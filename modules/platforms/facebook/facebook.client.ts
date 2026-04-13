import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { getFacebookAuthUrl, handleFacebookCallback } from "./facebook.auth";
import { registerPlatform } from "../registry";
import { toErrorMessage } from "@/shared/lib/error";
import { facebookConfig } from "./facebook.config";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export class FacebookClient implements PlatformClient {
  constructor(private account: Account) {}

  async getAuthUrl(redirectUri: string): Promise<string> {
    const credentials = await requirePlatformCredential("FACEBOOK", this.account.userId);
    return getFacebookAuthUrl(redirectUri, credentials.clientId || "");
  }

  async handleCallback(code: string, redirectUri: string): Promise<TokenPair> {
    const credentials = await requirePlatformCredential("FACEBOOK", this.account.userId);
    return handleFacebookCallback(
      code,
      redirectUri,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async refreshToken(): Promise<TokenPair> {
    const credentials = await requirePlatformCredential("FACEBOOK", this.account.userId);
    const res = await fetch(
      `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${credentials.clientId}&client_secret=${credentials.clientSecret}&fb_exchange_token=${this.account.accessToken}`,
    );
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
      scopes: this.account.scopes,
      tokenType: "long-lived",
    };
  }

  async publish(content: string): Promise<PublishResult> {
    try {
      const res = await fetch(`${GRAPH_API}/${this.account.platformUserId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          access_token: this.account.accessToken,
        }),
      });
      const data = await res.json();
      if (data.error) {
        return { success: false, error: data.error.message };
      }
      return { success: true, platformPostId: data.id };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, "Publish failed") };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    await fetch(`${GRAPH_API}/${platformPostId}?access_token=${this.account.accessToken}`, {
      method: "DELETE",
    });
  }

  async getAnalytics(platformPostId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(
        `${GRAPH_API}/${platformPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${this.account.accessToken}`,
      );
      const data = await res.json();
      return {
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares?.count || 0,
        impressions: 0,
        clicks: 0,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const res = await fetch(`${GRAPH_API}/me?fields=id,name,picture&access_token=${this.account.accessToken}`);
    const data = await res.json();
    return {
      platformUserId: data.id,
      displayName: data.name,
      avatarUrl: data.picture?.data?.url,
    };
  }
}

registerPlatform("FACEBOOK", (account) => new FacebookClient(account), facebookConfig);
