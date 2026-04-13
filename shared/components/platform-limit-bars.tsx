import { PlatformIcon } from "@/shared/components/platform-icon";

export interface PlatformLimitItem {
  platform: string;
  label: string;
  current: number;
  limit: number;
}

function getProgressColor(ratio: number): string {
  if (ratio > 1) {
    return "bg-[var(--accent-red)]";
  }

  if (ratio >= 0.8) {
    return "bg-[var(--accent-orange)]";
  }

  return "bg-[var(--accent-green)]";
}

export function PlatformLimitBars({
  items,
  title,
}: {
  items: PlatformLimitItem[];
  title: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[4px] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">{title}</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const ratio = item.current / item.limit;
          const width = Math.min(ratio * 100, 100);

          return (
            <div key={item.platform} className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <PlatformIcon platform={item.platform} size={16} />
                <span>{item.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white">
                <div className={`h-full rounded-full ${getProgressColor(ratio)}`} style={{ width: `${width}%` }} />
              </div>
              <span className={`text-xs ${ratio > 1 ? "text-[var(--accent-red)]" : "text-[var(--text-secondary)]"}`}>
                {item.current}/{item.limit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
