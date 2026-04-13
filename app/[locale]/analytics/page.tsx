"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { fetchJson } from "@/shared/lib/fetcher";
import type { AnalyticsOverview, AnalyticsTotals } from "@/shared/types/api";
import { useTranslations } from "next-intl";

function formatPlatformName(platform: string, translatedName: string): string {
  const brand = platform.charAt(0) + platform.slice(1).toLowerCase();
  return translatedName ? `${brand} ${translatedName}` : brand;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useSWR<AnalyticsOverview>(`/api/analytics?days=${days}`, fetchJson);
  const t = useTranslations("analytics");
  const tp = useTranslations("platform");
  const tc = useTranslations("common");

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
    clicks: "Clicks",
  };

  const chartData = data?.byPlatform
    ? Object.entries(data.byPlatform).map(([platform, stats]) => ({
        platform: formatPlatformName(platform, tp(platform.toLowerCase())),
        likes: stats.likes,
        comments: stats.comments,
        shares: stats.shares,
      }))
    : [];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mb-6 flex gap-2">
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
        <p className="text-[var(--text-secondary)]">{tc("loading")}</p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-5 gap-4">
            {data?.totals
              ? (Object.entries(data.totals) as Array<[keyof AnalyticsTotals, number]>).map(
                  ([key, value]) => (
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
                  ),
                )
              : null}
          </div>

          {chartData.length > 0 ? (
            <Card className="border-[var(--border-color)] p-6 shadow-none">
              <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">
                {t("engagement")}
              </h3>
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
          ) : null}

          {data?.byPlatform ? (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">{t("breakdown")}</h3>
              {Object.entries(data.byPlatform).map(([platform, stats]) => (
                <div
                  key={platform}
                  className="flex items-center gap-4 rounded border border-[var(--border-color)] p-3"
                >
                  <PlatformIcon platform={platform} />
                  <span className="w-28 text-sm font-medium">
                    {formatPlatformName(platform, tp(platform.toLowerCase()))}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {stats.likes} {t("likes").toLowerCase()}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {stats.comments} {t("comments").toLowerCase()}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {stats.shares} {t("shares").toLowerCase()}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {stats.impressions} {t("impressions").toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
