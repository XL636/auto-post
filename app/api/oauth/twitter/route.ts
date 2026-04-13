import { NextRequest, NextResponse } from "next/server";
import { createTwitterAuthRequest } from "@/modules/platforms/twitter/twitter.auth";
import { routing } from "@/i18n/routing";

const OAUTH_COOKIE_MAX_AGE = 10 * 60;
const OAUTH_COOKIE_PATH = "/api/oauth/twitter";

function isAppLocale(value: string | null | undefined): value is (typeof routing.locales)[number] {
  return Boolean(value && routing.locales.includes(value as (typeof routing.locales)[number]));
}

export async function GET(request: NextRequest) {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/twitter/callback`;
  const { url, codeVerifier, state } = createTwitterAuthRequest(redirectUri);
  const response = NextResponse.redirect(url);
  const locale = request.nextUrl.searchParams.get("locale");
  const safeLocale = isAppLocale(locale) ? locale : routing.defaultLocale;

  response.cookies.set("twitter_oauth_code_verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_COOKIE_MAX_AGE,
    path: OAUTH_COOKIE_PATH,
  });

  response.cookies.set("twitter_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_COOKIE_MAX_AGE,
    path: OAUTH_COOKIE_PATH,
  });
  response.cookies.set("twitter_oauth_locale", safeLocale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_COOKIE_MAX_AGE,
    path: OAUTH_COOKIE_PATH,
  });

  return response;
}
