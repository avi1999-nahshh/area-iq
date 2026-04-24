import fs from "fs";
import path from "path";

type Row = Record<string, unknown>;

function load(name: string): Row[] {
  const p = path.join(process.cwd(), "data", "processed", `${name}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

let cache: {
  pincodes: Map<string, Row>;
  scores: Map<string, Row>;
  infra: Map<string, Row>;
  air: Map<string, Row>;
  safety: Map<string, Row>;
  transit: Map<string, Row>;
  sup: Map<string, Row>;
} | null = null;

function idx() {
  if (cache) return cache;
  const m = (arr: Row[]) => new Map(arr.map((x) => [String(x.pincode), x]));
  cache = {
    pincodes: m(load("pincodes")),
    scores: m(load("scores_final")),
    infra: m(load("infrastructure")),
    air: m(load("air_quality")),
    safety: m(load("safety")),
    transit: m(load("transit")),
    sup: m(load("superlatives")),
  };
  return cache;
}

export function grade(overall: number): string {
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

export type Dim = {
  label: string;
  value: number;
  meta: string;
  nationalPct: number;
};

export type BriefData = {
  pincode: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  grade: string;
  overall: number;
  nationalRank: number;
  nationalTotal: number;
  archetype: string;
  archetypeTagline: string;
  superlative: string | null;
  scores: Dim[];
  topDim: Dim;
  lowDim: Dim;
  amenityCounts: { label: string; value: number }[];
  verdict: string;
  pullQuote: string;
  date: string;
};

// bound pct to avoid absurd phrasings like "top 0%" / "bottom 0%"
const bound = (n: number) => Math.min(99, Math.max(1, Math.round(n)));

export function loadBriefData(pincode: string): BriefData | null {
  const { pincodes, scores, infra, air, safety, transit, sup } = idx();
  const p = pincodes.get(pincode);
  const s = scores.get(pincode);
  const i = infra.get(pincode);
  if (!p || !s || !i) return null;

  const a = (air.get(pincode) ?? {}) as Row;
  const saf = (safety.get(pincode) ?? {}) as Row;
  const t = (transit.get(pincode) ?? {}) as Row;
  const su = sup.get(pincode) as Row | undefined;

  const aqi = a.aqi as number | undefined;
  const crime = saf.crime_rate_per_lakh as number | undefined;
  const metroKm = t.nearest_metro_km as number | undefined;
  const infraPct = s.infrastructure_national_pct as number;

  const dims: Dim[] = [
    {
      label: "Air",
      value: Math.round(s.air_quality_score as number),
      nationalPct: (s.air_quality_national_pct as number) ?? 0,
      meta: aqi ? `AQI ${aqi}` : "n/a",
    },
    {
      label: "Safety",
      value: Math.round(s.safety_score as number),
      nationalPct: (s.safety_national_pct as number) ?? 0,
      meta: crime ? `${Math.round(crime)}/lk` : "n/a",
    },
    {
      label: "Amenities",
      value: Math.round(s.infrastructure_score as number),
      nationalPct: infraPct ?? 0,
      meta: infraPct >= 99 ? "top 1%" : `top ${bound(100 - infraPct)}%`,
    },
    {
      label: "Transit",
      value: Math.round(s.transit_score as number),
      nationalPct: (s.transit_national_pct as number) ?? 0,
      meta: metroKm != null ? `${metroKm.toFixed(1)}km` : "n/a",
    },
    {
      label: "Cleanliness",
      value: Math.round(s.cleanliness_score as number),
      nationalPct: (s.cleanliness_national_pct as number) ?? 0,
      meta: "Swachh",
    },
    {
      label: "Property",
      value: Math.round(s.property_score as number),
      nationalPct: 0,
      meta: `${Math.round(s.property_score as number)}th pct`,
    },
  ];

  // Rank by percentile for tension framing. Property excluded (no pct).
  const byPct = dims
    .filter((d) => d.label !== "Property")
    .sort((x, y) => y.nationalPct - x.nationalPct);
  const topDim = byPct[0];
  const lowDim = byPct[byPct.length - 1];

  const topPct = bound(100 - topDim.nationalPct);
  const lowPct = bound(lowDim.nationalPct);
  const tagline = (s.archetype_tagline as string) ?? "";

  const verdict = `Top ${topPct}% at ${topDim.label.toLowerCase()}. Bottom ${lowPct}% at ${lowDim.label.toLowerCase()}. ${tagline}`;

  const pullQuote = `${topDim.value}/100 on ${topDim.label.toLowerCase()}, ${lowDim.value}/100 on ${lowDim.label.toLowerCase()}. The price of one, paid in the other.`;

  return {
    pincode,
    name: p.name as string,
    district: p.district as string,
    state: p.state as string,
    lat: p.lat as number,
    lng: p.lng as number,
    grade: grade(s.overall_score as number),
    overall: Math.round(s.overall_score as number),
    nationalRank: s.national_rank as number,
    nationalTotal: s.national_total as number,
    archetype: (s.archetype_name as string) ?? "",
    archetypeTagline: tagline,
    superlative: (su?.superlative_label as string) ?? null,
    scores: dims,
    topDim,
    lowDim,
    amenityCounts: [
      { label: "Cafés", value: (i.cafe_count as number) ?? 0 },
      { label: "Restaurants", value: (i.restaurant_count as number) ?? 0 },
      { label: "Pharmacies", value: (i.pharmacy_count as number) ?? 0 },
      { label: "Hospitals", value: (i.hospital_count as number) ?? 0 },
      { label: "Schools", value: (i.school_count as number) ?? 0 },
      { label: "Parks", value: (i.park_count as number) ?? 0 },
    ],
    verdict,
    pullQuote,
    date: "April 2026",
  };
}

export function listCandidatePincodes(): string[] {
  return Array.from(idx().scores.keys());
}
