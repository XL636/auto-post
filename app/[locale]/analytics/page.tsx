"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { fetchJson } from "@/shared/lib/fetcher";
import type { AnalyticsOverview, AnalyticsTotals } from "@/shared/types/api";
import { useTranslations } from "next-intl";

function formatPlatformName(platform: string, translatedName: string): string {
  const brand = platform.charAt(0) + platform.slice(1).toLowerCase();
  return translatedName ? `${brand} ${translatedName}` : brand;
}

function AnalyticsIllustration() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-20 w-20">
      <path d="M12 64h56" />
      <path d="M18 58V40" />
      <path d="M32 58V24" />
      <path d="M46 58V34" />
      <path d="M60 58V18" />
      <path d="M18 28l14-8 14 10 14-14" />
      <path d="M54 16h6v6" />
    </svg>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useSWR<AnalyticsOverview>(`/api/analytics?days=${days}`, fetchJson);
  const t = useTranslations("analytics");
  const tp = useTranslations("platform");

  const ranges = [
    { label: t("days7"), value: 7 },
    { label: t("days30"), value: 30 },
    { label: t("days90"), value: 90 },
  ];

  const metricKeys: Record<keyof AnalyticsTotals, string> = {
    likes: t("likes"),
    comments: t("comments"),
    shares: t("shares"),
    impressions: t("impressions"),
    clicks: t("clicks"),
  };

  const chartData = data?.byPlatform
    ? Object.entries(data.byPlatform).map(([platform, stats]) => ({
        platform: formatPlatformName(platform, tp(platform.toLowerCase())),
        likes: stats.likes,
        comments: stats.comments,
        shares: stats.shares,
      }))
    : [];

  const hasData = Boolean(data && data.count > 0 && chartData.length > 0);

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mb-6 flex flex-wrap gap-2">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => setDays(range.value)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              days === range.value
                ? "bg-[var(--text-primary)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </>
      ) : !hasData ? (
        <EmptyState
          icon={<AnalyticsIllustration />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href="/accounts">
              <Button className="bg-[var(--accent-blue)] text-white hover:opacity-90">{t("emptyCta")}</Button>
            </Link>
          }
        />
      ) : (() => {
        const overview = data as AnalyticsOverview;

        return (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {(Object.entries(overview.totals) as Array<[keyof AnalyticsTotals, number]>).map(([key, value]) => (
              <Card key={key} className="border-[var(--border-color)] shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal text-[var(--text-secondary)]">
                    {metricKeys[key]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-[var(--border-color)] p-4 shadow-none md:p-6">
            <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">{t("engagement")}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="likes" fill="var(--accent-blue)" name={t("likes")} />
                <Bar dataKey="comments" fill="var(--accent-green)" name={t("comments")} />
                <Bar dataKey="shares" fill="var(--accent-orange)" name={t("shares")} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">{t("breakdown")}</h3>
            {Object.entries(overview.byPlatform).map(([platform, stats]) => (
              <div
                key={platform}
                className="grid gap-3 rounded border border-[var(--border-color)] p-3 text-sm md:grid-cols-[auto,140px,1fr] md:items-center"
              >
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={platform} />
                  <span className="font-medium">{formatPlatformName(platform, tp(platform.toLowerCase()))}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] md:grid-cols-1">
                  <span>{stats.likes} {t("likes").toLowerCase()}</span>
                  <span>{stats.comments} {t("comments").toLowerCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] md:grid-cols-2 lg:grid-cols-3">
                  <span>{stats.shares} {t("shares").toLowerCase()}</span>
                  <span>{stats.impressions} {t("impressions").toLowerCase()}</span>
                  <span>{stats.clicks} {t("clicks").toLowerCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
        );
      })()}
    </div>
  );
}
