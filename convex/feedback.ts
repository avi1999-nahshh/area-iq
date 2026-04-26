import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// ── public mutation ──────────────────────────────────
export const submit = mutation({
  args: {
    surface: v.string(),
    sentiment: v.union(
      v.literal("up"),
      v.literal("down"),
      v.literal("text"),
    ),
    comment: v.optional(v.string()),
    email: v.optional(v.string()),
    context: v.optional(v.string()),
    user_agent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // basic guards: cap comment + email length
    const comment = args.comment?.slice(0, 2000);
    const email = args.email?.slice(0, 200);
    return await ctx.db.insert("feedback", {
      surface: args.surface,
      sentiment: args.sentiment,
      ...(comment ? { comment } : {}),
      ...(email ? { email } : {}),
      ...(args.context ? { context: args.context } : {}),
      ...(args.user_agent ? { user_agent: args.user_agent } : {}),
      createdAt: Date.now(),
    });
  },
});

// ── internal: list undigested feedback rows ──────────
export const listUndigested = internalQuery({
  args: {},
  handler: async (ctx) => {
    // by_undigested = ["digestSentAt", "createdAt"]; query by digestSentAt == undefined
    const rows: Doc<"feedback">[] = await ctx.db
      .query("feedback")
      .withIndex("by_undigested", (q) => q.eq("digestSentAt", undefined))
      .order("desc")
      .take(500);
    return rows;
  },
});

// ── internal: mark rows as digested ──────────────────
export const markDigested = internalMutation({
  args: {
    ids: v.array(v.id("feedback")),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { digestSentAt: args.sentAt });
    }
    return null;
  },
});

// ── internal: send daily digest via Resend ───────────
export const sendDailyDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    const rows: Doc<"feedback">[] = await ctx.runQuery(
      internal.feedback.listUndigested,
      {},
    );

    if (rows.length === 0) {
      console.log("[feedback digest] no new feedback");
      return null;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[feedback digest] RESEND_API_KEY not set — skipping send. " +
          `${rows.length} undigested rows remain.`,
      );
      return null;
    }

    const recipient =
      process.env.FEEDBACK_DIGEST_TO ?? "avinash.dubey@even.in";
    const html = renderDigestHtml(rows);
    const subject = `AreaIQ feedback digest — ${rows.length} new`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "feedback@resend.dev",
        to: recipient,
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(
        `[feedback digest] Resend send failed: ${resp.status} ${text}`,
      );
      return null;
    }

    const ids: Id<"feedback">[] = rows.map((r) => r._id);
    await ctx.runMutation(internal.feedback.markDigested, {
      ids,
      sentAt: Date.now(),
    });

    console.log(`[feedback digest] sent ${rows.length} rows to ${recipient}`);
    return null;
  },
});

// ── helpers ──────────────────────────────────────────
function renderDigestHtml(rows: Doc<"feedback">[]): string {
  const bySurface = new Map<string, Doc<"feedback">[]>();
  for (const r of rows) {
    const list = bySurface.get(r.surface) ?? [];
    list.push(r);
    bySurface.set(r.surface, list);
  }

  const sections: string[] = [];
  // sort surface keys for stable output
  const surfaceKeys = Array.from(bySurface.keys()).sort();
  for (const surface of surfaceKeys) {
    const items = bySurface.get(surface) ?? [];
    const tableRows = items
      .map((r) => {
        const time = new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 16);
        return `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(r.sentiment)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(r.comment ?? "")}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(r.email ?? "")}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(r.context ?? "")}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;color:#888;">${time} UTC</td>
        </tr>`;
      })
      .join("");

    sections.push(`
      <h2 style="font-size:16px;margin:24px 0 8px;font-family:system-ui,sans-serif;">
        ${escapeHtml(surface)} <span style="color:#888;font-weight:normal;">(${items.length})</span>
      </h2>
      <table style="border-collapse:collapse;width:100%;font-family:system-ui,sans-serif;font-size:13px;">
        <thead>
          <tr style="text-align:left;color:#666;">
            <th style="padding:6px 10px;border-bottom:2px solid #ddd;">sentiment</th>
            <th style="padding:6px 10px;border-bottom:2px solid #ddd;">comment</th>
            <th style="padding:6px 10px;border-bottom:2px solid #ddd;">email</th>
            <th style="padding:6px 10px;border-bottom:2px solid #ddd;">context</th>
            <th style="padding:6px 10px;border-bottom:2px solid #ddd;">time</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `);
  }

  return `<!doctype html>
<html><body style="background:#fafafa;padding:24px;color:#222;">
  <div style="max-width:760px;margin:0 auto;background:#fff;padding:24px;border:1px solid #eee;border-radius:8px;">
    <h1 style="font-size:20px;margin:0 0 4px;font-family:system-ui,sans-serif;">AreaIQ feedback digest</h1>
    <p style="margin:0 0 16px;color:#666;font-family:system-ui,sans-serif;font-size:13px;">
      ${rows.length} new entr${rows.length === 1 ? "y" : "ies"} since the last digest.
    </p>
    ${sections.join("")}
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
