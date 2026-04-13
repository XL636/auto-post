import { NextResponse } from "next/server";
import type { Account, Platform } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { getPlatformClient } from "@/modules/platforms";
import { encrypt } from "@/shared/lib/encryption";
import { handleTwitterCallback } from "@/modules/platforms/twitter/twitter.auth";
import {
  getDefaultUserId,
  getLocalizedAccountsPath,
} from "@/modules/accounts/account.service";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";
import { routing } from "@/i18n/routing";

const OAUTH_COOKIE_PATH = "/api/oauth/twitter";

function isAppLocale(value: string | null | undefined): value is (typeof routing.locales)[number] {
  return Boolean(value && routing.locales.includes(value as (typeof routing.locales)[number]));
}

function getCookieValue(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) {
    return undefined;
  }

  const prefix = `${name}=`;
  const match = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}

function clearOAuthCookies(response: NextResponse): void {
  response.cookies.set("twitter_oauth_code_verifier", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: OAUTH_COOKIE_PATH,
  });

  response.cookies.set("twitter_oauth_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: OAUTH_COOKIE_PATH,
  });
  response.cookies.set("twitter_oauth_locale", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: OAUTH_COOKIE_PATH,
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

export async function GET(req: Request) {
  const platform = "twitter";
  const platformKey = "TWITTER" as Platform;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.json({ error: oauthError }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  const storedState = getCookieValue(req, "twitter_oauth_state");
  const codeVerifier = getCookieValue(req, "twitter_oauth_code_verifier");
  const localeCookie = getCookieValue(req, "twitter_oauth_locale");
  const locale = isAppLocale(localeCookie) ? localeCookie : routing.defaultLocale;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  if (!codeVerifier) {
    return NextResponse.json({ error: "Missing PKCE verifier" }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/twitter/callback`;
  const credentials = await requirePlatformCredential("TWITTER", getDefaultUserId());
  const tokens = await handleTwitterCallback(
    code,
    redirectUri,
    credentials.clientId || "",
    credentials.clientSecret || "",
    codeVerifier,
  );

  const dummyAccount = createPlaceholderAccount(platformKey);
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
  clearOAuthCookies(response);
  return response;
}
