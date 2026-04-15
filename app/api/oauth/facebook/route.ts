import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";
import { getFacebookAuthUrl } from "@/modules/platforms/facebook/facebook.auth";
import { getDefaultUserId } from "@/modules/accounts/account.service";
import { routing } from "@/i18n/routing";

const OAUTH_COOKIE_MAX_AGE = 10 * 60;
const OAUTH_COOKIE_PATH = "/api/oauth/facebook";

function isAppLocale(value: string | null | undefined): value is (typeof routing.locales)[number] {
  return Boolean(value && routing.locales.includes(value as (typeof routing.locales)[number]));
}

export async function GET(request: NextRequest) {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/facebook/callback`;
  const locale = request.nextUrl.searchParams.get("locale");
  const safeLocale = isAppLocale(locale) ? locale : routing.defaultLocale;

  try {
    const credentials = await requirePlatformCredential("FACEBOOK", getDefaultUserId());
    const state = randomBytes(24).toString("hex");
    const authUrl = getFacebookAuthUrl(redirectUri, credentials.clientId || "", state);
    const response = NextResponse.redirect(authUrl);

    response.cookies.set("facebook_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: OAUTH_COOKIE_MAX_AGE,
      path: OAUTH_COOKIE_PATH,
    });
    response.cookies.set("facebook_oauth_locale", safeLocale, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: OAUTH_COOKIE_MAX_AGE,
      path: OAUTH_COOKIE_PATH,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Facebook credentials are not configured." },
      { status: 400 },
    );
  }
}
