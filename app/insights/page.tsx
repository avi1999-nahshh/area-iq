import { Inter, JetBrains_Mono } from "next/font/google";
import { TopNav } from "./top-nav";
import { AreaSearch } from "./area-search";
import { listIQv2 } from "./lib";
import { displayName } from "./blr-aliases";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function InsightsLanding() {
  const all = listIQv2();
  // Dedupe by display root so two pincodes that both alias to "Whitefield"
  // don't both surface in the Top 5. Keep the highest-scoring per root.
  const sorted = [...all].sort((a, b) => b.scores.overall - a.scores.overall);
  const seen = new Set<string>();
  const top5: typeof sorted = [];
  for (const p of sorted) {
    const root = displayName(p.pincode, p.name).replace(/\s*\([^)]*\)\s*$/, "");
    if (seen.has(root)) continue;
    seen.add(root);
    top5.push(p);
    if (top5.length >= 5) break;
  }

  return (
    <div className={`${inter.className} relative min-h-[100dvh] bg-[#f9f7f3] text-slate-900`}>
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
      <main id="main" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Asymmetric hero */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-end">
          <div>
            <span className="inline-flex items-stretch overflow-hidden rounded-md text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
              <span className="w-[3px] bg-amber-500" />
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700">
                Bangalore · Urban Pincodes · Early Access
              </span>
            </span>
            <h1
              className="text-[2.5rem] leading-[1.04] sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4"
              style={{ textWrap: "balance" }}
            >
              Look up any Bangalore neighbourhood&apos;s report card.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 max-w-xl">
              <span className={`${mono.className} font-bold tabular-nums`}>{all.length}</span>{" "}
              urban pincodes graded on air, amenities, connectivity, density, affordability,
              and walkability. Search by name.
            </p>
            <div className="max-w-xl">
              <AreaSearch
                basePath="/insights"
                size="lg"
                placeholder="Try Indiranagar, Koramangala, HSR Layout, Whitefield…"
              />
            </div>
          </div>
          <div className="hidden lg:block">
            <p className={`${mono.className} text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-3`}>
              Methodology
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Data joins CPCB air monitoring, OSM amenities, Census 2011, 99acres rent, BMTC
              + metro proximity. Every score is peer-relative within Bangalore urban tier.
            </p>
            <p className={`${mono.className} mt-4 text-[10px] tracking-[0.18em] uppercase text-slate-400`}>
              Bangalore POC · {new Date().getFullYear()}
            </p>
          </div>
        </section>

        <section className="mt-14 sm:mt-20">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Top 5 in Bangalore right now
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sorted by overall AreaIQ score · updated when sources refresh.
              </p>
            </div>
            <p className={`${mono.className} hidden sm:block text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400`}>
              Swipe →
            </p>
          </div>

          <ol
            role="list"
            className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] sm:auto-cols-[minmax(290px,360px)] gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "thin" }}
          >
            {top5.map((p, i) => {
              const isTop = i === 0;
              const cardBase = isTop
                ? "bg-amber-50 ring-1 ring-amber-300/70"
                : "bg-white";
              return (
                <li key={p.pincode} className="snap-start">
                  <a
                    href={`/insights/${p.pincode}`}
                    className={`group block h-full ${cardBase} rounded-2xl p-5 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]`}
                    style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)" }}
                  >
                    <div className="flex items-baseline justify-between mb-4">
                      {isTop ? (
                        <span className="inline-flex items-stretch overflow-hidden rounded-md text-[10px] font-semibold tracking-[0.18em] uppercase">
                          <span className="w-[3px] bg-amber-500" />
                          <span className="px-2 py-1 bg-amber-50 text-amber-800">
                            Editor&apos;s Pick
                          </span>
                        </span>
                      ) : (
                        <span className={`${mono.className} text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400`}>
                          Rank #{i + 1}
                        </span>
                      )}
                      <span className={`${mono.className} text-[10px] tracking-[0.12em] uppercase ${isTop ? "text-amber-700" : "text-slate-400"}`}>
                        {p.pincode}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className={`${mono.className} text-5xl font-extrabold tabular-nums tracking-tight leading-[0.95] text-slate-900`}>
                        {Math.round(p.scores.overall)}
                      </span>
                      <span className={`${mono.className} text-xs font-semibold text-slate-400`}>/100</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight text-slate-900 mb-1.5">
                      {displayName(p.pincode, p.name)}
                    </p>
                    <p className="text-sm text-amber-700 font-medium leading-snug">
                      {p.brag_label}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">
                      See report card
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <footer className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-gray-200/70 mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">
          Area<span className="text-amber-500">IQ</span>
        </span>
        <span className={mono.className}>Bangalore POC · Urban tier · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
