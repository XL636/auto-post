"use client";
import { useDrafts } from "@/shared/hooks/use-posts";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import Link from "next/link";
import { format } from "date-fns";

export default function DraftsPage() {
  const { data: drafts, isLoading, mutate } = useDrafts();

  const handlePublish = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    await fetch(`/api/posts/${id}/publish`, { method: "POST" });
    mutate();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    mutate();
  };

  return (
    <div>
      <PageHeader
        title="Drafts"
        description="Posts saved for later"
        action={
          <Link
            href="/posts/new"
            className="px-4 py-2 bg-[var(--accent-blue)] text-white text-sm rounded hover:opacity-90"
          >
            New Post
          </Link>
        }
      />

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading...</p>
      ) : !drafts?.length ? (
        <p className="text-[var(--text-secondary)]">No drafts yet.</p>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft: any) => (
            <div
              key={draft.id}
              className="p-4 border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex gap-1 shrink-0 mt-1">
                  {draft.platforms?.map((pp: any) => (
                    <PlatformIcon key={pp.id} platform={pp.account.platform} />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{draft.content}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    Updated {format(new Date(draft.updatedAt), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/posts/${draft.id}/edit`}
                    className="px-3 py-1 text-xs border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)]"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={(e) => handlePublish(draft.id, e)}
                    className="px-3 py-1 text-xs bg-[var(--accent-blue)] text-white rounded hover:opacity-90"
                  >
                    Publish
                  </button>
                  <button
                    onClick={(e) => handleDelete(draft.id, e)}
                    className="px-3 py-1 text-xs text-[var(--accent-red)] border border-[var(--border-color)] rounded hover:bg-red-50"
                  >
                    Delete
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
