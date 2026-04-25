"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { IQv2 } from "@/app/insights/lib";
import { BragChip } from "@/app/insights/brag-chip";
import { displayName } from "@/app/insights/blr-aliases";
import { ShareButton } from "@/app/_components/share-button";
import { compareShareText } from "@/app/_lib/share-copy";
import { track } from "@/app/_lib/track";
import { computeVerdict, type DimRow } from "./verdict";
import { pincodeToSlug, pairSlug as makePairSlug } from "./lib";
import { AreaPicker } from "./area-picker";

const HeroMap = dynamic(() => import("./hero-map").then((m) => m.HeroMap), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0d1219]" />,
});

const MONO_KICKER = "font-mono text-[11px] tracking-[0.22em] uppercase font-semibold";

interface Props {
  a: IQv2;
  b: IQv2;
  shareUrl: string;
}

export function HeadToHead({ a, b, shareUrl }: Props) {
  const router = useRouter();
  const verdict = useMemo(() => computeVerdict(a, b), [a, b]);
  const pairSlug = useMemo(() => makePairSlug(a.pincode, b.pincode), [a.pincode, b.pincode]);

  // Plausible "Compare Viewed" — fires once per render with the pair, the
  // winner, and the magnitude. Pincode is a public administrative code, so
  // it's safe; no PII.
  useEffect(() => {
    const winner_pincode =
      verdict.winnerSide === "tie" ? "tie" : verdict.winnerSide === "a" ? a.pincode : b.pincode;
    track("Compare Viewed", {
      pincode_a: a.pincode,
      pincode_b: b.pincode,
      winner_pincode,
      delta: verdict.delta,
      tie: verdict.tie,
    });
  }, [a.pincode, b.pincode, verdict.winnerSide, verdict.delta, verdict.tie]);

  const navigateTo = (slugA: string, slugB: string) => {
    if (slugA === slugB) return;
    router.push(`/compare/${slugA}-vs-${slugB}`);
  };
  const onPickA = (pin: string) => {
    track("Compare Picker Changed", { side: "a", from_pincode: a.pincode, to_pincode: pin });
    navigateTo(pincodeToSlug(pin), pincodeToSlug(b.pincode));
  };
  const onPickB = (pin: string) => {
    track("Compare Picker Changed", { side: "b", from_pincode: b.pincode, to_pincode: pin });
    navigateTo(pincodeToSlug(a.pincode), pincodeToSlug(pin));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
      <Breadcrumb a={a} b={b} />

      {/* Asymmetric hero: heading left, hero map right (lg+); stacks on mobile */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-center mt-2">
        <div className="text-center lg:text-left">
          <p className={`${MONO_KICKER} text-amber-700`}>Bangalore's Oldest Debate</p>
          <h1
            className="mt-4 text-[2.5rem] leading-[1.04] sm:text-6xl lg:text-[5.25rem] font-extrabold tracking-tight text-slate-900"
            style={{ textWrap: "balance" }}
          >
            Whose area <span className="italic text-amber-600">actually</span> wins?
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            HSR vs Whitefield. Indiranagar vs Koramangala. JP Nagar vs Jayanagar. The argument your group chat won't end — we'll call it.
          </p>
        </div>

        <div className="relative pt-6 lg:pt-0">
          <div
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: "5 / 4" }}
          >
            <HeroMap
              a={{ lat: a.lat, lng: a.lng, name: cleanShort(a) }}
              b={{ lat: b.lat, lng: b.lng, name: cleanShort(b) }}
            />
          </div>
          <p className={`${MONO_KICKER} text-slate-400 mt-3 text-center lg:text-left`}>
            {haversineKm(a.lat, a.lng, b.lat, b.lng).toFixed(1)} km apart · same Bangalore
          </p>
        </div>
      </section>

      {/* Picker row — full width below the hero */}
      <section className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
        <AreaPicker label="A" initialPincode={a.pincode} onPick={onPickA} highlightTone="amber" />
        <span
          className="hidden sm:inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-900 text-white text-xs font-bold tracking-[0.18em]"
          aria-hidden
        >
          VS
        </span>
        <AreaPicker label="B" initialPincode={b.pincode} onPick={onPickB} highlightTone="slate" />
      </section>

      {/* Verdict card — the screenshot artifact */}
      <VerdictCard a={a} b={b} verdict={verdict} shareUrl={shareUrl} pairSlug={pairSlug} />

      {/* Bento — three quick deltas */}
      <BentoStrip a={a} b={b} verdict={verdict} />

      {/* Tale of the Tape */}
      <Receipts a={a} b={b} dims={verdict.dims} />

      {/* CTA links */}
      <CtaRow a={a} b={b} />

      <CardStaggerStyle />
    </div>
  );
}

