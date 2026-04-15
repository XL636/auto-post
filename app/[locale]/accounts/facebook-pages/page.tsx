"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";

interface FacebookPageItem {
  id: string;
  name: string;
  category?: string;
  pictureUrl?: string;
}

export default function FacebookPagesPage() {
  const [pages, setPages] = useState<FacebookPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("accounts");
  const tt = useTranslations("toast");

  useEffect(() => {
    fetch("/api/oauth/facebook/pages")
      .then((res) => res.json())
      .then((data: { error?: string; pages?: FacebookPageItem[] }) => {
        if (data.error) {
          toast.error(data.error);
          router.push("/accounts");
          return;
        }

        setPages(data.pages || []);
      })
      .catch(() => {
        toast.error("Failed to load pages");
        router.push("/accounts");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSelect = async (pageId: string) => {
    setSaving(pageId);

    try {
      const res = await fetch("/api/oauth/facebook/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error || "Failed to connect page");
        return;
      }

      toast.success(tt("accountConnected", { platform: "Facebook" }));
      router.push("/accounts?connected=facebook");
    } catch {
      toast.error("Failed to connect page");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <PageHeader title={t("selectFacebookPage")} description={t("selectFacebookPageDesc")} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <p className="text-[var(--text-secondary)]">{t("noFacebookPages")}</p>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-4 rounded-[4px] border border-[var(--border-color)] bg-white p-4"
            >
              {page.pictureUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={page.pictureUrl} alt={page.name} className="h-10 w-10 rounded-full" />
                </>
              ) : (
                <PlatformIcon platform="FACEBOOK" size={40} />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{page.name}</p>
                {page.category ? (
                  <p className="text-xs text-[var(--text-tertiary)]">{page.category}</p>
                ) : null}
              </div>
              <Button
                onClick={() => handleSelect(page.id)}
                disabled={saving !== null}
                className="bg-[var(--accent-blue)] text-white hover:opacity-90"
              >
                {saving === page.id ? t("connecting") : t("connect")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
