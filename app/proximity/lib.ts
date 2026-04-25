import type { IQv2 } from "@/app/insights/lib";

export type Mode = "transit" | "drive" | "walk";

export type DimKey =
  | "air"
  | "lifestyle"
  | "essentials"
  | "connectivity"
  | "affordability";

export const DIMS: { key: DimKey; label: string; icon: string }[] = [
  { key: "air", label: "Air", icon: "air" },
  { key: "lifestyle", label: "Lifestyle", icon: "lifestyle" },
  { key: "essentials", label: "Essentials", icon: "essentials" },
  { key: "connectivity", label: "Connectivity", icon: "connectivity" },
  { key: "affordability", label: "Affordability", icon: "rupee" },
];

// Tuned to feel BLR-real until we plug the API. Average effective speeds.
//   transit  ≈ 33 km/h  (mix of metro + bus + last-mile)
//   drive    ≈ 24 km/h  (BLR all-day average; drops to ~14 km/h peak)
//   walk     ≈  4.8 km/h
export const MODE_KMPM: Record<Mode, number> = {
  transit: 0.55,
  drive: 0.4,
  walk: 0.08,
};

export const MODE_LABEL: Record<Mode, string> = {
  transit: "Transit",
  drive: "Drive",
  walk: "Walk",
};

// Real BLR tech-park / office-cluster lat/lngs. Default = Manyata.
export type OfficePreset = { id: string; label: string; lat: number; lng: number };
export const OFFICE_PRESETS: OfficePreset[] = [
  { id: "manyata", label: "Manyata Tech Park", lat: 13.0454, lng: 77.6206 },
  { id: "embassy", label: "Embassy Tech Village (ORR)", lat: 12.9583, lng: 77.6916 },
  { id: "itpl", label: "ITPL · Whitefield", lat: 12.9854, lng: 77.7368 },
  { id: "ecity", label: "Electronic City Phase 1", lat: 12.8456, lng: 77.6603 },
  { id: "bagmane", label: "Bagmane Tech Park · CV Raman Nagar", lat: 12.9881, lng: 77.6677 },
  { id: "ecospace", label: "RMZ Ecospace · Bellandur", lat: 12.9298, lng: 77.6816 },
];

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Straight-line distance × mode coefficient. Honest about the assumption.
export function commuteMinutes(km: number, mode: Mode): number {
  return km / MODE_KMPM[mode];
}

// Default weight 1.0; selected priority chips bump to 2.0. Returns 0–100.
export function weightedScore(p: IQv2, priorities: Set<DimKey>): number {
  let num = 0;
  let den = 0;
  for (const { key } of DIMS) {
    const w = priorities.has(key) ? 2 : 1;
    num += w * p.scores[key];
    den += w;
  }
  return num / den;
}

export type Match = {
  pincode: IQv2;
  km: number;
  minutes: number;
  weighted: number;
};

export function rankMatches(
  pincodes: IQv2[],
  origin: { lat: number; lng: number },
  mode: Mode,
  maxMinutes: number,
  priorities: Set<DimKey>
): Match[] {
  return pincodes
    .map((p) => {
      const km = haversineKm(origin, { lat: p.lat, lng: p.lng });
      return {
        pincode: p,
        km,
        minutes: commuteMinutes(km, mode),
        weighted: weightedScore(p, priorities),
      };
    })
    .filter((m) => m.minutes <= maxMinutes)
    .sort((a, b) => b.weighted - a.weighted);
}

// Used after the Convex commuteMatrix action returns. Filters and re-ranks
// from a precomputed minutes map — no haversine fallback. Slider + priority
// chip changes call this without re-hitting the API.
export function rankFromMinutes(
  pincodes: IQv2[],
  minutesByPincode: Map<string, number>,
  maxMinutes: number,
  priorities: Set<DimKey>
): Match[] {
  return pincodes
    .map((p) => ({
      pincode: p,
      km: 0,
      minutes: minutesByPincode.get(p.pincode) ?? Infinity,
      weighted: weightedScore(p, priorities),
    }))
    .filter((m) => Number.isFinite(m.minutes) && m.minutes <= maxMinutes)
    .sort((a, b) => b.weighted - a.weighted);
}

// Letter grade from a 0-100 sub-score (used in the 3-cell badges on cards).
export function gradeFromScore(s: number): string {
  if (s >= 90) return "A+";
  if (s >= 82) return "A";
  if (s >= 75) return "A-";
  if (s >= 68) return "B+";
  if (s >= 60) return "B";
  if (s >= 52) return "B-";
  if (s >= 45) return "C+";
  if (s >= 38) return "C";
  return "D";
}
