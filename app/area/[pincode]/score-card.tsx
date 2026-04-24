"use client";

import { useEffect, useState } from "react";

type AreaData = {
  pincode: { pincode: string; name: string; district: string; state: string;
    lat?: number; lng?: number; area_sq_km?: number; metro_city?: string };
  census?: { population?: number; literacy_rate?: number;
    commute_under_30_pct?: number; gender_ratio?: number } | null;
  airQuality?: { aqi?: number; pm25?: number; pm10?: number;
    station_name?: string; station_distance_km?: number } | null;
  safety?: { crime_rate_per_lakh?: number; nearest_police_station_name?: string } | null;
  infrastructure?: { hospital_count?: number; mall_count?: number;
    park_count?: number; bus_stop_count?: number;
    five_minute_city_score?: number } | null;
  transit?: { nearest_railway_name?: string; nearest_metro_name?: string;
    nearest_metro_km?: number; nearest_major_railway_name?: string } | null;
  cleanliness?: { ss_score?: number; ss_rank?: number; ss_source?: string } | null;
  property?: { hpi_value?: number; city_rent_median_2bhk?: number;
    rent_matched_locality?: string; rent_match_level?: string } | null;
  contacts?: { ls_constituency?: string; ls_mp_name?: string;
    ls_mp_party?: string; vs_constituency?: string } | null;
  scores?: {
    air_quality_score?: number; safety_score?: number; infrastructure_score?: number;
    transit_score?: number; cleanliness_score?: number; property_score?: number;
    overall_score?: number; overall_national_pct?: number;
    national_rank?: number; national_total?: number;
    overall_state_pct?: number; state_rank?: number; state_total?: number;
    overall_district_pct?: number; district_rank?: number; district_total?: number;
    overall_metro_pct?: number; metro_rank?: number; metro_total?: number;
    tier?: string; archetype_id?: string; archetype_name?: string;
    archetype_tagline?: string; archetype_emoji?: string;
    gender_equality_index?: number; hidden_gem_index?: number;
  } | null;
  archetype?: { name?: string; tagline?: string; emoji?: string;
    description?: string; pincode_count?: number } | null;
  trivia?: { facts?: string[]; district?: string; state?: string } | null;
};

interface Props { data: AreaData }

function gradeFor(score: number): { letter: string; tone: string } {
  if (score >= 90) return { letter: "A+", tone: "text-emerald-600" };
  if (score >= 85) return { letter: "A",  tone: "text-emerald-600" };
  if (score >= 80) return { letter: "A-", tone: "text-emerald-500" };
  if (score >= 75) return { letter: "B+", tone: "text-amber-600"   };
  if (score >= 70) return { letter: "B",  tone: "text-amber-600"   };
  if (score >= 65) return { letter: "B-", tone: "text-amber-500"   };
  if (score >= 60) return { letter: "C+", tone: "text-amber-500"   };
  if (score >= 55) return { letter: "C",  tone: "text-orange-500"  };
  if (score >= 50) return { letter: "C-", tone: "text-orange-500"  };
  if (score >= 45) return { letter: "D+", tone: "text-rose-500"    };
  if (score >= 40) return { letter: "D",  tone: "text-rose-500"    };
  return           { letter: "F",  tone: "text-rose-600"    };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n.toLocaleString() + (s[(v - 20) % 10] || s[v] || s[0]);
}

function aqiInfo(aqi: number) {
  if (aqi <= 50)  return { label: "good",            tone: "text-emerald-600", bg: "bg-emerald-50" };
  if (aqi <= 100) return { label: "moderate",        tone: "text-amber-600",   bg: "bg-amber-50"   };
  if (aqi <= 150) return { label: "sensitive groups",tone: "text-orange-500",  bg: "bg-orange-50"  };
  if (aqi <= 200) return { label: "unhealthy",       tone: "text-rose-500",    bg: "bg-rose-50"    };
  if (aqi <= 300) return { label: "very unhealthy",  tone: "text-rose-600",    bg: "bg-rose-50"    };
  return              { label: "hazardous",       tone: "text-rose-700",    bg: "bg-rose-50"    };
}

