"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useAccounts } from "@/shared/hooks/use-accounts";
import { usePlatformCredentials } from "@/shared/hooks/use-platform-credentials";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useFormatDate } from "@/shared/lib/date-format";
import type { AccountListItem, PlatformCredentialStatus } from "@/shared/types/api";

const BRAND_COLORS: Record<string, string> = {
  linkedin: "#0A66C2",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  discord: "#5865F2",
  reddit: "#FF4500",
  youtube: "#FF0000",
};

const ALL_PLATFORMS = [
  { key: "linkedin", brand: "LinkedIn" },
  { key: "twitter", brand: "Twitter" },
  { key: "facebook", brand: "Facebook" },
  { key: "discord", brand: "Discord" },
  { key: "reddit", brand: "Reddit" },
  { key: "youtube", brand: "YouTube" },
] as const;

type PlatformKey = (typeof ALL_PLATFORMS)[number]["key"];

function getPlatformLabel(platform: string, translatedName: string): string {
  const brand = platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
  return translatedName ? `${brand} ${translatedName}` : brand;
}

const ACCOUNT_STATUS_STYLES: Record<AccountListItem["status"], string> = {
  ACTIVE: "bg-green-50 text-[var(--accent-green)]",
  EXPIRING_SOON: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-[var(--accent-red)]",
  MISCONFIGURED: "bg-slate-100 text-slate-700",
  ERROR: "bg-orange-50 text-[var(--accent-orange)]",
};

