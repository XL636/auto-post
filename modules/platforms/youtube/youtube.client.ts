import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { getYouTubeAuthUrl, handleYouTubeCallback, refreshYouTubeAccessToken } from "./youtube.auth";
import { registerPlatform } from "../registry";
import { toErrorMessage } from "@/shared/lib/error";
import { youtubeConfig } from "./youtube.config";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";

const API_BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeClient implements PlatformClient {
  constructor(private account: Account) {}

  async getAuthUrl(redirectUri: string): Promise<string> {
    const credentials = await requirePlatformCredential("YOUTUBE", this.account.userId);
    return getYouTubeAuthUrl(redirectUri, credentials.clientId || "");
  }

  async handleCallback(code: string, redirectUri: string): Promise<TokenPair> {
    const credentials = await requirePlatformCredential("YOUTUBE", this.account.userId);
    return handleYouTubeCallback(
      code,
      redirectUri,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async refreshToken(): Promise<TokenPair> {
    if (!this.account.refreshToken) {
      throw new Error("No refresh token available");
    }

    const credentials = await requirePlatformCredential("YOUTUBE", this.account.userId);
    return refreshYouTubeAccessToken(
      this.account.refreshToken,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async publish(content: string): Promise<PublishResult> {
    try {
      const res = await fetch(`${API_BASE}/activities?part=snippet,contentDetails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: { description: content },
          contentDetails: { bulletin: { resourceId: {} } },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error?.message || "YouTube publish failed" };
      }
      return { success: true, platformPostId: data.id };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, "Publish failed") };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    console.warn(`YouTube post deletion not supported via API: ${platformPostId}`);
  }

  async getAnalytics(platformPostId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(`${API_BASE}/videos?part=statistics&id=${platformPostId}`, {
        headers: { Authorization: `Bearer ${this.account.accessToken}` },
      });
      if (!res.ok) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }
      const data = await res.json();
      const stats = data.items?.[0]?.statistics;
      if (!stats) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }
      return {
        likes: parseInt(stats.likeCount || "0", 10),
        comments: parseInt(stats.commentCount || "0", 10),
        shares: 0,
        impressions: parseInt(stats.viewCount || "0", 10),
        clicks: 0,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/channels?part=snippet&mine=true`, {
      headers: { Authorization: `Bearer ${this.account.accessToken}` },
    });
    const data = await res.json();
    const channel = data.items?.[0];
    return {
      platformUserId: channel?.id || "",
      displayName: channel?.snippet?.title || "YouTube Channel",
      avatarUrl: channel?.snippet?.thumbnails?.default?.url,
    };
  }
}

registerPlatform("YOUTUBE", (account) => new YouTubeClient(account), youtubeConfig);
