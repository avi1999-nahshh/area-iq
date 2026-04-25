/**
 * Verdict engine for /compare. Reads the IQv2 shape from
 * `data/processed/iq_v2_blr.json` directly. Six dimensions only —
 * walkability is excluded from the head-to-head surface.
 *
 * Returns a verdict object the head-to-head UI can render. Headline picks
 * winner + delta tone; share-copy bank handles the spicy tradeoff line.
 */
import type { IQv2 } from "@/app/insights/lib";
import { displayName } from "@/app/insights/blr-aliases";
import { pickShareLine } from "./share-copy";

export type DimKey =
  | "air"
  | "essentials"
  | "lifestyle"
  | "connectivity"
  | "density"
  | "affordability";

export const DIM_LABELS: Record<DimKey, string> = {
  air: "Air",
  essentials: "Essentials",
  lifestyle: "Lifestyle",
  connectivity: "Connectivity",
  density: "Density",
  affordability: "Affordability",
};

export const DIM_DESCRIPTIONS: Record<DimKey, string> = {
  air: "Local AQI, blended from the nearest CPCB stations within 15 km.",
  essentials: "Hospitals, schools, banks within the pincode.",
  lifestyle: "Cafés, restaurants, malls, parks — the going-out infrastructure.",
  connectivity: "Metro distance, bus stops, share of commutes under 30 minutes.",
  density: "Population per sq km plus how active the working population is.",
  affordability: "Where 2BHK rent lands relative to the rest of Bangalore.",
};

const DIM_KEYS: DimKey[] = [
  "air",
  "essentials",
  "lifestyle",
  "connectivity",
  "density",
  "affordability",
];

export type DimRow = {
  key: DimKey;
  label: string;
  description: string;
  a: number;          // 0-100
  b: number;
  winner: "a" | "b" | "tie";
};

export type Verdict = {
  winnerSide: "a" | "b" | "tie";
  winnerName: string;
  loserName: string;
  overallA: number;
  overallB: number;
  delta: number;        // absolute, rounded
  dimWins: { a: number; b: number; total: number };
  headline: string;
  shareLine: string;
  audience: string;
  audienceLine: string;
  dims: DimRow[];
  tie: boolean;
};

function audienceFor(a: IQv2): string {
  // Cheap heuristic from dim profile, not from a stale archetype label.
  const s = a.scores;
  const transitStrong = s.connectivity >= 70;
  const lifestyleStrong = s.lifestyle >= 70;
  const essentialsStrong = s.essentials >= 60;
  const cheap = s.affordability >= 60;
  if (lifestyleStrong && transitStrong) return "Young Professionals";
  if (essentialsStrong && cheap) return "Families";
  if (lifestyleStrong) return "Creatives";
  if (transitStrong) return "Commuters";
  return "Balanced Lifestyle";
}

const cleanName = (d: IQv2) =>
  displayName(d.pincode, d.name).replace(/\s*\(Bangalore\)\s*$/i, "");

export function computeVerdict(a: IQv2, b: IQv2): Verdict {
  const overallA = Math.round(a.scores.overall);
  const overallB = Math.round(b.scores.overall);

  const score = (d: IQv2, k: DimKey): number => {
    switch (k) {
      case "air": return d.scores.air;
      case "essentials": return d.scores.essentials;
      case "lifestyle": return d.scores.lifestyle;
      case "connectivity": return d.scores.connectivity;
      case "density": return d.scores.density;
      case "affordability": return d.scores.affordability;
    }
  };

  const dims: DimRow[] = DIM_KEYS.map((key) => {
    const av = Math.round(score(a, key));
    const bv = Math.round(score(b, key));
    let winner: "a" | "b" | "tie" = "tie";
    if (av > bv) winner = "a";
    else if (bv > av) winner = "b";
    return { key, label: DIM_LABELS[key], description: DIM_DESCRIPTIONS[key], a: av, b: bv, winner };
  });

  let winsA = 0;
  let winsB = 0;
  for (const d of dims) {
    if (d.winner === "a") winsA++;
    else if (d.winner === "b") winsB++;
  }

  const delta = Math.abs(overallA - overallB);
  const maxDimDelta = Math.max(...dims.map((d) => Math.abs(d.a - d.b)));
  const tie = delta < 4 && maxDimDelta <= 6;

  const aWins = overallA === overallB ? winsA >= winsB : overallA > overallB;
  const winnerSide: "a" | "b" | "tie" = tie ? "tie" : aWins ? "a" : "b";
  const winnerName = aWins ? cleanName(a) : cleanName(b);
  const loserName = aWins ? cleanName(b) : cleanName(a);

  let headline: string;
  if (tie) {
    headline = `${cleanName(a)} vs ${cleanName(b)}: dead heat.`;
  } else if (delta >= 20) {
    headline = `${winnerName} wins by ${delta} points. It's not close.`;
  } else if (delta >= 10) {
    headline = `${winnerName} wins by ${delta} points.`;
  } else if (delta >= 4) {
    headline = `${winnerName} edges it by ${delta} points.`;
  } else {
    // Overall scores are nearly tied but at least one dimension diverges
    // sharply. The biggest dim gap may favour the *loser* — saying
    // "Indiranagar takes it on affordability" reads backward when Indiranagar
    // is losing affordability by 69 points. Pick the biggest dim the overall
    // winner actually wins on instead.
    const sideOfOverallWinner: "a" | "b" = aWins ? "a" : "b";
    const winnerWonDims = dims.filter((d) => d.winner === sideOfOverallWinner);
    if (winnerWonDims.length > 0) {
      const biggest = [...winnerWonDims].sort(
        (x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b),
      )[0];
      const dimDelta = Math.abs(biggest.a - biggest.b);
      headline = `${winnerName} takes it on ${biggest.label.toLowerCase()} — ${dimDelta} points clear.`;
    } else {
      headline =
        delta > 0
          ? `${winnerName} edges it by ${delta} point${delta === 1 ? "" : "s"}.`
          : `${winnerName} edges it.`;
    }
  }

  const winnerData = aWins ? a : b;
  const loserData = aWins ? b : a;

  const rentDeltaK =
    winnerData.raw.rent_2bhk != null && loserData.raw.rent_2bhk != null
      ? Math.round(
          (winnerData.raw.rent_2bhk - loserData.raw.rent_2bhk) / 1000,
        )
      : undefined;

  const aqiDelta =
    winnerData.raw.aqi != null && loserData.raw.aqi != null
      ? Math.round(winnerData.raw.aqi - loserData.raw.aqi)
      : undefined;

  const pair = `${a.pincode}-vs-${b.pincode}`;
  const shareLine = pickShareLine(pair, {
    winner: winnerName,
    loser: loserName,
    delta,
    rentDeltaK,
    aqiDelta,
  });

  const audience = audienceFor(winnerData);
  const audienceLine = tie
    ? "Best for: honestly, a coin toss."
    : `Best for ${audience}.`;

  return {
    winnerSide,
    winnerName,
    loserName,
    overallA,
    overallB,
    delta,
    dimWins: { a: winsA, b: winsB, total: dims.length },
    headline,
    shareLine,
    audience,
    audienceLine,
    dims,
    tie,
  };
}
