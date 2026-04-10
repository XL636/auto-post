import { prisma } from "@/shared/lib/prisma";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from "date-fns";
import type { Post } from "@prisma/client";

export const calendarService = {
  async getMonthView(year: number, month: number): Promise<Record<string, Post[]>> {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(start);

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { scheduledAt: { gte: start, lte: end } },
          { publishedAt: { gte: start, lte: end } },
        ],
      },
      include: { platforms: { include: { account: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    const grouped: Record<string, Post[]> = {};
    for (const post of posts) {
      const date = format(post.scheduledAt || post.publishedAt || post.createdAt, "yyyy-MM-dd");
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(post);
    }
    return grouped;
  },

  async getWeekView(date: Date): Promise<Record<string, Post[]>> {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { scheduledAt: { gte: start, lte: end } },
          { publishedAt: { gte: start, lte: end } },
        ],
      },
      include: { platforms: { include: { account: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    const grouped: Record<string, Post[]> = {};
    for (const post of posts) {
      const d = format(post.scheduledAt || post.publishedAt || post.createdAt, "yyyy-MM-dd");
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(post);
    }
    return grouped;
  },
};
