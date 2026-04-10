import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getPlatformClient } from "@/modules/platforms";
import { encrypt } from "@/shared/lib/encryption";
import type { Platform, Account } from "@prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const dummyAccount = { platform: platformKey, accessToken: "" } as Account;
  const client = getPlatformClient(platformKey, dummyAccount);
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${platform}/callback`;

  const tokens = await client.handleCallback(code, redirectUri);

  const tempAccount = { ...dummyAccount, accessToken: tokens.accessToken } as Account;
  const tempClient = getPlatformClient(platformKey, tempAccount);
  const profile = await tempClient.getUserProfile();

  const encryptionKey = process.env.ENCRYPTION_KEY!;

  await prisma.account.upsert({
    where: {
      userId_platform_platformUserId: {
        userId: "default",
        platform: platformKey,
        platformUserId: profile.platformUserId,
      },
    },
    update: {
      accessToken: encrypt(tokens.accessToken, encryptionKey),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken, encryptionKey) : null,
      tokenExpiresAt: tokens.expiresAt,
      tokenType: tokens.tokenType,
      scopes: tokens.scopes,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    },
    create: {
      platform: platformKey,
      platformUserId: profile.platformUserId,
      accessToken: encrypt(tokens.accessToken, encryptionKey),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken, encryptionKey) : null,
      tokenExpiresAt: tokens.expiresAt,
      tokenType: tokens.tokenType,
      scopes: tokens.scopes,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl || "",
    },
  });

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?connected=${platform}`);
}
