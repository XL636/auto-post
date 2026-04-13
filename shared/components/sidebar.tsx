"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

const NAV_ITEMS = [
  { href: "/", key: "dashboard" },
  { href: "/posts", key: "posts" },
  { href: "/posts/drafts", key: "drafts" },
  { href: "/calendar", key: "calendar" },
  { href: "/analytics", key: "analytics" },
  { href: "/accounts", key: "accounts" },
  { href: "/settings/platforms", key: "credentials" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "zh" ? "en" : "zh" });
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between p-4">
        <span className="text-sm font-semibold tracking-tight">Auto Post Web</span>
        <button
          onClick={switchLocale}
          className="rounded border border-[var(--border-color)] px-2 py-0.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
        >
          {locale === "zh" ? "EN" : "中"}
        </button>
      </div>
      <nav className="flex-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-[var(--bg-hover)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
