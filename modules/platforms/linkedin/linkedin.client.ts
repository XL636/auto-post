import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { getLinkedInAuthUrl, handleLinkedInCallback } from "./linkedin.auth";
import { registerPlatform } from "../registry";
import { toErrorMessage } from "@/shared/lib/error";
import { linkedinConfig } from "./linkedin.config";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";

const API_BASE = "https://api.linkedin.com/v2";

export class LinkedInClient implements PlatformClient {
  constructor(private account: Account) {}

  async getAuthUrl(redirectUri: string): Promise<string> {
    const credentials = await requirePlatformCredential("LINKEDIN", this.account.userId);
    return getLinkedInAuthUrl(redirectUri, credentials.clientId || "");
  }

  async handleCallback(code: string, redirectUri: string): Promise<TokenPair> {
    const credentials = await requirePlatformCredential("LINKEDIN", this.account.userId);
    return handleLinkedInCallback(
      code,
      redirectUri,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async refreshToken(): Promise<TokenPair> {
    if (!this.account.refreshToken) {
      throw new Error("No refresh token available. Re-authorization required.");
    }

    const credentials = await requirePlatformCredential("LINKEDIN", this.account.userId);
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.account.refreshToken,
        client_id: credentials.clientId || "",
        client_secret: credentials.clientSecret || "",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || data.error);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || this.account.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: (data.scope || "").split(" "),
      tokenType: "long-lived",
    };
  }

  async publish(content: string): Promise<PublishResult> {
    try {
      const body = {
        author: `urn:li:person:${this.account.platformUserId}`,
        commentary: content,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
      };
      const res = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        const postId = res.headers.get("x-restli-id");
        return { success: true, platformPostId: postId || undefined };
      }

      const data = await res.json().catch(() => null);
      const errorMessage =
        (data as { message?: string })?.message || `LinkedIn publish failed (${res.status})`;
      return { success: false, error: errorMessage };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, "Publish failed") };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    const res = await fetch(
      `https://api.linkedin.com/rest/posts/${encodeURIComponent(platformPostId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error((data as { message?: string })?.message || "LinkedIn delete failed");
    }
  }

  async getAnalytics(platformPostId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(`${API_BASE}/socialActions/${encodeURIComponent(platformPostId)}`, {
        headers: {
          Authorization: `Bearer ${this.account.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });
      if (!res.ok) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }
      const data = await res.json();
      return {
        likes: data.likesSummary?.totalLikes ?? 0,
        comments: data.commentsSummary?.totalFirstLevelComments ?? 0,
        shares: data.sharesSummary?.totalShares ?? 0,
        impressions: 0,
        clicks: 0,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }
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
