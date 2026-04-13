"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { usePlatformCredentials } from "@/shared/hooks/use-platform-credentials";
import { useFormatDate } from "@/shared/lib/date-format";
import type { PlatformCredentialFieldKey, PlatformCredentialStatus } from "@/shared/types/api";

const PLATFORM_ORDER = ["LINKEDIN", "TWITTER", "FACEBOOK", "DISCORD", "REDDIT", "YOUTUBE"] as const;

type FormState = Partial<Record<PlatformCredentialFieldKey, string>>;

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

function getSourcePillClass(source: PlatformCredentialStatus["source"]): string {
  switch (source) {
    case "database":
      return "bg-emerald-50 text-emerald-700";
    case "environment":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function PlatformCredentialsPage() {
  const { data: credentials = [], isLoading, mutate } = usePlatformCredentials();
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const formatDate = useFormatDate();
  const t = useTranslations("credentials");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  const orderedCredentials = useMemo(() => {
    const byPlatform = new Map(credentials.map((item) => [item.platform, item]));
    return PLATFORM_ORDER.map((platform) => byPlatform.get(platform)).filter(
      (item): item is PlatformCredentialStatus => Boolean(item),
    );
  }, [credentials]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSelectedPlatform(new URLSearchParams(window.location.search).get("platform")?.toUpperCase() || null);
    }
  }, []);

  useEffect(() => {
    setForms((current) => {
      const next = { ...current };

      for (const credential of credentials) {
        const existing = next[credential.platform] || {};
        const seeded = { ...existing };

        for (const field of credential.fields) {
          if (field.secret || seeded[field.key] !== undefined) {
            continue;
          }

          const configuredValue = credential.configuredValues[field.key];
          if (configuredValue) {
            seeded[field.key] = configuredValue;
          }
        }

        next[credential.platform] = seeded;
      }

      return next;
    });
  }, [credentials]);

  const handleFieldChange = (platform: string, key: PlatformCredentialFieldKey, value: string) => {
    setForms((current) => ({
      ...current,
      [platform]: {
        ...current[platform],
        [key]: value,
      },
    }));
  };

  const handleSave = async (credential: PlatformCredentialStatus) => {
    const form = forms[credential.platform] || {};
    setSavingPlatform(credential.platform);

    try {
      const response = await fetch("/api/platform-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: credential.platform,
          clientId: form.clientId,
          clientSecret: form.clientSecret,
          botToken: form.botToken,
          webhookUrl: form.webhookUrl,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error || tt("failedToSave"));
        return;
      }

      setForms((current) => ({ ...current, [credential.platform]: { clientId: form.clientId } }));
      toast.success(tt("credentialsSaved", { platform: t(`platformNames.${credential.platform.toLowerCase()}`) }));
      await mutate();
    } finally {
      setSavingPlatform(null);
    }
  };

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(t("copied"));
  };

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      {isLoading ? (
        <p className="text-[var(--text-secondary)]">{tc("loading")}</p>
      ) : (
        <div className="space-y-4">
          {orderedCredentials.map((credential) => {
            const form = forms[credential.platform] || {};
            const highlighted = selectedPlatform === credential.platform;
            const platformKey = credential.platform.toLowerCase();
            const isEnvSource = credential.source === "environment";

            return (
              <section key={credential.platform} className={`rounded border p-5 ${highlighted ? "border-[var(--accent-blue)] shadow-sm" : "border-[var(--border-color)]"}`}>
                <div className="mb-4 flex flex-wrap items-start gap-3">
                  <PlatformIcon platform={credential.platform} size={28} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t(`platformNames.${platformKey}`)}</h2>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">{t(`help.${platformKey}`)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{t(`portalHelp.${platformKey}`)}</p>
                  </div>
                  <span
                    title={isEnvSource ? t("sourceEnvironmentTooltip") : undefined}
                    className={`ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${getSourcePillClass(credential.source)}`}
                  >
                    {isEnvSource ? <LockIcon /> : null}
                    {t(`source.${credential.source}`)}
                  </span>
                </div>

                {credential.callbackUrl ? (
                  <div className="mb-4 rounded bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-secondary)]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="font-medium text-[var(--text-primary)]">{t("callbackUrl")}</div>
                      <button type="button" onClick={() => handleCopy(credential.callbackUrl!)} className="text-[var(--accent-blue)] hover:underline">
                        {t("copy")}
                      </button>
                    </div>
                    <code className="break-all">{credential.callbackUrl}</code>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  {credential.fields.map((field) => {
                    const configuredValue = credential.configuredValues[field.key];
                    const value = form[field.key] || "";
                    const placeholder = field.secret
                      ? configuredValue
                        ? `${t("configured")}: ${configuredValue}`
                        : t("placeholder")
                      : t("placeholder");

                    return (
                      <label key={field.key} className="block text-sm">
                        <span className="mb-2 block text-[var(--text-secondary)]">{field.label}</span>
                        <Input
                          type={field.secret ? "password" : "text"}
                          value={value}
                          onChange={(event) => handleFieldChange(credential.platform, field.key, event.target.value)}
                          placeholder={placeholder}
                          className="border-[var(--border-color)]"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {credential.updatedAt
                      ? t("updatedAt", { value: formatDate(new Date(credential.updatedAt), "yyyy/MM/dd HH:mm") })
                      : t("notConfigured")}
                  </p>
                  <Button onClick={() => handleSave(credential)} disabled={savingPlatform === credential.platform} className="bg-[var(--accent-blue)] text-white hover:opacity-90">
                    {savingPlatform === credential.platform ? tc("saving") : tc("save")}
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
