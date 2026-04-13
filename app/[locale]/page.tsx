"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { StatusBadge } from "@/shared/components/status-badge";
import { usePosts } from "@/shared/hooks/use-posts";
import type { PostListItem } from "@/shared/types/api";
import { useTranslations } from "next-intl";

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
      <div className="mb-8 grid grid-cols-4 gap-4">
        {statsKeys.map((key) => (
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

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("recentPosts")}</h2>
        <Link
          href="/posts/new"
          className="rounded px-4 py-2 text-sm text-white hover:opacity-90 bg-[var(--accent-blue)]"
        >
          {tc("newPost")}
        </Link>
      </div>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">{tc("loading")}</p>
      ) : posts.length === 0 ? (
        <p className="text-[var(--text-secondary)]">{t("noPosts")}</p>
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
