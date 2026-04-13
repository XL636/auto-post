import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { Account, Platform } from "@prisma/client";
import { getPlatformClient } from "@/modules/platforms";
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
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;
  const client = getPlatformClient(platformKey, createPlaceholderAccount(platformKey));
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${platform}/callback`;
  const locale = request.nextUrl.searchParams.get("locale");

  if (platformKey === "DISCORD") {
    return NextResponse.redirect(
      new URL(getLocalizedAccountsPath(locale), process.env.NEXT_PUBLIC_APP_URL),
    );
  }

  let url: string;

  try {
    url = await client.getAuthUrl(redirectUri);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Platform credentials are not configured." },
      { status: 400 },
    );
  }

  if (!url) {
    return NextResponse.json({ error: "Platform does not use OAuth" }, { status: 400 });
  }

  const state = randomBytes(24).toString("hex");
  const redirectUrl = new URL(url);
  redirectUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(redirectUrl);
  const cookiePath = getOAuthCookiePath(platform);
  const safeLocale = isAppLocale(locale) ? locale : routing.defaultLocale;

  response.cookies.set(`${platform}_oauth_state`, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: cookiePath,
  });
  response.cookies.set(`${platform}_oauth_locale`, safeLocale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: cookiePath,
  });

  return response;
}
