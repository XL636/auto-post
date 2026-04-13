import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { registerPlatform } from "../registry";
import { twitterConfig } from "./twitter.config";
import { getTwitterAuthUrl, handleTwitterCallback, refreshTwitterToken } from "./twitter.auth";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";

const API_BASE = "https://api.twitter.com/2";

function getTwitterError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const errorData = data as {
    detail?: string;
    title?: string;
    errors?: Array<{ message?: string }>;
  };

  return errorData.detail || errorData.title || errorData.errors?.[0]?.message || fallback;
}

export class TwitterClient implements PlatformClient {
  constructor(private account: Account) {}

  async getAuthUrl(redirectUri: string): Promise<string> {
    const credentials = await requirePlatformCredential("TWITTER", this.account.userId);
    return getTwitterAuthUrl(redirectUri, credentials.clientId || "");
  }

  async handleCallback(code: string, redirectUri: string): Promise<TokenPair> {
    const credentials = await requirePlatformCredential("TWITTER", this.account.userId);
    return handleTwitterCallback(
      code,
      redirectUri,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async refreshToken(token?: string): Promise<TokenPair> {
    const refreshToken = token || this.account.refreshToken;

    if (!refreshToken) {
      throw new Error("No Twitter refresh token available. Re-authorization required.");
    }

    const credentials = await requirePlatformCredential("TWITTER", this.account.userId);
    return refreshTwitterToken(refreshToken, credentials.clientId || "", credentials.clientSecret || "");
  }

  async publish(content: string, mediaUrls: string[] = []): Promise<PublishResult> {
    try {
      if (content.length > twitterConfig.maxChars) {
        return {
          success: false,
          error: `Twitter posts are limited to ${twitterConfig.maxChars} characters.`,
        };
      }

      if (mediaUrls.length > twitterConfig.maxMediaCount) {
        return {
          success: false,
          error: `Twitter supports up to ${twitterConfig.maxMediaCount} media items per post.`,
        };
      }

      if (mediaUrls.length > 0) {
        return {
          success: false,
          error: "Twitter media uploads are not implemented for external media URLs yet.",
        };
      }

      const res = await fetch(`${API_BASE}/tweets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: getTwitterError(data, "Twitter publish failed") };
      }

      return { success: true, platformPostId: data.data?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Twitter publish failed",
      };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tweets/${platformPostId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.account.accessToken}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(getTwitterError(data, "Twitter delete failed"));
    }
  }

  async getAnalytics(platformPostId: string): Promise<AnalyticsData> {
    try {
      const params = new URLSearchParams({
        "tweet.fields": "public_metrics",
      });
      const res = await fetch(`${API_BASE}/tweets/${platformPostId}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
        },
      });

      if (!res.ok) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }

      const data = await res.json();
      const metrics = data.data?.public_metrics;

      return {
        likes: metrics?.like_count || 0,
        comments: metrics?.reply_count || 0,
        shares: (metrics?.retweet_count || 0) + (metrics?.quote_count || 0),
        impressions: 0,
        clicks: 0,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const params = new URLSearchParams({
      "user.fields": "profile_image_url,username",
    });
    const res = await fetch(`${API_BASE}/users/me?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.account.accessToken}`,
      },
    });
    const data = await res.json();

    if (!res.ok || !data.data?.id) {
      throw new Error(getTwitterError(data, "Failed to fetch Twitter profile"));
    }

    return {
      platformUserId: data.data.id,
      displayName: data.data.name || data.data.username,
      avatarUrl: data.data.profile_image_url,
    };
  }
}

registerPlatform("TWITTER", (account) => new TwitterClient(account), twitterConfig);
