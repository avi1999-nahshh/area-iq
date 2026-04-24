import { ImageResponse } from "next/og";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const runtime = "edge";

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

function buildVerdict(s: {
  air_quality_score?: number; safety_score?: number; infrastructure_score?: number;
  transit_score?: number; cleanliness_score?: number; property_score?: number;
}): string {
  const dims: [string, number][] = [
    ["air",         s.air_quality_score ?? 50],
    ["safety",      s.safety_score ?? 50],
    ["amenities",   s.infrastructure_score ?? 50],
    ["transit",     s.transit_score ?? 50],
    ["cleanliness", s.cleanliness_score ?? 50],
    ["buzz",        s.property_score ?? 50],
  ];
  const sorted = [...dims].sort((a, b) => b[1] - a[1]);
  const strong = sorted.slice(0, 2).filter((x) => x[1] >= 65).map((x) => x[0]);
  const weak   = sorted.slice(-2).filter((x) => x[1] < 50).map((x) => x[0]);
  if (strong.length && weak.length)
    return `strong on ${strong.join(" + ")}, held back by ${weak.join(" + ")}`;
  if (strong.length) return `best known for its ${strong.join(" + ")}`;
  if (weak.length)   return `average · weak on ${weak.join(" + ")}`;
  return "solidly average across the board";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode");
  if (!pincode) return new Response("missing pincode", { status: 400 });

  const data = await fetchQuery(api.area.getByPincode, { pincode },
    { url: process.env.NEXT_PUBLIC_CONVEX_URL });
  if (!data) return new Response("pincode not found", { status: 404 });

  const { pincode: pc, scores, archetype } = data;
  const overall = Math.round(scores?.overall_score ?? 0);
  const grade = gradeFor(overall);
  const verdict = scores ? buildVerdict(scores) : "";
  const rank = scores?.national_rank ? ordinal(scores.national_rank) : null;
  const total = scores?.national_total?.toLocaleString() ?? "19,928";

  const dims: [string, number][] = [
    ["air",         Math.round(scores?.air_quality_score ?? 0)],
    ["safety",      Math.round(scores?.safety_score ?? 0)],
    ["amenities",   Math.round(scores?.infrastructure_score ?? 0)],
    ["transit",     Math.round(scores?.transit_score ?? 0)],
    ["cleanliness", Math.round(scores?.cleanliness_score ?? 0)],
    ["buzz",        Math.round(scores?.property_score ?? 0)],
  ];

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630, background: "#fdfcf7",
        display: "flex", flexDirection: "column",
        padding: "60px 72px", fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
      }}>
        {/* top tag row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8", fontSize: 16, fontWeight: 500 }}>
          <div style={{ display: "flex", letterSpacing: 3 }}>{`PINCODE · ${pc.pincode}`}</div>
          <div style={{ display: "flex", fontWeight: 700 }}>
            <div style={{ display: "flex", color: "#0f172a" }}>Area</div>
            <div style={{ display: "flex", color: "#f59e0b" }}>IQ</div>
          </div>
        </div>

        {/* archetype hero */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 28, marginTop: 36 }}>
          <div style={{ display: "flex", fontSize: 140, lineHeight: 0.9 }}>
            {archetype?.emoji ?? "🏘️"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", fontSize: 13, letterSpacing: 3, color: "#d97706", fontWeight: 700, marginBottom: 10 }}>
              ARCHETYPE
            </div>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#0f172a", letterSpacing: "-2px", lineHeight: 0.95 }}>
              {archetype?.name ?? "Neighbourhood"}
            </div>
            {archetype?.tagline && (
              <div style={{ display: "flex", fontSize: 22, color: "#64748b", fontStyle: "italic", marginTop: 14, lineHeight: 1.25 }}>
                {`“${archetype.tagline}”`}
              </div>
            )}
          </div>
        </div>

        {/* grade + verdict + rank */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 32, marginTop: 44 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 13, letterSpacing: 3, color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>
              GRADE
            </div>
            <div style={{ display: "flex", fontSize: 180, fontWeight: 700, color: grade.color, letterSpacing: "-10px", lineHeight: 0.8 }}>
              {grade.letter}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingBottom: 18 }}>
            <div style={{ display: "flex", fontSize: 13, letterSpacing: 3, color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>
              OVERALL
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: "#0f172a", letterSpacing: "-2px", lineHeight: 1 }}>
                {String(overall)}
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "#cbd5e1", fontWeight: 500 }}>
                /100
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#334155", marginTop: 14, lineHeight: 1.3 }}>
              {verdict}
            </div>
            {rank && (
              <div style={{ display: "flex", fontSize: 14, color: "#94a3b8", marginTop: 10 }}>
                {`ranked ${rank} of ${total} pincodes`}
              </div>
            )}
          </div>
        </div>

        {/* dimension ladder */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 32, borderTop: "1px solid #e2e8f0" }}>
          {dims.map(([label, v]) => {
            const c = v >= 70 ? "#f59e0b" : v >= 50 ? "#94a3b8" : "#f43f5e";
            return (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 24,
                borderBottom: "1px solid #f1f5f9", padding: "0",
                height: 36,
              }}>
                <div style={{ display: "flex", width: 150, fontSize: 13, letterSpacing: 2, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
                  {label}
                </div>
                <div style={{ display: "flex", flex: 1, height: 1, background: "#f1f5f9", position: "relative" }}>
                  <div style={{ display: "flex", width: `${v}%`, height: 1, background: c }} />
                </div>
                <div style={{ display: "flex", width: 76, fontSize: 32, fontWeight: 700, color: c, justifyContent: "flex-end", letterSpacing: "-1px" }}>
                  {String(v)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
