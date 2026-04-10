"use client";
import { usePosts } from "@/shared/hooks/use-posts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/page-header";
import { StatusBadge } from "@/shared/components/status-badge";
import { PlatformIcon } from "@/shared/components/platform-icon";
import Link from "next/link";

export default function DashboardPage() {
  const { data: posts, isLoading } = usePosts();

  const stats = {
    scheduled: posts?.filter((p: any) => p.status === "SCHEDULED").length || 0,
    published: posts?.filter((p: any) => p.status === "PUBLISHED").length || 0,
    failed: posts?.filter((p: any) => p.status === "FAILED").length || 0,
    drafts: posts?.filter((p: any) => p.status === "DRAFT").length || 0,
  };

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your social media activity" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(stats).map(([key, value]) => (
          <Card key={key} className="border-[var(--border-color)] shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-[var(--text-secondary)] capitalize">
                {key}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Posts</h2>
        <Link
          href="/posts/new"
          className="px-4 py-2 bg-[var(--accent-blue)] text-white text-sm rounded hover:opacity-90"
        >
          New Post
        </Link>
      </div>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading...</p>
      ) : !posts?.length ? (
        <p className="text-[var(--text-secondary)]">No posts yet. Create your first post!</p>
      ) : (
        <div className="space-y-2">
          {posts.slice(0, 10).map((post: any) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}/edit`}
              className="flex items-center gap-3 p-3 rounded border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex gap-1">
                {post.platforms?.map((pp: any) => (
                  <PlatformIcon key={pp.id} platform={pp.account.platform} />
                ))}
              </div>
              <span className="flex-1 text-sm truncate">{post.content}</span>
              <StatusBadge status={post.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
