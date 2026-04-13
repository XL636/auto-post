"use client";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
  SCHEDULED: "bg-blue-50 text-[var(--accent-blue)]",
  PUBLISHING: "bg-orange-50 text-[var(--accent-orange)]",
  PUBLISHED: "bg-green-50 text-[var(--accent-green)]",
  FAILED: "bg-red-50 text-[var(--accent-red)]",
};

const STATUS_KEYS: Record<string, string> = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PUBLISHING: "publishing",
  PUBLISHED: "published",
  FAILED: "failed",
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("status");
  const key = STATUS_KEYS[status];

  return (
    <Badge variant="outline" className={`${STATUS_STYLES[status] || ""} border-0 text-xs`}>
      {key ? t(key) : status.toLowerCase()}
    </Badge>
  );
}
