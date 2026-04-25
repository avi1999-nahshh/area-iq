import { ImageResponse } from "next/og";

export const runtime = "edge";

const W = 1200;
const H = 630;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pc = (searchParams.get("pc") || "").trim();
  const name = (searchParams.get("name") || "Bangalore").trim();
  const overall = Number(searchParams.get("overall") || 0) || 0;
  const brag = (searchParams.get("brag") || "AreaIQ").trim();

  const cleanName = name.replace(/\s*\(Bangalore\)\s*$/i, "");
  const overallText = overall > 0 ? String(Math.round(overall)) : "—";

  const mono =
    "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          background: "#0d1219",
          color: "#fff",
          fontFamily: "ui-sans-serif, system-ui",
        }}
      >
        {/* radial amber glow */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: -160,
            top: -160,
            width: 720,
            height: 720,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,158,11,0.32), rgba(245,158,11,0) 60%)",
          }}
        />

        {/* left column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 64px",
            width: 720,
          }}
        >
          {/* top: brand row + brag chip stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* brand row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              <div style={{ display: "flex" }}>
                <div style={{ display: "flex" }}>Area</div>
                <div style={{ display: "flex", color: "#f59e0b" }}>IQ</div>
              </div>
              <div style={{ display: "flex", opacity: 0.4, fontWeight: 400 }}>·</div>
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: "#fbbf24",
                  fontFamily: mono,
                }}
              >
                {pc}
              </div>
            </div>

            {/* brag chip */}
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                borderRadius: 8,
                overflow: "hidden",
                alignSelf: "flex-start",
              }}
            >
              <div style={{ display: "flex", width: 4, background: "#f59e0b" }} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(245,158,11,0.16)",
                  color: "#fbbf24",
                  padding: "10px 18px",
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {brag}
              </div>
            </div>
          </div>

          {/* big name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
              }}
            >
              {cleanName}.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#cbd5e1",
                lineHeight: 1.35,
                fontWeight: 400,
              }}
            >
              Bangalore, scored on six dimensions.
            </div>
          </div>

          {/* footer URL */}
          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#94a3b8",
              fontFamily: mono,
            }}
          >
            area-iq-one.vercel.app/insights/{pc}
          </div>
        </div>

        {/* right column — score */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "60px 72px",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#fbbf24",
              fontFamily: mono,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Overall AreaIQ
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 360,
              fontWeight: 800,
              letterSpacing: "-0.06em",
              lineHeight: 0.85,
              color: "#fff",
              fontFamily: mono,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {overallText}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#94a3b8",
              fontFamily: mono,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            of 100
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    },
  );
}
