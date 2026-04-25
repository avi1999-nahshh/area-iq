/**
 * Area lookup by pincode — returns the full joined record used by the report card,
 * the OG image route, and the share button.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getByPincode = query({
  args: { pincode: v.string() },
  handler: async (ctx, { pincode }) => {
    const [
      pc,
      census,
      airQuality,
      safety,
      infrastructure,
      transit,
      cleanliness,
      property,
      contacts,
      scores,
    ] = await Promise.all([
      ctx.db.query("pincodes").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("census").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("air_quality").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("safety").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("infrastructure").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("transit").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("cleanliness").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("property").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("contacts").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
      ctx.db.query("scores").withIndex("by_pincode", (q) => q.eq("pincode", pincode)).first(),
    ]);

    if (!pc) return null;

    const [trivia, archetype] = await Promise.all([
      ctx.db
        .query("trivia")
        .withIndex("by_district", (q) => q.eq("district", pc.district))
        .first(),
      scores
        ? ctx.db
            .query("archetypes")
            .withIndex("by_cluster_id", (q) => q.eq("cluster_id", scores.cluster_id))
            .first()
        : null,
    ]);

    return {
      pincode: pc,
      census,
      airQuality,
      safety,
      infrastructure,
      transit,
      cleanliness,
      property,
      contacts,
      scores,
      trivia,
      archetype,
    };
  },
});

// Lightweight lookup for search/autocomplete — just name + district from a prefix
export const searchByPrefix = query({
  args: { prefix: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { prefix, limit = 10 }) => {
    if (!prefix) return [];
    const results = await ctx.db
      .query("pincodes")
      .withIndex("by_pincode", (q) => q.gte("pincode", prefix).lt("pincode", prefix + "￿"))
      .take(limit);
    return results.map((r) => ({
      pincode: r.pincode,
      name: r.name,
      district: r.district,
      state: r.state,
    }));
  },
});

/**
 * Full-text neighbourhood search by area name. Reusable across /insights,
 * /compare, /proximity. The POC scopes to Bangalore urban via the optional
 * `metroOnly` filter; pass false to broaden once we expand beyond BLR.
 */
export const searchByName = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
    metroCity: v.optional(v.string()),
  },
  handler: async (ctx, { q, limit = 8, metroCity }) => {
    const term = q.trim();
    if (term.length < 2) return [];
    let results = await ctx.db
      .query("pincodes")
      .withSearchIndex("search_name", (s) =>
        metroCity ? s.search("name", term).eq("metro_city", metroCity) : s.search("name", term),
      )
      .take(limit * 2);

    // For Bangalore-only POC, also intersect with tier=urban via the scores table.
    if (metroCity === "Bengaluru") {
      const filtered: typeof results = [];
      for (const r of results) {
        const s = await ctx.db
          .query("scores")
          .withIndex("by_pincode", (q2) => q2.eq("pincode", r.pincode))
          .first();
        if (s?.tier === "urban") filtered.push(r);
        if (filtered.length >= limit) break;
      }
      results = filtered;
    } else {
      results = results.slice(0, limit);
    }

    return results.map((r) => ({
      pincode: r.pincode,
      name: r.name,
      district: r.district,
      state: r.state,
    }));
  },
});