function buildVerdict(s: NonNullable<AreaData["scores"]>): string {
  const dims: [string, number][] = [
    ["air",    s.air_quality_score ?? 50],
    ["safety", s.safety_score ?? 50],
    ["amenities", s.infrastructure_score ?? 50],
    ["transit", s.transit_score ?? 50],
    ["cleanliness", s.cleanliness_score ?? 50],
    ["buzz", s.property_score ?? 50],
  ];
  const sorted = [...dims].sort((a, b) => b[1] - a[1]);
  const strong = sorted.slice(0, 2).filter((x) => x[1] >= 65).map((x) => x[0]);
  const weak   = sorted.slice(-2).filter((x) => x[1] < 50).map((x) => x[0]);
  if (strong.length && weak.length)
    return `strong on ${strong.join(" and ")}, held back by ${weak.join(" and ")}.`;
  if (strong.length) return `best known for its ${strong.join(" and ")}.`;
  if (weak.length)   return `mostly average, with ${weak.join(" and ")} as the weak links.`;
  return "a solidly average profile across the board.";
}

function DimensionRow({
  label, score, delay,
}: { label: string; score: number; delay: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const v = Math.round(score);
  const tone = v >= 70 ? "text-amber-600" : v >= 50 ? "text-slate-700" : "text-rose-500";
  const bar  = v >= 70 ? "bg-amber-500"  : v >= 50 ? "bg-slate-400"  : "bg-rose-400";
  return (
    <div className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-5 py-4 border-t border-slate-100 first:border-t-0">
      <span className="text-[11px] tracking-[0.14em] uppercase text-slate-400 font-semibold tabular-nums w-24">
        {label}
      </span>
      <div className="h-px bg-slate-100 relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${bar}`}
          style={{
            width: mounted ? `${v}%` : "0%",
            transition: `width 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
          }}
        />
      </div>
      <span className={`text-4xl font-bold tracking-tighter tabular-nums leading-none ${tone}`}>
        {v}
      </span>
    </div>
  );
}

function tierChip(tier?: string) {
  const t = tier ?? "—";
  const bg =
    t === "urban"      ? "bg-slate-900 text-white"
    : t === "semi-urban" ? "bg-amber-100 text-amber-900 border border-amber-200"
    : t === "rural"    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
    : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-[0.14em] ${bg}`}>
      {t}
    </span>
  );
}

export function ScoreCard({ data }: Props) {
  const { pincode: pc, census, airQuality, infrastructure, property, contacts, scores, archetype, trivia } = data;

  const overall = Math.round(scores?.overall_score ?? 0);
  const nationalPct = scores?.overall_national_pct ?? 0;
  const betterThanPct = Math.round(nationalPct);
  const grade = gradeFor(overall);

  const dims: [string, number][] = [
    ["air",         scores?.air_quality_score ?? 0],
    ["safety",      scores?.safety_score ?? 0],
    ["amenities",   scores?.infrastructure_score ?? 0],
    ["transit",     scores?.transit_score ?? 0],
    ["cleanliness", scores?.cleanliness_score ?? 0],
    ["buzz",        scores?.property_score ?? 0],
  ];

  const aqi = airQuality?.aqi;
  const aqi_meta = typeof aqi === "number" ? aqiInfo(aqi) : null;

  const rentVal = property?.city_rent_median_2bhk;
  const rentDisplay = rentVal ? `₹${(rentVal / 1000).toFixed(0)}k` : null;
  const rentLabel = property?.rent_match_level === "locality"
    ? `typical ${property.rent_matched_locality ?? "local"} 2bhk`
    : "typical city 2bhk";

  const pop = census?.population;
  const popDisplay =
    pop ? (pop >= 1e5 ? `${(pop / 1e5).toFixed(1)}L`
      : pop >= 1e3 ? `${(pop / 1e3).toFixed(0)}k` : String(pop)) : null;

  const fiveMin = infrastructure?.five_minute_city_score;

  const verdict = scores ? buildVerdict(scores) : "";

  return (
    <article className="pt-4 pb-8">
      {/* ─── masthead ─────────────────────────────────────────── */}
      <header
        className="relative animate-fade-in-up"
        style={{ animationDelay: "40ms" }}
      >
        {/* top tag row */}
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-8">
          <span className="tracking-[0.2em] uppercase">
            Pincode · {pc.pincode}
          </span>
          {tierChip(scores?.tier)}
        </div>

        {/* archetype-as-hero: emoji overflows leftwards, name dominates */}
        {archetype?.name && (
          <div className="flex items-start gap-4 mb-6">
            <span
              className="text-7xl leading-none shrink-0"
              style={{ transform: "translateY(-8px)" }}
              aria-hidden
            >
              {archetype.emoji ?? "🏘️"}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-amber-600 mb-2">
                archetype
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter leading-[0.92] text-slate-900 text-balance">
                {archetype.name}
              </h1>
              {archetype.tagline && (
                <p className="mt-3 text-lg italic text-slate-500 leading-snug text-balance">
                  “{archetype.tagline}”
                </p>
              )}
            </div>
          </div>
        )}

        {/* place line */}
        <p className="text-sm text-slate-500 mb-2">
          {pc.name} · {pc.district}, {pc.state}
        </p>
      </header>

      {/* ─── grade + one-liner verdict ──────────────────────────── */}
      <section
        className="mt-10 grid grid-cols-[auto_1fr] items-end gap-6 sm:gap-8 animate-fade-in-up"
        style={{ animationDelay: "120ms" }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400 mb-1">
            grade
          </span>
          <span
            className={`text-[9rem] sm:text-[11rem] font-bold tracking-[-0.08em] leading-[0.78] ${grade.tone} tabular-nums`}
          >
            {grade.letter}
          </span>
        </div>
        <div className="pb-3 min-w-0">
          <p className="text-xs text-slate-400 font-medium mb-1">overall</p>
          <p className="text-4xl font-bold tracking-tighter leading-none text-slate-900 tabular-nums">
            {overall}
            <span className="text-slate-300 text-2xl font-medium">/100</span>
          </p>
          <p className="mt-4 text-sm text-slate-600 leading-snug text-balance">
            {verdict}
          </p>
        </div>
      </section>

      {/* ─── rank row ─────────────────────────────────────────── */}
      <section
        className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 animate-fade-in-up"
        style={{ animationDelay: "180ms" }}
      >
        {scores?.national_rank && scores?.national_total && (
          <RankCol
            label="nationally"
            rank={ordinal(scores.national_rank)}
            total={scores.national_total}
            hint={`beats ${Math.round(betterThanPct)}% of India`}
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
      </section>

      {/* ─── six dimensions — typographic ladder, not bars ──────── */}
      <section
        className="mt-12 animate-fade-in-up"
        style={{ animationDelay: "240ms" }}
      >
        <h2 className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400 mb-2">
          six dimensions
        </h2>
        <div>
          {dims.map(([label, s], i) => (
            <DimensionRow key={label} label={label} score={s} delay={i * 70} />
          ))}
        </div>
      </section>

      {/* ─── at a glance — asymmetric, larger hero stat ──────── */}
      <section
        className="mt-12 grid sm:grid-cols-[1.4fr_1fr_1fr] gap-3 animate-fade-in-up"
        style={{ animationDelay: "300ms" }}
      >
        {/* aqi — the one with live pulse */}
        <div className={`relative rounded-2xl p-5 overflow-hidden border ${aqi_meta ? aqi_meta.bg : "bg-slate-50"} ${aqi_meta ? "border-transparent" : "border-slate-100"}`}>
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-slate-500 mb-1">
            air · right now
          </p>
          {aqi != null ? (
            <>
              <p className={`text-6xl font-bold tracking-tighter leading-none tabular-nums ${aqi_meta?.tone ?? "text-slate-900"}`}>
                {aqi}
              </p>
              <p className={`mt-2 text-sm font-medium ${aqi_meta?.tone ?? "text-slate-500"}`}>
                AQI · {aqi_meta?.label}
              </p>
              {airQuality?.station_name && (
                <p className="mt-1 text-[11px] text-slate-400 truncate">
                  {airQuality.station_name}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">no nearby station</p>
          )}
        </div>

        <Stat
          label="typical rent"
          value={rentDisplay ?? "—"}
          sub={rentDisplay ? rentLabel : "data unavailable"}
        />
        <Stat
          label="5-min city"
          value={fiveMin != null ? `${fiveMin}/10` : "—"}
          sub={fiveMin != null ? "walkable essentials" : "not rated"}
        />

        {popDisplay && (
          <Stat
            label="district population"
            value={popDisplay}
            sub="census 2011"
          />
        )}
      </section>

      {/* ─── did-you-know — editorial quote rows ──────── */}
      {trivia?.facts && trivia.facts.length > 0 && (
        <section
          className="mt-14 animate-fade-in-up"
          style={{ animationDelay: "360ms" }}
        >
          <h2 className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400 mb-4">
            one thing about {pc.district}
          </h2>
          <div className="space-y-5">
            {trivia.facts.slice(0, 3).map((fact, i) => (
              <figure key={i} className="relative pl-6 border-l-2 border-amber-400">
                <p className="text-lg leading-snug text-slate-800 text-balance">
                  {fact}
                </p>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ─── representative — minimal line ──────── */}
      {contacts?.ls_mp_name && (
        <section
          className="mt-14 flex items-baseline gap-4 animate-fade-in-up"
          style={{ animationDelay: "420ms" }}
        >
          <span className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400">
            MP
          </span>
          <p className="text-sm text-slate-800">
            <span className="font-semibold">{contacts.ls_mp_name}</span>
            {contacts.ls_mp_party && (
              <span className="text-amber-600 font-medium"> · {contacts.ls_mp_party}</span>
            )}
            {contacts.ls_constituency && (
              <span className="text-slate-400"> · {contacts.ls_constituency.toLowerCase()}</span>
            )}
          </p>
        </section>
      )}

      {/* ─── archetype description — closing note ──────── */}
      {archetype?.description && (
        <section
          className="mt-14 p-6 rounded-2xl bg-slate-50 border border-slate-100 animate-fade-in-up"
          style={{ animationDelay: "480ms" }}
        >
          <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-amber-700 mb-3">
            life here, in one paragraph
          </p>
          <p className="text-slate-700 leading-relaxed text-balance">
            {archetype.description}
          </p>
          {archetype.pincode_count && (
            <p className="text-xs text-slate-400 mt-4">
              shared with {archetype.pincode_count.toLocaleString()} other pincodes
            </p>
          )}
        </section>
      )}
    </article>
  );
}

function RankCol({ label, rank, total, hint }: { label: string; rank: string; total: number; hint?: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tighter text-slate-900 tabular-nums leading-none">
        {rank}
      </p>
      <p className="text-xs text-slate-400 mt-1 tabular-nums">
        of {total.toLocaleString()}
        {hint ? ` · ${hint}` : ""}
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-5 bg-white border border-slate-100">
      <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-slate-500 mb-1">
        {label}
      </p>
      <p className="text-4xl font-bold tracking-tighter leading-none text-slate-900 tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-2 text-[11px] text-slate-400 leading-tight">{sub}</p>}
    </div>
  );
}
