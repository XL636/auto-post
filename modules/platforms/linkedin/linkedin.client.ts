import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { getLinkedInAuthUrl, handleLinkedInCallback } from "./linkedin.auth";
import { registerPlatform } from "../registry";
import { linkedinConfig } from "./linkedin.config";

const API_BASE = "https://api.linkedin.com/v2";

export class LinkedInClient implements PlatformClient {
  constructor(private account: Account) {}

  getAuthUrl(redirectUri: string): string {
    return getLinkedInAuthUrl(redirectUri);
  }

  handleCallback(code: string, redirectUri: string): Promise<TokenPair> {
    return handleLinkedInCallback(code, redirectUri);
  }

  async refreshToken(): Promise<TokenPair> {
    throw new Error("LinkedIn tokens are long-lived (365 days), manual re-auth needed");
  }

  async publish(content: string): Promise<PublishResult> {
    try {
      const body = {
        author: `urn:li:person:${this.account.platformUserId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      };
      const res = await fetch(`${API_BASE}/ugcPosts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "LinkedIn publish failed" };
      return { success: true, platformPostId: data.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    await fetch(`${API_BASE}/ugcPosts/${platformPostId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.account.accessToken}` },
    });
  }

  async getAnalytics(): Promise<AnalyticsData> {
    return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
  }

  async getUserProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/userinfo`, {
      headers: { Authorization: `Bearer ${this.account.accessToken}` },
    });
    const data = await res.json();
    return { platformUserId: data.sub, displayName: data.name, avatarUrl: data.picture };
  }
}

registerPlatform("LINKEDIN", (account) => new LinkedInClient(account), linkedinConfig);
