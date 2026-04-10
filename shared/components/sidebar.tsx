"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/posts", label: "Posts" },
  { href: "/posts/drafts", label: "Drafts" },
  { href: "/calendar", label: "Calendar" },
  { href: "/analytics", label: "Analytics" },
  { href: "/accounts", label: "Accounts" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col shrink-0">
      <div className="p-4 font-semibold text-sm tracking-tight">Auto Post Web</div>
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
