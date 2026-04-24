import { Postmark } from "./postmark";

/**
 * /mockup — static aesthetic preview for the "India Post × Urban Planning Journal"
 * direction. Hard-coded Koramangala data. No Convex fetch. Pure design exploration.
 */
export default function MockupPage() {
  const K = KORAMANGALA;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--font-geist-sans)",
        /* inline tokens — scoped to this preview so we don't disturb main app */
        ["--paper" as string]: "#F7EFE0",
        ["--paper-2" as string]: "#EEE5D1",
        ["--rule" as string]: "#C8BFAB",
        ["--ink" as string]: "#0F1B2B",
        ["--muted" as string]: "#6B6450",
        ["--saffron" as string]: "#D96E1A",
        ["--teal" as string]: "#00716A",
        ["--red" as string]: "#B52D1C",
      } as React.CSSProperties}
    >
      {/* grain overlay */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.15] mix-blend-multiply"
        style={{
          background:
            'url("data:image/svg+xml;utf8,' +
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><filter id="n"><feTurbulence baseFrequency="0.9" numOctaves="2"/><feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.12  0 0 0 0 0.17  0 0 0 0.6 0"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>`,
            ) +
            '")',
        }}
      />

      <div className="relative max-w-[820px] mx-auto px-6 sm:px-10 py-10">
        {/* ─── MASTHEAD ─────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between pb-4 mb-10 text-[10px]"
          style={{
            borderBottom: "3px double var(--rule)",
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            letterSpacing: "0.22em",
            color: "var(--ink)",
            fontWeight: 600,
          }}
        >
          <span>
            AREA<span style={{ color: "var(--saffron)" }}>IQ</span> · CIVIC GAZETTE
          </span>
          <span style={{ color: "var(--muted)" }}>
            EDITION II · Q2 · 2026 · RUPEE ₹0
          </span>
        </div>

        {/* ─── HERO ─────────────────────────────────────────────── */}
        <header className="grid grid-cols-[1fr_260px] gap-8 items-start mb-10">
          <div>
            {/* slug kicker */}
            <p
              className="mb-5 text-[11px]"
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
                letterSpacing: "0.26em",
                color: "var(--saffron)",
                fontWeight: 700,
              }}
            >
              § NEIGHBOURHOOD DOSSIER · {K.pincode}
            </p>

            {/* name */}
            <h1
              className="font-serif mb-3"
              style={{
                fontFamily: "var(--font-fraunces), serif",
                fontWeight: 700,
                fontSize: "clamp(3rem, 8vw, 6.5rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
              }}
            >
              {K.name}.
            </h1>

            {/* location + census strip */}
            <p
              className="mb-6 text-sm"
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
                letterSpacing: "0.08em",
                color: "var(--muted)",
              }}
            >
              {K.district.toUpperCase()} · {K.state.toUpperCase()}
              <span style={{ color: "var(--rule)" }}> · </span>
              CLASS. <span style={{ color: "var(--ink)", fontWeight: 700 }}>URBAN</span>
              <span style={{ color: "var(--rule)" }}> · </span>
              ARCHETYPE <span style={{ color: "var(--saffron)", fontWeight: 700 }}>
                {K.archetype.toUpperCase()}
              </span>
            </p>

            {/* verdict */}
            <p
              className="italic text-lg max-w-[520px]"
              style={{
                fontFamily: "var(--font-fraunces), serif",
                lineHeight: 1.4,
                color: "var(--ink)",
                fontWeight: 500,
              }}
            >
              {K.verdict}
            </p>
          </div>

          {/* THE POSTMARK — the signature */}
          <div className="flex justify-end pt-4">
            <Postmark
              pincode={K.pincode}
              archetype={K.archetype}
              grade={K.grade}
              gradeColor="var(--ink)"
              superlative={K.superlative}
              date={K.date}
              size={240}
              rotate={-4}
            />
          </div>
        </header>

        {/* ─── § I CENSUS SNAPSHOT ─────────────────────────────── */}
        <Section num="I" title="Census Snapshot" subtitle="2011 Primary Census Abstract">
          <div
            className="grid grid-cols-4"
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
              borderTop: "1px solid var(--rule)",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <LedgerCell label="Population" value="9.9L" sub="district" />
            <LedgerCell label="Gender ratio" value="946" sub="♀ per 1k ♂" accent />
            <LedgerCell label="Literacy" value="70%" sub="district" />
            <LedgerCell label="Commute ≤5km" value="66%" sub="of workers" accent />
          </div>
        </Section>

        {/* ─── § II ENVIRONMENTAL ─────────────────────────────── */}
        <Section num="II" title="Environmental Register" subtitle="Air · Safety · Cleanliness">
          <div className="grid grid-cols-3 gap-8">
            <ScoreLine
              label="Air Quality"
              score={7}
              meta="AQI 185 · unhealthy"
              tone="red"
            />
            <ScoreLine
              label="Safety"
              score={44}
              meta="950 IPC/lakh · 2014"
              tone="saffron"
            />
            <ScoreLine
              label="Cleanliness"
              score={14}
              meta="Swachh rank 36 · BBMP"
              tone="red"
            />
          </div>
        </Section>

        {/* ─── § III INFRASTRUCTURE ─────────────────────────────── */}
        <Section num="III" title="Infrastructure Ledger" subtitle="within pincode boundary">
          <div
            className="grid grid-cols-[2fr_1fr_1fr] gap-x-6"
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
              fontSize: "0.9rem",
            }}
          >
            <LedgerRow label="Healthcare — hospitals · clinics" count="14 · 10" rule />
            <LedgerRow label="Education — schools · colleges" count="15 · 0" rule />
            <LedgerRow label="Green — parks · playgrounds · sports" count="0 · 1 · 4" rule />
            <LedgerRow label="Retail — malls · markets" count="2 · 1" rule />
            <LedgerRow label="Financial — banks · ATMs · pharmacy" count="35 · 11 · 13" rule />
            <LedgerRow label="Food — cafes · restaurants" count="27 · 56" rule accent />
            <LedgerRow label="Transit — bus stops" count="51" />
          </div>
        </Section>

        {/* ─── § IV CONNECTIVITY ─────────────────────────────── */}
        <Section num="IV" title="Connectivity" subtitle="rail · metro · walkable access">
          <div className="grid grid-cols-2 gap-12">
            <ConnectivityItem
              label="Nearest metro"
              value="1.55 km"
              place="Central Silk Board"
              accent
            />
            <ConnectivityItem
              label="Nearest railway junction"
              value="7.66 km"
              place="Baiyyappanahalli Junction"
            />
            <ConnectivityItem
              label="5-minute walkability"
              value="8/10"
              place="essentials within walk"
              accent
            />
            <ConnectivityItem
              label="Typical 2BHK rent"
              value="₹28,000"
              place="/month · Koramangala rate"
            />
          </div>
        </Section>

        {/* ─── § V DID YOU KNOW ─────────────────────────────── */}
        <Section num="V" title="Did You Know" subtitle="three local dispatches">
          <div className="space-y-6">
            {K.facts.map((f, i) => (
              <figure
                key={i}
                className="relative pl-12 max-w-[680px]"
                style={{
                  fontFamily: "var(--font-fraunces), serif",
                  lineHeight: 1.45,
                  fontSize: "1.0625rem",
                  color: "var(--ink)",
                }}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 font-serif"
                  style={{
                    fontFamily: "var(--font-fraunces), serif",
                    fontSize: "2.8rem",
                    lineHeight: 1,
                    color: "var(--saffron)",
                    fontWeight: 700,
                    fontStyle: "italic",
                  }}
                >
                  §
                </span>
                <span
                  className="mr-3 font-mono text-xs"
                  style={{
                    fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
                    color: "var(--saffron)",
                    letterSpacing: "0.2em",
                    fontWeight: 700,
                  }}
                >
                  {`0${i + 1}`.slice(-2)}
                </span>
                {f}
              </figure>
            ))}
          </div>
        </Section>

        {/* ─── § VI REPRESENTATIVE ─────────────────────────────── */}
        <Section num="VI" title="Representative" subtitle="Lok Sabha · 2024">
          <p
            className="text-sm"
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ color: "var(--muted)" }}>MP </span>
            <span style={{ fontWeight: 700, color: "var(--ink)" }}>
              TEJASVI SURYA
            </span>
            <span style={{ color: "var(--saffron)", fontWeight: 700 }}> · BJP</span>
            <span style={{ color: "var(--muted)" }}> · BANGALORE SOUTH</span>
          </p>
        </Section>

        {/* ─── § VII LIFE HERE ─────────────────────────────── */}
        <Section num="VII" title="Life Here" subtitle="an editorial impression">
          <p
            className="drop-cap max-w-[620px]"
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "1.125rem",
              lineHeight: 1.6,
              color: "var(--ink)",
            }}
          >
            {K.narrative}
          </p>
        </Section>

        {/* ─── POST THIS AREA ─────────────────────────────── */}
        <div className="mt-16 mb-6 flex items-center justify-between">
          <button
            className="group relative"
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
              letterSpacing: "0.28em",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--ink)",
              background: "var(--saffron)",
              padding: "1rem 1.5rem",
              border: "2px solid var(--ink)",
              boxShadow: "4px 4px 0 var(--ink)",
            }}
          >
            POST THIS AREA →
          </button>

          <Postmark
            pincode={K.pincode}
            archetype={K.archetype}
            grade={K.grade}
            gradeColor="var(--ink)"
            superlative={K.superlative}
            date={K.date}
            size={110}
            rotate={14}
          />
        </div>

        {/* ─── COLOPHON ─────────────────────────────── */}
        <footer
          className="mt-16 pt-6 text-[10px]"
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            letterSpacing: "0.22em",
            color: "var(--muted)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <p>
            COLOPHON · SET IN FRAUNCES &amp; JETBRAINS MONO · PRINTED ON CREAM #F7EFE0
            <br />
            DATA SOURCED FROM CENSUS 2011 · NCRB · CPCB · OSM · SWACHH SURVEKSHAN · NHB ·
            MYNETA
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ─── building blocks ─────────────────────────────────────── */

