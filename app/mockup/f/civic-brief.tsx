import { Instrument_Serif, Spectral, JetBrains_Mono } from "next/font/google";
import { MapPreview } from "../_map-preview";
import type { BriefData } from "./loader";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const serif = Spectral({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

export function CivicBrief({ d }: { d: BriefData }) {
  const archetypeLower = d.archetype.toLowerCase();

  return (
    <div
      className={serif.className}
      style={{
        minHeight: "100dvh",
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
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          pointerEvents: "none",
          opacity: 0.06,
          mixBlendMode: "multiply",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />

      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(1.25); }
        }
        @keyframes drawBar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .rise { animation: riseIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .rise-2 { animation-delay: 0.12s; }
        .rise-3 { animation-delay: 0.24s; }
        .rise-4 { animation-delay: 0.36s; }
        .livedot { animation: pulseDot 1.6s ease-in-out infinite; }
        .fillbar {
          transform-origin: left center;
          animation: drawBar 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 0.5s;
        }
      `}</style>

      <main className="mx-auto w-full max-w-[820px] px-5 sm:px-8 pt-6 pb-24">
        <div
          className={`${mono.className} rise`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 10,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--muted)",
            paddingBottom: 12,
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              className="livedot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--ochre)",
                display: "inline-block",
              }}
            />
            AreaIQ · {d.pincode}
          </span>
          <span>{d.district} · {d.state}</span>
        </div>

        <section className="pt-10 sm:pt-14">
          <p
            className={`${mono.className} rise`}
            style={{
              fontSize: 10.5,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--ochre-dark)",
              fontWeight: 600,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 24,
                height: 1,
                background: "var(--ochre)",
                verticalAlign: "middle",
                marginRight: 10,
              }}
            />
            The {d.state} Dossier
          </p>

          <p
            className={`${display.className} rise rise-2`}
            style={{
              fontStyle: "italic",
              fontSize: "1.125rem",
              color: "var(--muted)",
              marginBottom: 2,
            }}
          >
            A report from
          </p>

          <h1
            className={`${display.className} rise rise-2`}
            style={{
              fontSize: "clamp(3.25rem, 13vw, 6.75rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.035em",
              color: "var(--ink)",
              marginBottom: "1.25rem",
              fontWeight: 400,
            }}
          >
            {d.name},
            <br />
            <span style={{ fontStyle: "italic", color: "var(--ochre)" }}>
              {archetypeLower}
            </span>
            .
          </h1>

          <p
            className={`${serif.className} rise rise-3`}
            style={{
              fontSize: "clamp(1.0625rem, 3.6vw, 1.25rem)",
              lineHeight: 1.55,
              color: "var(--ink)",
              fontStyle: "italic",
              fontWeight: 400,
              maxWidth: "54ch",
            }}
          >
            {d.verdict}
          </p>
        </section>

        <section
          className="mt-12 sm:mt-16 rise rise-3"
          style={{
            borderTop: "1px solid var(--ink)",
            borderBottom: "1px solid var(--ink)",
            padding: "1.5rem 0",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "1.25rem",
              alignItems: "center",
            }}
          >
            <span
              className={display.className}
              style={{
                fontSize: "clamp(5.5rem, 22vw, 8.5rem)",
                lineHeight: 0.82,
                fontStyle: "italic",
                letterSpacing: "-0.06em",
                color: "var(--ink)",
              }}
            >
              {d.grade}
            </span>
            <div>
              <p
                className={mono.className}
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                AreaIQ Grade
              </p>
              <p
                className={display.className}
                style={{
                  fontSize: "1.625rem",
                  fontStyle: "italic",
                  color: "var(--ink)",
                  lineHeight: 1.1,
                  marginBottom: 6,
                }}
              >
                {d.overall}
                <span style={{ color: "var(--muted)" }}> / 100</span>
              </p>
              <p
                className={mono.className}
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  lineHeight: 1.5,
                }}
              >
                #{d.nationalRank.toLocaleString()} <span style={{ opacity: 0.6 }}>of</span>{" "}
                {d.nationalTotal.toLocaleString()} <span style={{ opacity: 0.6 }}>in India</span>
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px dotted var(--rule)",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <p
                className={mono.className}
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--ochre-dark)",
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                Best
              </p>
              <p
                className={display.className}
                style={{
                  fontSize: "clamp(3rem, 13vw, 4.75rem)",
                  fontStyle: "italic",
                  color: "var(--ochre)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                }}
              >
                {d.topDim.value}
              </p>
              <p
                className={serif.className}
                style={{
                  fontSize: 13,
                  fontStyle: "italic",
                  color: "var(--muted)",
                  marginTop: 4,
                }}
              >
                {d.topDim.label.toLowerCase()}
              </p>
            </div>
            <span
              className={display.className}
              style={{
                fontStyle: "italic",
                fontSize: "clamp(1.5rem, 6vw, 2.25rem)",
                color: "var(--rule)",
                lineHeight: 1,
              }}
            >
              ·
            </span>
            <div style={{ textAlign: "right" }}>
              <p
                className={mono.className}
                style={{
                  fontSize: 9.5,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--alarm)",
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                Worst
              </p>
              <p
                className={display.className}
                style={{
                  fontSize: "clamp(3rem, 13vw, 4.75rem)",
                  fontStyle: "italic",
                  color: "var(--alarm)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                }}
              >
                {d.lowDim.value}
              </p>
              <p
                className={serif.className}
                style={{
                  fontSize: 13,
                  fontStyle: "italic",
                  color: "var(--muted)",
                  marginTop: 4,
                }}
              >
                {d.lowDim.label.toLowerCase()}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 sm:mt-16 rise rise-4">
          <div
            className="flex items-baseline justify-between"
            style={{
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 10,
            }}
          >
            <span className={mono.className}>
              <span style={{ color: "var(--ochre)" }}>§ I</span>&nbsp;&nbsp;The Territory
            </span>
            <span className={mono.className} style={{ fontSize: 9.5 }}>
              r. 1.5km
            </span>
          </div>

          <div
            style={{
              border: "1px solid var(--ink)",
              background: "var(--paper-2)",
              position: "relative",
              height: "clamp(280px, 55vw, 440px)",
              overflow: "hidden",
            }}
          >
            <MapPreview lat={d.lat} lng={d.lng} name={d.name} />
            <div
              className={mono.className}
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "var(--ink)",
                color: "var(--paper)",
                padding: "6px 10px",
                fontSize: 9.5,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 600,
                zIndex: 400,
              }}
            >
              Fig. 1 · {d.name}
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {d.amenityCounts.map((a) => (
              <div
                key={a.label}
                style={{
                  borderTop: "1px solid var(--rule)",
                  paddingTop: 8,
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 6,
                }}
              >
                <span
                  className={serif.className}
                  style={{
                    fontStyle: "italic",
                    fontSize: 13.5,
                    color: "var(--ink)",
                  }}
                >
                  {a.label}
                </span>
                <span
                  className={display.className}
                  style={{
                    fontSize: "1.375rem",
                    color: "var(--ink)",
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                  }}
                >
                  {a.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 sm:mt-20">
          <div className="flex items-baseline justify-between" style={{ marginBottom: 14 }}>
            <span
              className={mono.className}
              style={{
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--muted)",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "var(--ochre)" }}>§ II</span>&nbsp;&nbsp;Six Dimensions
            </span>
            <span
              className={mono.className}
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              0 — 100
            </span>
          </div>

          <div>
            {d.scores.map((dim) => {
              const s = dim.value;
              const color =
                s >= 70 ? "var(--ochre)" : s >= 45 ? "var(--ink)" : "var(--alarm)";
              return (
                <div
                  key={dim.label}
                  style={{
                    borderTop: "1px solid var(--rule)",
                    padding: "14px 0 12px",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "baseline",
                    gap: 14,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        className={serif.className}
                        style={{
                          fontStyle: "italic",
                          fontSize: "1.0625rem",
                          color: "var(--ink)",
                        }}
                      >
                        {dim.label}
                      </span>
                      <span
                        className={mono.className}
                        style={{
                          fontSize: 10.5,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                        }}
                      >
                        {dim.meta}
                      </span>
                    </div>
                    <div style={{ height: 4, background: "var(--rule)", position: "relative" }}>
                      <div
                        className="fillbar"
                        style={{ width: `${s}%`, height: "100%", background: color }}
                      />
                    </div>
                  </div>
                  <span
                    className={display.className}
                    style={{
                      fontSize: "clamp(2rem, 7vw, 2.75rem)",
                      fontStyle: "italic",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      color,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s}
                  </span>
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--ink)" }} />
          </div>
        </section>

        <section className="mt-14 sm:mt-20">
          <blockquote
            className={display.className}
            style={{
              fontSize: "clamp(1.5rem, 5.2vw, 2.25rem)",
              lineHeight: 1.2,
              fontStyle: "italic",
              color: "var(--ink)",
              paddingLeft: "1.25rem",
              borderLeft: "3px solid var(--ochre)",
              fontWeight: 400,
              maxWidth: "28ch",
            }}
          >
            {d.pullQuote}
          </blockquote>
        </section>

        {d.superlative && (
          <section
            className="mt-12 sm:mt-16"
            style={{
              background: "var(--ochre)",
              color: "var(--ink)",
              padding: "1.25rem 1.25rem 1.5rem",
            }}
          >
            <p
              className={mono.className}
              style={{
                fontSize: 9.5,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 10,
                opacity: 0.78,
              }}
            >
              Distinction
            </p>
            <p
              className={display.className}
              style={{
                fontSize: "clamp(1.5rem, 5.4vw, 2.25rem)",
                lineHeight: 1.1,
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.01em",
              }}
            >
              {d.superlative}.
            </p>
          </section>
        )}

        <section
          className="mt-14 sm:mt-20"
          style={{
            textAlign: "center",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <p
            className={mono.className}
            style={{
              fontSize: 10,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Worth an argument?
          </p>
          <p
            className={display.className}
            style={{
              fontSize: "clamp(1.75rem, 6vw, 2.75rem)",
              fontStyle: "italic",
              color: "var(--ink)",
              lineHeight: 1.1,
              marginBottom: 18,
              letterSpacing: "-0.02em",
            }}
          >
            Screenshot it. Send it. <br />
            <span style={{ color: "var(--ochre)" }}>Settle the debate.</span>
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {["Share to IG", "Send link", "Compare"].map((cta, i) => (
              <span
                key={cta}
                className={mono.className}
                style={{
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  padding: "10px 14px",
                  border: "1px solid var(--ink)",
                  background: i === 0 ? "var(--ink)" : "transparent",
                  color: i === 0 ? "var(--paper)" : "var(--ink)",
                  cursor: "pointer",
                }}
              >
                {cta}
              </span>
            ))}
          </div>
          <p
            className={mono.className}
            style={{
              marginTop: 22,
              fontSize: 9.5,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--muted)",
              opacity: 0.7,
            }}
          >
            AreaIQ · {d.pincode} · {d.date}
          </p>
        </section>
      </main>
    </div>
  );
}
