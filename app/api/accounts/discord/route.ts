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
