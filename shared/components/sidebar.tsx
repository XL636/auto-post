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
    <aside className="w-60 h-screen border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col shrink-0">
      <div className="flex items-center justify-between p-4">
        <span className="font-semibold text-sm tracking-tight">Auto Post Web</span>
        <button
          onClick={switchLocale}
          className="px-2 py-0.5 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          {locale === "zh" ? "EN" : "中"}
        </button>
      </div>
      <nav className="flex-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                active
                  ? "bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium"
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
