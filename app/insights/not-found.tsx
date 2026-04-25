import { Geist, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { TopNav } from "./top-nav";
import { AreaSearch } from "./area-search";

const sans = Geist({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function NotFound() {
  return (
    <div className={`${sans.className} relative min-h-[100dvh] bg-[#f9f7f3] text-slate-900`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-amber-500 focus:text-white focus:rounded-md focus:font-semibold"
      >
        Skip to content
      </a>
      <GrainOverlay />
      <TopNav />
      <main
        id="main"
        className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-24 text-center"
      >
        <p
          className={`${mono.className} text-[11px] font-semibold tracking-[0.22em] uppercase text-amber-700`}
        >
          404 · pincode out of scope
        </p>
        <h1
          className="mt-4 text-[2.25rem] leading-[1.05] sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900"
          style={{ textWrap: "balance" }}
        >
          We don&apos;t grade that pincode yet.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
          AreaIQ covers Bangalore urban pincodes for now. Try one from the list — or head
          back to the index.
        </p>

        <div className="mt-8 max-w-md mx-auto text-left">
          <AreaSearch
            basePath="/insights"
            placeholder="Search a Bangalore neighbourhood…"
          />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/insights"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 active:translate-y-[1px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to /insights
          </Link>
          <Link
            href="/insights"
            className="inline-flex items-center justify-center gap-1 text-sm text-slate-600 hover:text-amber-700 px-3 py-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]"
          >
            Why Bangalore-only?
            <span aria-hidden>→</span>
          </Link>
        </div>

        <p
          className={`${mono.className} mt-12 text-[11px] tracking-[0.18em] uppercase text-slate-400`}
        >
          AreaIQ · Bangalore
        </p>
      </main>
    </div>
  );
}

function GrainOverlay() {
  return (
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
  );
}
