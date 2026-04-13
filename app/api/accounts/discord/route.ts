import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { encrypt } from "@/shared/lib/encryption";
import { getDefaultUserId } from "@/modules/accounts/account.service";

export async function POST() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!botToken || !webhookUrl) {
    return NextResponse.json(
      { error: "DISCORD_BOT_TOKEN and DISCORD_WEBHOOK_URL must be configured first." },
      { status: 400 },
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  const accessToken = encryptionKey ? encrypt(botToken, encryptionKey) : botToken;

  const account = await prisma.account.upsert({
    where: {
      userId_platform_platformUserId: {
        userId: getDefaultUserId(),
        platform: "DISCORD",
        platformUserId: "discord-bot",
      },
    },
    update: {
      accessToken,
      tokenType: "bot",
      scopes: ["bot", "webhook"],
      displayName: "Discord Bot",
      avatarUrl: null,
      lastError: null,
      lastValidatedAt: new Date(),
    },
    create: {
      userId: getDefaultUserId(),
      platform: "DISCORD",
      platformUserId: "discord-bot",
      accessToken,
      tokenType: "bot",
      scopes: ["bot", "webhook"],
      displayName: "Discord Bot",
      avatarUrl: null,
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
