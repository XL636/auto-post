import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { registerPlatform } from "../registry";
import { toErrorMessage } from "@/shared/lib/error";
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
      if (!data.channel_id || !data.id) {
        return { success: false, error: "Discord webhook response missing channel_id or message id" };
      }
      return { success: true, platformPostId: `${data.channel_id}/${data.id}` };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, "Publish failed") };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      const messageId = platformPostId.includes("/") ? platformPostId.split("/")[1] : platformPostId;
      await fetch(`${webhookUrl}/messages/${messageId}`, { method: "DELETE" });
    }
  }

  async getAnalytics(platformPostId: string): Promise<AnalyticsData> {
    try {
      const [channelId, messageId] = platformPostId.split("/");
      if (!channelId || !messageId) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }

      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      });

      if (!res.ok) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }

      const message = await res.json();
      const totalReactions = (message.reactions || []).reduce(
        (sum: number, r: { count?: number }) => sum + (r.count || 0),
        0,
      );

      return { likes: totalReactions, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    } catch (error) {
      console.error("Discord analytics error:", error);
      return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    return {
      platformUserId: "discord-bot",
      displayName: "Discord Bot",
    };
  }
}

registerPlatform("DISCORD", (account) => new DiscordClient(account), discordConfig);
