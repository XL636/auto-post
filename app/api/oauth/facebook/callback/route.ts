import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { encrypt } from "@/shared/lib/encryption";
import {
  exchangeLongLivedToken,
  getFacebookPages,
  handleFacebookCallback,
} from "@/modules/platforms/facebook/facebook.auth";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";
import {
  getDefaultUserId,
  getLocalizedAccountsPath,
} from "@/modules/accounts/account.service";
import { routing } from "@/i18n/routing";

const OAUTH_COOKIE_PATH = "/api/oauth/facebook";
const FACEBOOK_PAGE_SCOPES = ["pages_manage_posts", "pages_read_engagement", "pages_show_list"];

function isAppLocale(value: string | null | undefined): value is (typeof routing.locales)[number] {
  return Boolean(value && routing.locales.includes(value as (typeof routing.locales)[number]));
}

function clearOAuthCookies(response: NextResponse): void {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: OAUTH_COOKIE_PATH,
  };

  response.cookies.set("facebook_oauth_state", "", cookieOptions);
  response.cookies.set("facebook_oauth_locale", "", cookieOptions);
}

async function saveFacebookPageAccount(args: {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  avatarUrl?: string;
}): Promise<void> {
  const encryptionKey = process.env.ENCRYPTION_KEY!;

  await prisma.account.upsert({
    where: {
      userId_platform_platformUserId: {
        userId: getDefaultUserId(),
        platform: "FACEBOOK",
        platformUserId: args.pageId,
      },
    },
    update: {
      accessToken: encrypt(args.pageAccessToken, encryptionKey),
      refreshToken: null,
      tokenExpiresAt: null,
      tokenType: "page",
      scopes: FACEBOOK_PAGE_SCOPES,
      displayName: args.pageName,
      avatarUrl: args.avatarUrl || null,
      lastError: null,
      lastValidatedAt: new Date(),
    },
    create: {
      userId: getDefaultUserId(),
      platform: "FACEBOOK",
      platformUserId: args.pageId,
      accessToken: encrypt(args.pageAccessToken, encryptionKey),
      refreshToken: null,
      tokenExpiresAt: null,
      tokenType: "page",
      scopes: FACEBOOK_PAGE_SCOPES,
      displayName: args.pageName,
      avatarUrl: args.avatarUrl || "",
      lastError: null,
      lastValidatedAt: new Date(),
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const storedState = req.cookies.get("facebook_oauth_state")?.value;
  const localeCookie = req.cookies.get("facebook_oauth_locale")?.value;
  const locale = isAppLocale(localeCookie) ? localeCookie : routing.defaultLocale;

  if (oauthError) {
    const response = NextResponse.redirect(
      new URL(
        `${getLocalizedAccountsPath(locale)}?error=facebook_denied`,
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );
    clearOAuthCookies(response);
    return response;
  }

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/facebook/callback`;
  const credentials = await requirePlatformCredential("FACEBOOK", getDefaultUserId());
  const clientId = credentials.clientId || "";
  const clientSecret = credentials.clientSecret || "";
  const tokens = await handleFacebookCallback(code, redirectUri, clientId, clientSecret);
  const longLived = await exchangeLongLivedToken(tokens.accessToken, clientId, clientSecret);
  const pages = await getFacebookPages(longLived.accessToken);

  if (pages.length === 0) {
    const response = NextResponse.redirect(
      new URL(
        `${getLocalizedAccountsPath(locale)}?error=facebook_no_pages`,
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );
    clearOAuthCookies(response);
    return response;
  }

  if (pages.length === 1) {
    const page = pages[0];

    await saveFacebookPageAccount({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      avatarUrl: page.picture?.data?.url,
    });

    const response = NextResponse.redirect(
      new URL(
        `${getLocalizedAccountsPath(locale)}?connected=facebook`,
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );
    clearOAuthCookies(response);
    return response;
  }

  const response = NextResponse.redirect(
    new URL(`/${locale}/accounts/facebook-pages`, process.env.NEXT_PUBLIC_APP_URL),
  );
  response.cookies.set("facebook_temp_token", longLived.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: OAUTH_COOKIE_PATH,
  });
  clearOAuthCookies(response);
  return response;
}
