"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { PlatformLimitBars, type PlatformLimitItem } from "@/shared/components/platform-limit-bars";
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

function UploadIllustration() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="mx-auto mb-3 h-8 w-8">
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M5 19h14" />
    </svg>
  );
}

export default function NewPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: accounts = [] } = useAccounts();
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const t = useTranslations("newPost");
  const tp = useTranslations("platform");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  const selectedPlatformItems = useMemo<PlatformLimitItem[]>(() => {
    const seen = new Set<string>();

    return accounts
      .filter((account) => selectedAccounts.includes(account.id))
      .filter((account) => {
        if (seen.has(account.platform)) {
          return false;
        }
        seen.add(account.platform);
        return Boolean(PLATFORM_LIMITS[account.platform]);
      })
      .map((account) => ({
        platform: account.platform,
        label: formatPlatformName(account.platform, tp(account.platform.toLowerCase())),
        current: content.length,
        limit: PLATFORM_LIMITS[account.platform],
      }));
  }, [accounts, content.length, selectedAccounts, tp]);

  const firstExceededPlatform = selectedPlatformItems.find((item) => item.current > item.limit);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const scheduledInPast = Boolean(scheduledAt) && new Date(scheduledAt).getTime() < Date.now();

  const toggleAccount = (id: string) => {
    setSelectedAccounts((current) =>
      current.includes(id) ? current.filter((accountId) => accountId !== id) : [...current, id],
    );
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const nextFiles = Array.from(files);
    if (nextFiles.length === 0) {
      return;
    }

    setUploadingFiles((current) => [...current, ...nextFiles.map((file) => file.name)]);

    try {
      for (const file of nextFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (response.ok) {
          const payload = (await response.json()) as UploadResponse;
          setMediaUrls((current) => [...current, payload.url]);
        } else {
          toast.error(tt("failedToUpload", { name: file.name }));
        }
        setUploadingFiles((current) => current.filter((name) => name !== file.name));
      }
    } catch {
      toast.error(tt("somethingWrong"));
      setUploadingFiles([]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    await uploadFiles(files);
    event.target.value = "";
  };

  const handleSubmit = async (mode: "publish" | "schedule" | "draft") => {
    if (!content.trim()) {
      return;
    }

    if (mode !== "draft" && selectedAccounts.length === 0) {
      return;
    }

    if (mode === "schedule" && (!scheduledAt || scheduledInPast)) {
      return;
    }

    setPublishing(true);
    try {
      const body: CreatePostPayload = {
        content,
        mediaUrls,
        platformAccountIds: mode === "draft" ? selectedAccounts : selectedAccounts,
      };

      if (mode === "schedule" && scheduledAt) {
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

      if (mode === "publish") {
        const publishResponse = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
        if (!publishResponse.ok) {
          const payload = (await publishResponse.json().catch(() => null)) as ErrorResponse | null;
          toast.error(payload?.error || tt("failedToPublish"));
          return;
        }
        toast.success(tt("postPublished"));
      } else if (mode === "schedule") {
        toast.success(tt("postScheduled"));
      } else {
        toast.success(tt("draftSaved"));
      }

      router.push("/posts");
    } catch {
      toast.error(tt("somethingWrong"));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">{t("content")}</label>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("placeholder")}
            className="min-h-[150px] resize-none border-[var(--border-color)]"
          />
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">{tc("characters", { count: content.length })}</p>
          <div className="mt-3">
            <PlatformLimitBars items={selectedPlatformItems} title={t("platformLimits")} />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">{t("media")}</label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              void uploadFiles(event.dataTransfer.files);
            }}
            className={`cursor-pointer rounded-[4px] border-2 border-dashed p-6 text-center transition-colors ${
              isDragging
                ? "border-[var(--accent-blue)] bg-blue-50"
                : "border-[var(--border-color)] bg-white"
            }`}
          >
            <UploadIllustration />
            <p className="text-sm font-medium text-[var(--text-primary)]">{t("dropzoneTitle")}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{t("dropzoneDescription")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {uploadingFiles.length > 0 ? (
            <div className="mt-3 space-y-1">
              {uploadingFiles.map((fileName) => (
                <p key={fileName} className="text-xs text-[var(--text-secondary)]">
                  {fileName} {t("uploadingFile")} <span className="animate-pulse">...</span>
                </p>
              ))}
            </div>
          ) : null}
          {mediaUrls.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaUrls.map((url, index) => (
                <div key={url} className="relative">
                  <Image src={url} alt="" width={80} height={80} className="h-20 w-20 rounded border border-[var(--border-color)] object-cover" />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMediaUrls((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    }}
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
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">{t("platforms")}</label>
          {accounts.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">
              {t("noAccounts")} <Link href="/accounts" className="text-[var(--accent-blue)]">{t("connectOne")}</Link>
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => handleSubmit("publish")}
            disabled={publishing || !content.trim() || selectedAccounts.length === 0}
            title={firstExceededPlatform ? t("limitExceededTooltip", { platform: firstExceededPlatform.label }) : undefined}
            className="bg-[var(--accent-blue)] text-white hover:opacity-90"
          >
            {publishing ? tc("publishing") : t("publishNow")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit("schedule")}
            disabled={publishing || !content.trim() || selectedAccounts.length === 0 || !scheduledAt || scheduledInPast}
            title={!scheduledAt ? t("scheduleTooltip") : scheduledInPast ? t("schedulePast") : undefined}
            className="border-[var(--border-color)]"
          >
            {t("scheduleSend")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleSubmit("draft")}
            disabled={publishing || !content.trim()}
            className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            {t("saveDraft")}
          </Button>
        </div>
      </div>
    </div>
  );
}
