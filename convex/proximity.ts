import { v } from "convex/values";
import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

type Mode = "transit" | "drive" | "walk";
type Destination = { pincode: string; lat: number; lng: number };

// ─── tunables ────────────────────────────────────────────
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OSRM_BASE = "https://router.project-osrm.org";
// OSRM public demo enforces max-table-size=100. Chunk destinations to stay under it.
const OSRM_CHUNK = 100;
// ToS asks for an identifying User-Agent on Nominatim requests.
const USER_AGENT = "AreaIQ/1.0 (proximity; avinash.dubey@even.in)";

// ─── helpers ─────────────────────────────────────────────
function bucketKey(lat: number, lng: number, mode: string): string {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return `${r(lat)},${r(lng)}|${mode}`;
}

function osrmProfile(mode: Mode): "driving" | "foot" {
  return mode === "walk" ? "foot" : "driving";
}

function modeMultiplier(mode: Mode): number {
  // OSRM gives free-flow road-network times. We treat:
  //   drive   = 1.0× (no traffic model — undersells BLR rush hour)
  //   transit = 0.95× (metro on long routes is slightly faster than driving)
  //   walk    = 1.0× (foot profile already accurate; no traffic to model)
  return mode === "transit" ? 0.95 : 1.0;
}

// Private helper. Calls OSRM /table chunked at OSRM_CHUNK destinations and
// returns minutes parallel to the input destinations. Used by both the
// per-search action and the prewarm batch. Throws on OSRM error.
async function fetchOsrmMinutes(
  originLat: number,
  originLng: number,
  mode: Mode,
  destinations: Destination[]
): Promise<number[]> {
  const profile = osrmProfile(mode);
  const mult = modeMultiplier(mode);
  const allMinutes: number[] = [];

  for (let i = 0; i < destinations.length; i += OSRM_CHUNK) {
    const chunk = destinations.slice(i, i + OSRM_CHUNK);
    const coords = [
      `${originLng},${originLat}`,
      ...chunk.map((d) => `${d.lng},${d.lat}`),
    ].join(";");
    const url = `${OSRM_BASE}/table/v1/${profile}/${coords}?sources=0&annotations=duration`;

    const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!resp.ok) {
      throw new Error(`OSRM ${resp.status}: ${await resp.text()}`);
    }
    const data: { durations?: (number | null)[][] } = await resp.json();
    if (!data.durations || !data.durations[0]) {
      throw new Error("OSRM returned no durations");
    }
    const minutes = data.durations[0]
      .slice(1)
      .map((sec) => (sec === null ? Infinity : (sec / 60) * mult));
    allMinutes.push(...minutes);
  }
  return allMinutes;
}

// ─── internal query: read cache ─────────────────────────
export const getCachedMatrix = internalQuery({
  args: { bucketKey: v.string() },
  handler: async (ctx, { bucketKey }) => {
    const row = await ctx.db
      .query("commute_cache")
      .withIndex("by_bucket", (q) => q.eq("bucketKey", bucketKey))
      .unique();
    if (!row) return null;
    if (Date.now() - row.computedAt > TTL_MS) return null;
    return { minutes: row.minutes, pincodes: row.pincodes };
  },
});

// ─── internal mutation: write cache (upsert) ────────────
export const upsertCachedMatrix = internalMutation({
  args: {
    bucketKey: v.string(),
    minutes: v.array(v.number()),
    pincodes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("commute_cache")
      .withIndex("by_bucket", (q) => q.eq("bucketKey", args.bucketKey))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        minutes: args.minutes,
        pincodes: args.pincodes,
        computedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("commute_cache", {
        bucketKey: args.bucketKey,
        minutes: args.minutes,
        pincodes: args.pincodes,
        computedAt: Date.now(),
      });
    }
    return null;
  },
});

// ─── public action: commute matrix ──────────────────────
// Returns origin → each destination in minutes. Uses OSRM /table on the public
// demo server (rate-limited; fine for testing). Caches by office bucket+mode.
type MatrixResult = {
  pincode: string;
  minutes: number;
}[];

export const commuteMatrix = action({
  args: {
    originLat: v.number(),
    originLng: v.number(),
    mode: v.union(v.literal("transit"), v.literal("drive"), v.literal("walk")),
    destinations: v.array(
      v.object({
        pincode: v.string(),
        lat: v.number(),
        lng: v.number(),
      })
    ),
  },
  handler: async (ctx, args): Promise<MatrixResult> => {
    const key = bucketKey(args.originLat, args.originLng, args.mode);

    // 1) Cache lookup
    const cached: { minutes: number[]; pincodes: string[] } | null =
      await ctx.runQuery(internal.proximity.getCachedMatrix, { bucketKey: key });
    if (cached) {
      const cachedMap = new Map(cached.pincodes.map((p, i) => [p, cached.minutes[i]]));
      return args.destinations.map((d) => ({
        pincode: d.pincode,
        minutes: cachedMap.get(d.pincode) ?? Infinity,
      }));
    }

    // 2) OSRM /table call(s) — chunked because the public demo caps at 100 dests
    const allMinutes = await fetchOsrmMinutes(
      args.originLat,
      args.originLng,
      args.mode,
      args.destinations
    );

    // 3) Persist to cache (parallel arrays keep it small + index-friendly)
    await ctx.runMutation(internal.proximity.upsertCachedMatrix, {
      bucketKey: key,
      minutes: allMinutes,
      pincodes: args.destinations.map((d) => d.pincode),
    });

    return args.destinations.map((d, i) => ({
      pincode: d.pincode,
      minutes: allMinutes[i],
    }));
  },
});

