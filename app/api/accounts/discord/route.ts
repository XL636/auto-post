import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { encrypt } from "@/shared/lib/encryption";
import { getDefaultUserId } from "@/modules/accounts/account.service";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";

export async function POST() {
  let credentials;

  try {
    credentials = await requirePlatformCredential("DISCORD", getDefaultUserId());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discord credentials are not configured." },
      { status: 400 },
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  const accessToken = encryptionKey
    ? encrypt(credentials.botToken || "", encryptionKey)
    : credentials.botToken || "";

  let displayName = "Discord Bot";
  let botUserId = "discord-bot";
  let avatarUrl: string | null = null;

  try {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${credentials.botToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      displayName = data.username || "Discord Bot";
      botUserId = data.id || "discord-bot";

      if (data.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;
      }
    }
  } catch {
    // Best-effort profile lookup only.
  }

  if (botUserId !== "discord-bot") {
    await prisma.account.deleteMany({
      where: {
        userId: getDefaultUserId(),
        platform: "DISCORD",
        platformUserId: "discord-bot",
      },
    });
  }

  const account = await prisma.account.upsert({
    where: {
      userId_platform_platformUserId: {
        userId: getDefaultUserId(),
        platform: "DISCORD",
        platformUserId: botUserId,
      },
    },
    update: {
      accessToken,
      tokenType: "bot",
      scopes: ["bot", "webhook"],
      displayName,
      avatarUrl,
      lastError: null,
      lastValidatedAt: new Date(),
    },
    create: {
      userId: getDefaultUserId(),
      platform: "DISCORD",
      platformUserId: botUserId,
      accessToken,
      tokenType: "bot",
      scopes: ["bot", "webhook"],
      displayName,
      avatarUrl,
      lastError: null,
      lastValidatedAt: new Date(),
    },
    select: {
      id: true,
      platform: true,
      displayName: true,
      avatarUrl: true,
      tokenExpiresAt: true,
      scopes: true,
      createdAt: true,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
