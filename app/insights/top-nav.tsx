"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AreaSearch } from "./area-search";

const TABS: { href: string; label: string; ready: boolean }[] = [
  { href: "/insights", label: "Insights", ready: true },
  { href: "/compare", label: "Compare", ready: false },
  { href: "/proximity", label: "Proximity", ready: false },
];

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <Link
          href="/"
          className="font-semibold text-base tracking-tight text-slate-900 shrink-0"
        >
          Area<span className="text-amber-500">IQ</span>
        </Link>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {TABS.map((t) => {
            const active =
              t.href === "/insights"
                ? pathname?.startsWith("/insights")
                : pathname?.startsWith(t.href);
            const cls = !t.ready
              ? "px-3 py-1.5 rounded-md text-slate-400 cursor-not-allowed flex items-center gap-1.5"
              : active
                ? "px-3 py-1.5 rounded-md text-amber-600"
                : "px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-gray-50";
            const inner = (
              <>
                {t.label}
                {!t.ready && (
                  <span className="text-[9px] font-semibold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded bg-gray-100 text-slate-500">
                    Soon
                  </span>
                )}
              </>
            );
            return t.ready ? (
              <Link key={t.href} href={t.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <span key={t.href} className={cls} aria-disabled="true">
                {inner}
              </span>
            );
          })}
        </nav>

        {/* Desktop search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <AreaSearch size="sm" placeholder="Search Bangalore neighbourhood…" />
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500 text-white whitespace-nowrap">
            Early Access
          </span>
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden w-9 h-9 rounded-md flex items-center justify-center text-slate-700 hover:bg-gray-100 active:scale-[0.96] transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile search row (always visible at <sm) */}
      <div className="sm:hidden px-4 pb-3">
        <AreaSearch size="sm" placeholder="Search Bangalore neighbourhood…" />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {TABS.map((t) => {
              const active =
                t.href === "/insights"
                  ? pathname?.startsWith("/insights")
                  : pathname?.startsWith(t.href);
              if (!t.ready) {
                return (
                  <span
                    key={t.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-md text-slate-400"
                  >
                    {t.label}
                    <span className="text-[10px] font-semibold tracking-[0.14em] uppercase px-2 py-0.5 rounded bg-gray-100 text-slate-500">
                      Soon
                    </span>
                  </span>
                );
              }
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium ${
                    active
                      ? "bg-amber-50 text-amber-700"
                      : "text-slate-700 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500 text-white">
                Early Access
              </span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
