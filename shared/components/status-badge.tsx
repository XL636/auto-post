import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
  SCHEDULED: "bg-blue-50 text-[var(--accent-blue)]",
  PUBLISHING: "bg-orange-50 text-[var(--accent-orange)]",
  PUBLISHED: "bg-green-50 text-[var(--accent-green)]",
  FAILED: "bg-red-50 text-[var(--accent-red)]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`${STATUS_STYLES[status] || ""} border-0 text-xs`}>
      {status.toLowerCase()}
    </Badge>
  );
}