// ── Breadcrumb ─────────────────────────────────────────────────────────

function Breadcrumb({ a, b }: { a: IQv2; b: IQv2 }) {
  return (
    <nav
      className={`${MONO_KICKER} flex items-center justify-center lg:justify-start gap-2 text-slate-500 mb-6`}
      aria-label="Breadcrumb"
    >
      <Link href="/compare" className="hover:text-amber-700 transition-colors">
        Compare
      </Link>
      <span aria-hidden className="text-slate-400">/</span>
      <span className="text-slate-700">Bangalore</span>
      <span aria-hidden className="text-slate-400">/</span>
      <span className="text-slate-900 truncate max-w-[40ch]">
        {cleanShort(a)} vs {cleanShort(b)}
      </span>
    </nav>
  );
}

// ── Verdict card ───────────────────────────────────────────────────────

function VerdictCard({
  a,
  b,
  verdict,
  shareUrl,
  pairSlug,
}: {
  a: IQv2;
  b: IQv2;
  verdict: ReturnType<typeof computeVerdict>;
  shareUrl: string;
  pairSlug: string;
}) {
  const winnerSide = verdict.winnerSide;

  return (
    <section className="mt-12 sm:mt-16">
      <article
        className="bg-white rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.10)",
        }}
      >
        {/* Headline + share line */}
        <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6">
          <p className={`${MONO_KICKER} text-amber-700`}>The Verdict</p>
          <h2
            className="mt-3 text-3xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-slate-900 leading-[1.05]"
            style={{ textWrap: "balance" }}
          >
            {verdict.headline}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed italic max-w-2xl">
            {verdict.shareLine}
          </p>
          <div className="mt-5">
            <span className="inline-flex items-stretch overflow-hidden rounded-md text-xs font-semibold tracking-[0.12em] uppercase">
              <span className="w-[3px] bg-amber-500" />
              <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800">
                {verdict.audienceLine}
              </span>
            </span>
          </div>
        </div>

        {/* Score blocks: A, big VS, B */}
        <div className="px-6 sm:px-10 py-6 border-t border-gray-100 grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-8 items-center">
          <ScoreBlock area={a} side="a" winning={winnerSide === "a"} align="left" />
          <span
            className={`${MONO_KICKER} inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-900 text-amber-200`}
            aria-hidden
          >
            VS
          </span>
          <ScoreBlock area={b} side="b" winning={winnerSide === "b"} align="right" />
        </div>

        {/* Wordmark + URL footer + share */}
        <div className="px-6 sm:px-10 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-900">
            Area<span className="text-amber-600">IQ</span>
          </span>
          <span className={`${MONO_KICKER} text-slate-400 truncate hidden sm:inline-block`}>
            {shareUrl.replace(/^https?:\/\//, "")}
          </span>
          <ShareButton
            surface="compare"
            size="sm"
            variant="primary"
            label="Share"
            share={compareShareText({
              winner: verdict.winnerName,
              loser: verdict.loserName,
              trashTalk: verdict.shareLine,
              pairSlug,
            })}
            trackProps={{
              pincode_a: a.pincode,
              pincode_b: b.pincode,
              winner_pincode:
                verdict.winnerSide === "tie"
                  ? "tie"
                  : verdict.winnerSide === "a"
                    ? a.pincode
                    : b.pincode,
            }}
          />
        </div>
      </article>
    </section>
  );
}

