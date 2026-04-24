import Link from "next/link";
import { Instrument_Serif } from "next/font/google";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

/**
 * /mockup — index of design direction explorations. Pick one.
 */
export default function MockupIndex() {
  const directions = [
    {
      letter: "A",
      title: "Civic Quarterly",
      tagline: "Monocle meets India Vogue",
      desc: "Luxury publication. Oatmeal + ink-navy + Jaipur ochre. Instrument Serif display, DM Sans body, oversized gutter page number as signature.",
      swatches: ["#FAF6EE", "#1A2633", "#C88A1F"],
      href: "/mockup/a",
    },
    {
      letter: "B",
      title: "The Postmark",
      tagline: "India Post × Census Atlas",
      desc: "Postal-authority tradition. Saffron + teal + cream. Fraunces display, mono data, circular postmark as signature (pincode + grade + superlative encoded in one stamp).",
      swatches: ["#F7EFE0", "#0F1B2B", "#D96E1A", "#00716A"],
      href: "/mockup/b",
    },
    {
      letter: "C",
      title: "The Dispatch",
      tagline: "Newspaper of record",
      desc: "Broadsheet composition. Newsprint cream + ink + alarm red. Playfair Display masthead, Source Serif 4 body, 3-column grid with drop cap lead.",
      swatches: ["#EDE7DC", "#0A0A0A", "#B42D1C"],
      href: "/mockup/c",
    },
    {
      letter: "D",
      title: "The Brief",
      tagline: "Bloomberg × FiveThirtyEight",
      desc: "Analyst report. Warm paper + concrete + quiet teal. Spectral display, Jost body, classification ribbon + inline small-multiples panel as signature.",
      swatches: ["#F7F3EC", "#1A1A18", "#2E7C7B"],
      href: "/mockup/d",
    },
  ];

  return (
    <div
      className={serif.className}
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#F7F3EC",
        padding: "4rem 2rem",
      }}
    >
      <div className="max-w-[1100px] mx-auto">
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#C88A1F",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          AreaIQ · Design Directions · 2026
        </p>

        <h1
          style={{
            fontSize: "clamp(3rem, 6vw, 5.5rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            marginBottom: "1.5rem",
          }}
        >
          Four ways to look at{" "}
          <em style={{ color: "#C88A1F" }}>a neighbourhood</em>.
        </h1>
        <p
          style={{
            maxWidth: "620px",
            fontSize: "1.25rem",
            lineHeight: 1.5,
            color: "#A8A49A",
            marginBottom: "4rem",
            fontStyle: "italic",
          }}
        >
          Same data — Koramangala, 560034, Bengaluru. Same human — someone deciding, comparing, sharing. Four distinct aesthetic identities. Pick one; remix them; reject them.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {directions.map((d) => (
            <Link
              key={d.letter}
              href={d.href}
              className="group block"
              style={{
                padding: "2rem 1.75rem",
                background: "#17171A",
                border: "1px solid #2A2A2D",
                transition: "transform 0.2s, border-color 0.2s",
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <span
                  style={{
                    fontSize: "6rem",
                    lineHeight: 0.85,
                    fontWeight: 400,
                    color: "#C88A1F",
                    fontStyle: "italic",
                  }}
                >
                  {d.letter}
                </span>
                <div className="flex gap-1.5">
                  {d.swatches.map((s) => (
                    <span
                      key={s}
                      style={{
                        width: 22,
                        height: 22,
                        background: s,
                        display: "block",
                      }}
                      title={s}
                    />
                  ))}
                </div>
              </div>
              <h2
                style={{
                  fontSize: "2rem",
                  lineHeight: 1,
                  marginBottom: "0.25rem",
                }}
              >
                {d.title}
              </h2>
              <p
                style={{
                  fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#A8A49A",
                  fontWeight: 500,
                  marginBottom: "1.25rem",
                }}
              >
                {d.tagline}
              </p>
              <p
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.55,
                  color: "#C7C3BA",
                  fontStyle: "normal",
                }}
              >
                {d.desc}
              </p>
              <p
                style={{
                  fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#C88A1F",
                  fontWeight: 600,
                  marginTop: "1.5rem",
                }}
                className="group-hover:underline"
              >
                Open direction {d.letter} →
              </p>
            </Link>
          ))}
        </div>

        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#6B6760",
            fontWeight: 500,
            marginTop: "4rem",
            textAlign: "center",
          }}
        >
          All four use the same data · same pincode · different identity
        </p>
      </div>
    </div>
  );
}
