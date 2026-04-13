"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { StatusBadge } from "@/shared/components/status-badge";
import { usePosts } from "@/shared/hooks/use-posts";
import { useFormatDate } from "@/shared/lib/date-format";
import type { PostListItem } from "@/shared/types/api";
import { useTranslations } from "next-intl";

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: posts = [], isLoading, mutate } = usePosts(
    statusFilter === "ALL" ? undefined : statusFilter,
  );
  const formatDate = useFormatDate();
  const t = useTranslations("posts");
  const tc = useTranslations("common");
  const ts = useTranslations("status");
  const tt = useTranslations("toast");

  const statuses = [
    { key: "ALL", label: t("all") },
    { key: "DRAFT", label: ts("draft") },
    { key: "SCHEDULED", label: ts("scheduled") },
    { key: "PUBLISHED", label: ts("published") },
    { key: "FAILED", label: ts("failed") },
  ];

  const handleDelete = async (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(t("confirmDelete"))) {
      return;
    }

    const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success(tt("postDeleted"));
      await mutate();
    } else {
      toast.error(tt("failedToDelete"));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(t("confirmBulkDelete", { count: selectedIds.size }))) {
      return;
    }

    const response = await fetch("/api/posts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", ids: Array.from(selectedIds) }),
    });

    if (response.ok) {
      const payload = (await response.json()) as { succeeded: number };
      toast.success(tt("bulkDeleted", { count: payload.succeeded }));
      setSelectedIds(new Set());
      await mutate();
    } else {
      toast.error(tt("bulkDeleteFailed"));
    }
  };

  const handleBulkPublish = async () => {
    if (!confirm(t("confirmBulkPublish", { count: selectedIds.size }))) {
      return;
    }

    const response = await fetch("/api/posts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", ids: Array.from(selectedIds) }),
    });

    if (response.ok) {
      const payload = (await response.json()) as { succeeded: number };
      toast.success(tt("bulkPublished", { count: payload.succeeded }));
      setSelectedIds(new Set());
      await mutate();
    } else {
      toast.error(tt("bulkPublishFailed"));
    }
  };

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Link
            href="/posts/new"
            className="rounded px-4 py-2 text-sm text-white hover:opacity-90 bg-[var(--accent-blue)]"
          >
            {tc("newPost")}
          </Link>
        }
      />

      <div className="mb-6 flex gap-2">
        {statuses.map((status) => (
          <button
            key={status.key}
            onClick={() => setStatusFilter(status.key)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              statusFilter === status.key
                ? "bg-[var(--text-primary)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {selectedIds.size > 0 ? (
        <div className="mb-4 flex items-center gap-3 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
          <span className="text-sm text-[var(--text-secondary)]">
            {tc("selected", { count: selectedIds.size })}
          </span>
          <button
            onClick={handleBulkPublish}
            className="rounded bg-[var(--accent-blue)] px-3 py-1 text-xs text-white hover:opacity-90"
          >
            {tc("publish")}
          </button>
          <button
            onClick={handleBulkDelete}
            className="rounded border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--accent-red)] hover:bg-red-50"
          >
            {tc("delete")}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            {tc("clear")}
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">{tc("loading")}</p>
      ) : posts.length === 0 ? (
        <p className="text-[var(--text-secondary)]">{t("noPosts")}</p>
      ) : (
        <div className="overflow-hidden rounded border border-[var(--border-color)]">
          {posts.map((post: PostListItem, index) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}/edit`}
              className={`flex items-center gap-4 p-4 transition-colors hover:bg-[var(--bg-hover)] ${
                index > 0 ? "border-t border-[var(--border-color)]" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(post.id)}
                onClick={(event) => event.stopPropagation()}
                onChange={() => {
                  setSelectedIds((current) => {
                    const next = new Set(current);
                    if (next.has(post.id)) {
                      next.delete(post.id);
                    } else {
                      next.add(post.id);
                    }
                    return next;
                  });
                }}
                className="h-4 w-4 shrink-0 accent-[var(--accent-blue)]"
              />
              <div className="flex shrink-0 gap-1">
                {post.platforms.map((platformPost) => (
                  <PlatformIcon key={platformPost.id} platform={platformPost.account.platform} />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{post.content}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {post.scheduledAt
                    ? `${ts("scheduled")}: ${formatDate(new Date(post.scheduledAt), "yyyy/MM/dd HH:mm")}`
                    : formatDate(new Date(post.createdAt), "yyyy/MM/dd HH:mm")}
                </p>
              </div>
              <StatusBadge status={post.status} />
              <button
                type="button"
                onClick={(event) => handleDelete(post.id, event)}
                className="rounded border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--accent-red)] hover:bg-red-50"
              >
                {tc("delete")}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
