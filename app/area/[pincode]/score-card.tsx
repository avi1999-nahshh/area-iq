"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Lazy-load map to avoid SSR issues with Leaflet
const MapPreview = dynamic(
  () => import("./map-preview").then((m) => m.MapPreview),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="skeleton-shimmer w-full h-full rounded-xl" style={{ minHeight: "420px" }} />
  );
}

/* ─── Data types ─────────────────────────────────────── */

type AreaData = {
  pincode: {
    pincode: string;
    name: string;
    district: string;
    state: string;
    lat?: number;
    lng?: number;
    area_sq_km?: number;
    metro_city?: string;
  };
  census?: {
    population?: number;
    literacy_rate?: number;
    commute_under_30_pct?: number;
    gender_ratio?: number;
  } | null;
  airQuality?: {
    aqi?: number;
    pm25?: number;
    pm10?: number;
    station_name?: string;
    station_distance_km?: number;
  } | null;
  safety?: {
    crime_rate_per_lakh?: number;
    nearest_police_station_name?: string;
    murder_rate?: number;
    theft_rate?: number;
    crimes_against_women_rate?: number;
    nearest_police_station_km?: number;
  } | null;
  infrastructure?: {
    hospital_count?: number;
    mall_count?: number;
    park_count?: number;
    bus_stop_count?: number;
    five_minute_city_score?: number;
    school_count?: number;
    cafe_count?: number;
    restaurant_count?: number;
  } | null;
  transit?: {
    nearest_railway_name?: string;
    nearest_metro_name?: string;
    nearest_metro_km?: number;
    nearest_major_railway_name?: string;
  } | null;
  cleanliness?: {
    ss_score?: number;
    ss_rank?: number;
    ss_source?: string;
  } | null;
  property?: {
    hpi_value?: number;
    city_rent_median_2bhk?: number;
    rent_matched_locality?: string;
    rent_match_level?: string;
  } | null;
  contacts?: {
    ls_constituency?: string;
    ls_mp_name?: string;
    ls_mp_party?: string;
    vs_constituency?: string;
  } | null;
  scores?: {
    air_quality_score?: number;
    air_national_pct?: number;
    safety_score?: number;
    safety_national_pct?: number;
    infrastructure_score?: number;
    infrastructure_national_pct?: number;
    transit_score?: number;
    transit_national_pct?: number;
    cleanliness_score?: number;
    cleanliness_national_pct?: number;
    property_score?: number;
    property_national_pct?: number;
    overall_score?: number;
    overall_national_pct?: number;
    national_rank?: number;
    national_total?: number;
    overall_state_pct?: number;
    state_rank?: number;
    state_total?: number;
    overall_district_pct?: number;
    district_rank?: number;
    district_total?: number;
    overall_metro_pct?: number;
    metro_rank?: number;
    metro_total?: number;
    tier?: string;
    archetype_id?: string;
    archetype_name?: string;
    archetype_tagline?: string;
    archetype_emoji?: string;
    gender_equality_index?: number;
    hidden_gem_index?: number;
    // optional future fields
    superlative_label?: string;
    superlative_scope?: string;
  } | null;
  archetype?: {
    name?: string;
    tagline?: string;
    emoji?: string;
    description?: string;
    pincode_count?: number;
  } | null;
  trivia?: {
    facts?: string[];
    district?: string;
    state?: string;
    narrative?: string;
  } | null;
};

interface Props {
  data: AreaData;
}

/* ─── Helpers ─────────────────────────────────────────── */

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n.toLocaleString() + (s[(v - 20) % 10] || s[v] || s[0]);
}

type DimKey =
  | "air"
  | "safety"
  | "infrastructure"
  | "transit"
  | "cleanliness"
  | "property";

