import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { encrypt } from "@/shared/lib/encryption";
import { getDefaultUserId } from "@/modules/accounts/account.service";
import { getFacebookPages } from "@/modules/platforms/facebook/facebook.auth";

const FACEBOOK_PAGE_SCOPES = ["pages_manage_posts", "pages_read_engagement", "pages_show_list"];

export async function GET(req: NextRequest) {
  const tempToken = req.cookies.get("facebook_temp_token")?.value;

  if (!tempToken) {
    return NextResponse.json({ error: "No pending Facebook connection" }, { status: 400 });
  }

  try {
    const pages = await getFacebookPages(tempToken);

    return NextResponse.json({
      pages: pages.map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        pictureUrl: page.picture?.data?.url,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch pages" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const tempToken = req.cookies.get("facebook_temp_token")?.value;

  if (!tempToken) {
    return NextResponse.json({ error: "No pending Facebook connection" }, { status: 400 });
  }

  const body = (await req.json()) as { pageId?: string };
  const pageId = body.pageId;

  if (!pageId) {
    return NextResponse.json({ error: "pageId is required" }, { status: 400 });
  }

  try {
    const pages = await getFacebookPages(tempToken);
    const selectedPage = pages.find((page) => page.id === pageId);

    if (!selectedPage) {
      return NextResponse.json({ error: "Page not found or no access" }, { status: 404 });
    }

    const encryptionKey = process.env.ENCRYPTION_KEY!;

    await prisma.account.upsert({
      where: {
        userId_platform_platformUserId: {
          userId: getDefaultUserId(),
          platform: "FACEBOOK",
          platformUserId: selectedPage.id,
        },
      },
      update: {
        accessToken: encrypt(selectedPage.access_token, encryptionKey),
        refreshToken: null,
        tokenExpiresAt: null,
        tokenType: "page",
        scopes: FACEBOOK_PAGE_SCOPES,
        displayName: selectedPage.name,
        avatarUrl: selectedPage.picture?.data?.url || null,
        lastError: null,
        lastValidatedAt: new Date(),
      },
      create: {
        userId: getDefaultUserId(),
        platform: "FACEBOOK",
        platformUserId: selectedPage.id,
        accessToken: encrypt(selectedPage.access_token, encryptionKey),
        refreshToken: null,
        tokenExpiresAt: null,
        tokenType: "page",
        scopes: FACEBOOK_PAGE_SCOPES,
        displayName: selectedPage.name,
        avatarUrl: selectedPage.picture?.data?.url || "",
        lastError: null,
        lastValidatedAt: new Date(),
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("facebook_temp_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/api/oauth/facebook",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save page" },
      { status: 500 },
    );
  }
}
