"use client";
import { useState } from "react";
import { usePosts } from "@/shared/hooks/use-posts";
import { PageHeader } from "@/shared/components/page-header";
import { StatusBadge } from "@/shared/components/status-badge";
import { PlatformIcon } from "@/shared/components/platform-icon";
import Link from "next/link";
import { format } from "date-fns";

const STATUSES = ["ALL", "DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"];

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data: posts, isLoading } = usePosts(
    statusFilter === "ALL" ? undefined : statusFilter,
  );

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Manage all your social media posts"
        action={
          <Link
            href="/posts/new"
            className="px-4 py-2 bg-[var(--accent-blue)] text-white text-sm rounded hover:opacity-90"
          >
            New Post
          </Link>
        }
      />

      <div className="flex gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              statusFilter === s
                ? "bg-[var(--text-primary)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {s.toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading...</p>
      ) : !posts?.length ? (
        <p className="text-[var(--text-secondary)]">No posts found.</p>
      ) : (
        <div className="border border-[var(--border-color)] rounded overflow-hidden">
          {posts.map((post: any, i: number) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}/edit`}
              className={`flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] transition-colors ${
                i > 0 ? "border-t border-[var(--border-color)]" : ""
              }`}
            >
              <div className="flex gap-1 shrink-0">
                {post.platforms?.map((pp: any) => (
                  <PlatformIcon key={pp.id} platform={pp.account.platform} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{post.content}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {post.scheduledAt
                    ? `Scheduled: ${format(new Date(post.scheduledAt), "MMM d, yyyy HH:mm")}`
                    : format(new Date(post.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <StatusBadge status={post.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
