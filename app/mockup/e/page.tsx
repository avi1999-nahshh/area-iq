import { Instrument_Serif, Spectral, Jost, JetBrains_Mono } from "next/font/google";
import { MapPreview } from "../../area/[pincode]/map-preview";
import { KORAMANGALA as K } from "../data";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const serif = Spectral({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"] });
const ui = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

// Koramangala I Block approx centroid
const LAT = 12.9352;
const LNG = 77.6245;

/**
 * DIRECTION E — "Civic Brief"
 * A × D hybrid. Luxury editorial chassis (oatmeal + ink-navy + ochre,
 * Instrument Serif hero, oversized gutter numeral, drop cap) carrying
 * analyst-grade density (classification ribbon, small-multiples strip,
 * ranks ladder, strength/weakness/caveat). A wide map band sits between
 * hero and essay — the neighbourhood as frontispiece.
 */
export default function MockupE() {
  const dims: [string, number, string][] = [
    ["Air",         K.scores.air,         `AQI ${K.stats.aqi}`],
    ["Safety",      K.scores.safety,      `${K.stats.crimePerLakh}/lk`],
    ["Amenities",   K.scores.infra,       "top 0.3%"],
    ["Transit",     K.scores.transit,     `${K.transit.metroKm}km`],
    ["Cleanliness", K.scores.cleanliness, "Swachh 36"],
    ["Property",    K.scores.property,    "99th pct"],
  ];

  return (
    <div
      className={ui.className}
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        ["--paper" as string]: "#FAF6EE",
        ["--paper-2" as string]: "#F0E9D6",
        ["--rule" as string]: "#D9D1B8",
        ["--ink" as string]: "#1A2633",
        ["--muted" as string]: "#706B5D",
        ["--ochre" as string]: "#C88A1F",
        ["--ochre-dark" as string]: "#8B5E12",
        ["--alarm" as string]: "#B84B3A",
      } as React.CSSProperties}
    >
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 md:px-12 pt-6 sm:pt-8 pb-20 sm:pb-24">
        {/* classification ribbon — D's signature, recolored into A's palette */}
        <div
          className={`${mono.className} flex flex-wrap items-stretch`}
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            fontSize: "11px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span
            className="shrink-0"
            style={{ padding: "10px 14px", background: "var(--ochre)", color: "var(--ink)" }}
          >
            Report · #01.K.{K.pincode}
          </span>
          <span
            className="flex-1 min-w-0"
            style={{ padding: "10px 14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            Classification · <span style={{ color: "var(--ochre)" }}>{K.tier}</span> · {K.district} ({K.state})
          </span>
          <span
            className="hidden sm:inline shrink-0"
            style={{ padding: "10px 14px", opacity: 0.65 }}
          >
            AreaIQ Civic Quarterly · {K.edition}
          </span>
        </div>

        {/* masthead */}
        <div
          className="flex items-baseline justify-between pt-5 pb-5 mb-16"
          style={{
            borderBottom: "1px solid var(--rule)",
            fontSize: "10px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          <span>
            AreaIQ{" "}
            <span
              className={display.className}
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
                fontSize: 15,
                color: "var(--ink)",
              }}
            >
              Civic Brief
            </span>
          </span>
          <span>Issued {K.date} · Bengaluru Edition</span>
        </div>

        {/* hero: A's oversized gutter numeral + editorial headline */}
        <header className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 md:gap-12 items-start mb-12 md:mb-16">
          <div
            className={display.className}
            style={{
              fontSize: "clamp(5.5rem, 22vw, 14rem)",
              lineHeight: 0.82,
              fontWeight: 400,
              color: "var(--ochre)",
              letterSpacing: "-0.04em",
              fontStyle: "italic",
            }}
          >
            02
          </div>

          <div>
            <div
              className="mb-6 flex items-center gap-4"
              style={{
                fontSize: "10px",
                letterSpacing: "0.4em",
                color: "var(--muted)",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "inline-block", width: 32, height: 1, background: "var(--ochre)" }} />
              <span>The Bengaluru Dossier · Neighbourhood Brief</span>
            </div>

            <p
              className={serif.className}
              style={{
                fontStyle: "italic",
                fontSize: "1.375rem",
                color: "var(--muted)",
                marginBottom: "0.25rem",
                fontWeight: 400,
              }}
            >
              A report from
            </p>

            <h1
              className={display.className}
              style={{
                fontSize: "clamp(2.75rem, 10vw, 7.5rem)",
                lineHeight: 0.9,
                fontWeight: 400,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
                marginBottom: "1.5rem",
              }}
            >
              {K.name},<br />
              <span style={{ fontStyle: "italic", color: "var(--ochre)" }}>the hustler</span>&apos;s paradox.
            </h1>

            <p
              className={mono.className}
              style={{
                fontSize: "11px",
                letterSpacing: "0.22em",
                color: "var(--muted)",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: "2rem",
              }}
            >
              Pincode {K.pincode} · {K.district} · {K.state} ·{" "}
              <span style={{ color: "var(--ochre)" }}>{K.superlative}</span>
            </p>

            <p
              className={serif.className}
              style={{
                fontSize: "1.375rem",
                lineHeight: 1.5,
                color: "var(--ink)",
                fontWeight: 400,
                fontStyle: "italic",
                maxWidth: "620px",
              }}
            >
              {K.verdict}
            </p>
          </div>
        </header>

        {/* MAP BAND — neighbourhood as frontispiece */}
        <section className="mb-16">
          <div
            className="flex flex-wrap items-baseline justify-between gap-2 mb-3"
            style={{
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--muted)",
              fontWeight: 500,
            }}
          >
            <span>
              <span style={{ color: "var(--ochre)", marginRight: 10 }}>§ I</span> The Territory
            </span>
            <span className={`${mono.className} hidden sm:inline`}>
              {LAT.toFixed(4)}° N · {LNG.toFixed(4)}° E · r. 1.5km
            </span>
            <span className={`${mono.className} sm:hidden`}>r. 1.5km</span>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-0"
            style={{ border: "1px solid var(--ink)", background: "var(--paper-2)" }}
          >
            <div
              className="md:border-r md:border-b-0 border-b"
              style={{
                position: "relative",
                height: "clamp(280px, 55vw, 420px)",
                borderColor: "var(--ink)",
              }}
            >
              <MapPreview lat={LAT} lng={LNG} name={K.name} />
              {/* corner overlay */}
              <div
                className={mono.className}
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: "var(--ink)",
                  color: "var(--paper)",
                  padding: "6px 10px",
                  fontSize: "10px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  zIndex: 400,
                }}
              >
                Fig. 1 · {K.fullName}
              </div>
            </div>

            {/* map-side data panel — D's density, A's palette */}
            <div className="p-6 md:p-7">
              <p
                className={mono.className}
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "1rem",
                  fontWeight: 600,
                }}
              >
                Within a 1.5 km radius
              </p>

              {[
                ["Cafés", K.amenities.cafes],
                ["Restaurants", K.amenities.restaurants],
                ["Banks", K.amenities.banks],
                ["Pharmacies", K.amenities.pharmacies],
                ["Hospitals", K.amenities.hospitals],
                ["Schools", K.amenities.schools],
                ["Parks", K.amenities.parks],
              ].map(([label, v]) => (
                <div
                  key={label as string}
                  className="flex items-baseline justify-between py-1.5"
                  style={{ borderBottom: "1px dotted var(--rule)" }}
                >
                  <span
                    className={serif.className}
                    style={{ fontStyle: "italic", fontSize: 15, color: "var(--ink)" }}
                  >
                    {label}
                  </span>
                  <span
                    className={display.className}
                    style={{
                      fontSize: "1.5rem",
                      color: "var(--ink)",
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1,
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}

              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--rule)",
                }}
              >
                <p
                  className={mono.className}
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 4,
                  }}
                >
                  Nearest metro
                </p>
                <p
                  className={serif.className}
                  style={{
                    fontSize: "1rem",
                    color: "var(--ink)",
                    fontStyle: "italic",
                    lineHeight: 1.35,
                  }}
                >
                  {K.transit.metroName}{" "}
                  <span className={mono.className} style={{ color: "var(--ochre)", fontSize: 12, fontStyle: "normal" }}>
                    · {K.transit.metroKm} km
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SMALL MULTIPLES STRIP — D's signature */}
        <section
          className="mb-20"
          style={{ borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)", padding: "1.5rem 0" }}
        >
          <p
            className={mono.className}
            style={{
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "1.25rem",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "var(--ochre)", marginRight: 10 }}>§ II</span> Six Dimensions · 0–100
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-5 sm:gap-6">
            {dims.map(([label, score, meta]) => {
              const s = score as number;
              const color = s >= 70 ? "var(--ochre)" : s >= 45 ? "var(--ink)" : "var(--alarm)";
              return (
                <div key={label as string} style={{ textAlign: "left" }}>
                  <p
                    className={mono.className}
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontWeight: 600,
                      marginBottom: "6px",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    className={display.className}
                    style={{
                      fontSize: "3rem",
                      fontWeight: 400,
                      fontStyle: "italic",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      color,
                    }}
                  >
                    {score}
                  </p>
                  <div
                    style={{
                      height: 3,
                      background: "var(--rule)",
                      marginTop: 10,
                      position: "relative",
                    }}
                  >
                    <div style={{ width: `${s}%`, height: "100%", background: color }} />
                  </div>
                  <p
                    className={mono.className}
                    style={{
                      fontSize: "10px",
                      color: "var(--muted)",
                      marginTop: 6,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {meta}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ESSAY + AT-A-GLANCE — A's editorial column + D's grade card */}
        <section className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10 md:gap-16 mb-16 md:mb-20">
          <div>
            <p
              className={mono.className}
              style={{
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "1.25rem",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "var(--ochre)", marginRight: 10 }}>§ III</span> The Dispatch
            </p>

            <p
              className={serif.className}
              style={{
                fontSize: "1.1875rem",
                lineHeight: 1.7,
                color: "var(--ink)",
                marginBottom: "1.5rem",
                fontWeight: 400,
              }}
            >
              <span
                className={display.className}
                style={{
                  float: "left",
                  fontSize: "5.5rem",
                  lineHeight: 0.85,
                  marginRight: "0.75rem",
                  marginTop: "0.3rem",
                  color: "var(--ochre)",
                  fontWeight: 400,
                  fontStyle: "italic",
                }}
              >
                {K.narrative.charAt(0)}
              </span>
              {K.narrative.slice(1)}
            </p>

            <blockquote
              className={display.className}
              style={{
                fontSize: "2.25rem",
                lineHeight: 1.15,
                fontStyle: "italic",
                color: "var(--ink)",
                margin: "2.5rem 0",
                paddingLeft: "2rem",
                borderLeft: "3px solid var(--ochre)",
                fontWeight: 400,
              }}
            >
              &ldquo;Koramangala ranks above 99% of India on amenities, and trails 97% of India on air quality. In one block, the cost of convenience is measured in PM2.5.&rdquo;
            </blockquote>

            <p
              className={serif.className}
              style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "var(--ink)" }}
            >
              {K.facts[1]}
            </p>
          </div>

          <aside>
            <div
              style={{
                padding: "2rem",
                background: "var(--paper-2)",
                border: "1px solid var(--ink)",
                position: "relative",
              }}
            >
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

              <div className="flex items-baseline gap-4 mb-7 mt-4">
                <span
                  className={display.className}
                  style={{
                    fontSize: "7.5rem",
                    fontWeight: 400,
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
                      fontStyle: "italic",
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
                      marginTop: 4,
                    }}
                  >
                    of 100
                  </p>
                </div>
              </div>

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
                        fontSize: "1.25rem",
                        fontStyle: "italic",
                        color: "var(--ink)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {rank}{" "}
                      <span
                        className={mono.className}
                        style={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          letterSpacing: "0.06em",
                          fontStyle: "normal",
                        }}
                      >
                        {total}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "0.875rem 1rem",
                  background: "var(--ochre)",
                  color: "var(--ink)",
                }}
              >
                <p
                  className={mono.className}
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: 4,
                    opacity: 0.85,
                  }}
                >
                  Distinction
                </p>
                <p
                  className={display.className}
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 400,
                    fontStyle: "italic",
                    lineHeight: 1.25,
                  }}
                >
                  {K.superlative}
                </p>
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                <p style={{ marginBottom: 4 }}>Represented by</p>
                <p
                  className={serif.className}
                  style={{
                    fontSize: "1.125rem",
                    letterSpacing: 0,
                    textTransform: "none",
                    color: "var(--ink)",
                    fontStyle: "italic",
                    fontWeight: 500,
                  }}
                >
                  {K.representative.name},{" "}
                  <span style={{ color: "var(--ochre-dark)" }}>{K.representative.party}</span>
                </p>
                <p style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                  {K.representative.constituency}
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* STRENGTH / WEAKNESS / CAVEAT — D's signature */}
        <section className="mb-16">
          <p
            className={mono.className}
            style={{
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "1.5rem",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "var(--ochre)", marginRight: 10 }}>§ IV</span> Findings
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                tag: "Strength",
                tagColor: "var(--ochre)",
                stat: K.scores.infra,
                statLabel: "Amenity Score",
                body: `Ninety-ninth-percentile amenity density nationally — ${K.amenities.cafes} cafes, ${K.amenities.restaurants} restaurants, ${K.amenities.banks} banks, ${K.amenities.pharmacies} pharmacies within the pincode boundary.`,
              },
              {
                tag: "Weakness",
                tagColor: "var(--alarm)",
                stat: K.scores.air,
                statLabel: "Air Quality",
                body: `PM2.5 averages well above WHO thresholds. AQI ${K.stats.aqi} at the nearest CPCB station places this pincode in the bottom 3% of India.`,
              },
              {
                tag: "Caveat",
                tagColor: "var(--muted)",
                stat: K.scores.cleanliness,
                statLabel: "Cleanliness",
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
                      fontWeight: 400,
                      fontStyle: "italic",
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
                  className={serif.className}
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "var(--ink)",
                  }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* colophon */}
        <footer
          className={`${mono.className} flex flex-wrap justify-between gap-y-2 gap-x-4`}
          style={{
            marginTop: "4rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--rule)",
            fontSize: "10px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          <span className="min-w-0">
            <span className="hidden sm:inline">Methodology · </span>
            Census · CPCB · NCRB · OSM · Swachh · MyNeta
          </span>
          <span className="shrink-0">§ 01 / {K.nationalTotal.toLocaleString()}</span>
        </footer>
      </div>
    </div>
  );
}
