"use client";

import { useEffect, useRef, useState } from "react";
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

const DEFAULT_SIDEBAR_WIDTH = 260;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 380;
const SIDEBAR_WIDTH_STORAGE_KEY = "auto-post-sidebar-width";
const SIDEBAR_RESET_WIDTH = DEFAULT_SIDEBAR_WIDTH;

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function clampSidebarWidth(width: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

function getStoredSidebarWidth(): number {
  if (typeof window === "undefined") {
    return DEFAULT_SIDEBAR_WIDTH;
  }

  const rawValue = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
  const parsedValue = rawValue ? Number(rawValue) : NaN;

  return Number.isFinite(parsedValue) ? clampSidebarWidth(parsedValue) : DEFAULT_SIDEBAR_WIDTH;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(getStoredSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStateRef = useRef({ startX: 0, startWidth: DEFAULT_SIDEBAR_WIDTH });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const nextWidth = resizeStateRef.current.startWidth + event.clientX - resizeStateRef.current.startX;
      setSidebarWidth(clampSidebarWidth(nextWidth));
    };

    const stopResizing = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "zh" ? "en" : "zh" });
  };

  const startResizing = (event: React.PointerEvent<HTMLButtonElement>) => {
    resizeStateRef.current = { startX: event.clientX, startWidth: sidebarWidth };
    setIsResizing(true);
  };

  const resetSidebarWidth = () => {
    setSidebarWidth(SIDEBAR_RESET_WIDTH);
  };

  const navContent = (
    <>
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
    </>
  );

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

      <div className="relative hidden shrink-0 md:block" style={{ width: `${sidebarWidth}px` }}>
        <aside className="sticky top-0 flex h-screen w-full flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]">
          {navContent}
        </aside>
        <button
          type="button"
          aria-label="Resize sidebar"
          title="Drag to resize. Double-click to reset."
          onPointerDown={startResizing}
          onDoubleClick={resetSidebarWidth}
          className="group absolute inset-y-0 -right-3 z-10 flex w-6 cursor-col-resize items-center justify-center"
        >
          <span
            className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors ${
              isResizing ? "bg-[var(--accent-blue)]" : "bg-[var(--border-color)]/70 group-hover:bg-[var(--accent-blue)]/70"
            }`}
          />
          <span
            className={`relative flex h-24 w-3 items-center justify-center rounded-full border bg-white/95 shadow-sm transition-all ${
              isResizing
                ? "border-[var(--accent-blue)] text-[var(--accent-blue)]"
                : "border-[var(--border-color)] text-[var(--text-tertiary)] group-hover:border-[var(--accent-blue)]/50 group-hover:text-[var(--accent-blue)]"
            }`}
          >
            <span className="flex flex-col gap-1">
              <span className="block h-1 w-1 rounded-full bg-current" />
              <span className="block h-1 w-1 rounded-full bg-current" />
              <span className="block h-1 w-1 rounded-full bg-current" />
            </span>
          </span>
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-transform md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
