import { ImageResponse } from "next/og";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const runtime = "edge";

// 1080 × 1920 — Instagram Story / vertical format
const W = 1080;
const H = 1920;

function gradeFor(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: "A+", color: "#059669" };
  if (score >= 85) return { letter: "A",  color: "#059669" };
  if (score >= 80) return { letter: "A-", color: "#10b981" };
  if (score >= 75) return { letter: "B+", color: "#d97706" };
  if (score >= 70) return { letter: "B",  color: "#d97706" };
  if (score >= 65) return { letter: "B-", color: "#f59e0b" };
  if (score >= 60) return { letter: "C+", color: "#f59e0b" };
  if (score >= 55) return { letter: "C",  color: "#f97316" };
  if (score >= 50) return { letter: "C-", color: "#f97316" };
  if (score >= 45) return { letter: "D+", color: "#f43f5e" };
  if (score >= 40) return { letter: "D",  color: "#f43f5e" };
  return             { letter: "F",  color: "#e11d48" };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n.toLocaleString() + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode");
  if (!pincode) return new Response("missing pincode", { status: 400 });

  const data = await fetchQuery(
    api.area.getByPincode,
    { pincode },
    { url: process.env.NEXT_PUBLIC_CONVEX_URL }
  );
  if (!data) return new Response("pincode not found", { status: 404 });

  const { pincode: pc, scores, archetype, trivia } = data;
  const overall = Math.round(scores?.overall_score ?? 0);
  const grade = gradeFor(overall);
  const rank = scores?.national_rank ? ordinal(scores.national_rank) : null;
  const total = scores?.national_total?.toLocaleString() ?? "19,928";
  const emoji = archetype?.emoji ?? scores?.archetype_emoji ?? "🏘️";
  const archetypeName = archetype?.name ?? scores?.archetype_name ?? "Neighbourhood";

  // Pull one trivia fact for the pull quote
  const triviaFact =
    trivia?.facts?.[0] ??
    archetype?.tagline ??
    `${pc.name} is in the top ${Math.round(100 - (scores?.overall_national_pct ?? 50))}% of all areas in India.`;

  // Truncate fact if too long for the image
  const factDisplay =
    triviaFact.length > 120
      ? triviaFact.slice(0, 117) + "…"
      : triviaFact;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: "#fdfcf7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── subtle background accent ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: H * 0.55,
            background: "radial-gradient(ellipse 80% 60% at 50% 10%, #fff9e6 0%, #fdfcf7 100%)",
            display: "flex",
          }}
        />

        {/* ── TOP 20%: wordmark + pincode ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: H * 0.20,
            width: "100%",
            paddingTop: 80,
            gap: 16,
            position: "relative",
          }}
        >
          {/* AreaIQ wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <span style={{ fontSize: 52, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px" }}>
              Area
            </span>
            <span style={{ fontSize: 52, fontWeight: 700, color: "#f59e0b", letterSpacing: "-1px" }}>
              IQ
            </span>
          </div>
          {/* Pincode pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#0f172a",
              color: "#fff",
              borderRadius: 999,
              paddingLeft: 32,
              paddingRight: 32,
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            <span style={{ fontSize: 26, letterSpacing: 4, fontWeight: 600 }}>
              {pc.pincode}
            </span>
            <span style={{ fontSize: 22, color: "#94a3b8", fontWeight: 400 }}>·</span>
            <span style={{ fontSize: 26, fontWeight: 700 }}>
              {pc.name}
            </span>
          </div>
        </div>

        {/* ── NEXT 30%: emoji + archetype name ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: H * 0.30,
            width: "100%",
            gap: 28,
            position: "relative",
          }}
        >
          {/* Big emoji */}
          <div style={{ display: "flex", fontSize: 200, lineHeight: 1 }}>
            {emoji}
          </div>
          {/* Archetype name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 6,
                color: "#d97706",
                textTransform: "uppercase",
              }}
            >
              ARCHETYPE
            </span>
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-2px",
                lineHeight: 1,
                textAlign: "center",
              }}
            >
              {archetypeName}
            </span>
          </div>
        </div>

        {/* ── MIDDLE 30%: grade letter HUGE + ranked ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: H * 0.30,
            width: "100%",
            gap: 16,
            position: "relative",
          }}
        >
          {/* Grade letter */}
          <div
            style={{
              display: "flex",
              fontSize: 300,
              fontWeight: 700,
              color: grade.color,
              letterSpacing: "-12px",
              lineHeight: 0.85,
            }}
          >
            {grade.letter}
          </div>

          {/* Score + ranked */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 60, fontWeight: 700, color: "#0f172a", letterSpacing: "-2px" }}>
              {String(overall)}
            </span>
            <span style={{ fontSize: 28, color: "#cbd5e1", fontWeight: 500 }}>/100</span>
          </div>
          {rank && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#f1f5f9",
                borderRadius: 999,
                paddingLeft: 28,
                paddingRight: 28,
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              <span style={{ fontSize: 22, color: "#64748b", fontWeight: 600 }}>
                ranked {rank} of {total}
              </span>
            </div>
          )}
        </div>

        {/* ── NEXT 10%: pull quote ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: H * 0.10,
            width: "100%",
            paddingLeft: 80,
            paddingRight: 80,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              borderLeft: "4px solid #f59e0b",
              paddingLeft: 28,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontStyle: "italic",
                color: "#475569",
                lineHeight: 1.4,
              }}
            >
              &ldquo;{factDisplay}&rdquo;
            </span>
          </div>
        </div>

        {/* ── BOTTOM 10%: areaiq.app + swipe up ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: H * 0.10,
            width: "100%",
            borderTop: "1px solid #e2e8f0",
            gap: 10,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#0f172a" }}>areaiq</span>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#f59e0b" }}>.app</span>
          </div>
          <span
            style={{
              fontSize: 18,
              color: "#94a3b8",
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            swipe up to see your area
          </span>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
