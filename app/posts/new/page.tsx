"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/shared/hooks/use-accounts";
import { PageHeader } from "@/shared/components/page-header";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function NewPostPage() {
  const router = useRouter();
  const { data: accounts } = useAccounts();
  const [content, setContent] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [publishing, setPublishing] = useState(false);

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (publishNow: boolean) => {
    if (!content.trim() || selectedAccounts.length === 0) return;
    setPublishing(true);

    try {
      const body: any = {
        content,
        platformAccountIds: selectedAccounts,
      };
      if (scheduledAt && !publishNow) {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const post = await res.json();

      if (publishNow) {
        await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
      }

      router.push("/posts");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Post" description="Create and publish to your connected platforms" />

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            Content
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[150px] border-[var(--border-color)] resize-none"
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-1">{content.length} characters</p>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            Platforms
          </label>
          {!accounts?.length ? (
            <p className="text-sm text-[var(--text-tertiary)]">
              No accounts connected.{" "}
              <a href="/accounts" className="text-[var(--accent-blue)]">
                Connect one
              </a>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accounts.map((acc: any) => (
                <button
                  key={acc.id}
                  onClick={() => toggleAccount(acc.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors ${
                    selectedAccounts.includes(acc.id)
                      ? "border-[var(--accent-blue)] bg-blue-50"
                      : "border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <PlatformIcon platform={acc.platform} size={16} />
                  {acc.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
            Schedule (optional)
          </label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="border-[var(--border-color)] w-auto"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleSubmit(true)}
            disabled={publishing || !content.trim() || selectedAccounts.length === 0}
            className="bg-[var(--accent-blue)] hover:opacity-90"
          >
            {publishing ? "Publishing..." : "Publish Now"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={publishing || !content.trim() || selectedAccounts.length === 0}
            className="border-[var(--border-color)]"
          >
            {scheduledAt ? "Schedule" : "Save Draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
