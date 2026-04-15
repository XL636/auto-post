"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useConfirmDialog } from "@/shared/hooks/use-confirm-dialog";
import { useAccounts } from "@/shared/hooks/use-accounts";
import { usePlatformCredentials } from "@/shared/hooks/use-platform-credentials";
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

function AccountsIllustration() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-20 w-20">
      <circle cx="27" cy="28" r="8" />
      <circle cx="53" cy="28" r="8" />
      <path d="M14 58c2-10 10-16 20-16s18 6 20 16" />
      <path d="M40 58c1.5-8 7.5-12 13-12 4.5 0 8.5 2.5 11 6" />
    </svg>
  );
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
  const { data: accounts = [], isLoading, mutate } = useAccounts();
  const { data: credentialStatuses = [], isLoading: credentialsLoading } = usePlatformCredentials();
  const { dialog, confirm } = useConfirmDialog();
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [alertPlatform, setAlertPlatform] = useState<PlatformKey | null>(null);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const connectSectionRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const formatDate = useFormatDate();
  const t = useTranslations("accounts");
  const tp = useTranslations("platform");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error === "facebook_no_pages") {
      toast.error(t("noFacebookPages"));
    } else if (error === "facebook_denied") {
      toast.error(tt("authDenied", { platform: "Facebook" }));
    } else {
      return;
    }

    params.delete("error");
    const nextSearch = params.toString();
    const nextUrl = nextSearch ? `${window.location.pathname}?${nextSearch}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [t, tt]);

  const connectedCountByPlatform = useMemo(() => {
    return accounts.reduce<Record<string, number>>((counts, account) => {
      const key = account.platform.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }, [accounts]);

  const credentialStatusByPlatform = useMemo(
    () => new Map(credentialStatuses.map((status) => [status.platform.toLowerCase(), status])),
    [credentialStatuses],
  );

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

  const startConnect = (platform: PlatformKey) => {
    const credentialStatus = credentialStatusByPlatform.get(platform);

    if (!credentialStatus?.configured) {
      setAlertPlatform(platform);
      return;
    }

    setAlertPlatform(null);

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

    const approved = await confirm({
      title: t("disconnectDialogTitle"),
      description: t("confirmDisconnect"),
      confirmLabel: t("disconnect"),
      cancelLabel: tc("cancel"),
      variant: "destructive",
    });

    if (!approved) {
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
        {credentialsLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ALL_PLATFORMS.map((platform) => {
              const connectedCount = connectedCountByPlatform[platform.key] || 0;
              const isDiscordConnected = platform.key === "discord" && connectedCount > 0;
              const credentialStatus = credentialStatusByPlatform.get(platform.key);
              const brandColor = BRAND_COLORS[platform.key];
              const needsCredentialConfig = !credentialStatus?.configured;
              const source = credentialStatus?.source || "missing";

              return (
                <div key={platform.key}>
                  <button
                    onClick={() => startConnect(platform.key)}
                    disabled={isDiscordConnected || isConnectingDiscord}
                    className={`relative flex min-h-[84px] w-full items-center gap-3 rounded-[4px] border border-[var(--border-color)] border-l-[3px] px-4 text-left text-sm transition-[background-color,border-left-width,box-shadow] duration-150 hover:border-l-4 hover:shadow-sm ${
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
                      {tp(platform.key) ? <p className="text-xs text-[var(--text-tertiary)]">{tp(platform.key)}</p> : null}
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
                  {alertPlatform === platform.key ? (
                    <div className="mt-2 rounded border border-[var(--accent-orange)]/30 bg-orange-50 p-3 text-sm">
                      <p className="font-medium text-[var(--accent-orange)]">{t("credentialsNeeded")}</p>
                      <p className="mt-1 text-[var(--text-secondary)]">{t("credentialsNeededDesc", { platform: platform.brand })}</p>
                      <Link href={`/settings/platforms?platform=${platform.key.toUpperCase()}`} className="mt-2 inline-block text-sm font-medium text-[var(--accent-blue)] hover:underline">
                        {t("setupCredentials")} →
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <hr className="my-8 border-[var(--border-color)]" />

      <div>
        <h2 className="mb-4 text-xs font-medium text-[var(--text-tertiary)]">{t("connected")}</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={<AccountsIllustration />}
            title={t("noAccounts")}
            description={t("emptyDescription")}
            action={
              <Button
                onClick={() => connectSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="bg-[var(--accent-blue)] text-white hover:opacity-90"
              >
                {t("connect")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const platformKey = account.platform.toLowerCase() as PlatformKey;
              const brandColor = BRAND_COLORS[platformKey] || "#787774";
              const hasLinkedPosts = account.linkedPostCount > 0;
              const expandedError = expandedErrorId === account.id;
              const disconnectTitle = hasLinkedPosts
                ? t("disconnectTooltip", { count: account.linkedPostCount })
                : undefined;

              return (
                <div key={account.id} className="rounded-[4px] border border-[var(--border-color)] bg-white p-4 transition-shadow duration-150 hover:shadow-sm" style={{ borderLeftWidth: 3, borderLeftColor: brandColor }}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <PlatformIcon platform={account.platform} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{account.displayName}</p>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${ACCOUNT_STATUS_STYLES[account.status]}`}>
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
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">{t("linkedPosts", { count: account.linkedPostCount })}</p>
                      {account.lastError ? (
                        <div className="mt-3 rounded border border-[var(--accent-red)]/20 bg-red-50/60 p-3">
                          <button
                            type="button"
                            onClick={() => setExpandedErrorId(expandedError ? null : account.id)}
                            className="text-xs font-medium text-[var(--accent-red)] hover:underline"
                          >
                            {expandedError ? t("hideError") : t("showError")}
                          </button>
                          {expandedError ? <p className="mt-2 text-xs leading-5 text-[var(--accent-red)]">{account.lastError}</p> : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 md:justify-end">
                      {(account.status === "EXPIRED" || account.status === "EXPIRING_SOON") && platformKey !== "discord" ? (
                        <button type="button" onClick={() => startConnect(platformKey)} className="text-sm font-medium text-[var(--accent-blue)] hover:underline">
                          {t("reconnect")}
                        </button>
                      ) : null}
                      {account.status === "MISCONFIGURED" ? (
                        <Link href={`/settings/platforms?platform=${account.platform}`} className="text-sm font-medium text-[var(--accent-blue)] hover:underline">
                          {t("fixCredentials")}
                        </Link>
                      ) : null}
                      <button
                        onClick={() => handleDisconnect(account)}
                        disabled={hasLinkedPosts}
                        title={disconnectTitle}
                        className="flex items-center gap-1 rounded-[4px] border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--accent-red)] transition-all duration-150 hover:border-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--border-color)] disabled:bg-transparent disabled:text-[var(--text-tertiary)]"
                      >
                        {hasLinkedPosts ? <span aria-hidden="true">ℹ</span> : null}
                        {t("disconnect")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
