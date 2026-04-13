"use client";

import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { PlatformLimitBars, type PlatformLimitItem } from "@/shared/components/platform-limit-bars";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";
import { usePost } from "@/shared/hooks/use-posts";
import type { PostListItem } from "@/shared/types/api";
import { useTranslations } from "next-intl";

const PLATFORM_LIMITS: Record<string, number> = {
  LINKEDIN: 3000,
  FACEBOOK: 63206,
  DISCORD: 2000,
  REDDIT: 40000,
  TWITTER: 280,
  YOUTUBE: 5000,
};

function formatPlatformName(platform: string, translatedName: string): string {
  const brand = platform.charAt(0) + platform.slice(1).toLowerCase();
  return translatedName ? `${brand} ${translatedName}` : brand;
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: post } = usePost(id);
  const { dialog, confirm } = useConfirmDialog();
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const t = useTranslations("editPost");
  const tp = useTranslations("platform");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setScheduledAt(toDatetimeLocal(post.scheduledAt));
    }
  }, [post]);

  const platformItems = useMemo<PlatformLimitItem[]>(() => {
    if (!post) {
      return [];
    }

    const seen = new Set<string>();
    return post.platforms
      .map((platformPost) => platformPost.account.platform)
      .filter((platform) => {
        if (!PLATFORM_LIMITS[platform] || seen.has(platform)) {
          return false;
        }
        seen.add(platform);
        return true;
      })
      .map((platform) => ({
        platform,
        label: formatPlatformName(platform, tp(platform.toLowerCase())),
        current: content.length,
        limit: PLATFORM_LIMITS[platform],
      }));
  }, [content.length, post, tp]);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const scheduledInPast = Boolean(scheduledAt) && new Date(scheduledAt).getTime() < Date.now();

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
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
      router.push("/posts");
    } else {
      toast.error(tt("failedToDelete"));
    }
  };

  if (!post) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("title")} />
      {post.platforms.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.platforms.map((platformPost: PostListItem["platforms"][number]) => (
            <div key={platformPost.id} className="flex items-center gap-1.5 rounded bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-secondary)]">
              <PlatformIcon platform={platformPost.account.platform} size={14} />
              {platformPost.account.displayName}
            </div>
          ))}
        </div>
      ) : null}
      <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="mb-2 min-h-[150px] resize-none border-[var(--border-color)]" />
      <div className="mb-4 text-xs text-[var(--text-tertiary)]">{tc("characters", { count: content.length })}</div>
      <div className="mb-6">
        <PlatformLimitBars items={platformItems} title={t("platformLimits")} />
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">{t("schedule")}</label>
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
          className="w-full max-w-xs border-[var(--border-color)]"
        />
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">{t("timezoneHint", { tz: timezone })}</p>
        {scheduledInPast ? <p className="mt-1 text-xs text-[var(--accent-red)]">{t("schedulePast")}</p> : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-[var(--accent-blue)] text-white hover:opacity-90">
          {saving ? tc("saving") : tc("save")}
        </Button>
        <Button variant="outline" onClick={() => router.back()} className="border-[var(--border-color)]">
          {tc("cancel")}
        </Button>
        <button type="button" onClick={handleDelete} className="rounded border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--accent-red)] hover:bg-red-50">
          {tc("delete")}
        </button>
      </div>
      {dialog}
    </div>
  );
}
