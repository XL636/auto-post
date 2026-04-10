import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { getRedditAuthUrl, handleRedditCallback } from "./reddit.auth";
import { registerPlatform } from "../registry";
import { redditConfig } from "./reddit.config";

const API_BASE = "https://oauth.reddit.com";

export class RedditClient implements PlatformClient {
  constructor(private account: Account) {}

  getAuthUrl(redirectUri: string): string {
    return getRedditAuthUrl(redirectUri);
  }

  handleCallback(code: string, redirectUri: string): Promise<TokenPair> {
    return handleRedditCallback(code, redirectUri);
  }

  async refreshToken(): Promise<TokenPair> {
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`,
    ).toString("base64");

    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.account.refreshToken!,
      }),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || this.account.refreshToken!,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: (data.scope || "").split(" "),
      tokenType: "bearer",
    };
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
    } catch (error: any) {
      return { success: false, error: error.message };
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
      if (!post) return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
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
