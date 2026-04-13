import type { TokenPair } from "@/shared/types";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";
import { getDefaultUserId } from "@/modules/accounts/account.service";

export async function getDiscordAuthUrl(): Promise<string> {
  return "";
}

export async function handleDiscordCallback(userId = getDefaultUserId()): Promise<TokenPair> {
  const credentials = await requirePlatformCredential("DISCORD", userId);

  return {
    accessToken: credentials.botToken || "",
    scopes: ["bot"],
    tokenType: "bot",
  };
}
