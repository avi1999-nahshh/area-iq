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
// Bangalore-bounded. Returns up to 5 candidates for free-text address input.
// Wire this when the office field becomes typeable; it's already deployed so
// the UI can adopt it without another Convex push.
export const geocode = action({
  args: { query: v.string() },
  handler: async (
    _ctx,
    { query }
  ): Promise<{ label: string; lat: number; lng: number; placeId: string }[]> => {
    const q = query.trim();
    if (q.length < 3) return [];

    // viewbox = lng_min,lat_max,lng_max,lat_min — widened to catch outer ring,
    // airport, Whitefield, Hoskote edges, Electronic City extension. Soft
    // preference (bounded=0) so a slightly mistyped address still resolves;
    // we filter to a BLR-only box server-side below.
    const url =
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}` +
      `&format=json&countrycodes=in&viewbox=77.30,13.30,77.95,12.70&bounded=0&limit=10`;

    const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!resp.ok) return [];
    const data: Array<{
      display_name: string;
      lat: string;
      lon: string;
      place_id: number;
    }> = await resp.json();

    // Hard BLR filter: drop anything that crept in from outside the box
    // (Nominatim with bounded=0 returns viewbox-preferring but not viewbox-only).
    return data
      .map((r) => ({
        label: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        placeId: String(r.place_id),
      }))
      .filter(
        (r) =>
          r.lat >= 12.70 && r.lat <= 13.30 &&
          r.lng >= 77.30 && r.lng <= 77.95
      );
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
