import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPlatformClient } from "@/modules/platforms";
import type { Platform, Account } from "@prisma/client";
import { getLocalizedAccountsPath } from "@/modules/accounts/account.service";
import { routing } from "@/i18n/routing";

function getOAuthCookiePath(platform: string): string {
  return `/api/oauth/${platform}`;
}

function isAppLocale(value: string | null | undefined): value is (typeof routing.locales)[number] {
  return Boolean(value && routing.locales.includes(value as (typeof routing.locales)[number]));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;
  const dummyAccount = { platform: platformKey, accessToken: "" } as Account;
  const client = getPlatformClient(platformKey, dummyAccount);
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${platform}/callback`;
  const locale = request.nextUrl.searchParams.get("locale");

  if (platformKey === "DISCORD") {
    return NextResponse.redirect(
      new URL(getLocalizedAccountsPath(locale), process.env.NEXT_PUBLIC_APP_URL),
    );
  }

  const url = client.getAuthUrl(redirectUri);
  if (!url) {
    return NextResponse.json({ error: "Platform does not use OAuth" }, { status: 400 });
  }

  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(new URL(url));
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

  response.headers.set(
    "Location",
    (() => {
      const redirectUrl = new URL(url);
      redirectUrl.searchParams.set("state", state);
      return redirectUrl.toString();
    })(),
  );

  return response;
}
