"use client";
import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useSWR(`/api/analytics?days=${days}`, fetcher);

  const chartData = data?.byPlatform
    ? Object.entries(data.byPlatform).map(([platform, stats]: [string, any]) => ({
        platform,
        likes: stats.likes,
        comments: stats.comments,
        shares: stats.shares,
      }))
    : [];

  return (
    <div>
      <PageHeader title="Analytics" description="Track your social media performance" />

      <div className="flex gap-2 mb-6">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setDays(r.value)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              days === r.value
                ? "bg-[var(--text-primary)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-4 mb-8">
            {data?.totals &&
              Object.entries(data.totals).map(([key, value]) => (
                <Card key={key} className="border-[var(--border-color)] shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal text-[var(--text-secondary)] capitalize">
                      {key}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(value as number).toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {chartData.length > 0 && (
            <Card className="border-[var(--border-color)] shadow-none p-6">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                Engagement by Platform
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="likes" fill="var(--accent-blue)" name="Likes" />
                  <Bar dataKey="comments" fill="var(--accent-green)" name="Comments" />
                  <Bar dataKey="shares" fill="var(--accent-orange)" name="Shares" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {data?.byPlatform && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">Platform Breakdown</h3>
              {Object.entries(data.byPlatform).map(([platform, stats]: [string, any]) => (
                <div key={platform} className="flex items-center gap-4 p-3 border border-[var(--border-color)] rounded">
                  <PlatformIcon platform={platform} />
                  <span className="font-medium text-sm w-24">{platform}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{stats.likes} likes</span>
                  <span className="text-xs text-[var(--text-secondary)]">{stats.comments} comments</span>
                  <span className="text-xs text-[var(--text-secondary)]">{stats.shares} shares</span>
                  <span className="text-xs text-[var(--text-secondary)]">{stats.impressions} impressions</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
