import { NextResponse } from "next/server";
import { getPlatformClient } from "@/modules/platforms";
import type { Platform, Account } from "@prisma/client";

export async function GET(_: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;
  const dummyAccount = { platform: platformKey, accessToken: "" } as Account;
  const client = getPlatformClient(platformKey, dummyAccount);
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${platform}/callback`;
  const url = client.getAuthUrl(redirectUri);
  if (!url) return NextResponse.json({ error: "Platform does not use OAuth" }, { status: 400 });
  return NextResponse.redirect(url);
}
