import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getPlatformClient } from "@/modules/platforms";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { platforms: { include: { account: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.post.update({ where: { id }, data: { status: "PUBLISHING" } });

  const results = await Promise.allSettled(
    post.platforms.map(async (pp) => {
      const content = pp.overrideContent || post.content;
      const client = getPlatformClient(pp.account.platform, pp.account);
      const result = await client.publish(content, post.mediaUrls);
      await prisma.postPlatform.update({
        where: { id: pp.id },
        data: {
          status: result.success ? "PUBLISHED" : "FAILED",
          platformPostId: result.platformPostId,
          errorMessage: result.error,
          publishedAt: result.success ? new Date() : null,
        },
      });
      return result;
    }),
  );

  const anySuccess = results.some((r) => r.status === "fulfilled" && r.value.success);
  await prisma.post.update({
    where: { id },
    data: {
      status: anySuccess ? "PUBLISHED" : "FAILED",
      publishedAt: anySuccess ? new Date() : null,
    },
  });

  return NextResponse.json({ results });
}
