import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TopNav } from "../top-nav";
import { getIQv2, type IQv2 } from "../lib";
import { displayName } from "../blr-aliases";
import { FlippableCard } from "./flippable-card";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

interface Props { params: Promise<{ pincode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pincode } = await params;
  const d = getIQv2(pincode);
  if (!d) return { title: "Not in scope — AreaIQ" };
  // Strip the redundant "(Bangalore)" tail that India Post appends, but
  // keep meaningful disambiguators like "(EPIP)" or "(Mahadevapura)" so
  // three Whitefield pincodes don't all read as just "Whitefield".
  const name = displayName(d.pincode, d.name).replace(/\s*\(Bangalore\)\s*$/i, "");
  return {
    title: `${name} · ${d.brag_label} — AreaIQ`,
    description: d.subhead,
    openGraph: {
      title: `${name}: ${d.brag_label}`,
      description: d.subhead,
      type: "website",
    },
  };
}

export default async function InsightsPincode({ params }: Props) {
  const { pincode } = await params;
  const d = getIQv2(pincode);
  if (!d) return notFound();
  return (
    <div className={`${inter.className} relative min-h-[100dvh] bg-[#f9f7f3] text-slate-900`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-amber-500 focus:text-white focus:rounded-md focus:font-semibold"
      >
        Skip to content
      </a>
      <GrainOverlay />
      <TopNav />
      <Bragging d={d} />
      <CardStaggerStyle />
    </div>
  );
}

// ── Bragging Report ───────────────────────────────────────────────────

function Bragging({ d }: { d: IQv2 }) {
  const overall = Math.round(d.scores.overall);
  // Strip only the redundant "(Bangalore)" tag — keep "(EPIP)" /
  // "(Mahadevapura)" so the three Whitefield pincodes are visually distinct.
  const name = displayName(d.pincode, d.name).replace(/\s*\(Bangalore\)\s*$/i, "");

  return (
    <main id="main" className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-20 sm:pb-24">
      {/* Breadcrumb */}
      <nav
        className={`${mono.className} flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-slate-500 mb-8`}
        aria-label="Breadcrumb"
      >
        <Link
          href="/insights"
          className="hover:text-amber-700 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]"
        >
          Insights
        </Link>
        <span aria-hidden className="text-slate-400">/</span>
        <Link
          href="/insights"
          className="hover:text-amber-700 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]"
        >
          Bangalore
        </Link>
        <span aria-hidden className="text-slate-400">/</span>
        <span className="text-slate-900 font-semibold">{name}</span>
      </nav>

      {/* Asymmetric hero on lg+, centered <lg */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <BragChip brag={d.brag_label} />
          <h1
            className={`mt-5 sm:mt-6 text-[2.5rem] leading-[1.04] sm:text-6xl lg:text-[5.5rem] font-extrabold tracking-tight text-slate-900`}
            style={{ textWrap: "balance" }}
          >
            {name}: <span className="text-slate-700">{labelOnly(d.brag_label)}</span>
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {d.subhead}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-amber-100 text-amber-800 font-semibold text-sm cursor-not-allowed transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]"
            >
              <Award /> Claim your area report
              <span className="text-[9px] font-semibold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded bg-gray-100 text-slate-500">
                Soon
              </span>
            </button>
            <a
              href="#deep-dive"
              className="text-sm text-slate-600 hover:text-amber-700 inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]"
            >
              Read methodology
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </div>
        </div>

        {/* Share preview — flippable card with score breakdown on the back */}
        <div className="relative pt-8 lg:pt-0">
          <FlippableCard d={d} name={name} monoClass={mono.className} />
        </div>
      </section>

      {/* Bento — borderless cards with mono numerals.
          3 cards now: Air leads (loud, 2-col), Transit narrow + dark, Lifestyle wide horizontal. */}
      <section className="mt-16 sm:mt-20">
        <div
          className="card-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          style={{ ["--stagger" as string]: "80ms" }}
        >
          <FeatureCard
            kicker="Air Quality"
            title={airTitle(d)}
            metric={d.raw.aqi != null ? `${d.raw.aqi}` : "—"}
            metricSuffix="AQI"
            body={airBlurb(d)}
            warn={d.raw.aqi != null && d.raw.aqi > 150}
            celebrate={d.raw.aqi != null && d.raw.aqi <= 100}
            hero
            className="lg:col-span-2"
            staggerIdx={0}
            monoClass={mono.className}
          />
          <FeatureCard
            kicker="Transit Proximity"
            title={transitTitle(d)}
            metric={d.raw.metro_km != null ? `${d.raw.metro_km.toFixed(1)}` : "—"}
            metricSuffix={d.raw.metro_km != null ? "km" : ""}
            body={metroBlurb(d)}
            dark
            staggerIdx={1}
            monoClass={mono.className}
          />
          <FeatureCard
            kicker="Lifestyle Density"
            title={lifestyleTitle(d)}
            metric={`${d.counts.cafes + d.counts.restaurants}`}
            metricSuffix="POIs"
            body={`${d.counts.cafes} cafés · ${d.counts.restaurants} restaurants · ${d.counts.parks} parks within the pincode.`}
            horizontal
            className="lg:col-span-3"
            staggerIdx={2}
            monoClass={mono.className}
          />
        </div>
      </section>

      {/* DEEP DIVE */}
      <section id="deep-dive" className="mt-16 sm:mt-20">
        <div className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Deep Dive</h2>
          <p className={`${mono.className} text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400`}>
            All six scores
          </p>
        </div>
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.10)" }}
        >
          <DimRow monoClass={mono.className} label="Air Quality" value={d.scores.air} pct={d.percentile_blr.air} note={airBlurb(d)} />
          <DimRow monoClass={mono.className} label="Essentials" value={d.scores.essentials} pct={d.percentile_blr.essentials}
            note={`${d.counts.hospitals} hospitals · ${d.counts.schools} schools · ${d.counts.banks} banks within the pincode.`} />
          <DimRow monoClass={mono.className} label="Lifestyle" value={d.scores.lifestyle} pct={d.percentile_blr.lifestyle}
            note={`${d.counts.cafes} cafés · ${d.counts.restaurants} restaurants · ${d.counts.malls} malls/markets · ${d.counts.parks} parks/playgrounds.`} />
          <DimRow monoClass={mono.className} label="Connectivity" value={d.scores.connectivity} pct={d.percentile_blr.connectivity} note={metroBlurb(d)} />
          <DimRow monoClass={mono.className} label="Density & Activity" value={d.scores.density} pct={d.percentile_blr.density}
            note={`Population density ${Math.round(d.raw.pop_density).toLocaleString()}/km² · worker participation ${d.raw.wpr.toFixed(1)}%.`} />
          <DimRow monoClass={mono.className} label="Affordability" value={d.scores.affordability} pct={d.percentile_blr.affordability}
            note={d.raw.rent_2bhk
              ? `2BHK ~₹${Math.round(d.raw.rent_2bhk / 1000)}k/mo (${d.raw.rent_match === "locality" ? "locality match" : "city median"}).`
              : "Rent data not available — peer-relative score only."}
            soft={!d.scores.affordability_confident} />
        </div>

        <p className={`${mono.className} mt-4 text-[11px] sm:text-xs tracking-[0.12em] uppercase text-slate-400 leading-relaxed`}>
          Pincode {d.pincode} · {d.district}, {d.state} · Overall {overall}/100 · Sources: CPCB · OSM · Census 2011 · 99acres · Bengaluru Metro · BMTC
        </p>
      </section>

      <footer className="mt-16 pt-6 border-t border-gray-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">Area<span className="text-amber-500">IQ</span></span>
        <span className={mono.className}>Bangalore POC · Urban tier · {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}

// ── Fixed grain overlay ────────────────────────────────────────────────

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

// ── Feature card ─────────────────────────────────────────────────────

function FeatureCard({
  kicker, title, metric, metricSuffix, body, dark, warn, celebrate,
  hero, horizontal, className, staggerIdx = 0, monoClass,
}: {
  kicker: string; title: string; metric: string; metricSuffix?: string; body: string;
  dark?: boolean; warn?: boolean; celebrate?: boolean; hero?: boolean; horizontal?: boolean;
  className?: string; staggerIdx?: number; monoClass: string;
}) {
  const tone = dark
    ? "bg-slate-900 text-white"
    : warn
      ? "bg-rose-50 text-slate-900"
      : celebrate
        ? "bg-amber-50 text-slate-900"
        : "bg-white text-slate-900";

  const shadow = dark
    ? "shadow-[0_1px_2px_rgba(15,23,42,0.18),0_12px_32px_-12px_rgba(15,23,42,0.30)]"
    : warn
      ? "shadow-[0_1px_2px_rgba(225,29,72,0.06),0_8px_24px_-12px_rgba(225,29,72,0.14)]"
      : celebrate
        ? "shadow-[0_1px_2px_rgba(217,119,6,0.06),0_8px_24px_-12px_rgba(217,119,6,0.16)]"
        : "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_16px_36px_-14px_rgba(15,23,42,0.18)]";

  const padding = hero ? "p-6 sm:p-8" : "p-5 sm:p-6";
  const metricSize = hero
    ? "text-5xl sm:text-6xl lg:text-7xl"
    : horizontal
      ? "text-5xl sm:text-6xl"
      : "text-4xl sm:text-5xl";

  const kickerColor = dark
    ? "text-amber-300"
    : warn
      ? "text-rose-700"
      : celebrate
        ? "text-amber-700"
        : "text-slate-500";

  const suffixColor = dark
    ? "text-amber-200"
    : warn
      ? "text-rose-500"
      : celebrate
        ? "text-amber-700"
        : "text-slate-500";

  const titleSize = hero ? "text-xl sm:text-2xl lg:text-[28px]" : "text-lg sm:text-xl";
  const bodyColor = dark ? "text-slate-300" : "text-slate-600";

  return (
    <article
      className={`stagger-item group relative rounded-2xl ${padding} ${tone} ${shadow} ${className ?? ""} flex flex-col transition-shadow duration-200`}
      style={{ ["--i" as string]: staggerIdx }}
    >
      <div className="mb-4">
        <span className={`${monoClass} text-[11px] font-semibold tracking-[0.18em] uppercase ${kickerColor}`}>
          {kicker}
        </span>
      </div>

      {horizontal ? (
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8 flex-1">
          <div className="flex items-baseline gap-1.5 sm:min-w-[140px]">
            <span className={`${monoClass} ${metricSize} font-extrabold tracking-tight tabular-nums leading-[0.95]`}>
              {metric}
            </span>
            {metricSuffix && (
              <span className={`${monoClass} text-sm font-semibold ${suffixColor}`}>{metricSuffix}</span>
            )}
          </div>
          <div className="sm:flex-1 sm:pb-1">
            <h3 className={`${titleSize} font-bold tracking-tight mb-1.5 ${dark ? "text-white" : "text-slate-900"}`}>{title}</h3>
            <p className={`text-sm leading-relaxed ${bodyColor}`}>{body}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className={`${monoClass} ${metricSize} font-extrabold tracking-tight tabular-nums leading-[0.95]`}>
              {metric}
            </span>
            {metricSuffix && (
              <span className={`${monoClass} text-sm font-semibold ${suffixColor}`}>{metricSuffix}</span>
            )}
          </div>
          <h3 className={`${titleSize} font-bold tracking-tight mb-2 ${dark ? "text-white" : "text-slate-900"}`}>{title}</h3>
          <p className={`text-sm leading-relaxed ${bodyColor}`}>{body}</p>
        </>
      )}
    </article>
  );
}

// ── Deep Dive row ───────────────────────────────────────────────────

function DimRow({
  label, value, pct, note, soft, monoClass,
}: {
  label: string; value: number; pct: number; note: string; soft?: boolean; monoClass: string;
}) {
  const v = Math.round(value);
  const tone = v >= 70 ? "text-amber-600" : v >= 45 ? "text-slate-900" : "text-rose-600";
  const barTone = v >= 70 ? "bg-amber-500" : v >= 45 ? "bg-slate-700" : "bg-rose-400";
  const topPct = Math.max(1, Math.round(100 - pct));

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5 grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr_minmax(0,2fr)] gap-3 sm:gap-5 items-start sm:items-center border-b border-gray-100 last:border-0">
      <div className={`${monoClass} text-3xl font-extrabold tabular-nums ${tone} ${soft ? "opacity-60" : ""}`}>
        {v}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className={`${monoClass} text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-slate-400 shrink-0`}>
            Top {topPct}% in BLR
          </p>
        </div>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-md">
          <div className={`h-full rounded-full ${barTone}`} style={{ width: `${Math.max(2, v)}%` }} />
        </div>
        <p className="sm:hidden text-xs text-slate-500 leading-relaxed mt-2">{note}</p>
      </div>
      <p className="hidden sm:block text-sm text-slate-600 leading-relaxed">{note}</p>
    </div>
  );
}