function getCredentialStatusClass(status: PlatformCredentialStatus["source"] | "missing"): string {
  switch (status) {
    case "database":
      return "bg-emerald-50 text-emerald-700";
    case "environment":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AccountsPage() {
  const router = useRouter();
  const { data: accounts = [], isLoading, mutate } = useAccounts();
  const { data: credentialStatuses = [], isLoading: credentialsLoading } = usePlatformCredentials();
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const connectSectionRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const formatDate = useFormatDate();
  const t = useTranslations("accounts");
  const tp = useTranslations("platform");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  const connectedCountByPlatform = useMemo(() => {
    return accounts.reduce<Record<string, number>>((counts, account) => {
      const key = account.platform.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }, [accounts]);

  const credentialStatusByPlatform = useMemo(() => {
    return new Map(credentialStatuses.map((status) => [status.platform.toLowerCase(), status]));
  }, [credentialStatuses]);

  const handleDiscordConnect = async () => {
    setIsConnectingDiscord(true);
    try {
      const response = await fetch("/api/accounts/discord", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error || tt("failedToConnect"));
        return;
      }

      toast.success(tt("accountConnected", { platform: "Discord" }));
      await mutate();
    } finally {
      setIsConnectingDiscord(false);
    }
  };

  const handleConnect = (platform: PlatformKey) => {
    const credentialStatus = credentialStatusByPlatform.get(platform);

    if (!credentialStatus?.configured) {
      toast.error(t("credentialsRequired", { platform: ALL_PLATFORMS.find((item) => item.key === platform)?.brand || platform }));
      router.push(`/settings/platforms?platform=${platform.toUpperCase()}`);
      return;
    }

    if (platform === "discord") {
      void handleDiscordConnect();
      return;
    }

    window.location.assign(`/api/oauth/${platform}?locale=${locale}`);
  };

  const handleDisconnect = async (account: AccountListItem) => {
    if (account.linkedPostCount > 0) {
      toast.error(t("disconnectBlocked", { count: account.linkedPostCount }));
      return;
    }

    if (!confirm(t("confirmDisconnect"))) {
      return;
    }

    const response = await fetch("/api/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: account.id }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(payload?.error || tt("failedToDisconnect"));
      return;
    }

    toast.success(tt("accountDisconnected"));
    await mutate();
  };

  return (
    <div>
      <div className="mb-8 border-b border-gray-100">
        <PageHeader title={t("title")} description={t("description")} />
      </div>

      <div ref={connectSectionRef} className="mb-10">
        <h2 className="mb-4 text-sm font-medium text-[var(--text-tertiary)]">{t("connect")}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ALL_PLATFORMS.map((platform) => {
            const connectedCount = connectedCountByPlatform[platform.key] || 0;
            const isDiscordConnected = platform.key === "discord" && connectedCount > 0;
            const credentialStatus = credentialStatusByPlatform.get(platform.key);
            const brandColor = BRAND_COLORS[platform.key];
            const needsCredentialConfig = !credentialStatus?.configured;
            const source = credentialStatus?.source || "missing";

            return (
              <button
                key={platform.key}
                onClick={() => handleConnect(platform.key)}
                disabled={isDiscordConnected || credentialsLoading || isConnectingDiscord}
                className={`relative flex min-h-[84px] items-center gap-3 rounded-[4px] border border-[var(--border-color)] border-l-[3px] px-4 text-left text-sm transition-[background-color,border-left-width,box-shadow] duration-150 hover:border-l-4 hover:shadow-sm ${
                  isDiscordConnected
                    ? "bg-green-50/50 disabled:hover:bg-green-50/50"
                    : needsCredentialConfig
                      ? "bg-amber-50/50 hover:bg-amber-50"
                      : "bg-white hover:bg-blue-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                style={{ borderLeftColor: brandColor }}
              >
                <PlatformIcon platform={platform.key.toUpperCase()} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{platform.brand}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${getCredentialStatusClass(source)}`}>
                      {needsCredentialConfig ? t("credentialsMissing") : t(`credentialSource.${source}`)}
                    </span>
                  </div>
                  {tp(platform.key) ? (
                    <p className="text-xs text-[var(--text-tertiary)]">{tp(platform.key)}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {needsCredentialConfig ? t("configureCredentials") : t("credentialsReady")}
                  </p>
                </div>
                {connectedCount > 0 ? (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-[var(--accent-green)] px-1.5 py-0.5 text-[10px] leading-none text-white">
                    {connectedCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="my-8 border-[var(--border-color)]" />

      <div>
        <h2 className="mb-4 text-xs font-medium text-[var(--text-tertiary)]">{t("connected")}</h2>

        {isLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">{tc("loading")}</p>
        ) : accounts.length === 0 ? (
          <div className="flex h-[120px] flex-col items-center justify-center rounded-[4px] border-2 border-dashed border-[var(--border-color)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-tertiary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2 h-9 w-9"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-sm text-[var(--text-tertiary)]">{t("noAccounts")}</p>
            <button
              onClick={() =>
                connectSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="mt-3 rounded-[4px] border border-[var(--border-color)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-shadow duration-150 hover:shadow-sm"
            >
              {t("connect")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const platformKey = account.platform.toLowerCase();
              const brandColor = BRAND_COLORS[platformKey] || "#787774";
              const hasLinkedPosts = account.linkedPostCount > 0;

              return (
                <div
                  key={account.id}
                  className="flex items-center gap-4 rounded-[4px] border border-[var(--border-color)] bg-white p-4 transition-shadow duration-150 hover:shadow-sm"
                  style={{ borderLeftWidth: 3, borderLeftColor: brandColor }}
                >
                  <PlatformIcon platform={account.platform} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {account.displayName}
                      </p>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-medium ${ACCOUNT_STATUS_STYLES[account.status]}`}
                      >
                        {t(`status.${account.statusLabel}`)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                      {getPlatformLabel(account.platform, tp(platformKey))}
                      {" · "}
                      {t("connectedAt")} {formatDate(new Date(account.createdAt), "yyyy/MM/dd")}
                      {account.tokenExpiresAt ? (
                        <>
                          {" · "}
                          {t("tokenExpires")} {formatDate(new Date(account.tokenExpiresAt), "yyyy/MM/dd")}
                        </>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {t("linkedPosts", { count: account.linkedPostCount })}
                    </p>
                    {account.lastError ? (
                      <p className="mt-1 text-xs text-[var(--accent-red)]">{account.lastError}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => handleDisconnect(account)}
                    disabled={hasLinkedPosts}
                    className="flex-shrink-0 rounded-[4px] border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--accent-red)] opacity-60 transition-all duration-150 hover:border-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white hover:opacity-100 disabled:cursor-not-allowed disabled:border-[var(--border-color)] disabled:bg-transparent disabled:text-[var(--text-tertiary)]"
                  >
                    {t("disconnect")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
