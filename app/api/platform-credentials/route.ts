import { NextResponse } from "next/server";
import type { Platform } from "@prisma/client";
import { getDefaultUserId } from "@/modules/accounts/account.service";
import { listPlatformCredentialStatuses, savePlatformCredential } from "@/modules/platform-credentials/credential.service";
import type { SavePlatformCredentialInput } from "@/shared/types/api";

const ALLOWED_PLATFORMS: Platform[] = [
  "LINKEDIN",
  "TWITTER",
  "FACEBOOK",
  "DISCORD",
  "REDDIT",
  "YOUTUBE",
];

function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && ALLOWED_PLATFORMS.includes(value as Platform);
}

export async function GET() {
  const statuses = await listPlatformCredentialStatuses(getDefaultUserId());
  return NextResponse.json(statuses);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as SavePlatformCredentialInput | null;
  if (!body || !isPlatform(body.platform)) {
    return NextResponse.json({ error: "Invalid platform credential payload." }, { status: 400 });
  }

  try {
    await savePlatformCredential(body, getDefaultUserId());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save credentials." },
      { status: 400 },
    );
  }
}
