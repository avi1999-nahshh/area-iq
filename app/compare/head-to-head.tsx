"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Instrument_Serif, Spectral, Jost, JetBrains_Mono } from "next/font/google";
import { computeVerdict, type AreaLite, type Verdict } from "./verdict";

// Fonts — match civic-brief.tsx exactly
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const serif = Spectral({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"] });
const ui = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

// Dynamically load MiniMap to avoid SSR hydration issues with Leaflet
const MiniMap = dynamic(
  () => import("./mini-map").then((m) => m.MiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full" style={{ minHeight: 200, background: "var(--paper-2)" }} />
    ),
  },
);

// ─── types ────────────────────────────────────────────────────────────────────

type AreaData = AreaLite & {
  pincode: AreaLite["pincode"] & { lat?: number; lng?: number };
  infrastructure?:
    | (NonNullable<AreaLite["infrastructure"]> & {
        pharmacy_count?: number | null;
        park_count?: number | null;
      })
    | null;
  trivia?: { facts?: string[] } | null;
};

interface Props {
  a: AreaData;
  b: AreaData;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function grade(overall: number): string {
  if (overall >= 90) return "A+";
  if (overall >= 82) return "A";
  if (overall >= 75) return "A-";
  if (overall >= 70) return "B+";
  if (overall >= 65) return "B";
  if (overall >= 60) return "B-";
  if (overall >= 55) return "C+";
  if (overall >= 50) return "C";
  if (overall >= 45) return "D+";
  if (overall >= 40) return "D";
  return "F";
}

function scoreColor(score: number) {
  if (score >= 70) return "var(--ochre)";
  if (score >= 45) return "var(--ink)";
  return "var(--alarm)";
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SideHeader({ area, label }: { area: AreaData; label: string }) {
  const overallRaw = area.scores?.overall_score ?? 0;
  const overall = Math.round(overallRaw);
  const g = area.scores ? grade(overallRaw) : "—";
  return (
    <div>
      <p
        className={mono.className}
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--muted)",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        <span style={{ color: "var(--ochre)" }}>{label}</span>{" "}
        · {area.pincode.pincode}
      </p>
      <p
        className={display.className}
        style={{
          fontSize: "clamp(1.75rem, 4.5vw, 2.5rem)",
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "var(--ink)",
          marginBottom: 6,
        }}
      >
        {area.pincode.name}
      </p>
      <p
        className={mono.className}
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 14,
        }}
      >
        {area.pincode.district} · {area.pincode.state}
      </p>
      <div className="flex items-baseline gap-3">
        <span
          className={display.className}
          style={{
            fontSize: "3.25rem",
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            color: scoreColor(overall),
          }}
        >
          {g}
        </span>
        <span>
          <span
            className={display.className}
            style={{
              fontSize: "1.5rem",
              fontStyle: "italic",
              color: "var(--muted)",
              lineHeight: 1,
            }}
          >
            {overall}
          </span>
          <span
            className={mono.className}
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginLeft: 6,
            }}
          >
            / 100
          </span>
        </span>
      </div>
    </div>
  );
}

function SectionEyebrow({ section, title, right }: { section: string; title: string; right?: React.ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-baseline justify-between gap-2 mb-4"
      style={{
        fontSize: 10,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "var(--muted)",
        fontWeight: 600,
      }}
    >
      <span className={mono.className}>
        <span style={{ color: "var(--ochre)", marginRight: 10 }}>{section}</span> {title}
      </span>
      {right ? <span className={mono.className}>{right}</span> : null}
    </div>
  );
}

