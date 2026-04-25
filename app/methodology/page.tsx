import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Methodology — AreaIQ",
  description:
    "How AreaIQ scores Bangalore neighbourhoods: the six dimensions, the data sources, the honesty rules, and what we deliberately don't show.",
};

const TOC = [
  { id: "scope", label: "Scope" },
  { id: "dimensions", label: "The six dimensions" },
  { id: "honesty", label: "Honesty rules" },
  { id: "hidden", label: "What's hidden or dropped" },
  { id: "proximity", label: "How proximity search works" },
  { id: "sources", label: "Data sources" },
  { id: "limitations", label: "Limitations" },
];

export default function MethodologyPage() {
  return (
    <div className={`${inter.className} relative min-h-[100dvh] bg-[#f9f7f3] text-slate-900`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-amber-500 focus:text-white focus:rounded-md focus:font-semibold"
      >
        Skip to content
      </a>
      <GrainOverlay />

      {/* Minimal nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-base tracking-tight text-slate-900">
          Area<span className="text-amber-500">IQ</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/insights"
            className="hidden sm:inline-flex text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            Insights
          </Link>
          <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500 text-white">
            Early Access
          </span>
        </nav>
      </header>

      <main id="main" className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-20 sm:pb-28">
        {/* Breadcrumb */}
        <nav
          className={`${mono.className} flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-slate-500 mb-6`}
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-amber-700 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]"
          >
            Home
          </Link>
          <span aria-hidden className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Methodology</span>
        </nav>

        {/* Hero */}
        <header className="max-w-3xl mb-12 sm:mb-16">
          <span className="inline-flex items-stretch overflow-hidden rounded-md text-[11px] font-semibold tracking-[0.18em] uppercase mb-4">
            <span className="w-[3px] bg-amber-500" />
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700">Documentation</span>
          </span>
          <h1
            className="text-[2.5rem] leading-[1.04] sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
            style={{ textWrap: "balance" }}
          >
            How we score.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
            The six dimensions, the formula, the honesty gates, and the data sources behind
            every AreaIQ score. Read what we exclude as carefully as what we include.
          </p>
        </header>

        {/* Layout: TOC sidebar + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
          {/* TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-6">
              <p className={`${mono.className} text-[10px] font-semibold tracking-[0.22em] uppercase text-slate-400 mb-3`}>
                On this page
              </p>
              <ul className="space-y-1">
                {TOC.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className="block text-sm text-slate-600 hover:text-amber-700 hover:bg-gray-50 px-2 py-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]"
                    >
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <article className="max-w-3xl space-y-14 sm:space-y-16">
            {/* SCOPE */}
            <Section
              id="scope"
              kicker="01"
              title="Scope: Bangalore urban tier only"
              mono={mono.className}
            >
              <p>
                AreaIQ is, deliberately, a small product. It covers <Stat mono={mono.className}>129</Stat>{" "}
                pincodes — the urban tier inside Bangalore. Nothing else.
              </p>
              <p>
                We tried scoring all of India. The data didn&apos;t hold up. About 88% of
                Indian pincodes are tier <Code mono={mono.className}>rural</Code>; for those,
                rent coverage is around 2%, the nearest CPCB air station is a median of 24km
                away, and there&apos;s no metro within a useful radius. A score in those
                conditions is fiction.
              </p>
              <p>
                Inside Bangalore urban, the picture changes: <Stat mono={mono.className}>100%</Stat> of
                pincodes have AQI, metro distance, and rent data; <Stat mono={mono.className}>76%</Stat> have
                a CPCB station within 15km; <Stat mono={mono.className}>49%</Stat> have a locality-level
                rent match (vs. 24% nationally). That&apos;s the smallest cut we could make
                where the score is defensible.
              </p>
              <p>
                When AreaIQ expands, it&apos;ll be one city at a time — never a flag-day
                rollout to all of India.
              </p>
            </Section>

            {/* DIMENSIONS */}
            <Section
              id="dimensions"
              kicker="02"
              title="The six dimensions"
              mono={mono.className}
            >
              <p>
                Every score is <strong>peer-relative within Bangalore urban</strong>. A 73 in
                amenities means &ldquo;this pincode beats 73% of Bangalore urban pincodes
                on amenity density&rdquo; — not an absolute claim about the world.
              </p>

              <DimTable mono={mono.className} />

              <p className="mt-6">
                The overall score weights these as:
              </p>
              <WeightTable mono={mono.className} />
              <p className="text-sm text-slate-500 mt-3">
                Walkability is computed but weighted at zero — see{" "}
                <a href="#hidden" className="text-amber-700 hover:text-amber-900 underline underline-offset-2 decoration-amber-300">
                  What&apos;s hidden or dropped
                </a>{" "}
                below.
              </p>
            </Section>

            {/* HONESTY */}
            <Section id="honesty" kicker="03" title="Honesty rules" mono={mono.className}>
              <p>
                A relative ranking can lie about absolute reality. Bangalore-wide AQI is
                uniformly bad (median 185, &ldquo;Unhealthy&rdquo; on the CPCB scale). A
                pincode in the 95th percentile of Bangalore air is still breathing AQI 150+.
                Calling it &ldquo;Top 5% Cleanest Air&rdquo; would mislead.
              </p>
              <p>So the brag-label generator (the line that appears under the area name) has gates:</p>
              <ul className="space-y-3 list-none pl-0">
                <Rule
                  mono={mono.className}
                  label="Air confidence"
                  body={
                    <>
                      The Cleanest Air brag fires only if the nearest CPCB station is within{" "}
                      <Stat mono={mono.className}>15km</Stat> AND the absolute AQI is{" "}
                      <Stat mono={mono.className}>≤ 100</Stat> (the CPCB &ldquo;Moderate&rdquo;
                      threshold). Otherwise we brag on the next-best dimension.
                    </>
                  }
                />
                <Rule
                  mono={mono.className}
                  label="Affordability locality"
                  body={
                    <>
                      The Affordable Living brag requires a locality-level rent match (not a
                      city-median fallback) unless the pincode is in the top 10 absolute. Stops
                      city-median guesses from masquerading as locality knowledge.
                    </>
                  }
                />
                <Rule
                  mono={mono.className}
                  label="Subhead anchors on the strongest single dim"
                  body={
                    <>
                      The &ldquo;outperforms X% of Bangalore on Y&rdquo; line uses the actual
                      percentile of one dimension — not the top dim&apos;s percentile parroted
                      across multiple. Avoids the &ldquo;outperforms 97% on lifestyle, essentials,
                      AND air&rdquo; bug where two of the three were overstated.
                    </>
                  }
                />
              </ul>
            </Section>

            {/* HIDDEN */}
            <Section
              id="hidden"
              kicker="04"
              title="What's hidden or dropped"
              mono={mono.className}
            >
              <p>
                Three signals were either fully removed or kept in the data but never shown:
              </p>

              <Card mono={mono.className} title="Walkability — hidden, weight 0">
                <p>
                  Composite of{" "}
                  <Code mono={mono.className}>five_minute_city_score × 0.6</Code> +{" "}
                  <Code mono={mono.className}>commute_under_30min_pct × 0.4</Code>. The blend
                  mixes neighbourhood walkability with office commute time, and reads as
                  confusing in the report. The score still computes (still in
                  <Code mono={mono.className}>iq_v2_blr.json</Code>) but no surface displays it
                  and the overall weights it at 0. Its old 15% was redistributed across air
                  (+4), amenities (+4), connectivity (+2), density (+3), affordability (+2).
                </p>
              </Card>

              <Card mono={mono.className} title="Cleanliness — dropped">
                <p>
                  100% of pincodes show a Swachh Survekshan score, but only{" "}
                  <Stat mono={mono.className}>925</Stat> unique ULBs drive all 19,928 rows. The
                  other 19,003 are broadcast from their parent city or state. Two pincodes in
                  the same ULB get identical cleanliness scores. Single year (2024-25). We
                  dropped it from scoring entirely.
                </p>
              </Card>

              <Card mono={mono.className} title="Safety — dropped">
                <p>
                  The NCRB district crime data is from <Stat mono={mono.className}>2014</Stat>.
                  Twelve years stale. Same district = same safety score, no within-district
                  resolution. We dropped it rather than display a number that suggests
                  precision the data doesn&apos;t have.
                </p>
              </Card>

              <Card mono={mono.className} title="Property as nightlight intensity — dropped">
                <p>
                  The previous &ldquo;property_score&rdquo; field was actually a nightlight
                  intensity proxy, not real property data, despite being labelled as such.
                  Replaced by 99acres rent (locality match preferred, city median fallback).
                  Pincodes with no rent data show a peer-relative score with reduced weight,
                  not a fabricated number.
                </p>
              </Card>
            </Section>

            {/* PROXIMITY */}
            <Section
              id="proximity"
              kicker="05"
              title="How proximity search works"
              mono={mono.className}
            >
              <p>
                When you tell us where you work, we don&apos;t draw a straight line. We
                compute the actual travel time on real Bangalore roads — the way Google
                Maps would, with our own routing layer underneath.
              </p>

              <p className="font-semibold text-slate-900 mt-6 mb-1">Three steps:</p>
              <ol className="list-decimal pl-6 space-y-3 text-base">
                <li>
                  <strong>Find your office.</strong> Type any Bangalore address — Manyata,
                  Cubbon Park, Hosur Road — and we resolve it to a point on the map. Or
                  pick from <Stat mono={mono.className}>6</Stat> pre-loaded tech parks
                  in the dropdown.
                </li>
                <li>
                  <strong>Time the trip.</strong> From your office, we compute the commute to
                  every one of the <Stat mono={mono.className}>129</Stat> neighbourhoods we
                  cover, by your chosen mode — drive, transit, or walk. The math follows the
                  real road network, not as-the-crow-flies. Average <Stat mono={mono.className}>~3s</Stat>{" "}
                  on a fresh search; instant on a repeat.
                </li>
                <li>
                  <strong>Rank the survivors.</strong> Anything outside your commute window
                  drops out. For the rest, we re-score using your priority chips — every
                  chip you tick gives that dimension <strong>twice the weight</strong> in the
                  overall IQ score. Sort by the new score, take the top 6.
                </li>
              </ol>

              <Card mono={mono.className} title="Why it&apos;s usually instant">
                <p>
                  About 80% of commute searches in Bangalore start at the same handful of
                  tech parks. We pre-compute the routes for those origins at launch (and
                  re-cache for <Stat mono={mono.className}>7 days</Stat> after any search),
                  so most users land on a fully loaded result before they finish blinking.
                  Type a one-off address — say, your apartment in Banashankari — and the
                  first call takes a few seconds; it&apos;s cached after that.
                </p>
              </Card>

              <p className="font-semibold text-slate-900 mt-6 mb-1">What this version doesn&apos;t model:</p>
              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>
                  <strong>Traffic.</strong> We give you free-flow road times. A 9am rush-hour
                  drive will run roughly{" "}
                  <Stat mono={mono.className}>1.5–2×</Stat> the number we show. The route
                  status pip is honest about this — it reads{" "}
                  <Code mono={mono.className}>live · road network</Code>, not{" "}
                  <Code mono={mono.className}>live traffic</Code>. The next iteration plugs
                  in a traffic-aware provider; the rest of the architecture stays as-is.
                </li>
                <li>
                  <strong>Adjust hours</strong> — the modal where you pick departure and
                  return times — currently stores your selection but doesn&apos;t change the
                  math. Same reason as above. Once traffic data is live, that input starts
                  to matter.
                </li>
                <li>
                  <strong>The amber blob on the map</strong> is a circle sized by mode and
                  max-minute, not a true reachable zone. It&apos;s a visual hint. The
                  ranking itself uses real road-network minutes per neighbourhood — that
                  filter is honest, the blob is decoration.
                </li>
              </ul>
            </Section>

            {/* SOURCES */}
            <Section id="sources" kicker="06" title="Data sources" mono={mono.className}>
              <SourceTable mono={mono.className} />
              <p className="mt-6">
                When sources update, AreaIQ does too. Air is the closest to real-time (CPCB
                refreshes hourly, we pull weekly); rent and OSM amenities refresh on a
                weekly target; Census 2011 is, of course, frozen until the next census drops.
              </p>
            </Section>

            {/* LIMITATIONS */}
            <Section id="limitations" kicker="07" title="Limitations" mono={mono.className}>
              <ul className="list-disc pl-6 space-y-2 text-base">
                <li>
                  <strong>Bangalore-only.</strong> Don&apos;t use scores from outside the
                  city — they don&apos;t exist here.
                </li>
                <li>
                  <strong>Census is 15 years old.</strong> Demographic and household-size
                  numbers are 2011. Bangalore has grown and shifted since.
                </li>
                <li>
                  <strong>Rent is estimates.</strong> 99acres data is sparse; for some
                  pincodes we use a city-median fallback. The Affordability brag-label gate
                  is one defence; the &ldquo;estimate&rdquo; tag in the deep-dive note is
                  another.
                </li>
                <li>
                  <strong>OSM amenity counts under-report.</strong> Cafés and restaurants in
                  particular. We aggregate across reasonable tags but small businesses
                  outside the OSM contributor base are missed.
                </li>
                <li>
                  <strong>Air station distance.</strong> 76% of pincodes have a CPCB station
                  within 15km; for the other 24% the air score is shown but the brag-label
                  is suppressed (see Honesty rules).
                </li>
                <li>
                  <strong>No real-time traffic in proximity search.</strong> We use real
                  road-network times (not straight-line), but they assume free-flow speeds.
                  Bangalore rush-hour drives will run noticeably longer than the number
                  shown. Traffic-aware routing is the next iteration; the rest stays the same.
                </li>
              </ul>
            </Section>

            {/* CTA back to insights */}
            <section className="pt-2">
              <div className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                style={{
                  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)",
                }}
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-1">
                    Ready to look one up?
                  </h2>
                  <p className="text-sm text-slate-600 max-w-md">
                    Search any of the 129 Bangalore neighbourhoods we&apos;ve scored.
                  </p>
                </div>
                <Link
                  href="/insights"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 active:translate-y-[1px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white shrink-0"
                >
                  Open Insights
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </section>
          </article>
        </div>
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

// ── reusable atoms ──────────────────────────────────────────────────────

function Section({
  id,
  kicker,
  title,
  mono,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  mono: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-12">
      <p className={`${mono} text-[11px] font-semibold tracking-[0.22em] uppercase text-amber-700 mb-2`}>
        § {kicker}
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-5">
        {title}
      </h2>
      <div className="space-y-4 text-base text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

function Stat({ children, mono }: { children: React.ReactNode; mono: string }) {
  return (
    <span
      className={`${mono} font-bold tabular-nums text-amber-700`}
    >
      {children}
    </span>
  );
}

function Code({ children, mono }: { children: React.ReactNode; mono: string }) {
  return (
    <code className={`${mono} text-[0.92em] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800`}>
      {children}
    </code>
  );
}

function Rule({
  mono,
  label,
  body,
}: {
  mono: string;
  label: string;
  body: React.ReactNode;
}) {
  return (
    <li
      className="bg-white rounded-lg p-4 sm:p-5"
      style={{
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)",
      }}
    >
      <p className={`${mono} text-[11px] font-semibold tracking-[0.18em] uppercase text-amber-700 mb-1.5`}>
        {label}
      </p>
      <p className="text-sm text-slate-700 leading-relaxed">{body}</p>
    </li>
  );
}

function Card({
  mono,
  title,
  children,
}: {
  mono: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-lg p-4 sm:p-5"
      style={{
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)",
      }}
    >
      <p className={`${mono} text-[11px] font-semibold tracking-[0.18em] uppercase text-amber-700 mb-2`}>
        {title}
      </p>
      <div className="text-sm text-slate-700 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function DimTable({ mono }: { mono: string }) {
  const rows: { dim: string; what: string; source: string }[] = [
    {
      dim: "Air",
      what: "CPCB AQI from the nearest station ≤15km. PM2.5 weighted.",
      source: "CPCB Sameer",
    },
    {
      dim: "Essentials",
      what: "Counts of hospitals + schools + colleges + banks within the pincode.",
      source: "OSM",
    },
    {
      dim: "Lifestyle",
      what: "Counts of cafés + restaurants + malls/markets + parks within the pincode.",
      source: "OSM",
    },
    {
      dim: "Connectivity",
      what: "Composite: metro km (40%) + railway km (15%) + bus stop count (20%) + commute<30min % (25%)",
      source: "BMTC, Bengaluru Metro, OSM, Census 2011",
    },
    {
      dim: "Density & Activity",
      what: "Population density + worker participation + (small avg HH size as a young-area proxy)",
      source: "Census 2011",
    },
    {
      dim: "Affordability",
      what: "Inverted 99acres 2BHK rent percentile (locality match preferred, city median fallback)",
      source: "99acres scrape",
    },
  ];
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm bg-white rounded-lg overflow-hidden"
        style={{
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)",
        }}
      >
        <thead className={`${mono} text-[10px] tracking-[0.18em] uppercase text-slate-500`}>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 sm:px-5 py-3 font-semibold">Dimension</th>
            <th className="text-left px-4 sm:px-5 py-3 font-semibold">What goes in</th>
            <th className="text-left px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.dim} className="border-b border-gray-100 last:border-0 align-top">
              <td className="px-4 sm:px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                {r.dim}
              </td>
              <td className="px-4 sm:px-5 py-3 text-slate-600 leading-relaxed">{r.what}</td>
              <td className={`${mono} px-4 sm:px-5 py-3 text-[12px] text-slate-500 leading-relaxed`}>
                {r.source}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeightTable({ mono }: { mono: string }) {
  const rows: [string, number][] = [
    ["Air", 24],
    ["Amenities (Essentials + Lifestyle averaged)", 24],
    ["Connectivity", 22],
    ["Density & Activity", 18],
    ["Affordability", 12],
    ["Walkability (hidden)", 0],
  ];
  return (
    <div className="bg-white rounded-lg p-2 sm:p-3"
      style={{
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)",
      }}
    >
      <ul className="divide-y divide-gray-100">
        {rows.map(([label, w]) => (
          <li key={label} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-sm text-slate-700">{label}</span>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-20 sm:w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${w === 0 ? "bg-gray-300" : "bg-amber-500"}`}
                  style={{ width: `${(w / 24) * 100}%` }}
                />
              </div>
              <span className={`${mono} text-sm font-bold tabular-nums w-10 text-right text-slate-900`}>
                {w}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceTable({ mono }: { mono: string }) {
  const rows: { source: string; vintage: string; granularity: string; what: string }[] = [
    {
      source: "CPCB Sameer",
      vintage: "Live (hourly upstream, weekly pull)",
      granularity: "Per monitoring station, joined by nearest distance",
      what: "AQI, PM2.5",
    },
    {
      source: "OpenStreetMap",
      vintage: "Continuous, snapshot weekly",
      granularity: "Per-pincode polygon intersection",
      what: "Hospitals, schools, colleges, banks, cafés, restaurants, malls, markets, parks, bus stops",
    },
    {
      source: "Census 2011",
      vintage: "2011 (frozen until next census)",
      granularity: "Pincode (joined via district + town code)",
      what: "Population, density, household size, worker participation, commute distribution",
    },
    {
      source: "99acres",
      vintage: "Quarterly scrape",
      granularity: "Locality (preferred) → city median (fallback)",
      what: "2BHK monthly rent",
    },
    {
      source: "Bengaluru Metro",
      vintage: "Static, manual update on line additions",
      granularity: "Station coordinates → nearest distance",
      what: "Metro km",
    },
    {
      source: "BMTC",
      vintage: "OSM-sourced",
      granularity: "Per-pincode polygon intersection",
      what: "Bus stop counts",
    },
    {
      source: "OpenStreetMap routing",
      vintage: "Live (rate-limited public demo)",
      granularity: "Address → road-network minutes per pincode",
      what: "Drive / transit / walk commute time for proximity search",
    },
    {
      source: "Nominatim",
      vintage: "Live (debounced 800ms; ToS = 1 req/sec)",
      granularity: "Free-text address → lat/lng (Bangalore-bounded viewbox)",
      what: "Office address autocomplete",
    },
  ];
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm bg-white rounded-lg overflow-hidden"
        style={{
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)",
        }}
      >
        <thead className={`${mono} text-[10px] tracking-[0.18em] uppercase text-slate-500`}>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Source</th>
            <th className="text-left px-4 sm:px-5 py-3 font-semibold">Vintage</th>
            <th className="text-left px-4 sm:px-5 py-3 font-semibold">Granularity</th>
            <th className="text-left px-4 sm:px-5 py-3 font-semibold">Feeds</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source} className="border-b border-gray-100 last:border-0 align-top">
              <td className="px-4 sm:px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                {r.source}
              </td>
              <td className={`${mono} px-4 sm:px-5 py-3 text-[12px] text-slate-500 leading-relaxed`}>
                {r.vintage}
              </td>
              <td className="px-4 sm:px-5 py-3 text-slate-600 leading-relaxed">
                {r.granularity}
              </td>
              <td className="px-4 sm:px-5 py-3 text-slate-600 leading-relaxed">{r.what}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
