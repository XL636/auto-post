import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { getRedditAuthUrl, handleRedditCallback, refreshRedditAccessToken } from "./reddit.auth";
import { registerPlatform } from "../registry";
import { toErrorMessage } from "@/shared/lib/error";
import { redditConfig } from "./reddit.config";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";

const API_BASE = "https://oauth.reddit.com";

export class RedditClient implements PlatformClient {
  constructor(private account: Account) {}

  async getAuthUrl(redirectUri: string): Promise<string> {
    const credentials = await requirePlatformCredential("REDDIT", this.account.userId);
    return getRedditAuthUrl(redirectUri, credentials.clientId || "");
  }

  async handleCallback(code: string, redirectUri: string): Promise<TokenPair> {
    const credentials = await requirePlatformCredential("REDDIT", this.account.userId);
    return handleRedditCallback(
      code,
      redirectUri,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async refreshToken(): Promise<TokenPair> {
    if (!this.account.refreshToken) {
      throw new Error("No Reddit refresh token available. Re-authorization required.");
    }

    const credentials = await requirePlatformCredential("REDDIT", this.account.userId);
    return refreshRedditAccessToken(
      this.account.refreshToken,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async publish(content: string): Promise<PublishResult> {
    try {
      const res = await fetch(`${API_BASE}/api/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "AutoPostWeb/1.0",
        },
        body: new URLSearchParams({
          kind: "self",
          sr: "u_" + this.account.displayName,
          title: content.substring(0, 300),
          text: content,
        }),
      });
      const data = await res.json();
      if (data.json?.errors?.length) {
        return { success: false, error: data.json.errors[0].join(": ") };
      }
      return { success: true, platformPostId: data.json?.data?.name };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, "Publish failed") };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    await fetch(`${API_BASE}/api/del`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.account.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ id: platformPostId }),
    });
  }

  async getAnalytics(platformPostId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(`${API_BASE}/api/info?id=${platformPostId}`, {
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
          "User-Agent": "AutoPostWeb/1.0",
        },
      });
      const data = await res.json();
      const post = data.data?.children?.[0]?.data;
      if (!post) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }
      return {
        likes: post.ups || 0,
        comments: post.num_comments || 0,
        shares: post.num_crossposts || 0,
        impressions: 0,
        clicks: 0,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/api/v1/me`, {
      headers: {
        Authorization: `Bearer ${this.account.accessToken}`,
        "User-Agent": "AutoPostWeb/1.0",
      },
    });
    const data = await res.json();
    return {
      platformUserId: data.id,
      displayName: data.name,
      avatarUrl: data.icon_img,
    };
  }
}

registerPlatform("REDDIT", (account) => new RedditClient(account), redditConfig);
