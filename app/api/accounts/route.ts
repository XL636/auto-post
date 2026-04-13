import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAccountHealth, getDefaultUserId } from "@/modules/accounts/account.service";

function getStatusLabel(status: ReturnType<typeof getAccountHealth>["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "EXPIRING_SOON":
      return "expiringSoon";
    case "EXPIRED":
      return "expired";
    case "MISCONFIGURED":
      return "misconfigured";
    case "ERROR":
      return "error";
    default:
      return "active";
  }
}

export async function GET() {
  const accounts = await prisma.account.findMany({
    where: { userId: getDefaultUserId() },
    select: {
      id: true,
      platform: true,
      displayName: true,
      avatarUrl: true,
      tokenExpiresAt: true,
      scopes: true,
      createdAt: true,
      lastError: true,
      lastValidatedAt: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    accounts.map((account) => {
      const health = getAccountHealth(account);

      return {
        id: account.id,
        platform: account.platform,
        displayName: account.displayName,
        avatarUrl: account.avatarUrl,
        tokenExpiresAt: account.tokenExpiresAt,
        scopes: account.scopes,
        createdAt: account.createdAt,
        linkedPostCount: account._count.posts,
        status: health.status,
        statusLabel: getStatusLabel(health.status),
        canPublish: health.canPublish,
        lastError: account.lastError,
        lastValidatedAt: account.lastValidatedAt,
      };
    }),
  );
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id;

  if (!id) {
    return NextResponse.json({ error: "Account id is required" }, { status: 400 });
  }

  const linkedPostCount = await prisma.postPlatform.count({
    where: { accountId: id },
  });

  if (linkedPostCount > 0) {
    return NextResponse.json(
      { error: "This account is still linked to existing posts.", linkedPostCount },
      { status: 409 },
    );
  }

  await prisma.account.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
