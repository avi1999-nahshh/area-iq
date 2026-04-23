import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const join = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) return { status: "already_joined" as const };

    await ctx.db.insert("waitlist", {
      email,
      joinedAt: Date.now(),
    });

    return { status: "joined" as const };
  },
});
