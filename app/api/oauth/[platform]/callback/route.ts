import { NextRequest, NextResponse } from "next/server";
import type { Account, Platform } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { getPlatformClient } from "@/modules/platforms";
import { encrypt } from "@/shared/lib/encryption";
import {
  getDefaultUserId,
  getLocalizedAccountsPath,
} from "@/modules/accounts/account.service";
import { routing } from "@/i18n/routing";

function getOAuthCookiePath(platform: string): string {
  return `/api/oauth/${platform}`;
}

function isAppLocale(value: string | null | undefined): value is (typeof routing.locales)[number] {
  return Boolean(value && routing.locales.includes(value as (typeof routing.locales)[number]));
}

function clearOAuthCookies(response: NextResponse, platform: string): void {
  const cookiePath = getOAuthCookiePath(platform);

  response.cookies.set(`${platform}_oauth_state`, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: cookiePath,
  });
  response.cookies.set(`${platform}_oauth_locale`, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: cookiePath,
  });
}

function createPlaceholderAccount(platform: Platform): Account {
  const now = new Date();

  return {
    id: `${platform.toLowerCase()}-oauth`,
    userId: getDefaultUserId(),
    platform,
    accessToken: "",
    refreshToken: null,
    platformUserId: "",
    displayName: "",
    avatarUrl: null,
    tokenExpiresAt: null,
    tokenType: null,
    scopes: [],
    lastError: null,
    lastValidatedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;

  if (platformKey === "FACEBOOK") {
    return NextResponse.json({ error: "Facebook uses dedicated callback route" }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = req.cookies.get(`${platform}_oauth_state`)?.value;
  const localeCookie = req.cookies.get(`${platform}_oauth_locale`)?.value;
  const locale = isAppLocale(localeCookie) ? localeCookie : routing.defaultLocale;

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  const dummyAccount = createPlaceholderAccount(platformKey);
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
        userId: getDefaultUserId(),
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
      lastError: null,
      lastValidatedAt: new Date(),
    },
    create: {
      userId: getDefaultUserId(),
      platform: platformKey,
      platformUserId: profile.platformUserId,
      accessToken: encrypt(tokens.accessToken, encryptionKey),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken, encryptionKey) : null,
      tokenExpiresAt: tokens.expiresAt,
      tokenType: tokens.tokenType,
      scopes: tokens.scopes,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl || "",
      lastError: null,
      lastValidatedAt: new Date(),
    },
  });

  const response = NextResponse.redirect(
    new URL(
      `${getLocalizedAccountsPath(locale)}?connected=${platform}`,
      process.env.NEXT_PUBLIC_APP_URL,
    ),
  );
  clearOAuthCookies(response, platform);
  return response;
}
