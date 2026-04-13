"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { StatusBadge } from "@/shared/components/status-badge";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";
import { usePosts } from "@/shared/hooks/use-posts";
import { useFormatDate } from "@/shared/lib/date-format";
import type { PostListItem } from "@/shared/types/api";
import { useTranslations } from "next-intl";

function PostsIllustration() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-20 w-20">
      <rect x="16" y="14" width="48" height="52" rx="6" />
      <path d="M26 28h28" />
      <path d="M26 38h28" />
      <path d="M26 48h18" />
      <path d="M50 50l5 5 9-12" />
    </svg>
  );
}

function getStatusDotColor(status: PostListItem["status"]): string {
  switch (status) {
    case "FAILED":
      return "bg-[var(--accent-red)]";
    case "PUBLISHED":
      return "bg-[var(--accent-green)]";
    case "PUBLISHING":
      return "bg-[var(--accent-orange)]";
    case "SCHEDULED":
      return "bg-[var(--accent-blue)]";
    default:
      return "bg-[var(--text-tertiary)]";
  }
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M8 7l1 12h6l1-12" />
    </svg>
  );
}

export default function PostsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: posts = [], isLoading, mutate } = usePosts(statusFilter === "ALL" ? undefined : statusFilter);
  const formatDate = useFormatDate();
  const { dialog, confirm } = useConfirmDialog();
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

  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const handleDelete = async (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const approved = await confirm({
      title: t("deleteDialogTitle"),
      description: t("confirmDelete"),
      confirmLabel: tc("delete"),
      cancelLabel: tc("cancel"),
      variant: "destructive",
    });

    if (!approved) {
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
    const approved = await confirm({
      title: t("bulkDeleteDialogTitle"),
      description: t("confirmBulkDelete", { count: selectedIds.size }),
      confirmLabel: tc("delete"),
      cancelLabel: tc("cancel"),
      variant: "destructive",
    });

    if (!approved) {
      return;
    }

    const response = await fetch("/api/posts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", ids: selectedIdsArray }),
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
    const approved = await confirm({
      title: t("bulkPublishDialogTitle"),
      description: t("confirmBulkPublish", { count: selectedIds.size }),
      confirmLabel: tc("publish"),
      cancelLabel: tc("cancel"),
    });

    if (!approved) {
      return;
    }

    const response = await fetch("/api/posts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", ids: selectedIdsArray }),
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

  const handleRetry = async (postId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const response = await fetch(`/api/posts/${postId}/publish`, { method: "POST" });
    if (response.ok) {
      toast.success(tt("postPublished"));
      await mutate();
    } else {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(payload?.error || tt("failedToPublish"));
    }
  };

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Link href="/posts/new">
            <Button className="bg-[var(--accent-blue)] text-white hover:opacity-90">{tc("newPost")}</Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
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
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
          <span className="text-sm text-[var(--text-secondary)]">{tc("selected", { count: selectedIds.size })}</span>
          <button onClick={handleBulkPublish} className="rounded bg-[var(--accent-blue)] px-3 py-1 text-xs text-white hover:opacity-90">
            {tc("publish")}
          </button>
          <button onClick={handleBulkDelete} className="rounded border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--accent-red)] hover:bg-red-50">
            {tc("delete")}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
            {tc("clear")}
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded border border-[var(--border-color)] p-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="hidden h-3 w-32 md:block" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<PostsIllustration />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href="/posts/new">
              <Button className="bg-[var(--accent-blue)] text-white hover:opacity-90">{t("emptyCta")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded border border-[var(--border-color)]">
          {posts.map((post: PostListItem, index) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}/edit`}
              className={`flex items-center gap-3 p-4 transition-colors hover:bg-[var(--bg-hover)] md:gap-4 ${
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
                <p className="truncate text-sm text-[var(--text-primary)]">{post.content}</p>
                {post.status === "FAILED" && post.platforms[0]?.errorMessage ? (
                  <p className="mt-0.5 truncate text-xs text-[var(--accent-red)]">{post.platforms[0].errorMessage}</p>
                ) : null}
                <p className="mt-1 hidden text-xs text-[var(--text-tertiary)] md:block">
                  {post.scheduledAt
                    ? `${ts("scheduled")}: ${formatDate(new Date(post.scheduledAt), "yyyy/MM/dd HH:mm")}`
                    : formatDate(new Date(post.createdAt), "yyyy/MM/dd HH:mm")}
                </p>
              </div>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full md:hidden ${getStatusDotColor(post.status)}`} />
              <div className="hidden md:block">
                <StatusBadge status={post.status} />
              </div>
              {post.status === "FAILED" ? (
                <button
                  type="button"
                  onClick={(event) => handleRetry(post.id, event)}
                  className="hidden rounded border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] md:inline-flex"
                >
                  {t("retry")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={(event) => handleDelete(post.id, event)}
                className="rounded border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-[var(--accent-red)] hover:bg-red-50 md:px-3"
                title={tc("delete")}
              >
                <span className="md:hidden"><TrashIcon /></span>
                <span className="hidden md:inline">{tc("delete")}</span>
              </button>
            </Link>
          ))}
        </div>
      )}
      {dialog}
    </div>
  );
}
