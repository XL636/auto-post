import type { TokenPair } from "@/shared/types";

export function getDiscordAuthUrl(): string {
  return ""; // Discord uses Bot Token, no OAuth flow
}

export async function handleDiscordCallback(): Promise<TokenPair> {
  // Discord Bot Token is set via env, no callback needed
  return {
    accessToken: process.env.DISCORD_BOT_TOKEN!,
    scopes: ["bot"],
    tokenType: "bot",
  };
}
