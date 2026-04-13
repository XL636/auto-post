"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useAccounts } from "@/shared/hooks/use-accounts";
import { useTranslations } from "next-intl";

interface UploadResponse {
  url: string;
}

interface CreatePostResponse {
  id: string;
}

interface ErrorResponse {
  error?: string;
}

interface CreatePostPayload {
  content: string;
  mediaUrls: string[];
  platformAccountIds: string[];
  scheduledAt?: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const t = useTranslations("newPost");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  const toggleAccount = (id: string) => {
    setSelectedAccounts((current) =>
      current.includes(id) ? current.filter((accountId) => accountId !== id) : [...current, id],
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (response.ok) {
          const payload = (await response.json()) as UploadResponse;
          setMediaUrls((current) => [...current, payload.url]);
        } else {
          toast.error(tt("failedToUpload", { name: file.name }));
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (publishNow: boolean) => {
    if (!content.trim() || selectedAccounts.length === 0) {
      return;
    }

    setPublishing(true);
    try {
      const body: CreatePostPayload = {
        content,
        mediaUrls,
        platformAccountIds: selectedAccounts,
      };
      if (scheduledAt && !publishNow) {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
        toast.error(payload?.error || tt("failedToCreate"));
        return;
      }

      const post = (await response.json()) as CreatePostResponse;
      if (publishNow) {
        const publishResponse = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
        if (!publishResponse.ok) {
          const payload = (await publishResponse.json().catch(() => null)) as ErrorResponse | null;
          toast.error(payload?.error || tt("failedToPublish"));
          return;
        }
        toast.success(tt("postPublished"));
      } else {
        toast.success(scheduledAt ? tt("postScheduled") : tt("draftSaved"));
      }
      router.push("/posts");
    } catch {
      toast.error(tt("somethingWrong"));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            {t("content")}
          </label>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("placeholder")}
            className="min-h-[150px] resize-none border-[var(--border-color)]"
          />
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {tc("characters", { count: content.length })}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            {t("media")}
          </label>
          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            multiple
            onChange={handleFileUpload}
            className="text-sm file:mr-4 file:rounded file:border-0 file:bg-[var(--bg-secondary)] file:px-4 file:py-2 file:text-sm file:text-[var(--text-primary)] hover:file:bg-[var(--bg-hover)]"
          />
          {uploading ? <p className="mt-1 text-xs text-[var(--text-tertiary)]">{t("uploading")}</p> : null}
          {mediaUrls.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {mediaUrls.map((url, index) => (
                <div key={url} className="relative">
                  <Image
                    src={url}
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded border border-[var(--border-color)] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            {t("platforms")}
          </label>
          {accounts.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">
              {t("noAccounts")}{" "}
              <Link href="/accounts" className="text-[var(--accent-blue)]">
                {t("connectOne")}
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => toggleAccount(account.id)}
                  disabled={!account.canPublish}
                  title={account.canPublish ? undefined : account.lastError || account.statusLabel}
                  className={`flex items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${
                    selectedAccounts.includes(account.id)
                      ? "border-[var(--accent-blue)] bg-blue-50"
                      : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <PlatformIcon platform={account.platform} size={16} />
                  {account.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            {t("schedule")}
          </label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="w-auto border-[var(--border-color)]"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleSubmit(true)}
            disabled={publishing || !content.trim() || selectedAccounts.length === 0}
            className="bg-[var(--accent-blue)] hover:opacity-90"
          >
            {publishing ? tc("publishing") : t("publishNow")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={publishing || !content.trim() || selectedAccounts.length === 0}
            className="border-[var(--border-color)]"
          >
            {scheduledAt ? t("scheduleSend") : t("saveDraft")}
          </Button>
        </div>
      </div>
    </div>
  );
}