function describeDimension(dim: DimKey, score: number): string {
  const s = Math.round(score);

  const descriptions: Record<DimKey, { low: string; mid: string; high: string }> = {
    air: {
      low: "Unhealthy most of the year — avoid morning walks without a mask. Pollution peaks in winter months.",
      mid: "Moderate AQI. Tree-lined avenues help mitigate dust and local traffic. Check daily readings before outdoor exercise.",
      high: "Consistently clean air. Green cover and low vehicular density keep pollution well in check year-round.",
    },
    safety: {
      low: "Crime rates run higher than most comparable areas. Heightened awareness advised, especially after dark.",
      mid: "Generally safe for daily life. Petty theft is the primary concern — keep valuables secure in crowded spots.",
      high: "One of the safer pockets around. Low crime rates and a visible police presence make this a reassuring place to live.",
    },
    infrastructure: {
      low: "Essentials are sparse — plan longer trips for hospitals, markets, and schools. Largely underserved.",
      mid: "Core amenities are covered within a short commute. Parks and schools exist, but options are limited.",
      high: "Well-served neighbourhood. Hospitals, schools, parks, and markets are all within easy reach.",
    },
    transit: {
      low: "Public transport options are thin. A personal vehicle is almost a necessity here.",
      mid: "Adequate bus connectivity with railway access nearby. Metro availability varies by sub-locality.",
      high: "Excellent transit links — metro, rail, and bus networks make car-free living genuinely possible.",
    },
    cleanliness: {
      low: "Waste management and sanitation lag noticeably. Swachh Survekshan scores reflect ongoing challenges.",
      mid: "Decent cleanliness overall. Street-level maintenance is inconsistent but improving in recent surveys.",
      high: "High Swachh Survekshan performance. Waste management and public sanitation are above the national average.",
    },
    property: {
      low: "Rents are accessible — one of the more affordable pockets in the city. Good for early-career movers.",
      mid: "Mid-market pricing. Rent reflects the area's amenities without the premium of top-tier localities.",
      high: "Premium rent territory. Prices reflect strong demand, good connectivity, and established social infrastructure.",
    },
  };

  const entry = descriptions[dim];
  if (s >= 70) return entry.high;
  if (s >= 45) return entry.mid;
  return entry.low;
}

