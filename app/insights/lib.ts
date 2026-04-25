import fs from "fs";
import path from "path";

export type IQv2 = {
  pincode: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  scores: {
    air: number;
    air_confident: boolean;
    amenities: number;
    essentials: number;
    lifestyle: number;
    connectivity: number;
    density: number;
    affordability: number;
    affordability_confident: boolean;
    walkability: number;
    overall: number;
  };
  ranks: Record<string, number>;
  percentile_blr: Record<string, number>;
  counts: {
    hospitals: number;
    schools: number;
    banks: number;
    cafes: number;
    restaurants: number;
    malls: number;
    parks: number;
    buses: number;
  };
  raw: {
    aqi: number | null;
    station_distance_km: number | null;
    metro_km: number | null;
    rail_km: number | null;
    rent_2bhk: number | null;
    rent_match: string | null;
    pop_density: number;
    wpr: number;
    hh_size: number;
    five_min_city: number;
    commute_under_30_pct: number;
  };
  brag_label: string;
  subhead: string;
};

let cache: IQv2[] | null = null;
let byPincode: Map<string, IQv2> | null = null;

function load(): IQv2[] {
  if (cache) return cache;
  const p = path.join(process.cwd(), "data", "processed", "iq_v2_blr.json");
  cache = JSON.parse(fs.readFileSync(p, "utf8"));
  byPincode = new Map(cache!.map((x) => [x.pincode, x]));
  return cache!;
}

export function getIQv2(pincode: string): IQv2 | null {
  load();
  return byPincode?.get(pincode) ?? null;
}

export function listIQv2(): IQv2[] {
  return load();
}
