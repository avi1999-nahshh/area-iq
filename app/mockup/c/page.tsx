import { Playfair_Display, Source_Serif_4, IBM_Plex_Sans_Condensed } from "next/font/google";
import { KORAMANGALA as K } from "../data";

const masthead = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"] });
const body = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600", "700"], style: ["normal", "italic"] });
const condensed = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

/**
 * DIRECTION C — "Broadsheet of Record"
 * A newspaper-of-record treatment: oversized masthead, dateline, 3-column grid,
 * drop-cap lead, running folio, one alarm-red accent reserved for critical flags.
 */
export default function MockupC() {
  return (
    <div
      className={body.className}
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        ["--paper" as string]: "#EDE7DC",
        ["--paper-2" as string]: "#E3DBC8",
        ["--rule" as string]: "#B5AD99",
        ["--rule-soft" as string]: "#D4CBB4",
        ["--ink" as string]: "#0A0A0A",
        ["--muted" as string]: "#666055",
        ["--red" as string]: "#B42D1C",
      } as React.CSSProperties}
    >
      <div className="max-w-[1080px] mx-auto px-6 sm:px-10 pt-6 pb-20">
        {/* masthead */}
        <div
          className="flex items-center justify-between pb-3 mb-1"
          style={{
            fontSize: "11px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--ink)",
            fontFamily: `"IBM Plex Sans Condensed", ui-sans-serif, sans-serif`,
          }}
        >
          <span>Vol. II · No. 142</span>
          <span>Saturday, April 24, 2026</span>
          <span>Edition ₹0</span>
        </div>

        {/* big masthead */}
        <h1
          className={masthead.className}
          style={{
            fontSize: "clamp(3.5rem, 9vw, 7rem)",
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            margin: "0.5rem 0",
          }}
        >
          The AreaIQ Dispatch
        </h1>

        <div
          className="flex items-center justify-between pt-2 pb-1"
          style={{
            borderTop: "3px double var(--ink)",
            borderBottom: "1px solid var(--ink)",
            fontSize: "11px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--ink)",
            fontFamily: `"IBM Plex Sans Condensed", ui-sans-serif, sans-serif`,
          }}
        >
          <span>Civic Desk · Bengaluru Bureau</span>
          <span
            className={body.className}
            style={{ fontStyle: "italic", letterSpacing: 0, textTransform: "none", fontSize: "12px" }}
          >
            &ldquo;Every neighbourhood, on record.&rdquo;
          </span>
          <span>Printed for pincode {K.pincode}</span>
        </div>

        {/* top story */}
        <section className="mt-10 mb-14">
          {/* kicker */}
          <p
            className={condensed.className}
            style={{
              fontSize: "11px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--red)",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Top Story · Neighbourhood Report
          </p>

          {/* banner headline */}
          <h2
            className={masthead.className}
            style={{
              fontSize: "clamp(3rem, 7vw, 5.5rem)",
              fontWeight: 900,
              lineHeight: 0.96,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            Koramangala Ranked India&apos;s
            <br />
            <em style={{ fontWeight: 700, fontStyle: "italic" }}>Top Amenity Hub</em>
          </h2>

          {/* deck */}
          <p
            className={body.className}
            style={{
              fontStyle: "italic",
              fontSize: "1.375rem",
              lineHeight: 1.35,
              color: "var(--ink)",
              textAlign: "center",
              maxWidth: "700px",
              margin: "0 auto 1.25rem auto",
            }}
          >
            Bengaluru block earns 99-percentile infrastructure score — but trails 97% of India on air quality and 86% on cleanliness. The tradeoff every hustler accepts.
          </p>

          {/* byline */}
          <p
            className={condensed.className}
            style={{
              fontSize: "11px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--muted)",
              fontWeight: 500,
              textAlign: "center",
              marginBottom: "2rem",
            }}
          >
            By AreaIQ Civic Desk · Pincode {K.pincode} · {K.date}
          </p>

          {/* 3-column body */}
          <div
            style={{
              columnCount: 3,
              columnGap: "2.5rem",
              columnRule: "1px solid var(--rule-soft)",
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "var(--ink)",
              textAlign: "justify",
              fontFamily: `var(--font-source-serif), "Source Serif 4", Georgia, serif`,
            }}
          >
            <p style={{ marginBottom: "1rem" }}>
              <span
                className={masthead.className}
                style={{
                  float: "left",
                  fontSize: "4.25rem",
                  lineHeight: 0.85,
                  marginRight: "0.5rem",
                  marginTop: "0.25rem",
                  fontWeight: 900,
                  color: "var(--ink)",
                }}
              >
                K
              </span>
              oramangala has always been the neighbourhood everyone talks about. Now the numbers confirm it: of all 19,928 Indian pincodes surveyed in the 2026 AreaIQ index, none pack more amenities per square kilometre, none have a denser cafe grid, and none convert their 100 Feet Road as hard.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              The cost is measurable. PM2.5 readings at the nearest CPCB station average {K.stats.aqi} — placing the block in the bottom 3% of India for air. BBMP&apos;s Swachh Survekshan rank for Bengaluru is 36, which translates to a cleanliness percentile in the bottom 14%.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              {K.facts[0]}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              {K.facts[1]}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              The representative here is Tejasvi Surya, BJP — who took Bangalore South with a decisive margin in 2024. Koramangala&apos;s classification in the index is <em>Urban Prime Core</em>.
            </p>
            <p>
              {K.facts[2]}
            </p>
          </div>
        </section>

        {/* at-a-glance box — below fold, newspaper-style */}
        <section
          className="grid grid-cols-[1fr_320px] gap-10 pt-8"
          style={{ borderTop: "2px solid var(--ink)" }}
        >
          <div>
            <p
              className={condensed.className}
              style={{
                fontSize: "11px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--ink)",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Section Two · Scorecard
            </p>
            <h3
              className={masthead.className}
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                lineHeight: 1,
                color: "var(--ink)",
                marginBottom: "1.25rem",
              }}
            >
              A grade of {" "}
              <em style={{ color: "var(--red)" }}>{K.grade}</em>, broken down.
            </h3>

            <div
              style={{
                columnCount: 2,
                columnGap: "2rem",
                fontFamily: `var(--font-source-serif), "Source Serif 4", Georgia, serif`,
                fontSize: "14px",
              }}
            >
              {[
                ["Air", K.scores.air, "Bottom 3% — AQI 185"],
                ["Safety", K.scores.safety, "Mid pack — 950 IPC/lakh"],
                ["Amenities", K.scores.infra, "Top 0.3% nationally"],
                ["Transit", K.scores.transit, "Metro 1.5km · rail 7.7km"],
                ["Cleanliness", K.scores.cleanliness, "Bottom 14% — Swachh 36"],
                ["Property", K.scores.property, "99th percentile buzz"],
              ].map(([label, score, meta]) => (
                <div
                  key={label as string}
                  style={{
                    breakInside: "avoid",
                    paddingBottom: "0.75rem",
                    marginBottom: "0.75rem",
                    borderBottom: "1px solid var(--rule-soft)",
                  }}
                >
                  <div
                    className={condensed.className}
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    {label}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={masthead.className}
                      style={{
                        fontSize: "2rem",
                        lineHeight: 1,
                        fontWeight: 900,
                        color: (score as number) >= 70 ? "var(--ink)" : (score as number) >= 45 ? "var(--ink)" : "var(--red)",
                      }}
                    >
                      {score}
                    </span>
                    <span
                      className={condensed.className}
                      style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em" }}
                    >
                      / 100
                    </span>
                  </div>
                  <div style={{ fontStyle: "italic", color: "var(--muted)", marginTop: "2px" }}>
                    {meta}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside
            style={{
              borderLeft: "1px solid var(--rule)",
              paddingLeft: "1.5rem",
              fontSize: "14px",
              lineHeight: 1.55,
            }}
          >
            <p
              className={condensed.className}
              style={{
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--red)",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Civic Alert
            </p>
            <p
              className={body.className}
              style={{
                fontStyle: "italic",
                fontSize: "1rem",
                color: "var(--ink)",
                marginBottom: "1.25rem",
              }}
            >
              Air quality in this block qualifies as &ldquo;Unhealthy&rdquo; on CPCB&apos;s scale for more than 40% of the year.
            </p>

            <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "1rem" }}>
              <p
                className={condensed.className}
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "0.25rem",
                }}
              >
                Amenity Ledger
              </p>
              {[
                ["Hospitals", K.amenities.hospitals],
                ["Schools", K.amenities.schools],
                ["Cafes", K.amenities.cafes],
                ["Restaurants", K.amenities.restaurants],
                ["Malls", K.amenities.malls],
                ["Parks", K.amenities.parks],
              ].map(([l, n]) => (
                <div
                  key={l as string}
                  className="flex items-baseline justify-between py-1"
                  style={{ borderBottom: "1px dotted var(--rule-soft)" }}
                >
                  <span className={body.className} style={{ fontStyle: "italic" }}>
                    {l}
                  </span>
                  <span className={condensed.className} style={{ fontWeight: 700 }}>
                    {n}
                  </span>
                </div>
              ))}
            </div>

            <p
              className={condensed.className}
              style={{
                marginTop: "1.25rem",
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              MP · {K.representative.name} ({K.representative.party}) · {K.representative.constituency}
            </p>
          </aside>
        </section>

        {/* folio */}
        <div
          className={condensed.className}
          style={{
            marginTop: "3rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--rule)",
            fontSize: "10px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          The AreaIQ Dispatch · Page 01 of 19,928 · Continues on Pincode 560038
        </div>
      </div>
    </div>
  );
}
