import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  const accounts = await prisma.account.findMany({
    where: { userId: "default" },
    select: {
      id: true,
      platform: true,
      displayName: true,
      avatarUrl: true,
      tokenExpiresAt: true,
      scopes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(accounts);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.account.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
