"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Log" },
  { href: "/insights", label: "Insights" },
  { href: "/import", label: "Import" },
  { href: "/settings/fields", label: "Fields" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-ink-700 bg-ink-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 py-3.5 text-center text-sm font-medium transition ${
                active ? "text-accent" : "text-ink-400 hover:text-ink-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
