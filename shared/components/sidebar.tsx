"use client";

import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
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

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "zh" ? "en" : "zh" });
  };

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-20 flex h-12 items-center justify-between border-b border-[var(--border-color)] bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation"
          className="rounded border border-[var(--border-color)] p-2 text-[var(--text-primary)]"
        >
          <MenuIcon />
        </button>
        <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Auto Post Web</span>
        <button
          onClick={switchLocale}
          className="rounded border border-[var(--border-color)] px-2 py-0.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
        >
          {locale === "zh" ? "EN" : "中"}
        </button>
      </div>

      {isOpen ? <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-transform md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden items-center justify-between p-4 md:flex">
          <span className="text-sm font-semibold tracking-tight">Auto Post Web</span>
          <button
            onClick={switchLocale}
            className="rounded border border-[var(--border-color)] px-2 py-0.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
          >
            {locale === "zh" ? "EN" : "中"}
          </button>
        </div>
        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4 md:hidden">
          <span className="text-sm font-semibold tracking-tight">Auto Post Web</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
            className="rounded border border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-secondary)]"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 px-2 py-3 md:py-0">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
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
    </>
  );
}
