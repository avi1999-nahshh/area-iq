import { Spectral, Jost, JetBrains_Mono } from "next/font/google";
import { KORAMANGALA as K } from "../data";

const display = Spectral({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"] });
const body = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

/**
 * DIRECTION D — "Urban Analyst Report"
 * Think FiveThirtyEight × Bloomberg Opinion × Places Journal. Data-first hierarchy,
 * classification ribbons, inline small multiples, sharp typography with one quiet
 * teal accent. Reads smart-and-shareable without going wonky.
 */
export default function MockupD() {
  const dims: [string, number, string][] = [
    ["Air",         K.scores.air,         "AQI 185"],
    ["Safety",      K.scores.safety,      "950/lk"],
    ["Amenities",   K.scores.infra,       "top 0.3%"],
    ["Transit",     K.scores.transit,     "1.5km"],
    ["Cleanliness", K.scores.cleanliness, "Swachh 36"],
    ["Property",    K.scores.property,    "99th pct"],
  ];

  return (
    <div
      className={body.className}
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        ["--paper" as string]: "#F7F3EC",
        ["--paper-2" as string]: "#FFFFFF",
        ["--rule" as string]: "#D8D2C4",
        ["--ink" as string]: "#1A1A18",
        ["--muted" as string]: "#7A776F",
        ["--teal" as string]: "#2E7C7B",
        ["--teal-dark" as string]: "#1F5655",
      } as React.CSSProperties}
    >
      <div className="max-w-[1180px] mx-auto px-6 sm:px-12 pt-10 pb-20">
        {/* classification ribbon — the signature */}
        <div
          className={mono.className}
          style={{
            display: "flex",
            alignItems: "stretch",
            background: "var(--ink)",
            color: "var(--paper)",
            fontSize: "11px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span style={{ padding: "10px 16px", background: "var(--teal)", color: "#fff" }}>
            Report · #01.K.560034
          </span>
          <span style={{ padding: "10px 16px", flex: 1 }}>
            Classification · <span style={{ color: "var(--teal)" }}>Urban Prime Core</span> · Bengaluru (Karnataka)
          </span>
          <span style={{ padding: "10px 16px", color: "var(--paper)", opacity: 0.6 }}>
            Issued {K.date}
          </span>
        </div>

        {/* executive hero */}
        <header className="mt-12 grid grid-cols-[1fr_400px] gap-14">
          <div>
            <p
              className={mono.className}
              style={{
                fontSize: "11px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--teal)",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
            >
              Neighbourhood Brief · 2026
            </p>

            <h1
              className={display.className}
              style={{
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                fontWeight: 400,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                marginBottom: "1rem",
              }}
            >
              <span style={{ color: "var(--muted)" }}>560034 ·</span> {K.name}:<br />
              <em>{K.archetype.toLowerCase()}</em>, priced in smog.
            </h1>

            <p
              className={display.className}
              style={{
                fontSize: "1.25rem",
                lineHeight: 1.5,
                color: "var(--ink)",
                fontWeight: 400,
                maxWidth: "580px",
                fontStyle: "italic",
              }}
            >
              {K.verdict}
            </p>

            {/* small multiples — THE SIGNATURE */}
            <div
              className="mt-10 grid grid-cols-6 gap-4"
              style={{ padding: "1.25rem 0", borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)" }}
            >
              {dims.map(([label, score, meta]) => {
                const s = score as number;
                const color = s >= 70 ? "var(--teal)" : s >= 45 ? "var(--ink)" : "#B84B3A";
                return (
                  <div key={label as string} style={{ textAlign: "left" }}>
                    <p
                      className={mono.className}
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      className={display.className}
                      style={{
                        fontSize: "2.5rem",
                        fontWeight: 500,
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                        color,
                      }}
                    >
                      {score}
                    </p>
                    {/* mini bar */}
                    <div
                      style={{
                        height: "3px",
                        background: "var(--rule)",
                        marginTop: "8px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${s}%`,
                          height: "100%",
                          background: color,
                        }}
                      />
                    </div>
                    <p
                      className={mono.className}
                      style={{
                        fontSize: "10px",
                        color: "var(--muted)",
                        marginTop: "4px",
                      }}
                    >
                      {meta}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* right — large classification card */}
          <aside>
            <div
              style={{
                padding: "2rem",
                background: "var(--paper-2)",
                border: "1px solid var(--ink)",
                position: "relative",
              }}
            >
              {/* corner tag */}
              <div
                className={mono.className}
                style={{
                  position: "absolute",
                  top: -1,
                  right: -1,
                  background: "var(--ink)",
                  color: "var(--paper)",
                  padding: "6px 12px",
                  fontSize: "10px",
                  letterSpacing: "0.24em",
                  fontWeight: 600,
                }}
              >
                Grade
              </div>

              <div className="flex items-baseline gap-4 mb-8 mt-4">
                <span
                  className={display.className}
                  style={{
                    fontSize: "7.5rem",
                    fontWeight: 500,
                    lineHeight: 0.85,
                    color: "var(--ink)",
                    fontStyle: "italic",
                    letterSpacing: "-0.06em",
                  }}
                >
                  {K.grade}
                </span>
                <div>
                  <p
                    className={display.className}
                    style={{
                      fontSize: "2.25rem",
                      fontWeight: 400,
                      lineHeight: 1,
                      color: "var(--muted)",
                    }}
                  >
                    {K.overall}
                  </p>
                  <p
                    className={mono.className}
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginTop: "4px",
                    }}
                  >
                    of 100
                  </p>
                </div>
              </div>

              {/* ranks ladder */}
              <div>
                {[
                  ["Nationally", `#${K.nationalRank.toLocaleString()}`, `of ${K.nationalTotal.toLocaleString()}`],
                  ["In Karnataka", "#1,202", "of 1,355"],
                  ["In Bangalore", "#54", "of 115"],
                  ["In metro Bengaluru", "#56", "of 128"],
                ].map(([label, rank, total]) => (
                  <div
                    key={label as string}
                    className="flex items-baseline justify-between py-2"
                    style={{ borderBottom: "1px solid var(--rule)" }}
                  >
                    <span
                      className={mono.className}
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      className={display.className}
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 500,
                        color: "var(--ink)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {rank}{" "}
                      <span className={mono.className} style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.06em" }}>
                        {total}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {/* superlative callout */}
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "0.875rem 1rem",
                  background: "var(--teal)",
                  color: "#fff",
                }}
              >
                <p
                  className={mono.className}
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: "4px",
                    opacity: 0.8,
                  }}
                >
                  Distinction
                </p>
                <p
                  className={display.className}
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    fontStyle: "italic",
                    lineHeight: 1.3,
                  }}
                >
                  {K.superlative}
                </p>
              </div>
            </div>
          </aside>
        </header>

        {/* key findings */}
        <section className="mt-16 grid grid-cols-3 gap-8">
          {[
            {
              tag: "Strength",
              tagColor: "var(--teal)",
              stat: "99",
              statLabel: "Amenity Score",
              body: "Ninety-ninth-percentile amenity density nationally — 27 cafes, 56 restaurants, 35 banks, 13 pharmacies within pincode boundary.",
            },
            {
              tag: "Weakness",
              tagColor: "#B84B3A",
              stat: "7",
              statLabel: "Air Quality Score",
              body: `PM2.5 averages well above WHO thresholds. AQI ${K.stats.aqi} at the nearest CPCB station places this pincode in the bottom 3% of India.`,
            },
            {
              tag: "Caveat",
              tagColor: "var(--muted)",
              stat: "14",
              statLabel: "Cleanliness Score",
              body: "BBMP's Swachh Survekshan rank of 36 puts Bengaluru behind 35 million-plus cities on waste management.",
            },
          ].map((f) => (
            <div
              key={f.tag}
              style={{
                borderTop: "2px solid var(--ink)",
                paddingTop: "1rem",
              }}
            >
              <p
                className={mono.className}
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: f.tagColor,
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                }}
              >
                {f.tag}
              </p>
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className={display.className}
                  style={{
                    fontSize: "4.5rem",
                    lineHeight: 1,
                    fontWeight: 500,
                    letterSpacing: "-0.04em",
                    color: f.tagColor,
                  }}
                >
                  {f.stat}
                </span>
                <span
                  className={mono.className}
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  {f.statLabel}
                </span>
              </div>
              <p
                className={body.className}
                style={{
                  fontSize: "14px",
                  lineHeight: 1.55,
                  color: "var(--ink)",
                }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </section>

        {/* methodology footer */}
        <footer
          className={mono.className}
          style={{
            marginTop: "4rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--rule)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--muted)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Methodology: Census 2011 · CPCB · NCRB · OSM · Swachh Survekshan · MyNeta
          </span>
          <span>§ Report 01 / 19,928</span>
        </footer>
      </div>
    </div>
  );
}
