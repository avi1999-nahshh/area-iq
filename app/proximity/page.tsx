import { Suspense } from "react";
import type { Metadata } from "next";
import { TopNav } from "@/app/insights/top-nav";
import { listIQv2 } from "@/app/insights/lib";
import { ProximityClient } from "./proximity-client";

export const metadata: Metadata = {
  title: "Proximity — find a Bangalore neighbourhood by your office",
  description:
    "Pick your office, your max commute, and what matters. AreaIQ ranks Bangalore neighbourhoods within reach using six-dimension scoring.",
};

export default function ProximityPage() {
  const pincodes = listIQv2();

  return (
    <div className="relative min-h-[100dvh] bg-[#f9f7f3] text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-amber-500 focus:text-white focus:rounded-md focus:font-semibold"
      >
        Skip to content
      </a>
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          opacity: 0.04,
          mixBlendMode: "multiply",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />
      <TopNav />
      <main id="main" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Suspense boundary — ProximityClient calls useSearchParams(), which
            blocks the static prerender unless wrapped (Next.js 16). */}
        <Suspense
          fallback={
            <div
              className="h-[60vh] rounded-xl bg-amber-50/40"
              aria-label="Loading proximity search"
            />
          }
        >
          <ProximityClient pincodes={pincodes} />
        </Suspense>
      </main>
      <footer className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 mt-8 border-t border-gray-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">
          Area<span className="text-amber-500">IQ</span>
        </span>
        <span>Bangalore · Urban tier · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
