"use client";
import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { StatusBadge } from "@/shared/components/status-badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData } = useSWR(`/api/calendar?year=${year}&month=${month}`, fetcher);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  return (
    <div>
      <PageHeader title="Calendar" description="Content schedule overview" />

      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          Prev
        </Button>
        <span className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          Next
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-[var(--border-color)] border border-[var(--border-color)] rounded">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-[var(--bg-secondary)] p-2 text-xs text-center font-medium text-[var(--text-secondary)]">
            {d}
          </div>
        ))}

        {Array.from({ length: (startDay + 6) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white p-2 min-h-[100px]" />
        ))}

        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const posts = calendarData?.[dateKey] || [];
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div key={dateKey} className={`bg-white p-2 min-h-[100px] ${isToday ? "ring-2 ring-[var(--accent-blue)] ring-inset" : ""}`}>
              <div className={`text-xs mb-1 ${isToday ? "text-[var(--accent-blue)] font-bold" : "text-[var(--text-secondary)]"}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {posts.slice(0, 3).map((post: any) => (
                  <div key={post.id} className="flex items-center gap-1">
                    {post.platforms?.map((pp: any) => (
                      <PlatformIcon key={pp.id} platform={pp.account?.platform || "UNKNOWN"} size={12} />
                    ))}
                    <span className="text-xs truncate text-[var(--text-secondary)]">
                      {post.content?.substring(0, 20)}
                    </span>
                  </div>
                ))}
                {posts.length > 3 && (
                  <span className="text-xs text-[var(--text-tertiary)]">+{posts.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
