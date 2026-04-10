import { prisma } from "@/shared/lib/prisma";

export const analyticsService = {
  async getOverview(days: number) {
    const since = new Date(Date.now() - days * 86400_000);

    const analytics = await prisma.analytics.findMany({
      where: { fetchedAt: { gte: since } },
      include: { postPlatform: { include: { account: true, post: true } } },
      orderBy: { fetchedAt: "desc" },
    });

    const totals = { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    const byPlatform: Record<string, typeof totals> = {};

    for (const a of analytics) {
      totals.likes += a.likes;
      totals.comments += a.comments;
      totals.shares += a.shares;
      totals.impressions += a.impressions;
      totals.clicks += a.clicks;

      const p = a.postPlatform.account.platform;
      if (!byPlatform[p]) byPlatform[p] = { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      byPlatform[p].likes += a.likes;
      byPlatform[p].comments += a.comments;
      byPlatform[p].shares += a.shares;
      byPlatform[p].impressions += a.impressions;
      byPlatform[p].clicks += a.clicks;
    }

    return { totals, byPlatform, count: analytics.length };
  },
};
