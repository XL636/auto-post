import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { registerPlatform } from "../registry";
import { discordConfig } from "./discord.config";

export class DiscordClient implements PlatformClient {
  constructor(private account: Account) {}

  getAuthUrl(): string {
    return "";
  }

  async handleCallback(): Promise<TokenPair> {
    return {
      accessToken: process.env.DISCORD_BOT_TOKEN!,
      scopes: ["bot"],
      tokenType: "bot",
    };
  }

  async refreshToken(): Promise<TokenPair> {
    return this.handleCallback();
  }

  async publish(content: string): Promise<PublishResult> {
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) return { success: false, error: "DISCORD_WEBHOOK_URL not configured" };

      const res = await fetch(`${webhookUrl}?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "Discord post failed" };
      return { success: true, platformPostId: data.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(`${webhookUrl}/messages/${platformPostId}`, { method: "DELETE" });
    }
  }

  async getAnalytics(): Promise<AnalyticsData> {
    return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
  }

  async getUserProfile(): Promise<UserProfile> {
    return {
      platformUserId: "discord-bot",
      displayName: "Discord Bot",
    };
  }
}

registerPlatform("DISCORD", (account) => new DiscordClient(account), discordConfig);