function CardStaggerStyle() {
  return (
    <style>{`
      .card-stagger .stagger-item {
        opacity: 0;
        transform: translateY(8px);
        animation: stagger-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        animation-delay: calc(var(--i, 0) * var(--stagger, 80ms));
        will-change: transform, opacity;
      }
      @keyframes stagger-rise {
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .card-stagger .stagger-item { animation: none; opacity: 1; transform: none; }
      }
    `}</style>
  );
}

// ── Flag-style brag chip with leading bar ────────────────────────────

function BragChip({ brag }: { brag: string }) {
  const variant = chipVariant(brag);
  return (
    <span className="inline-flex items-stretch overflow-hidden rounded-md text-xs font-semibold tracking-[0.12em] uppercase">
      <span className={`w-[3px] ${variant.bar}`} />
      <span className={`flex items-center gap-2 px-3 py-1.5 ${variant.body}`}>
        {variant.icon}
        {brag}
      </span>
    </span>
  );
}

function chipVariant(brag: string): { icon: React.ReactNode; bar: string; body: string } {
  if (/Bangalore's #1\b/.test(brag)) return { icon: <Trophy />, bar: "bg-amber-500", body: "bg-amber-50 text-amber-800" };
  if (/Bangalore's #[23]\b/.test(brag)) return { icon: <TrophyOutline />, bar: "bg-amber-400", body: "bg-amber-50 text-amber-800" };
  if (/Top 5%/.test(brag)) return { icon: <ShieldCheck />, bar: "bg-amber-500", body: "bg-amber-50 text-amber-800" };
  if (/Top 1[05]%/.test(brag)) return { icon: <Shield />, bar: "bg-amber-300", body: "bg-amber-50 text-amber-700" };
  return { icon: <Dot />, bar: "bg-slate-500", body: "bg-slate-100 text-slate-700" };
}

// ── helpers ─────────────────────────────────────────────────────────

function labelOnly(brag: string): string {
  const m1 = brag.match(/Bangalore's (#\d+ .+)/); if (m1) return `The ${m1[1]}`;
  const m2 = brag.match(/(Top \d+% .+) in Bangalore/); if (m2) return m2[1];
  return brag;
}
function transitTitle(d: IQv2): string {
  const km = d.raw.metro_km ?? 99;
  if (km <= 1.5) return "Metro at the Doorstep";
  if (km <= 4) return "Easy Metro Access";
  if (km <= 10) return "Reachable by Bus + Metro";
  return "Far From Rapid Transit";
}
function lifestyleTitle(d: IQv2): string {
  const total = d.counts.cafes + d.counts.restaurants;
  if (total >= 80) return "Dense Lifestyle Strip";
  if (total >= 40) return "Active F&B Scene";
  if (total >= 15) return "Pockets of Lifestyle";
  return "Quiet Residential";
}
function airTitle(d: IQv2): string {
  const aqi = d.raw.aqi;
  if (aqi == null) return "Reading Unavailable";
  if (aqi <= 50) return "Good Air";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  return "Very Unhealthy";
}
function metroBlurb(d: IQv2): string {
  const km = d.raw.metro_km;
  if (km == null) return "No metro data available.";
  return `${km.toFixed(1)}km to nearest metro · ${d.counts.buses} bus stops · ${Math.round(d.raw.commute_under_30_pct)}% commute under 30 min.`;
}
function airBlurb(d: IQv2): string {
  if (d.raw.aqi == null) return "AQI not available.";
  const conf = d.scores.air_confident;
  const dist = d.raw.station_distance_km;
  return conf
    ? `Pulled from a CPCB station ${dist?.toFixed(1)}km away.`
    : `Closest CPCB station is ${dist?.toFixed(1)}km — treat as a city-wide read.`;
}

// ── tiny inline icons ────────────────────────────────────────────────
function Award() { return (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
  </svg>
);}
function Trophy() { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 4h12v3a6 6 0 0 1-5 5.917V16h2a2 2 0 0 1 2 2v2H7v-2a2 2 0 0 1 2-2h2v-3.083A6 6 0 0 1 6 7V4Zm-2 1h2v2H4a1 1 0 0 1 0-2Zm14 0h2a1 1 0 0 1 0 2h-2V5Z" />
  </svg>
);}
function TrophyOutline() { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" /><path d="M12 13v3" /><path d="M9 20h6" /><path d="M4 5h2M18 5h2" />
  </svg>
);}
function ShieldCheck() { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);}
function Shield() { return (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);}
function Dot() { return <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-current" />; }
