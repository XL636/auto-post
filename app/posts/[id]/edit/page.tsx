"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { usePost } from "@/shared/hooks/use-posts";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: post } = usePost(id);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post) setContent(post.content);
  }, [post]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    router.push("/posts");
  };

  if (!post) return <p className="text-[var(--text-secondary)]">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit Post" />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[150px] border-[var(--border-color)] resize-none mb-4"
      />
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-[var(--accent-blue)]">
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} className="border-[var(--border-color)]">
          Cancel
        </Button>
      </div>
    </div>
  );
}