// ─── public action: geocode (Nominatim) ─────────────────
// Bangalore-bounded. Multi-pass: first the exact query, then with " Bangalore"
// appended if results are thin. Aliases like "BIAL" / "ORR" / "ECity" expand
// before any HTTP call. Hard BLR-bounding-box filter on the merged results.

type RawNominatim = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

// Common BLR shortcuts that OSM doesn't index. Expand BEFORE hitting Nominatim
// so the literal text the user typed still matches the intended landmark.
const QUERY_ALIASES: Record<string, string> = {
  "bial": "Kempegowda International Airport Bangalore",
  "blr airport": "Kempegowda International Airport Bangalore",
  "bangalore airport": "Kempegowda International Airport Bangalore",
  "orr": "Outer Ring Road Bangalore",
  "outer ring road": "Outer Ring Road Bangalore",
  "ecity": "Electronic City Bangalore",
  "e-city": "Electronic City Bangalore",
  "e city": "Electronic City Bangalore",
  "forum": "Forum Mall Koramangala Bangalore",
  "phoenix": "Phoenix Marketcity Bangalore",
  "ub city": "UB City Mall Bangalore",
  "manyata": "Manyata Tech Park Bangalore",
  "embassy techvillage": "Embassy Tech Village Bangalore",
  "embassy tech village": "Embassy Tech Village Bangalore",
  "itpl": "ITPL Whitefield Bangalore",
  "bagmane": "Bagmane Tech Park Bangalore",
  "rmz ecospace": "RMZ Ecospace Bellandur Bangalore",
  "ecospace": "RMZ Ecospace Bellandur Bangalore",
};

function expandAlias(q: string): string {
  const key = q.trim().toLowerCase();
  return QUERY_ALIASES[key] ?? q;
}

function inBlrBox(r: { lat: number; lng: number }): boolean {
  return r.lat >= 12.7 && r.lat <= 13.3 && r.lng >= 77.3 && r.lng <= 77.95;
}

async function nominatimSearch(q: string): Promise<RawNominatim[]> {
  const url =
    `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}` +
    `&format=json&countrycodes=in` +
    `&viewbox=77.30,13.30,77.95,12.70&bounded=0` +
    `&limit=15&addressdetails=0&dedupe=1`;
  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) return [];
  return resp.json();
}

export const geocode = action({
  args: { query: v.string() },
  handler: async (
    _ctx,
    { query }
  ): Promise<{ label: string; lat: number; lng: number; placeId: string }[]> => {
    const q = query.trim();
    if (q.length < 3) return [];

    const expanded = expandAlias(q);
    const lowQ = expanded.toLowerCase();
    const hasCity = lowQ.includes("bangalore") || lowQ.includes("bengaluru");

    // Pass 1: exact (or alias-expanded) query.
    const pass1 = await nominatimSearch(expanded);

    // Pass 2: append "Bangalore" if user didn't include it AND pass 1 was thin.
    // Forces Nominatim to rank Bangalore matches first; surfaces businesses,
    // streets, and POIs OSM has indexed but Nominatim wouldn't have ranked
    // top without the city anchor.
    let pass2: RawNominatim[] = [];
    if (!hasCity && pass1.length < 6) {
      pass2 = await nominatimSearch(`${expanded} Bangalore`);
    }

    // Merge, dedupe by place_id, hard-filter to BLR bounding box.
    const seen = new Set<number>();
    const merged: RawNominatim[] = [];
    for (const r of [...pass1, ...pass2]) {
      if (seen.has(r.place_id)) continue;
      seen.add(r.place_id);
      merged.push(r);
    }

    return merged
      .map((r) => ({
        label: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        placeId: String(r.place_id),
      }))
      .filter(inBlrBox)
      .slice(0, 12); // cap returned set
  },
});

// ─── public action: prewarm caches for known offices ─────
// One-shot tool for filling the cache up-front so the first user lands on a
// warm row. Caller passes the preset list + the BLR destination list once;
// action loops `presets × {transit, drive, walk}` and calls OSRM only for
// combos that aren't already cached. Idempotent — safe to re-run anytime.
type PrewarmResult = {
  warmed: number;
  skipped: number;
  failed: { presetId: string; mode: Mode; error: string }[];
};

export const prewarmPresets = action({
  args: {
    presets: v.array(
      v.object({ id: v.string(), lat: v.number(), lng: v.number() })
    ),
    destinations: v.array(
      v.object({
        pincode: v.string(),
        lat: v.number(),
        lng: v.number(),
      })
    ),
  },
  handler: async (ctx, args): Promise<PrewarmResult> => {
    const modes: Mode[] = ["transit", "drive", "walk"];
    let warmed = 0;
    let skipped = 0;
    const failed: { presetId: string; mode: Mode; error: string }[] = [];

    for (const preset of args.presets) {
      for (const mode of modes) {
        const key = bucketKey(preset.lat, preset.lng, mode);

        const cached: { minutes: number[]; pincodes: string[] } | null =
          await ctx.runQuery(internal.proximity.getCachedMatrix, {
            bucketKey: key,
          });
        if (cached) {
          skipped++;
          continue;
        }

        try {
          const minutes = await fetchOsrmMinutes(
            preset.lat,
            preset.lng,
            mode,
            args.destinations
          );
          await ctx.runMutation(internal.proximity.upsertCachedMatrix, {
            bucketKey: key,
            minutes,
            pincodes: args.destinations.map((d) => d.pincode),
          });
          warmed++;
        } catch (err) {
          failed.push({
            presetId: preset.id,
            mode,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    return { warmed, skipped, failed };
  },
});