/* ─── Sub-components ─────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase text-slate-400"
      style={{ letterSpacing: "0.18em" }}
    >
      {children}
    </p>
  );
}

function ScoreBar({ score, className = "" }: { score: number; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`h-1.5 rounded-full bg-slate-100 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full"
        style={{
          width: mounted ? `${Math.round(score)}%` : "0%",
          background: "#F5C518",
          transition: "width 1.1s cubic-bezier(0.16,1,0.3,1) 200ms",
        }}
      />
    </div>
  );
}

function DimensionCard({
  label,
  score,
  description,
  delay = 0,
}: {
  label: string;
  score: number;
  description: string;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl p-5 border border-slate-100 bg-white flex flex-col gap-3 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <SectionLabel>{label}</SectionLabel>
      <div className="flex items-baseline gap-2">
        <span
          className="text-5xl font-bold tabular-nums tracking-tight leading-none"
          style={{ color: "#0A0A0A", fontVariantNumeric: "tabular-nums" }}
        >
          {Math.round(score)}
        </span>
        <span className="text-sm text-slate-400 font-medium">/100</span>
      </div>
      <ScoreBar score={score} />
      <p className="text-[13px] text-slate-600 leading-snug">{description}</p>
    </div>
  );
}

function DimensionRow({
  label,
  score,
  delay,
}: {
  label: string;
  score: number;
  delay: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const v = Math.round(score);
  const barColor =
    v >= 70 ? "#F5C518" : v >= 50 ? "#94a3b8" : "#f87171";

  return (
    <div className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-5 py-4 border-t border-slate-100 first:border-t-0">
      <span className="text-[11px] tracking-[0.14em] uppercase text-slate-400 font-semibold tabular-nums w-28">
        {label}
      </span>
      <div className="h-px bg-slate-100 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: mounted ? `${v}%` : "0%",
            background: barColor,
            transition: `width 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
          }}
        />
      </div>
      <span
        className="text-4xl font-bold tracking-tighter tabular-nums leading-none"
        style={{ color: "#0A0A0A" }}
      >
        {v}
      </span>
    </div>
  );
}

function RankCol({
  label,
  rank,
  total,
  hint,
}: {
  label: string;
  rank: string;
  total: number;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-slate-400 mb-1">
        {label}
      </p>
      <p
        className="text-2xl font-bold tracking-tighter tabular-nums leading-none"
        style={{ color: "#0A0A0A" }}
      >
        {rank}
      </p>
      <p className="text-xs text-slate-400 mt-1 tabular-nums">
        of {total.toLocaleString()}
        {hint ? ` · ${hint}` : ""}
      </p>
    </div>
  );
}

/* ─── Mini histogram bars (5 bars) ──────────────────── */
function MiniHistogram({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(v / max) * 100}%`,
            minHeight: "4px",
            background: i === values.length - 1 ? "#F5C518" : "#e2e8f0",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Overall Score Badge ─────────────────────────────── */
function OverallBadge({
  score,
  betterThanPct,
  tier,
  archetypeName,
  archetypeEmoji,
}: {
  score: number;
  betterThanPct: number;
  tier?: string;
  archetypeName?: string;
  archetypeEmoji?: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-slate-100"
      style={{ background: "#FFF9E6" }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="font-bold tabular-nums tracking-[-0.02em] leading-none"
          style={{
            fontSize: "clamp(3rem,8vw,5rem)",
            color: "#0A0A0A",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score}
        </span>
        <span className="text-xl text-slate-400 font-medium">/100</span>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>
          better than {betterThanPct}% of India
        </p>
        <div className="flex flex-wrap gap-2">
          {tier && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
              style={{ background: "#0A0A0A", color: "#FDFCF7" }}
            >
              {tier}
            </span>
          )}
          {archetypeName && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: "#fff",
                color: "#0A0A0A",
                border: "1px solid #F5C518",
              }}
            >
              {archetypeEmoji && `${archetypeEmoji} `}
              {archetypeName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ScoreCard ──────────────────────────────────── */

export function ScoreCard({ data }: Props) {
  const {
    pincode: pc,
    airQuality,
    infrastructure,
    safety,
    property,
    contacts,
    scores,
    archetype,
    trivia,
  } = data;

  const overall = Math.round(scores?.overall_score ?? 0);
  const nationalPct = scores?.overall_national_pct ?? 0;
  const betterThanPct = Math.round(nationalPct);

  const airScore = scores?.air_quality_score ?? 0;
  const safetyScore = scores?.safety_score ?? 0;
  const infraScore = scores?.infrastructure_score ?? 0;
  const transitScore = scores?.transit_score ?? 0;
  const cleanScore = scores?.cleanliness_score ?? 0;
  const propScore = scores?.property_score ?? 0;

  const rentVal = property?.city_rent_median_2bhk;
  const rentDisplay = rentVal
    ? `₹${Math.round(rentVal / 1000)}k`
    : null;
  const rentLocalityLabel =
    property?.rent_match_level === "locality"
      ? property.rent_matched_locality ?? "the locality"
      : pc.metro_city ?? pc.district;

  // Editorial narrative fallback
  const narrativeCopy = trivia?.narrative ?? archetype?.description ?? null;

  // Safety histogram — approximate breakdown from crime rate + score
  const safetyBars = (() => {
    const cr = safety?.crime_rate_per_lakh ?? 200;
    const normalized = Math.max(0, Math.min(100, 100 - (cr / 500) * 100));
    return [
      Math.round(normalized * 0.7),
      Math.round(normalized * 0.85),
      Math.round(normalized * 0.9),
      Math.round(normalized * 0.95),
      Math.round(normalized),
    ];
  })();

  // lat/lng for map
  const lat = pc.lat ?? 0;
  const lng = pc.lng ?? 0;
  const hasCoords = lat !== 0 && lng !== 0;

  // Optional amenity pill counts (feature-flagged)
  const cafeCount = infrastructure?.cafe_count;
  const restaurantCount = infrastructure?.restaurant_count;
  const hasAmenityPills = (cafeCount ?? 0) > 0 || (restaurantCount ?? 0) > 0;

  const dims: [string, DimKey, number][] = [
    ["air quality", "air", airScore],
    ["safety", "safety", safetyScore],
    ["infrastructure", "infrastructure", infraScore],
    ["transit", "transit", transitScore],
    ["cleanliness", "cleanliness", cleanScore],
    ["property", "property", propScore],
  ];

  return (
    <article className="pt-6 pb-8 space-y-14">

      {/* ─── Overall Score ────────────────────────────────── */}
      <OverallBadge
        score={overall}
        betterThanPct={betterThanPct}
        tier={scores?.tier}
        archetypeName={scores?.archetype_name}
        archetypeEmoji={scores?.archetype_emoji}
      />

      {/* ─── SECTION: Typology & Heatmap ───────────────── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <SectionLabel>Neighborhood Typology &amp; Heatmap</SectionLabel>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">

          {/* Left — map panel */}
          <div
            className="relative rounded-2xl overflow-hidden border border-slate-100"
            style={{ minHeight: "420px", background: "#F5F5F0" }}
          >
            {hasCoords ? (
              <MapPreview lat={lat} lng={lng} name={pc.name} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-slate-400 text-sm gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>map data unavailable</span>
              </div>
            )}

            {/* Overlay pills — top left */}
            <div className="absolute top-3 left-3 flex gap-2 z-[9999]">
              {scores?.tier && (
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: "#0A0A0A", color: "#FDFCF7" }}
                >
                  {scores.tier}
                </span>
              )}
              {scores?.archetype_name && (
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold"
                  style={{
                    background: "#FFF9E6",
                    color: "#0A0A0A",
                    border: "1px solid #F5C518",
                  }}
                >
                  {scores.archetype_emoji && `${scores.archetype_emoji} `}
                  {scores.archetype_name}
                </span>
              )}
            </div>

            {/* Optional amenity pills — bottom left */}
            {hasAmenityPills && (
              <div className="absolute bottom-3 left-3 flex gap-2 z-[9999]">
                {cafeCount && cafeCount > 0 && (
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(255,249,230,0.92)", color: "#DCA800", border: "1px solid #F5C518" }}
                  >
                    {cafeCount} cafes
                  </span>
                )}
                {restaurantCount && restaurantCount > 0 && (
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(255,249,230,0.92)", color: "#DCA800", border: "1px solid #F5C518" }}
                  >
                    {restaurantCount} restaurants
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right — two vertical dimension cards */}
          <div className="flex flex-col gap-4">
            <DimensionCard
              label="Public Parks"
              score={infraScore}
              description={
                describeDimension("infrastructure", infraScore) +
                (infrastructure?.park_count
                  ? ` ${infrastructure.park_count} park${infrastructure.park_count !== 1 ? "s" : ""} in the area.`
                  : "")
              }
              delay={120}
            />
            <DimensionCard
              label="Air Quality"
              score={airScore}
              description={
                describeDimension("air", airScore) +
                (airQuality?.aqi ? ` Current AQI: ${airQuality.aqi}.` : "")
              }
              delay={180}
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION: Deep Dive — Safety + Rent Outlook ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <SectionLabel>Deep Dive</SectionLabel>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Safety Index */}
          <div className="rounded-2xl p-6 border border-slate-100 bg-white flex flex-col gap-4">
            <SectionLabel>Safety Index</SectionLabel>
            <div className="flex items-baseline gap-2">
              <span
                className="text-6xl font-bold tabular-nums tracking-tight leading-none"
                style={{ color: "#0A0A0A" }}
              >
                {Math.round(safetyScore)}
              </span>
              <span className="text-sm text-slate-400">/100</span>
            </div>
            <ScoreBar score={safetyScore} />
            <p className="text-[13px] text-slate-600 leading-snug">
              {describeDimension("safety", safetyScore)}
              {safety?.nearest_police_station_name
                ? ` Nearest station: ${safety.nearest_police_station_name}.`
                : ""}
            </p>
            <MiniHistogram values={safetyBars} />
            <p
              className="text-[10px] text-slate-400 uppercase"
              style={{ letterSpacing: "0.12em" }}
            >
              crime trend index
            </p>
          </div>

          {/* Rent Outlook */}
          <div
            className="rounded-2xl p-6 border border-slate-100 flex flex-col gap-4"
            style={{ background: "#FFF9E6" }}
          >
            <SectionLabel>Rent Outlook</SectionLabel>
            <div className="flex items-baseline gap-2">
              <span
                className="text-6xl font-bold tabular-nums tracking-tight leading-none"
                style={{ color: "#0A0A0A" }}
              >
                {Math.round(propScore)}
              </span>
              <span className="text-sm text-slate-500">/100</span>
            </div>
            <ScoreBar score={propScore} />
            {rentDisplay && (
              <p
                className="text-2xl font-bold tracking-tight"
                style={{ color: "#DCA800" }}
              >
                {rentDisplay}
                <span className="text-base font-medium text-slate-500">/mo</span>
              </p>
            )}
            <p className="text-[13px] text-slate-700 leading-snug">
              {rentDisplay
                ? `2BHK rent here runs ${rentDisplay} — ${rentLocalityLabel} rate.`
                : "Rent data unavailable for this pincode."}
            </p>
            <p className="text-[13px] text-slate-600 leading-snug mt-auto">
              {describeDimension("property", propScore)}
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION: Six Dimensions ─────────────────────── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "260ms" }}>
        <SectionLabel>Six Dimensions</SectionLabel>

        {/* Rank row */}
        {(scores?.national_rank ||
          scores?.state_rank ||
          scores?.district_rank ||
          scores?.metro_rank) && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 mb-6 p-5 rounded-2xl border border-slate-100 bg-white">
            {scores?.national_rank && scores?.national_total && (
              <RankCol
                label="nationally"
                rank={ordinal(scores.national_rank)}
                total={scores.national_total}
                hint={`top ${betterThanPct}% of India`}
              />
            )}
            {scores?.state_rank && scores?.state_total && (
              <RankCol
                label="in state"
                rank={ordinal(scores.state_rank)}
                total={scores.state_total}
                hint={pc.state}
              />
            )}
            {scores?.district_rank && scores?.district_total && (
              <RankCol
                label="in district"
                rank={ordinal(scores.district_rank)}
                total={scores.district_total}
                hint={pc.district}
              />
            )}
            {scores?.metro_rank && scores?.metro_total && pc.metro_city && (
              <RankCol
                label="in metro"
                rank={ordinal(scores.metro_rank)}
                total={scores.metro_total}
                hint={pc.metro_city}
              />
            )}
          </div>
        )}

        <div className="mt-2">
          {dims.map(([label, key, score], i) => (
            <DimensionRow
              key={key}
              label={label}
              score={score}
              delay={i * 70}
            />
          ))}
        </div>
      </section>

      {/* ─── SECTION: Did You Know ────────────────────────── */}
      {trivia?.facts && trivia.facts.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: "320ms" }}>
          <SectionLabel>Did You Know</SectionLabel>
          <div className="mt-6 space-y-6">
            {trivia.facts.slice(0, 3).map((fact, i) => (
              <figure key={i} className="relative pl-6 border-l-2" style={{ borderColor: "#F5C518" }}>
                <blockquote>
                  <p
                    className="text-lg leading-snug text-slate-800 text-balance italic"
                    style={{ fontFamily: "var(--font-fraunces), serif" }}
                  >
                    {fact}
                  </p>
                </blockquote>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ─── SECTION: Your Representative ────────────────── */}
      {contacts?.ls_mp_name && (
        <section className="animate-fade-in-up" style={{ animationDelay: "380ms" }}>
          <SectionLabel>Your Representative</SectionLabel>
          <div className="mt-4 rounded-2xl p-5 bg-white border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 font-bold text-sm"
              style={{ background: "#FFF9E6", border: "1px solid #F5C518", color: "#DCA800" }}
              aria-hidden="true"
            >
              {contacts.ls_mp_party?.charAt(0) ?? "P"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-base" style={{ color: "#0A0A0A" }}>
                {contacts.ls_mp_name}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {contacts.ls_mp_party && (
                  <span style={{ color: "#DCA800" }}>{contacts.ls_mp_party}</span>
                )}
                {contacts.ls_constituency && (
                  <span className="text-slate-400">
                    {" · "}
                    {contacts.ls_constituency.toLowerCase()}
                  </span>
                )}
              </p>
            </div>
            <p
              className="text-[10px] uppercase text-slate-400 sm:ml-auto shrink-0 font-semibold"
              style={{ letterSpacing: "0.12em" }}
            >
              Lok Sabha MP
            </p>
          </div>
        </section>
      )}

      {/* ─── SECTION: Life Here ──────────────────────────── */}
      {narrativeCopy && (
        <section className="animate-fade-in-up" style={{ animationDelay: "440ms" }}>
          <SectionLabel>Life Here</SectionLabel>
          <div
            className="mt-4 p-7 rounded-2xl border border-slate-100"
            style={{ background: "#F5F5F0" }}
          >
            <p className="drop-cap text-slate-700 leading-relaxed text-balance text-[15px]">
              {narrativeCopy}
            </p>
            {archetype?.pincode_count && archetype.pincode_count > 1 && (
              <p className="text-xs text-slate-400 mt-5">
                {archetype.pincode_count.toLocaleString()} pincodes share this profile
              </p>
            )}
          </div>
        </section>
      )}

    </article>
  );
}