function DimRow({
  dim,
  nameA,
  nameB,
}: {
  dim: Verdict["dimDeltas"][number];
  nameA: string;
  nameB: string;
}) {
  const aWin = dim.winner === "a";
  const bWin = dim.winner === "b";
  const colA = aWin ? "var(--ochre)" : scoreColor(dim.a) === "var(--alarm)" ? "var(--alarm)" : "var(--ink)";
  const colB = bWin ? "var(--ochre)" : scoreColor(dim.b) === "var(--alarm)" ? "var(--alarm)" : "var(--ink)";
  return (
    <div
      className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-5 items-center py-4"
      style={{ borderBottom: "1px dotted var(--rule)" }}
    >
      {/* A side — bar grows right-to-left */}
      <div className="flex items-center gap-3 justify-end min-w-0">
        <div
          className="hidden sm:block"
          style={{ flex: 1, height: 3, background: "var(--rule)", position: "relative" }}
        >
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: `${dim.a}%`,
              height: "100%",
              background: colA,
            }}
          />
        </div>
        <span
          className={display.className}
          style={{
            fontSize: "2.25rem",
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: colA,
            fontVariantNumeric: "tabular-nums",
            minWidth: "2.4ch",
            textAlign: "right",
          }}
        >
          {dim.a}
        </span>
      </div>

      {/* Center label */}
      <div className="text-center">
        <p
          className={mono.className}
          style={{
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--ink)",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {dim.label}
        </p>
        <p
          className={mono.className}
          style={{
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginTop: 4,
          }}
        >
          {dim.winner === "tie"
            ? "tie"
            : dim.winner === "a"
              ? `${nameA.split(" ")[0]} +${Math.abs(dim.a - dim.b)}`
              : `${nameB.split(" ")[0]} +${Math.abs(dim.a - dim.b)}`}
        </p>
      </div>

      {/* B side — bar grows left-to-right */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={display.className}
          style={{
            fontSize: "2.25rem",
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: colB,
            fontVariantNumeric: "tabular-nums",
            minWidth: "2.4ch",
          }}
        >
          {dim.b}
        </span>
        <div
          className="hidden sm:block"
          style={{ flex: 1, height: 3, background: "var(--rule)", position: "relative" }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${dim.b}%`,
              height: "100%",
              background: colB,
            }}
          />
        </div>
      </div>
    </div>
  );
}

type NumRow = {
  label: string;
  a: string | null;
  b: string | null;
  // -1 = lower is better; +1 = higher is better
  direction: 1 | -1;
  // raw numbers used purely for comparison (null skips highlighting)
  rawA: number | null;
  rawB: number | null;
};

function NumberTable({ rows, nameA, nameB }: { rows: NumRow[]; nameA: string; nameB: string }) {
  return (
    <div>
      {/* Header */}
      <div
        className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-5 pb-3"
        style={{ borderBottom: "1px solid var(--ink)" }}
      >
        <p
          className={mono.className}
          style={{
            fontSize: 10,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--muted)",
            fontWeight: 600,
            textAlign: "right",
          }}
        >
          {nameA}
        </p>
        <p
          className={mono.className}
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--ink)",
            fontWeight: 700,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          metric
        </p>
        <p
          className={mono.className}
          style={{
            fontSize: 10,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--muted)",
            fontWeight: 600,
          }}
        >
          {nameB}
        </p>
      </div>
      {rows.map((row) => {
        let aWin = false;
        let bWin = false;
        if (row.rawA != null && row.rawB != null && row.rawA !== row.rawB) {
          if (row.direction === 1) {
            aWin = row.rawA > row.rawB;
            bWin = row.rawB > row.rawA;
          } else {
            aWin = row.rawA < row.rawB;
            bWin = row.rawB < row.rawA;
          }
        }
        return (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-5 items-baseline py-3.5"
            style={{ borderBottom: "1px dotted var(--rule)" }}
          >
            <span
              className={display.className}
              style={{
                fontSize: "1.375rem",
                fontStyle: "italic",
                fontWeight: 400,
                lineHeight: 1,
                color: aWin ? "var(--ochre)" : "var(--ink)",
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.a ?? "—"}
            </span>
            <span
              className={mono.className}
              style={{
                fontSize: 10,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "var(--muted)",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {row.label}
            </span>
            <span
              className={display.className}
              style={{
                fontSize: "1.375rem",
                fontStyle: "italic",
                fontWeight: 400,
                lineHeight: 1,
                color: bWin ? "var(--ochre)" : "var(--ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.b ?? "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MapPanel({
  area,
  figLabel,
  amenities,
}: {
  area: AreaData;
  figLabel: string;
  amenities: { label: string; value: number }[];
}) {
  const lat = area.pincode.lat ?? 20.5937;
  const lng = area.pincode.lng ?? 78.9629;
  return (
    <div style={{ border: "1px solid var(--ink)", background: "var(--paper-2)" }}>
      <div
        style={{
          position: "relative",
          height: "clamp(220px, 38vw, 320px)",
          borderBottom: "1px solid var(--ink)",
        }}
      >
        <MiniMap lat={lat} lng={lng} name={area.pincode.name} pincode={area.pincode.pincode} />
        <div
          className={mono.className}
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "var(--ink)",
            color: "var(--paper)",
            padding: "5px 9px",
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 600,
            zIndex: 400,
            maxWidth: "calc(100% - 20px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {figLabel} · {area.pincode.name}
        </div>
      </div>
      <div className="px-4 py-3 sm:px-5 sm:py-4">
        <p
          className={mono.className}
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--muted)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Within the pincode
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {amenities.map((a) => (
            <div key={a.label} className="flex items-baseline gap-1.5">
              <span
                className={display.className}
                style={{
                  fontSize: "1.125rem",
                  fontStyle: "italic",
                  color: "var(--ink)",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {a.value}
              </span>
              <span
                className={serif.className}
                style={{
                  fontSize: 12,
                  fontStyle: "italic",
                  color: "var(--muted)",
                }}
              >
                {a.label}
              </span>
            </div>
          ))}
        </div>
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

  // Concrete number rows
  const aqiA = a.airQuality?.aqi ?? null;
  const aqiB = b.airQuality?.aqi ?? null;
  const crimeA = a.safety?.crime_rate_per_lakh ?? null;
  const crimeB = b.safety?.crime_rate_per_lakh ?? null;
  const rentA = a.property?.city_rent_median_2bhk ?? null;
  const rentB = b.property?.city_rent_median_2bhk ?? null;
  const metroA = a.transit?.nearest_metro_km ?? null;
  const metroB = b.transit?.nearest_metro_km ?? null;
  const cafeA = a.infrastructure?.cafe_count ?? null;
  const cafeB = b.infrastructure?.cafe_count ?? null;
  const restA = a.infrastructure?.restaurant_count ?? null;
  const restB = b.infrastructure?.restaurant_count ?? null;

  const numberRows: NumRow[] = ([
    {
      label: "rent · 2bhk",
      a: rentA != null ? `₹${Math.round(rentA / 1000)}k` : null,
      b: rentB != null ? `₹${Math.round(rentB / 1000)}k` : null,
      direction: -1 as const,
      rawA: rentA,
      rawB: rentB,
    },
    {
      label: "aqi",
      a: aqiA != null ? `${aqiA}` : null,
      b: aqiB != null ? `${aqiB}` : null,
      direction: -1 as const,
      rawA: aqiA,
      rawB: aqiB,
    },
    {
      label: "crime / lakh",
      a: crimeA != null ? `${Math.round(crimeA).toLocaleString()}` : null,
      b: crimeB != null ? `${Math.round(crimeB).toLocaleString()}` : null,
      direction: -1 as const,
      rawA: crimeA,
      rawB: crimeB,
    },
    {
      label: "metro distance",
      a: metroA != null ? `${metroA.toFixed(1)} km` : null,
      b: metroB != null ? `${metroB.toFixed(1)} km` : null,
      direction: -1 as const,
      rawA: metroA,
      rawB: metroB,
    },
    {
      label: "cafés",
      a: cafeA != null ? `${cafeA}` : null,
      b: cafeB != null ? `${cafeB}` : null,
      direction: 1 as const,
      rawA: cafeA,
      rawB: cafeB,
    },
    {
      label: "restaurants",
      a: restA != null ? `${restA}` : null,
      b: restB != null ? `${restB}` : null,
      direction: 1 as const,
      rawA: restA,
      rawB: restB,
    },
  ] satisfies NumRow[]).filter((r) => r.a != null || r.b != null);

  const amenitiesA = [
    { label: "cafés", value: a.infrastructure?.cafe_count ?? 0 },
    { label: "restaurants", value: a.infrastructure?.restaurant_count ?? 0 },
    { label: "pharmacies", value: a.infrastructure?.pharmacy_count ?? 0 },
    { label: "parks", value: a.infrastructure?.park_count ?? 0 },
  ];
  const amenitiesB = [
    { label: "cafés", value: b.infrastructure?.cafe_count ?? 0 },
    { label: "restaurants", value: b.infrastructure?.restaurant_count ?? 0 },
    { label: "pharmacies", value: b.infrastructure?.pharmacy_count ?? 0 },
    { label: "parks", value: b.infrastructure?.park_count ?? 0 },
  ];

  // Headline: split it visually so the winner name picks up ochre italic
  const headline = verdict.headline;
  const winnerName = verdict.winner.pincode.name;
  let headlineNode: React.ReactNode = headline;
  if (!verdict.tie && headline.startsWith(winnerName)) {
    const rest = headline.slice(winnerName.length);
    headlineNode = (
      <>
        <span style={{ fontStyle: "italic", color: "var(--ochre)" }}>{winnerName}</span>
        {rest}
      </>
    );
  } else if (verdict.tie) {
    // "X vs Y: dead heat."
    headlineNode = (
      <>
        {a.pincode.name} <span style={{ fontStyle: "italic", color: "var(--muted)" }}>vs</span>{" "}
        {b.pincode.name}: <span style={{ fontStyle: "italic", color: "var(--ochre)" }}>dead heat.</span>
      </>
    );
  }

  // Right-side eyebrow context: shared state, else "two states"
  const sharedState = a.pincode.state === b.pincode.state ? a.pincode.state : "Two states";

  return (
    <div
      className={ui.className}
      style={{
        minHeight: "100dvh",
        background: "var(--paper)",
        color: "var(--ink)",
        position: "relative",
        ["--paper" as string]: "#FAF6EE",
        ["--paper-2" as string]: "#F0E9D6",
        ["--rule" as string]: "#D9D1B8",
        ["--ink" as string]: "#1A2633",
        ["--muted" as string]: "#706B5D",
        ["--ochre" as string]: "#C88A1F",
        ["--ochre-dark" as string]: "#8B5E12",
        ["--alarm" as string]: "#B84B3A",
      } as React.CSSProperties}
    >
      {/* paper-noise overlay (lifted from civic-brief reference convention) */}
      <svg
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0.06,
          mixBlendMode: "multiply",
          zIndex: 1,
        }}
      >
        <filter id="ht-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ht-noise)" />
      </svg>

      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 md:px-12 pt-6 sm:pt-8 pb-20 sm:pb-24" style={{ position: "relative", zIndex: 2 }}>

        {/* ── classification ribbon ── */}
        <div
          className={`${mono.className} flex flex-wrap items-stretch`}
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span
            className="shrink-0"
            style={{ padding: "10px 14px", background: "var(--ochre)", color: "var(--ink)" }}
          >
            Battle · #{a.pincode.pincode} × #{b.pincode.pincode}
          </span>
          <span
            className="flex-1 min-w-0"
            style={{
              padding: "10px 14px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Head-to-Head · <span style={{ color: "var(--ochre)" }}>{a.pincode.district}</span> vs{" "}
            <span style={{ color: "var(--ochre)" }}>{b.pincode.district}</span>
          </span>
          <span
            className="hidden sm:inline shrink-0"
            style={{ padding: "10px 14px", opacity: 0.65 }}
          >
            AreaIQ Civic Brief · Compare
          </span>
        </div>

        {/* ── masthead ── */}
        <div
          className="flex items-baseline justify-between pt-5 pb-5 mb-12 md:mb-16"
          style={{
            borderBottom: "1px solid var(--rule)",
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          <span className={mono.className}>
            <a href="/" style={{ color: "var(--muted)" }}>AreaIQ</a>{" "}
            <span
              className={display.className}
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
                fontSize: 15,
                color: "var(--ink)",
              }}
            >
              Compare
            </span>
          </span>
          <span className={`${mono.className} hidden sm:inline`}>
            {sharedState} · Volume II · Head-to-Head
          </span>
        </div>

        {/* ── hero verdict block ── */}
        <header className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 md:gap-12 items-start mb-14 md:mb-20">
          <div>
            <div
              className="mb-5 flex items-center gap-4"
              style={{
                fontSize: 10,
                letterSpacing: "0.4em",
                color: "var(--muted)",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "inline-block", width: 32, height: 1, background: "var(--ochre)" }} />
              <span className={mono.className}>Head-to-Head · {sharedState}</span>
            </div>

            <p
              className={serif.className}
              style={{
                fontStyle: "italic",
                fontSize: "1.25rem",
                color: "var(--muted)",
                marginBottom: "0.5rem",
                fontWeight: 400,
              }}
            >
              The verdict is in.
            </p>

            <h1
              className={display.className}
              style={{
                fontSize: "clamp(2.25rem, 7.5vw, 5.5rem)",
                lineHeight: 0.95,
                fontWeight: 400,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
                marginBottom: "1.5rem",
              }}
            >
              {headlineNode}
            </h1>

            <p
              className={serif.className}
              style={{
                fontSize: "1.375rem",
                lineHeight: 1.5,
                color: "var(--ink)",
                fontWeight: 400,
                fontStyle: "italic",
                maxWidth: 620,
                marginBottom: "1.5rem",
              }}
            >
              {verdict.trashTalk}
            </p>

            <p
              className={mono.className}
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                color: "var(--muted)",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              #{a.pincode.pincode} · {a.pincode.name}{" "}
              <span style={{ color: "var(--ochre)" }}>×</span>{" "}
              #{b.pincode.pincode} · {b.pincode.name}
            </p>
          </div>

          {/* Vs panel */}
          <aside
            style={{
              border: "1px solid var(--ink)",
              background: "var(--paper-2)",
              padding: "1.5rem",
              position: "relative",
            }}
          >
            <div
              className={mono.className}
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "6px 12px",
                fontSize: 10,
                letterSpacing: "0.24em",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Scorecard
            </div>
            <div className="mt-3">
              <SideHeader area={a} label="Side A" />
            </div>
            <div
              className="my-5 flex items-center gap-3"
              style={{
                fontSize: 10,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
              <span
                className={display.className}
                style={{
                  fontSize: "1.125rem",
                  fontStyle: "italic",
                  color: "var(--ochre)",
                  letterSpacing: 0,
                  textTransform: "lowercase",
                }}
              >
                versus
              </span>
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
            </div>
            <SideHeader area={b} label="Side B" />
            {!verdict.tie ? (
              <div
                className={mono.className}
                style={{
                  marginTop: "1.5rem",
                  padding: "0.75rem 0.875rem",
                  background: "var(--ochre)",
                  color: "var(--ink)",
                  fontSize: 10,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {verdict.winner.pincode.name} · +{verdict.overallDelta} pts
              </div>
            ) : (
              <div
                className={mono.className}
                style={{
                  marginTop: "1.5rem",
                  padding: "0.75rem 0.875rem",
                  background: "var(--ink)",
                  color: "var(--paper)",
                  fontSize: 10,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Dead heat · pick by feel
              </div>
            )}
          </aside>
        </header>

        {/* ── § I The Battlefield ── */}
        <section className="mb-14 md:mb-20">
          <SectionEyebrow
            section="§ I"
            title="The Battlefield"
            right={<span className="hidden sm:inline">r. 1.5km · per side</span>}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <MapPanel area={a} figLabel="Fig. 1A" amenities={amenitiesA} />
            <MapPanel area={b} figLabel="Fig. 1B" amenities={amenitiesB} />
          </div>
        </section>

        {/* ── § II Six Dimensions · Head-to-Head ── */}
        <section
          className="mb-14 md:mb-20"
          style={{
            borderTop: "1px solid var(--ink)",
            borderBottom: "1px solid var(--ink)",
            padding: "1.5rem 0",
          }}
        >
          <SectionEyebrow
            section="§ II"
            title="Five Dimensions · Head-to-Head"
            right={
              <span className="hidden sm:inline">
                {verdict.tie
                  ? "split decision"
                  : `${verdict.dimWins.winner}-${verdict.dimWins.loser} on dims`}
              </span>
            }
          />
          <div>
            {verdict.dimDeltas.map((dim) => (
              <DimRow key={dim.key} dim={dim} nameA={a.pincode.name} nameB={b.pincode.name} />
            ))}
          </div>
        </section>

        {/* ── § III Concrete numbers ── */}
        {numberRows.length > 0 && (
          <section className="mb-14 md:mb-20">
            <SectionEyebrow
              section="§ III"
              title="The Receipts"
              right={<span className="hidden sm:inline">cited figures</span>}
            />
            <NumberTable rows={numberRows} nameA={a.pincode.name} nameB={b.pincode.name} />
          </section>
        )}

        {/* ── § IV Verdict ── */}
        <section className="mb-12 md:mb-16">
          <SectionEyebrow section="§ IV" title="The Verdict" />
          <div
            style={{
              border: "1px solid var(--ink)",
              background: "var(--paper-2)",
              padding: "1.5rem 1.5rem 1.75rem",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-start">
              {/* Big ratio */}
              <div>
                <p
                  className={mono.className}
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Dimensions won
                </p>
                <p
                  className={display.className}
                  style={{
                    fontSize: "clamp(3.5rem, 8vw, 5.5rem)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    color: verdict.tie ? "var(--muted)" : "var(--ochre)",
                  }}
                >
                  {verdict.dimWins.winner}
                  <span style={{ color: "var(--muted)", fontSize: "0.55em" }}>
                    {" / "}
                    {verdict.dimWins.total}
                  </span>
                </p>
                <p
                  className={mono.className}
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--ink)",
                  }}
                >
                  {verdict.tie ? a.pincode.name + " · " + b.pincode.name : verdict.winner.pincode.name}
                </p>
              </div>

              {/* Right column */}
              <div>
                <p
                  className={serif.className}
                  style={{
                    fontStyle: "italic",
                    fontSize: "1.25rem",
                    lineHeight: 1.5,
                    color: "var(--ink)",
                    marginBottom: "1rem",
                    fontWeight: 400,
                  }}
                >
                  {verdict.audienceLine}
                </p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {!verdict.tie && (
                    <span
                      className={mono.className}
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.24em",
                        textTransform: "uppercase",
                        background: "var(--ink)",
                        color: "var(--paper)",
                        padding: "6px 10px",
                        fontWeight: 600,
                      }}
                    >
                      +{verdict.overallDelta} overall
                    </span>
                  )}
                  <span
                    className={mono.className}
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      background: "var(--ochre)",
                      color: "var(--ink)",
                      padding: "6px 10px",
                      fontWeight: 700,
                    }}
                  >
                    {verdict.audience}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleShare}
                    className={mono.className}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 40,
                      padding: "10px 14px",
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      background: copied ? "var(--ochre)" : "var(--ink)",
                      color: copied ? "var(--ink)" : "var(--paper)",
                      border: "1px solid var(--ink)",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Link copied
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        Share this battle
                      </>
                    )}
                  </button>
                  <a
                    href={`/insights/${a.pincode.pincode}`}
                    className={mono.className}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      minHeight: 40,
                      padding: "10px 14px",
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      background: "var(--paper)",
                      color: "var(--ink)",
                      border: "1px solid var(--ink)",
                    }}
                  >
                    {a.pincode.name} brief →
                  </a>
                  <a
                    href={`/insights/${b.pincode.pincode}`}
                    className={mono.className}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      minHeight: 40,
                      padding: "10px 14px",
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      background: "var(--paper)",
                      color: "var(--ink)",
                      border: "1px solid var(--ink)",
                    }}
                  >
                    {b.pincode.name} brief →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── colophon ── */}
        <footer
          style={{
            marginTop: "4rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--rule)",
            fontSize: 10,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
          className={`${mono.className} flex flex-wrap justify-between gap-y-2 gap-x-4`}
        >
          <span className="min-w-0">
            <span className="hidden sm:inline">Methodology · </span>
            Census · CPCB · NCRB · OSM · Swachh · MyNeta
          </span>
          <span className="shrink-0">
            Battle · #{a.pincode.pincode} × #{b.pincode.pincode}
          </span>
        </footer>
      </div>
    </div>
  );
}
