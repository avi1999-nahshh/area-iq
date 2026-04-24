"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { computeVerdict, type AreaLite } from "./verdict";

// Dynamically load MiniMap to avoid SSR hydration issues with Leaflet
const MiniMap = dynamic(
  () => import("./mini-map").then((m) => m.MiniMap),
  { ssr: false, loading: () => <div className="skeleton-shimmer w-full h-full rounded-xl" style={{ minHeight: 200 }} /> }
);

// ─── types ────────────────────────────────────────────────────────────────────

type AreaData = AreaLite & {
  pincode: AreaLite["pincode"] & { lat?: number; lng?: number };
  trivia?: { facts?: string[] } | null;
};

interface Props {
  a: AreaData;
  b: AreaData;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function MetricBar({ score, isWinner }: { score: number; isWinner: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${isWinner ? "bg-amber-400" : "bg-slate-300"}`}
        style={{ width: mounted ? `${pct}%` : "0%" }}
      />
    </div>
  );
}

function MetricRow({
  label,
  scoreA,
  scoreB,
  subtitleA,
  subtitleB,
}: {
  label: string;
  scoreA: number;
  scoreB: number;
  subtitleA?: string;
  subtitleB?: string;
}) {
  const aWins = scoreA >= scoreB;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center py-4 border-b border-slate-100 last:border-0">
      {/* Area A side */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2 justify-end">
          <span className={`text-2xl font-bold tracking-tight tabular-nums ${aWins ? "text-amber-600" : "text-slate-400"}`}>
            {Math.round(scoreA)}
          </span>
        </div>
        {subtitleA && (
          <p className="text-[10px] text-slate-400 text-right leading-tight">{subtitleA}</p>
        )}
        <MetricBar score={scoreA} isWinner={aWins} />
      </div>

      {/* Label */}
      <div className="text-center px-3">
        <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-slate-400 whitespace-nowrap">
          {label}
        </span>
      </div>

      {/* Area B side */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight tabular-nums ${!aWins ? "text-amber-600" : "text-slate-400"}`}>
            {Math.round(scoreB)}
          </span>
        </div>
        {subtitleB && (
          <p className="text-[10px] text-slate-400 leading-tight">{subtitleB}</p>
        )}
        <MetricBar score={scoreB} isWinner={!aWins} />
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function HeadToHead({ a, b }: Props) {
  const verdict = computeVerdict(a, b);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const latA = a.pincode.lat ?? 20.5937;
  const lngA = a.pincode.lng ?? 78.9629;
  const latB = b.pincode.lat ?? 20.5937;
  const lngB = b.pincode.lng ?? 78.9629;

  // Metric rows: [label, scoreA, scoreB, subtitleA, subtitleB]
  const crimeA = a.safety?.crime_rate_per_lakh;
  const crimeB = b.safety?.crime_rate_per_lakh;
  const rentA  = a.property?.city_rent_median_2bhk;
  const rentB  = b.property?.city_rent_median_2bhk;
  const aqiA   = a.airQuality?.aqi;
  const aqiB   = b.airQuality?.aqi;
  const transitA = a.scores?.transit_score ?? 0;
  const transitB = b.scores?.transit_score ?? 0;

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] grain">
      <a href="#main" className="skip-link">skip to content</a>

      {/* ── header ── */}
      <header className="px-6 py-5 max-w-5xl mx-auto w-full flex items-center justify-between animate-fade-in-up">
        <a href="/" className="font-semibold text-lg tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
          Area<span className="text-amber-500">IQ</span>
        </a>
        <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">compare</span>
      </header>

      <main id="main" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-24">

        {/* ── title block ── */}
        <section className="pt-8 pb-6 text-center animate-fade-in-up" style={{ animationDelay: "40ms" }}>
          <h1
            className="text-6xl sm:text-8xl font-bold tracking-tighter text-slate-900 leading-none"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Head-to-Head
          </h1>
          <p className="mt-4 text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Compare objective metrics and subjective realities to find the neighborhood that aligns perfectly with your lifestyle.
          </p>
        </section>

        {/* ── area selectors row ── */}
        <section
          className="flex items-center justify-center gap-4 sm:gap-8 py-4 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          {/* Area A chip */}
          <a
            href={`/area/${a.pincode.pincode}`}
            className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-slate-400 group-hover:text-amber-600 transition-colors">
              Area A
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {a.pincode.name}
            </span>
            <span className="text-xs text-slate-400">{a.pincode.pincode}</span>
          </a>

          <span
            className="text-2xl sm:text-3xl font-bold text-slate-300"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            vs
          </span>

          {/* Area B chip */}
          <a
            href={`/area/${b.pincode.pincode}`}
            className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-slate-400 group-hover:text-amber-600 transition-colors">
              Area B
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {b.pincode.name}
            </span>
            <span className="text-xs text-slate-400">{b.pincode.pincode}</span>
          </a>
        </section>

        {/* ── mini maps row ── */}
        <section
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 animate-fade-in-up"
          style={{ animationDelay: "120ms" }}
        >
          {/* Map A */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50" style={{ height: 220 }}>
            <MiniMap lat={latA} lng={lngA} name={a.pincode.name} pincode={a.pincode.pincode} />
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-700">{a.pincode.name}</p>
              <p className="text-[10px] text-slate-400">{a.pincode.district}</p>
            </div>
          </div>

          {/* Map B */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50" style={{ height: 220 }}>
            <MiniMap lat={latB} lng={lngB} name={b.pincode.name} pincode={b.pincode.pincode} />
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-700">{b.pincode.name}</p>
              <p className="text-[10px] text-slate-400">{b.pincode.district}</p>
            </div>
          </div>
        </section>

        {/* ── verdict card ── */}
        <section
          className="mt-8 rounded-3xl p-7 sm:p-10 animate-fade-in-up"
          style={{
            animationDelay: "180ms",
            background: "#FDFCF7",
            border: "1px solid #e8e4d8",
            boxShadow: "0 8px 40px -12px rgba(245,197,24,0.12)",
          }}
        >
          {/* The Verdict label */}
          <p
            className="text-[10px] font-semibold text-slate-400"
            style={{ letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            The Verdict
          </p>

          {/* Winner headline */}
          <h2
            className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.05]"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            {verdict.headline}
          </h2>

          {/* Trash-talk subhead */}
          <p className="mt-4 text-slate-700 leading-snug text-lg sm:text-xl font-medium">
            {verdict.trashTalk}
          </p>

          {/* Dim-wins ticker + audience chip */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!verdict.tie && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white">
                {verdict.dimWins.winner} of {verdict.dimWins.total} dimensions
              </span>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              {verdict.audienceLine}
            </span>
          </div>

          {/* Share CTA */}
          <button
            onClick={handleShare}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share Comparison
              </>
            )}
          </button>
        </section>

        {/* ── deep dive metrics table ── */}
        <section
          className="mt-8 rounded-3xl overflow-hidden border border-slate-100 bg-white animate-fade-in-up"
          style={{ animationDelay: "260ms" }}
        >
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 px-6 pt-5 pb-3 border-b border-slate-100">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700 leading-tight">{a.pincode.name}</p>
              <p className="text-[10px] text-slate-400">{a.pincode.pincode}</p>
            </div>
            <div className="px-3">
              <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-slate-300">metric</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 leading-tight">{b.pincode.name}</p>
              <p className="text-[10px] text-slate-400">{b.pincode.pincode}</p>
            </div>
          </div>

          {/* Metric rows */}
          <div className="px-6 pb-4">
            <MetricRow
              label="Safety"
              scoreA={a.scores?.safety_score ?? 0}
              scoreB={b.scores?.safety_score ?? 0}
              subtitleA={crimeA ? `Crime: ${Math.round(crimeA)}/lakh` : undefined}
              subtitleB={crimeB ? `Crime: ${Math.round(crimeB)}/lakh` : undefined}
            />
            <MetricRow
              label="Air Quality"
              scoreA={a.scores?.air_quality_score ?? 0}
              scoreB={b.scores?.air_quality_score ?? 0}
              subtitleA={aqiA ? `AQI: ${aqiA}` : undefined}
              subtitleB={aqiB ? `AQI: ${aqiB}` : undefined}
            />
            <MetricRow
              label="Avg Rent"
              scoreA={100 - (a.scores?.property_score ?? 50)}
              scoreB={100 - (b.scores?.property_score ?? 50)}
              subtitleA={rentA ? `₹${Math.round(rentA / 1000)}k/mo 2BHK` : undefined}
              subtitleB={rentB ? `₹${Math.round(rentB / 1000)}k/mo 2BHK` : undefined}
            />
            <MetricRow
              label="Transit"
              scoreA={transitA}
              scoreB={transitB}
              subtitleA={`Transit score: ${Math.round(transitA)}`}
              subtitleB={`Transit score: ${Math.round(transitB)}`}
            />
          </div>
        </section>

      </main>

      {/* ── footer ── */}
      <footer className="border-t border-slate-200/70 px-6 py-6 bg-[#fdfcf7]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-semibold text-slate-900 text-sm">
            Area<span className="text-amber-500">IQ</span>
          </span>
          <span className="text-xs text-slate-400">
            © {new Date().getFullYear()} AreaIQ. Built for India.
          </span>
        </div>
      </footer>
    </div>
  );
}
