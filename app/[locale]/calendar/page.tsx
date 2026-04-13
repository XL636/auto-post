"use client";

import { useState } from "react";
import useSWR from "swr";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { fetchJson } from "@/shared/lib/fetcher";
import { useFormatDate } from "@/shared/lib/date-format";
import type { CalendarData, PostListItem, PostPlatformSummary } from "@/shared/types/api";
import { useTranslations } from "next-intl";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const { data: calendarData } = useSWR<CalendarData>(
    `/api/calendar?year=${year}&month=${month}`,
    fetchJson,
  );
  const formatDate = useFormatDate();
  const t = useTranslations("calendar");
  const tc = useTranslations("common");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const dayNames: string[] = t.raw("days");

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          {tc("prev")}
        </Button>
        <span className="text-lg font-semibold">{formatDate(currentDate, "yyyy年M月")}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          {tc("next")}
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px rounded border border-[var(--border-color)] bg-[var(--border-color)]">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="bg-[var(--bg-secondary)] p-2 text-center text-xs font-medium text-[var(--text-secondary)]"
          >
            {dayName}
          </div>
        ))}
        {Array.from({ length: (startDay + 6) % 7 }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[100px] bg-white p-2" />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const posts = calendarData?.[dateKey] || [];
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div
              key={dateKey}
              className={`min-h-[100px] bg-white p-2 ${
                isToday ? "ring-2 ring-inset ring-[var(--accent-blue)]" : ""
              }`}
            >
              <div
                className={`mb-1 text-xs ${
                  isToday ? "font-bold text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {posts.slice(0, 3).map((post: PostListItem) => (
                  <div key={post.id} className="flex items-center gap-1">
                    {post.platforms.map((platformPost: PostPlatformSummary) => (
                      <PlatformIcon
                        key={platformPost.id}
                        platform={platformPost.account.platform}
                        size={12}
                      />
                    ))}
                    <span className="truncate text-xs text-[var(--text-secondary)]">
                      {post.content.substring(0, 20)}
                    </span>
                  </div>
                ))}
                {posts.length > 3 ? (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {tc("more", { count: posts.length - 3 })}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