function Section({
  num,
  title,
  subtitle,
  children,
}: {
  num: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mb-14"
      style={{ borderTop: "1px solid var(--rule)", paddingTop: "2rem" }}
    >
      <div
        className="flex items-baseline gap-4 mb-6"
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
        }}
      >
        <span
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.32em",
            color: "var(--saffron)",
            fontWeight: 700,
          }}
        >
          § {num}
        </span>
        <h2
          className="font-serif"
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontStyle: "italic",
            fontSize: "1.35rem",
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <span
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              color: "var(--muted)",
              marginLeft: "auto",
            }}
          >
            {subtitle.toUpperCase()}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function LedgerCell({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className="py-5"
      style={{
        borderRight: "1px solid var(--rule)",
      }}
    >
      <p
        className="mb-1"
        style={{
          fontSize: "0.65rem",
          letterSpacing: "0.22em",
          color: "var(--muted)",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
          fontSize: "2.25rem",
          fontWeight: 600,
          color: accent ? "var(--saffron)" : "var(--ink)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        className="mt-2"
        style={{
          fontSize: "0.65rem",
          letterSpacing: "0.14em",
          color: "var(--muted)",
        }}
      >
        {sub}
      </p>
    </div>
  );
}

function ScoreLine({
  label,
  score,
  meta,
  tone,
}: {
  label: string;
  score: number;
  meta: string;
  tone: "saffron" | "teal" | "red";
}) {
  const color =
    tone === "saffron" ? "var(--saffron)" : tone === "teal" ? "var(--teal)" : "var(--red)";
  return (
    <div>
      <p
        className="mb-1"
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
          fontSize: "0.65rem",
          letterSpacing: "0.22em",
          color: "var(--muted)",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontStyle: "italic",
            fontSize: "3.5rem",
            fontWeight: 700,
            color,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            fontSize: "0.75rem",
            color: "var(--muted)",
            letterSpacing: "0.1em",
          }}
        >
          / 100
        </span>
      </div>
      {/* hairline bar — teal for measurement */}
      <div
        className="mt-3 relative"
        style={{ height: "2px", background: "var(--paper-2)" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${score}%`,
            background: color,
          }}
        />
      </div>
      <p
        className="mt-2"
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
          fontSize: "0.7rem",
          color: "var(--muted)",
          letterSpacing: "0.08em",
        }}
      >
        {meta}
      </p>
    </div>
  );
}

function LedgerRow({
  label,
  count,
  rule = false,
  accent = false,
}: {
  label: string;
  count: string;
  rule?: boolean;
  accent?: boolean;
}) {
  return (
    <>
      <div
        className="py-3"
        style={{
          borderBottom: rule ? "1px dotted var(--rule)" : "none",
          color: "var(--ink)",
          fontSize: "0.9rem",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        className="py-3 text-right"
        style={{
          borderBottom: rule ? "1px dotted var(--rule)" : "none",
          color: "var(--muted)",
          fontSize: "0.8rem",
          letterSpacing: "0.1em",
        }}
      >
        count
      </div>
      <div
        className="py-3 text-right"
        style={{
          borderBottom: rule ? "1px dotted var(--rule)" : "none",
          color: accent ? "var(--saffron)" : "var(--ink)",
          fontWeight: 700,
          fontSize: "1rem",
          letterSpacing: "0.08em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </div>
    </>
  );
}

function ConnectivityItem({
  label,
  value,
  place,
  accent = false,
}: {
  label: string;
  value: string;
  place: string;
  accent?: boolean;
}) {
  return (
    <div style={{ fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace" }}>
      <p
        style={{
          fontSize: "0.65rem",
          letterSpacing: "0.22em",
          color: "var(--muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-fraunces), serif",
          fontSize: "2rem",
          fontWeight: 700,
          color: accent ? "var(--teal)" : "var(--ink)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginBottom: "0.4rem",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.06em",
          color: "var(--muted)",
        }}
      >
        {place}
      </p>
    </div>
  );
}

/* ─── mock data — Koramangala I Block ─────────────────────── */

const KORAMANGALA = {
  pincode: "560034",
  name: "Koramangala",
  district: "Bangalore",
  state: "Karnataka",
  archetype: "The Hustler's Hub",
  grade: "D+",
  superlative: "Karnataka's Top Amenity Hub",
  date: "Q2 · 2026",
  verdict:
    "An amenity hub choked by its own air. Koramangala holds 99th-percentile infrastructure nationally — yet ranks in the bottom 3% for air quality, and the BBMP's Swachh score puts cleanliness in the bottom 14%.",
  narrative:
    "Koramangala is an always-on block. Startups colonise cafés past midnight; scooter deliveries thicken the arterials all day; the 100 Feet Road exists on its own chronotope. In return for being India's most concentrated amenity corridor, residents trade away a breathable sky and tolerate a civic waste infrastructure permanently one complaint behind demand. The archetype is a hustler's hub — rewarding for the ambitious, punishing for anyone who wants to age slowly.",
  facts: [
    "Bengaluru's official name change from 'Bangalore' on November 1, 2014, means its current identity is younger than WhatsApp, which launched in 2009.",
    "Despite covering just 0.45% of India's total land area, Bengaluru district alone accounts for over 30% of India's total IT exports.",
    "Bengaluru sits at an average elevation of 920 metres (3,018 feet) above sea level, making it one of the highest major metropolitan cities in India — significantly higher than Delhi (216m) or Mumbai (14m).",
  ],
};
