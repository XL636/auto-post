"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { usePost } from "@/shared/hooks/use-posts";
import type { PostListItem } from "@/shared/types/api";
import { useTranslations } from "next-intl";

function formatPlatformName(platform: string, translatedName: string): string {
  const brand = platform.charAt(0) + platform.slice(1).toLowerCase();
  return translatedName ? `${brand} ${translatedName}` : brand;
}

const PLATFORM_LIMITS: Record<string, number> = {
  LINKEDIN: 3000,
  FACEBOOK: 63206,
  DISCORD: 2000,
  REDDIT: 40000,
  TWITTER: 280,
  YOUTUBE: 5000,
};

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: post } = usePost(id);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const t = useTranslations("editPost");
  const tp = useTranslations("platform");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  useEffect(() => {
    if (post) {
      setContent(post.content);
    }
  }, [post]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        toast.success(tt("postSaved"));
        router.push("/posts");
      } else {
        toast.error(tt("failedToSave"));
      }
    } catch {
      toast.error(tt("failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) {
      return;
    }

    const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success(tt("postDeleted"));
      router.push("/posts");
    } else {
      toast.error(tt("failedToDelete"));
    }
  };

  if (!post) {
    return <p className="text-[var(--text-secondary)]">{tc("loading")}</p>;
  }

  const platforms = post.platforms.map((platformPost) => platformPost.account.platform);

  return (
    <div className="max-w-2xl">
      <PageHeader title={t("title")} />
      {platforms.length > 0 ? (
        <div className="mb-4 flex gap-2">
          {post.platforms.map((platformPost: PostListItem["platforms"][number]) => (
            <div
              key={platformPost.id}
              className="flex items-center gap-1.5 rounded bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-secondary)]"
            >
              <PlatformIcon platform={platformPost.account.platform} size={14} />
              {platformPost.account.displayName}
            </div>
          ))}
        </div>
      ) : null}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="mb-2 min-h-[150px] resize-none border-[var(--border-color)]"
      />
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
        <span>{tc("characters", { count: content.length })}</span>
        {platforms.map((platform) => {
          const limit = PLATFORM_LIMITS[platform];
          if (!limit) {
            return null;
          }

          const over = content.length > limit;
          return (
            <span key={platform} className={over ? "text-[var(--accent-red)]" : ""}>
              {formatPlatformName(platform, tp(platform.toLowerCase()))} {over ? "✗" : "✓"} (
              {content.length}/{limit})
            </span>
          );
        })}
      </div>
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-[var(--accent-blue)]">
          {saving ? tc("saving") : tc("save")}
        </Button>
        <Button variant="outline" onClick={() => router.back()} className="border-[var(--border-color)]">
          {tc("cancel")}
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--accent-red)] hover:bg-red-50"
        >
          {tc("delete")}
        </button>
      </div>
    </div>
  );
}
