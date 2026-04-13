"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { fetchJson } from "@/shared/lib/fetcher";
import { useFormatDate } from "@/shared/lib/date-format";
import type { CalendarData, PostListItem, PostPlatformSummary } from "@/shared/types/api";
import { useTranslations } from "next-intl";

function CalendarCellSkeleton() {
  return <Skeleton className="min-h-[100px] rounded-none bg-white" />;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const { data: calendarData, isLoading } = useSWR<CalendarData>(
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

  const daysWithPosts = useMemo(
    () => days.filter((day) => (calendarData?.[format(day, "yyyy-MM-dd")] || []).length > 0),
    [calendarData, days],
  );

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="border-[var(--border-color)]">
          {tc("prev")}
        </Button>
        <span className="text-lg font-semibold">{formatDate(currentDate, "yyyy年M月")}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="border-[var(--border-color)]">
          {tc("next")}
        </Button>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-3 md:hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
          <div className="hidden grid-cols-7 gap-px rounded border border-[var(--border-color)] bg-[var(--border-color)] md:grid">
            {Array.from({ length: 14 }).map((_, index) => (
              <CalendarCellSkeleton key={index} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const posts = calendarData?.[dateKey] || [];
              const isToday = dateKey === format(new Date(), "yyyy-MM-dd");

              return (
                <details key={dateKey} className="rounded border border-[var(--border-color)] bg-white" open={posts.length > 0 && isToday}>
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                    <span>
                      {formatDate(day, "M月d日")} {dayNames[(getDay(day) + 6) % 7]}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs ${isToday ? "bg-blue-50 text-[var(--accent-blue)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}>
                      {posts.length}
                    </span>
                  </summary>
                  <div className="border-t border-[var(--border-color)] px-4 py-3">
                    {posts.length === 0 ? (
                      <p className="text-xs text-[var(--text-tertiary)]">{t("emptyDay")}</p>
                    ) : (
                      <div className="space-y-2">
                        {posts.map((post: PostListItem) => (
                          <div key={post.id} className="rounded bg-[var(--bg-secondary)] p-3">
                            <div className="mb-2 flex gap-1">
                              {post.platforms.map((platformPost: PostPlatformSummary) => (
                                <PlatformIcon key={platformPost.id} platform={platformPost.account.platform} size={14} />
                              ))}
                            </div>
                            <p className="text-sm text-[var(--text-primary)]">{post.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>

          <div className="hidden grid-cols-7 gap-px rounded border border-[var(--border-color)] bg-[var(--border-color)] md:grid">
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
              const isToday = dateKey === format(new Date(), "yyyy-MM-dd");

              return (
                <div
                  key={dateKey}
                  className={`min-h-[100px] bg-white p-2 ${isToday ? "ring-2 ring-inset ring-[var(--accent-blue)]" : ""}`}
                >
                  <div className={`mb-1 text-xs ${isToday ? "font-bold text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {posts.slice(0, 3).map((post: PostListItem) => (
                      <div key={post.id} className="flex items-center gap-1">
                        {post.platforms.map((platformPost: PostPlatformSummary) => (
                          <PlatformIcon key={platformPost.id} platform={platformPost.account.platform} size={12} />
                        ))}
                        <span className="truncate text-xs text-[var(--text-secondary)]">{post.content.substring(0, 20)}</span>
                      </div>
                    ))}
                    {posts.length > 3 ? (
                      <span className="text-xs text-[var(--text-tertiary)]">{tc("more", { count: posts.length - 3 })}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {!isLoading && daysWithPosts.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-tertiary)]">{t("emptyMonth")}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