function ScoreBlock({
  area,
  side,
  winning,
  align,
}: {
  area: IQv2;
  side: "a" | "b";
  winning: boolean;
  align: "left" | "right";
}) {
  const score = Math.round(area.scores.overall);
  const alignClass = align === "right" ? "text-right items-end" : "text-left items-start";
  return (
    <div className={`flex flex-col gap-2 ${alignClass} min-w-0`}>
      <div className={`flex ${align === "right" ? "justify-end" : "justify-start"} w-full`}>
        <BragChip brag={area.brag_label} size="sm" />
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-mono text-5xl sm:text-6xl font-extrabold tabular-nums leading-none ${
            winning ? "text-amber-600" : "text-slate-900"
          }`}
        >
          {score}
        </span>
        <span className={`${MONO_KICKER} text-slate-400`}>/100</span>
      </div>
      <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate w-full">
        {cleanShort(area)}
        <span className={`${MONO_KICKER} block text-slate-400 mt-0.5 normal-case tracking-wide font-medium`}>
          Side {side === "a" ? "A" : "B"} · {area.pincode}
        </span>
      </h3>
    </div>
  );
}

// ── Bento — three quick deltas ─────────────────────────────────────────

function BentoStrip({
  a,
  b,
  verdict,
}: {
  a: IQv2;
  b: IQv2;
  verdict: ReturnType<typeof computeVerdict>;
}) {
  const aName = cleanShort(a);
  const bName = cleanShort(b);

  // Lifestyle: F&B count delta + winner
  const fbA = a.counts.cafes + a.counts.restaurants;
  const fbB = b.counts.cafes + b.counts.restaurants;
  const fbWinner = fbA >= fbB ? aName : bName;
  const fbDelta = Math.abs(fbA - fbB);
  const fbWinnerCounts = fbA >= fbB ? a.counts : b.counts;

  // Rent
  const rentA = a.raw.rent_2bhk;
  const rentB = b.raw.rent_2bhk;
  const rentDelta =
    rentA != null && rentB != null ? Math.abs(rentA - rentB) : null;
  const rentCheaper =
    rentA != null && rentB != null ? (rentA < rentB ? aName : bName) : null;
  const aIsFallback = isFallbackMatch(a.raw.rent_match);
  const bIsFallback = isFallbackMatch(b.raw.rent_match);
  const bothFallback = aIsFallback && bIsFallback;
  const oneFallback = aIsFallback !== bIsFallback;

  // Air
  const aqiA = a.raw.aqi;
  const aqiB = b.raw.aqi;
  const aqiDelta =
    aqiA != null && aqiB != null ? Math.abs(aqiA - aqiB) : null;
  const aqiCleaner =
    aqiA != null && aqiB != null ? (aqiA < aqiB ? aName : bName) : null;

  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">The headlines</h2>
        <p className={`${MONO_KICKER} text-slate-400`}>Three biggest gaps</p>
      </div>
      <div
        className="card-stagger grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-5 sm:gap-6"
        style={{ ["--stagger" as string]: "80ms" }}
      >
        {/* Lifestyle gap — hero amber card */}
        <article
          className="stagger-item rounded-2xl p-6 sm:p-8 bg-amber-50 text-slate-900 flex flex-col"
          style={{
            ["--i" as string]: 0,
            boxShadow:
              "0 1px 2px rgba(217,119,6,0.06), 0 8px 24px -12px rgba(217,119,6,0.16)",
          }}
        >
          <span className={`${MONO_KICKER} text-amber-700`}>Lifestyle Gap</span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono text-5xl sm:text-6xl lg:text-7xl font-extrabold tabular-nums leading-[0.95] text-slate-900">
              +{fbDelta}
            </span>
            <span className={`${MONO_KICKER} text-amber-700`}>F&B POIs</span>
          </div>
          <h3 className="mt-3 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            {fbWinner} runs the strip.
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {fbWinnerCounts.cafes} cafés · {fbWinnerCounts.restaurants} restaurants · {fbWinnerCounts.parks} parks within the pincode.
          </p>
        </article>

        {/* Rent gap — dark slate card */}
        <article
          className="stagger-item rounded-2xl p-5 sm:p-6 bg-slate-900 text-white flex flex-col"
          style={{
            ["--i" as string]: 1,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.18), 0 12px 32px -12px rgba(15,23,42,0.30)",
          }}
        >
          <span className={`${MONO_KICKER} text-amber-300`}>Rent Gap</span>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-mono text-4xl sm:text-5xl font-extrabold tabular-nums leading-[0.95]">
              {bothFallback
                ? "—"
                : rentDelta != null
                  ? `₹${Math.round(rentDelta / 1000)}k`
                  : "—"}
            </span>
            <span className={`${MONO_KICKER} text-amber-200`}>/mo</span>
          </div>
          <h3 className="mt-3 text-base sm:text-lg font-bold tracking-tight">
            {bothFallback
              ? "Locality data unavailable."
              : rentCheaper
                ? `${rentCheaper} costs less.`
                : "No rent data."}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            {bothFallback ? (
              "Both pincodes fall back to the BLR city median (₹16k/mo)."
            ) : rentA != null && rentB != null ? (
              oneFallback ? (
                <>
                  {aIsFallback ? (
                    <em className="not-italic text-slate-400">
                      {aName} ₹{Math.round(rentA / 1000)}k (city median)
                    </em>
                  ) : (
                    <>{aName} ₹{Math.round(rentA / 1000)}k</>
                  )}
                  {" · "}
                  {bIsFallback ? (
                    <em className="not-italic text-slate-400">
                      {bName} ₹{Math.round(rentB / 1000)}k (city median)
                    </em>
                  ) : (
                    <>{bName} ₹{Math.round(rentB / 1000)}k</>
                  )}
                  {" (2BHK)."}
                </>
              ) : (
                `${aName} ₹${Math.round(rentA / 1000)}k · ${bName} ₹${Math.round(rentB / 1000)}k (2BHK).`
              )
            ) : (
              "99acres locality match unavailable."
            )}
          </p>
        </article>

        {/* Air gap — white card */}
        <article
          className="stagger-item rounded-2xl p-5 sm:p-6 bg-white text-slate-900 flex flex-col"
          style={{
            ["--i" as string]: 2,
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)",
          }}
        >
          <span className={`${MONO_KICKER} text-slate-500`}>Air Gap</span>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-mono text-4xl sm:text-5xl font-extrabold tabular-nums leading-[0.95]">
              {aqiDelta != null ? `${Math.round(aqiDelta)}` : "—"}
            </span>
            <span className={`${MONO_KICKER} text-slate-500`}>AQI</span>
          </div>
          <h3 className="mt-3 text-base sm:text-lg font-bold tracking-tight">
            {aqiCleaner ? `${aqiCleaner} breathes easier.` : "No AQI signal."}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {aqiA != null && aqiB != null
              ? `${aName} AQI ${Math.round(aqiA)} · ${bName} AQI ${Math.round(aqiB)} (IDW-blended).`
              : "CPCB stations out of range."}
          </p>
        </article>
      </div>
    </section>
  );
}

// ── Tale of the Tape ───────────────────────────────────────────────────

function Receipts({ a, b, dims }: { a: IQv2; b: IQv2; dims: DimRow[] }) {
  const aName = cleanShort(a);
  const bName = cleanShort(b);
  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tale of the Tape</h2>
        <p className={`${MONO_KICKER} text-slate-400`}>Six dimensions, side by side</p>
      </div>
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.10)",
        }}
      >
        <div className={`hidden sm:grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] px-5 py-3 border-b border-gray-100 ${MONO_KICKER} text-slate-400`}>
          <span>Dimension</span>
          <span className="text-right">{aName}</span>
          <span className="text-right">{bName}</span>
        </div>
        {dims.map((d, i) => (
          <ReceiptRow key={d.key} d={d} a={a} b={b} idx={i} />
        ))}
      </div>
    </section>
  );
}

function ReceiptRow({ d, a, b, idx }: { d: DimRow; a: IQv2; b: IQv2; idx: number }) {
  const pctA = a.percentile_blr[d.key] ?? 50;
  const pctB = b.percentile_blr[d.key] ?? 50;
  const softA =
    d.key === "affordability" && isFallbackMatch(a.raw.rent_match)
      ? "(city median)"
      : undefined;
  const softB =
    d.key === "affordability" && isFallbackMatch(b.raw.rent_match)
      ? "(city median)"
      : undefined;
  return (
    <div
      className="px-5 py-5 grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 sm:gap-6 items-start sm:items-center border-b border-gray-100 last:border-0"
      style={{ ["--i" as string]: idx }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{d.label}</p>
        <p className="mt-1 text-xs text-slate-500 leading-snug">{d.description}</p>
      </div>
      <DimSide value={d.a} pct={pctA} winner={d.winner === "a"} softLabel={softA} />
      <DimSide value={d.b} pct={pctB} winner={d.winner === "b"} softLabel={softB} />
    </div>
  );
}

function DimSide({
  value,
  pct,
  winner,
  softLabel,
}: {
  value: number;
  pct: number;
  winner: boolean;
  softLabel?: string;
}) {
  const v = Math.round(value);
  const valueColor = winner ? "text-amber-600" : "text-slate-900";
  const barColor = winner ? "bg-amber-500" : "bg-slate-300";
  const topPct = Math.max(1, Math.round(100 - pct));
  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <div className="flex items-baseline gap-2 sm:flex-row-reverse">
        <span className={`${MONO_KICKER} text-slate-400 normal-case tracking-[0.12em] font-medium`}>
          Top {topPct}% in BLR
        </span>
        <span className={`font-mono text-2xl sm:text-3xl font-extrabold tabular-nums ${valueColor}`}>
          {v}
        </span>
      </div>
      <div className="w-full sm:w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(2, v)}%` }} />
      </div>
      {softLabel ? (
        <span className="text-slate-400 normal-case tracking-[0.12em] font-medium text-[10px]">
          {softLabel}
        </span>
      ) : null}
    </div>
  );
}

// ── CTA row ────────────────────────────────────────────────────────────

function CtaRow({ a, b }: { a: IQv2; b: IQv2 }) {
  return (
    <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[a, b].map((area) => (
        <Link
          key={area.pincode}
          href={`/insights/${area.pincode}`}
          className="group flex items-center justify-between gap-2 px-5 py-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition-colors"
        >
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-800 truncate">
              Read the {cleanShort(area)} report
            </span>
            <span className={`${MONO_KICKER} text-slate-400 normal-case tracking-[0.14em] font-medium`}>
              /insights/{area.pincode}
            </span>
          </span>
          <span className="text-amber-600 group-hover:translate-x-0.5 transition-transform" aria-hidden>
            →
          </span>
        </Link>
      ))}
    </section>
  );
}

// ── helpers ────────────────────────────────────────────────────────────

function cleanShort(d: IQv2): string {
  return displayName(d.pincode, d.name).replace(/\s*\(Bangalore\)\s*$/i, "");
}

function isFallbackMatch(match: string | null | undefined): boolean {
  return match === "city" || match === "city_inferred";
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
