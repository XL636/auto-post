"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useDrafts } from "@/shared/hooks/use-posts";
import { useFormatDate } from "@/shared/lib/date-format";
import type { PostListItem } from "@/shared/types/api";
import { useTranslations } from "next-intl";

interface ErrorResponse {
  error?: string;
}

function DraftIllustration() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-20 w-20">
      <path d="M20 16h28l12 12v36H20z" />
      <path d="M48 16v12h12" />
      <path d="M28 38h24" />
      <path d="M28 48h18" />
      <path d="M28 58h12" />
    </svg>
  );
}

export default function DraftsPage() {
  const { data: drafts = [], isLoading, mutate } = useDrafts();
  const formatDate = useFormatDate();
  const t = useTranslations("drafts");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  const handlePublish = async (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const response = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
    if (response.ok) {
      toast.success(tt("postPublished"));
    } else {
      const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
      toast.error(payload?.error || tt("failedToPublish"));
    }
    await mutate();
  };

  const handleDelete = async (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success(tt("draftDeleted"));
    } else {
      toast.error(tt("failedToDelete"));
    }
    await mutate();
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

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">{tc("loading")}</p>
      ) : drafts.length === 0 ? (
        <EmptyState
          icon={<DraftIllustration />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href="/posts/new">
              <Button className="bg-[var(--accent-blue)] text-white hover:opacity-90">{t("emptyCta")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {drafts.map((draft: PostListItem) => (
            <div
              key={draft.id}
              className="rounded border border-[var(--border-color)] p-4 transition-colors hover:bg-[var(--bg-hover)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="mt-1 flex shrink-0 gap-1">
                  {draft.platforms.map((platformPost) => (
                    <PlatformIcon key={platformPost.id} platform={platformPost.account.platform} />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{draft.content}</p>
                  <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                    {formatDate(new Date(draft.updatedAt), "yyyy/MM/dd HH:mm")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/posts/${draft.id}/edit`} className="rounded border border-[var(--border-color)] px-3 py-1 text-xs hover:bg-[var(--bg-hover)]">
                    {tc("edit")}
                  </Link>
                  <button onClick={(event) => handlePublish(draft.id, event)} className="rounded bg-[var(--accent-blue)] px-3 py-1 text-xs text-white hover:opacity-90">
                    {tc("publish")}
                  </button>
                  <button onClick={(event) => handleDelete(draft.id, event)} className="rounded border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--accent-red)] hover:bg-red-50">
                    {tc("delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
