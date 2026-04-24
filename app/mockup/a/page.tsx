import { Instrument_Serif, DM_Sans, Cormorant_Garamond } from "next/font/google";
import { KORAMANGALA as K } from "../data";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"] });

/**
 * DIRECTION A — "Monocle India Quarterly"
 * A luxury publication feel: generous whitespace, serif display with italic runs,
 * a single muted ochre accent, an oversized editorial gutter page number.
 */
export default function MockupA() {
  return (
    <div
      className={body.className}
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
      } as React.CSSProperties}
    >
      <div className="max-w-[1100px] mx-auto px-6 sm:px-12 pt-8 pb-24">
        {/* masthead */}
        <div
          className="flex items-baseline justify-between pb-5 mb-20"
          style={{
            borderBottom: "1px solid var(--rule)",
            fontSize: "10px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          <span>
            AreaIQ <span className={serif.className} style={{ fontStyle: "italic", fontWeight: 500, textTransform: "none", letterSpacing: 0, fontSize: 14, color: "var(--ink)" }}>Civic Quarterly</span>
          </span>
          <span>Volume II · April 2026 · Bengaluru Edition</span>
        </div>

        {/* hero with oversized gutter page number */}
        <header className="grid grid-cols-[160px_1fr] gap-12 items-start mb-24">
          {/* oversized page number — THE SIGNATURE */}
          <div
            className={display.className}
            style={{
              fontSize: "clamp(8rem, 16vw, 14rem)",
              lineHeight: 0.82,
              fontWeight: 400,
              color: "var(--ochre)",
              letterSpacing: "-0.04em",
              opacity: 0.95,
            }}
          >
            02
          </div>

          <div>
            {/* kicker */}
            <div
              className="mb-8 flex items-center gap-4"
              style={{ fontSize: "10px", letterSpacing: "0.4em", color: "var(--muted)", fontWeight: 500, textTransform: "uppercase" }}
            >
              <span style={{ display: "inline-block", width: 32, height: 1, background: "var(--ochre)" }} />
              <span>The Bengaluru Dossier</span>
            </div>

            {/* eyebrow */}
            <p
              className={serif.className}
              style={{
                fontStyle: "italic",
                fontSize: "1.5rem",
                color: "var(--muted)",
                marginBottom: "0.5rem",
                fontWeight: 400,
              }}
            >
              A report from
            </p>

            {/* headline */}
            <h1
              className={display.className}
              style={{
                fontSize: "clamp(4rem, 9vw, 7.5rem)",
                lineHeight: 0.88,
                fontWeight: 400,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
                marginBottom: "1.5rem",
              }}
            >
              {K.name},<br />
              <span style={{ fontStyle: "italic", color: "var(--ochre)" }}>the hustler</span>&apos;s paradox.
            </h1>

            {/* byline */}
            <p
              style={{
                fontSize: "12px",
                letterSpacing: "0.18em",
                color: "var(--muted)",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: "2rem",
              }}
            >
              {K.district} · {K.state} · Pincode {K.pincode} ·{" "}
              <span style={{ color: "var(--ochre)" }}>{K.superlative}</span>
            </p>

            {/* deck */}
            <p
              className={serif.className}
              style={{
                fontSize: "1.375rem",
                lineHeight: 1.45,
                color: "var(--ink)",
                fontWeight: 500,
                maxWidth: "560px",
                fontStyle: "italic",
              }}
            >
              Ninety-ninth percentile amenities. Bottom three percent for air. We profile the Bengaluru block that everyone wants to live in — and why almost no one recommends it.
            </p>
          </div>
        </header>

        {/* two-column article */}
        <section className="grid grid-cols-[1fr_320px] gap-16 mb-24">
          <div>
            {/* drop cap essay */}
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
                }}
              >
                K
              </span>
              {K.narrative.slice(1)}
            </p>

            {/* pull quote */}
            <blockquote
              className={display.className}
              style={{
                fontSize: "2.25rem",
                lineHeight: 1.15,
                fontStyle: "italic",
                color: "var(--ink)",
                margin: "3rem 0 3rem 0",
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

          {/* aside — data card */}
          <aside>
            <div
              style={{
                padding: "1.75rem",
                background: "var(--paper-2)",
                border: "1px solid var(--rule)",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.4em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  marginBottom: "1.5rem",
                }}
              >
                At a glance
              </p>

              {/* grade as the visual anchor */}
              <div className="flex items-baseline gap-4 mb-6">
                <span
                  className={display.className}
                  style={{
                    fontSize: "5rem",
                    lineHeight: 1,
                    color: "var(--ink)",
                    fontStyle: "italic",
                    fontWeight: 400,
                  }}
                >
                  {K.grade}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    AreaIQ Grade
                  </div>
                  <div
                    className={serif.className}
                    style={{
                      fontStyle: "italic",
                      fontSize: "14px",
                      color: "var(--ink)",
                    }}
                  >
                    {K.overall} of 100
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "1.25rem" }}>
                {[
                  ["Air", K.scores.air],
                  ["Safety", K.scores.safety],
                  ["Amenities", K.scores.infra],
                  ["Transit", K.scores.transit],
                  ["Cleanliness", K.scores.cleanliness],
                  ["Property", K.scores.property],
                ].map(([label, score]) => {
                  const s = score as number;
                  return (
                    <div
                      key={label as string}
                      className="py-2 flex items-center justify-between"
                      style={{
                        borderBottom: "1px dotted var(--rule)",
                        fontSize: "13px",
                      }}
                    >
                      <span
                        className={serif.className}
                        style={{ fontStyle: "italic", color: "var(--ink)" }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: s >= 70 ? "var(--ochre)" : s >= 45 ? "var(--ink)" : "var(--muted)",
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginTop: "1.25rem",
                }}
              >
                Ranked <span style={{ color: "var(--ochre)" }}>#{K.nationalRank.toLocaleString()}</span> of {K.nationalTotal.toLocaleString()}
              </p>
            </div>

            {/* representative */}
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
                  fontSize: "1.25rem",
                  letterSpacing: 0,
                  textTransform: "none",
                  color: "var(--ink)",
                  fontStyle: "italic",
                  fontWeight: 500,
                }}
              >
                {K.representative.name},{" "}
                <span style={{ color: "var(--ochre)" }}>{K.representative.party}</span>
              </p>
              <p>{K.representative.constituency}</p>
            </div>
          </aside>
        </section>

        {/* colophon */}
        <footer
          className="pt-5"
          style={{
            borderTop: "1px solid var(--rule)",
            fontSize: "10px",
            letterSpacing: "0.3em",
            color: "var(--muted)",
            textTransform: "uppercase",
          }}
        >
          Read next ·{" "}
          <span style={{ color: "var(--ink)" }}>
            The Bandra Paradox · The Connaught Myth
          </span>
        </footer>
      </div>
    </div>
  );
}
