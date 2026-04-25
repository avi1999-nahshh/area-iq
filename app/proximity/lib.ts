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

// Curated dictionary of common Bangalore office hotspots — tech parks, major
// commercial neighbourhoods, and the airport. Searched client-side BEFORE we
// hit Nominatim, so a user typing "manyata" or "etv" gets instant results
// with no network round-trip. `aliases` covers shortforms + colloquial names.
//
// Adding entries: keep tight (this is "where do you work", not a full
// gazetteer). Lat/lng should point at the actual building/cluster centroid,
// not the surrounding pincode.
export const OFFICE_LANDMARKS: Array<{
  id: string;
  label: string;
  aliases: string[];
  lat: number;
  lng: number;
}> = [
  // ── tech parks ──
  { id: "manyata", label: "Manyata Tech Park", aliases: ["manyata", "embassy manyata"], lat: 13.0454, lng: 77.6206 },
  { id: "etv", label: "Embassy Tech Village", aliases: ["etv", "embassy tech village", "devarabisanahalli"], lat: 12.9583, lng: 77.6916 },
  { id: "itpl", label: "ITPL · Whitefield", aliases: ["itpl", "international tech park", "whitefield itpl"], lat: 12.9854, lng: 77.7368 },
  { id: "ecity-1", label: "Electronic City Phase 1", aliases: ["electronic city phase 1", "ecity phase 1", "ecity 1", "infosys ecity", "electronic city"], lat: 12.8456, lng: 77.6603 },
  { id: "ecity-2", label: "Electronic City Phase 2", aliases: ["electronic city phase 2", "ecity phase 2", "ecity 2", "wipro ecity"], lat: 12.8276, lng: 77.6781 },
  { id: "bagmane-cvr", label: "Bagmane Tech Park · CV Raman Nagar", aliases: ["bagmane", "bagmane tech park"], lat: 12.9881, lng: 77.6677 },
  { id: "bagmane-wtc", label: "Bagmane World Technology Center · KR Puram", aliases: ["bagmane wtc", "bagmane world", "bagmane mahadevapura"], lat: 12.9968, lng: 77.6989 },
  { id: "bagmane-constellation", label: "Bagmane Constellation · Doddanekundi", aliases: ["bagmane constellation"], lat: 12.9778, lng: 77.7054 },
  { id: "ecospace", label: "RMZ Ecospace · Bellandur", aliases: ["rmz ecospace", "ecospace", "rmz bellandur"], lat: 12.9298, lng: 77.6816 },
  { id: "rmz-infinity", label: "RMZ Infinity · Old Madras Road", aliases: ["rmz infinity"], lat: 12.9846, lng: 77.6601 },
  { id: "prestige-techpark", label: "Prestige Tech Park · Marathahalli", aliases: ["prestige tech park", "prestige techpark"], lat: 12.9337, lng: 77.6907 },
  { id: "cessna", label: "Cessna Business Park · Sarjapur Road", aliases: ["cessna", "cessna business park"], lat: 12.9285, lng: 77.6876 },
  { id: "salarpuria-knowledge-city", label: "Salarpuria Knowledge City · Marathahalli", aliases: ["salarpuria", "salarpuria knowledge city"], lat: 12.9347, lng: 77.6912 },
  { id: "brigade-tech-gardens", label: "Brigade Tech Gardens · Whitefield", aliases: ["brigade tech gardens", "btg"], lat: 12.9786, lng: 77.7159 },
  { id: "embassy-golf-links", label: "Embassy GolfLinks · Domlur", aliases: ["embassy golf links", "egl", "embassy golflinks"], lat: 12.9590, lng: 77.6450 },
  { id: "vtv", label: "Vrindavan Tech Village · Sarjapur Road", aliases: ["vtv", "vrindavan tech village"], lat: 12.8995, lng: 77.6930 },
  { id: "pritech", label: "Pritech Park · Sarjapur Road", aliases: ["pritech", "pritech park"], lat: 12.9319, lng: 77.6864 },
  { id: "ub-city", label: "UB City · Vittal Mallya Road", aliases: ["ub city", "vittal mallya"], lat: 12.9716, lng: 77.5946 },
  { id: "bial", label: "Kempegowda International Airport (BIAL)", aliases: ["bial", "blr airport", "bangalore airport", "kia", "kempegowda airport"], lat: 13.1986, lng: 77.7066 },
  // ── neighbourhoods (people often search by area, not building) ──
  { id: "mg-road", label: "MG Road", aliases: ["mg road", "mahatma gandhi road"], lat: 12.9759, lng: 77.6058 },
  { id: "indiranagar", label: "Indiranagar", aliases: ["indiranagar", "indira nagar", "100 feet road", "100ft road"], lat: 12.9716, lng: 77.6411 },
  { id: "koramangala", label: "Koramangala", aliases: ["koramangala", "5th block koramangala", "forum mall"], lat: 12.9352, lng: 77.6245 },
  { id: "hsr-layout", label: "HSR Layout", aliases: ["hsr", "hsr layout"], lat: 12.9116, lng: 77.6473 },
  { id: "whitefield", label: "Whitefield", aliases: ["whitefield"], lat: 12.9698, lng: 77.7500 },
  { id: "marathahalli", label: "Marathahalli", aliases: ["marathahalli"], lat: 12.9583, lng: 77.6970 },
  { id: "bellandur", label: "Bellandur", aliases: ["bellandur"], lat: 12.9258, lng: 77.6760 },
  { id: "sarjapur-road", label: "Sarjapur Road", aliases: ["sarjapur road", "sarjapur"], lat: 12.9054, lng: 77.6797 },
  { id: "hebbal", label: "Hebbal", aliases: ["hebbal"], lat: 13.0358, lng: 77.5970 },
];

// Backwards-compat alias for the prewarm action's input shape.
export const OFFICE_PRESETS: OfficePreset[] = OFFICE_LANDMARKS.map((l) => ({
  id: l.id,
  label: l.label,
  lat: l.lat,
  lng: l.lng,
}));

export type LandmarkHit = { label: string; lat: number; lng: number; placeId: string };

export function searchLandmarks(query: string, limit = 8): LandmarkHit[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  const out: LandmarkHit[] = [];
  for (const lm of OFFICE_LANDMARKS) {
    const matches =
      lm.label.toLowerCase().includes(q) ||
      lm.aliases.some((a) => a.includes(q));
    if (matches) {
      out.push({
        label: lm.label,
        lat: lm.lat,
        lng: lm.lng,
        placeId: `landmark-${lm.id}`,
      });
      if (out.length >= limit) break;
    }
  }
  return out;
}

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
