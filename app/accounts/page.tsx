"use client";
import { useAccounts } from "@/shared/hooks/use-accounts";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const TIER1_PLATFORMS = [
  { key: "linkedin", name: "LinkedIn", hasOAuth: true },
  { key: "facebook", name: "Facebook", hasOAuth: true },
  { key: "discord", name: "Discord", hasOAuth: false },
  { key: "reddit", name: "Reddit", hasOAuth: true },
];

export default function AccountsPage() {
  const { data: accounts, isLoading, mutate } = useAccounts();

  const handleConnect = (platform: string) => {
    if (platform === "discord") {
      // Discord uses bot token, prompt user to add via env
      alert("Discord uses a Bot Token. Set DISCORD_BOT_TOKEN and DISCORD_WEBHOOK_URL in your .env file.");
      return;
    }
    window.location.href = `/api/oauth/${platform}`;
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Disconnect this account?")) return;
    await fetch("/api/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate();
  };

  const connectedPlatforms = new Set(accounts?.map((a: any) => a.platform) || []);

  return (
    <div>
      <PageHeader title="Accounts" description="Manage your connected social media accounts" />

      <div className="mb-8">
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Connect a Platform</h2>
        <div className="flex gap-3">
          {TIER1_PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => handleConnect(p.key)}
              disabled={connectedPlatforms.has(p.key.toUpperCase())}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded text-sm hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlatformIcon platform={p.key.toUpperCase()} size={16} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Connected Accounts</h2>

      {isLoading ? (
        <p className="text-[var(--text-secondary)]">Loading...</p>
      ) : !accounts?.length ? (
        <p className="text-[var(--text-secondary)]">No accounts connected yet.</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc: any) => (
            <div
              key={acc.id}
              className="flex items-center gap-4 p-4 border border-[var(--border-color)] rounded"
            >
              <PlatformIcon platform={acc.platform} size={32} />
              <div className="flex-1">
                <p className="font-medium text-sm">{acc.displayName}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {acc.platform} &middot; Connected {format(new Date(acc.createdAt), "MMM d, yyyy")}
                  {acc.tokenExpiresAt && (
                    <> &middot; Token expires {format(new Date(acc.tokenExpiresAt), "MMM d, yyyy")}</>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(acc.id)}
                className="text-[var(--accent-red)] border-[var(--border-color)] hover:bg-red-50"
              >
                Disconnect
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
