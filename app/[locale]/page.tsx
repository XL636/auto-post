"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { StatusBadge } from "@/shared/components/status-badge";
import { usePosts } from "@/shared/hooks/use-posts";
import type { PostListItem } from "@/shared/types/api";
import { useTranslations } from "next-intl";

function DashboardIllustration() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-20 w-20">
      <rect x="12" y="14" width="56" height="52" rx="6" />
      <path d="M22 30h36" />
      <path d="M22 40h22" />
      <path d="M22 50h28" />
      <path d="M56 24v18" />
      <path d="M50 36l6 6 10-12" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data: posts = [], isLoading } = usePosts();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  const statsKeys = ["scheduled", "published", "failed", "draft"] as const;
  const stats = {
    scheduled: posts.filter((post) => post.status === "SCHEDULED").length,
    published: posts.filter((post) => post.status === "PUBLISHED").length,
    failed: posts.filter((post) => post.status === "FAILED").length,
    draft: posts.filter((post) => post.status === "DRAFT").length,
  };

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)
          : statsKeys.map((key) => (
              <Card key={key} className="border-[var(--border-color)] shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal text-[var(--text-secondary)]">
                    {t(key)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats[key]}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("recentPosts")}</h2>
        <Link href="/posts/new">
          <Button className="bg-[var(--accent-blue)] text-white hover:opacity-90">{tc("newPost")}</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<DashboardIllustration />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href="/posts/new">
              <Button className="bg-[var(--accent-blue)] text-white hover:opacity-90">{t("emptyCta")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {posts.slice(0, 10).map((post: PostListItem) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}/edit`}
              className="flex items-center gap-3 rounded border border-[var(--border-color)] p-3 transition-colors hover:bg-[var(--bg-hover)]"
            >
              <div className="flex gap-1">
                {post.platforms.map((platformPost) => (
                  <PlatformIcon key={platformPost.id} platform={platformPost.account.platform} />
                ))}
              </div>
              <span className="flex-1 truncate text-sm">{post.content}</span>
              <StatusBadge status={post.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
