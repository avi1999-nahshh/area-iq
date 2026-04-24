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
