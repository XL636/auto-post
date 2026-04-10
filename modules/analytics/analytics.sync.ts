import { prisma } from "@/shared/lib/prisma";
import { getPlatformClient } from "@/modules/platforms";

export async function syncAllAnalytics(): Promise<void> {
  const published = await prisma.postPlatform.findMany({
    where: { status: "PUBLISHED", platformPostId: { not: null } },
    include: { account: true },
  });

  for (const pp of published) {
    try {
      const client = getPlatformClient(pp.account.platform, pp.account);
      const data = await client.getAnalytics(pp.platformPostId!);
      await prisma.analytics.create({
        data: { postPlatformId: pp.id, ...data },
      });
    } catch (error) {
      console.error(`Analytics sync failed for ${pp.id}:`, error);
    }
  }
}
