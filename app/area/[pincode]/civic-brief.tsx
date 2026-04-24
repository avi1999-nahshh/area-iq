import { Instrument_Serif, Spectral, Jost, JetBrains_Mono } from "next/font/google";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import { MapPreview } from "./map-preview";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const serif = Spectral({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"] });
const ui = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

type AreaData = NonNullable<FunctionReturnType<typeof api.area.getByPincode>>;

function grade(overall: number): string {
  if (overall >= 90) return "A+";
  if (overall >= 82) return "A";
  if (overall >= 75) return "A-";
  if (overall >= 70) return "B+";
  if (overall >= 65) return "B";
  if (overall >= 60) return "B-";
  if (overall >= 55) return "C+";
  if (overall >= 50) return "C";
  if (overall >= 45) return "D+";
  if (overall >= 40) return "D";
  return "F";
}

const bound = (n: number) => Math.min(99, Math.max(1, Math.round(n)));

export function CivicBrief({ data }: { data: AreaData }) {
  const {
    pincode: pc,
    airQuality,
    safety,
    infrastructure: infra,
    transit,
    cleanliness,
    contacts,
    scores,
    trivia,
  } = data;

  const overall = scores ? Math.round(scores.overall_score) : 0;
  const areaGrade = scores ? grade(scores.overall_score) : "—";
  const tier = scores?.tier ?? "—";

  type Dim = { label: string; value: number; meta: string; nationalPct: number };
  const dims: Dim[] = [
    {
      label: "Air",
      value: Math.round(scores?.air_quality_score ?? 0),
      nationalPct: scores?.air_quality_national_pct ?? 0,
      meta: airQuality?.aqi != null ? `AQI ${airQuality.aqi}` : "n/a",
    },
    {
      label: "Safety",
      value: Math.round(scores?.safety_score ?? 0),
      nationalPct: scores?.safety_national_pct ?? 0,
      meta: safety ? `${Math.round(safety.crime_rate_per_lakh)}/lk` : "n/a",
    },
    {
      label: "Amenities",
      value: Math.round(scores?.infrastructure_score ?? 0),
      nationalPct: scores?.infrastructure_national_pct ?? 0,
      meta:
        (scores?.infrastructure_national_pct ?? 0) >= 99
          ? "top 1%"
          : `top ${bound(100 - (scores?.infrastructure_national_pct ?? 0))}%`,
    },
    {
      label: "Transit",
      value: Math.round(scores?.transit_score ?? 0),
      nationalPct: scores?.transit_national_pct ?? 0,
      meta:
        transit?.nearest_metro_km != null
          ? `${transit.nearest_metro_km.toFixed(1)}km`
          : "n/a",
    },
    {
      label: "Cleanliness",
      value: Math.round(scores?.cleanliness_score ?? 0),
      nationalPct: scores?.cleanliness_national_pct ?? 0,
      meta:
        cleanliness?.ss_rank != null ? `Swachh #${cleanliness.ss_rank}` : "Swachh",
    },
    {
      label: "Property",
      value: Math.round(scores?.property_score ?? 0),
      nationalPct: 0,
      meta: `${Math.round(scores?.property_score ?? 0)}th pct`,
    },
  ];

  // Top/bottom dim by national percentile; exclude property (no pct).
  const byPct = dims
    .filter((d) => d.label !== "Property")
    .sort((x, y) => y.nationalPct - x.nationalPct);
  const topDim = byPct[0];
  const lowDim = byPct[byPct.length - 1];
  const topPctLabel = bound(100 - topDim.nationalPct);
  const lowPctLabel = bound(lowDim.nationalPct);

  const archetype = scores?.archetype_name ?? "";
  const tagline = scores?.archetype_tagline ?? "";
  const verdict = archetype
    ? `Top ${topPctLabel}% at ${topDim.label.toLowerCase()}. Bottom ${lowPctLabel}% on ${lowDim.label.toLowerCase()}. ${tagline}`
    : "";

  const narrative =
    (trivia?.narrative && trivia.narrative.trim()) ||
    "A neighbourhood's character emerges from the balance of what it offers and what it lacks — the following pages trace both.";

  const firstFact = trivia?.facts?.[1] ?? trivia?.facts?.[0] ?? "";

  const rep = contacts?.vs_mla_name
    ? {
        name: contacts.vs_mla_name,
        party: contacts.vs_mla_party ?? "",
        constituency: contacts.vs_constituency,
      }
    : contacts?.ls_mp_name
      ? {
          name: contacts.ls_mp_name,
          party: contacts.ls_mp_party ?? "",
          constituency: contacts.ls_constituency,
        }
      : null;

  const amenities = [
    { label: "Cafés", value: infra?.cafe_count ?? 0 },
    { label: "Restaurants", value: infra?.restaurant_count ?? 0 },
    { label: "Banks", value: infra?.bank_count ?? 0 },
    { label: "Pharmacies", value: infra?.pharmacy_count ?? 0 },
    { label: "Hospitals", value: infra?.hospital_count ?? 0 },
    { label: "Schools", value: infra?.school_count ?? 0 },
    { label: "Parks", value: infra?.park_count ?? 0 },
  ];

  const pullQuoteTop = dims.reduce((a, b) => (a.value > b.value ? a : b));
  const pullQuoteLow = dims.reduce((a, b) => (a.value < b.value ? a : b));
  const pullQuote = `${pc.name} ranks above ${bound(pullQuoteTop.nationalPct)}% of India on ${pullQuoteTop.label.toLowerCase()}, and trails ${bound(100 - pullQuoteLow.nationalPct)}% on ${pullQuoteLow.label.toLowerCase()}. The cost of one, paid in the other.`;

  // "Neighbourhood is the {N}th pincode we've graded"
  const reportNo = scores?.national_rank ?? 0;
  const reportTotal = scores?.national_total ?? 0;

  return (
    <div
      className={ui.className}
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
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 md:px-12 pt-6 sm:pt-8 pb-20 sm:pb-24">
        {/* classification ribbon */}
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
            Report · #{reportNo.toLocaleString()}
          </span>
          <span
            className="flex-1 min-w-0"
            style={{
              padding: "10px 14px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Classification · <span style={{ color: "var(--ochre)" }}>{tier}</span> · {pc.district} ({pc.state})
          </span>
          <span
            className="hidden sm:inline shrink-0"
            style={{ padding: "10px 14px", opacity: 0.65 }}
          >
            AreaIQ Civic Brief
          </span>
        </div>

        {/* masthead */}
        <div
          className="flex items-baseline justify-between pt-5 pb-5 mb-12 md:mb-16"
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
          <span className="hidden sm:inline">
            Pincode {pc.pincode} · {pc.state} Edition
          </span>
        </div>

        {/* hero */}
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
            {pc.pincode.slice(-2)}
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
              <span>The {pc.state} Dossier · Neighbourhood Brief</span>
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
              {pc.name},
              <br />
              <span style={{ fontStyle: "italic", color: "var(--ochre)" }}>
                {archetype.toLowerCase()}
              </span>
              .
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
              Pincode {pc.pincode} · {pc.district} · {pc.state}
              {scores?.superlative_label ? (
                <>
                  {" "}·{" "}
                  <span style={{ color: "var(--ochre)" }}>{scores.superlative_label}</span>
                </>
              ) : null}
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
              {verdict}
            </p>
          </div>
        </header>

        {/* § I MAP BAND */}
        <section className="mb-14 md:mb-16">
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
              {pc.lat.toFixed(4)}° N · {pc.lng.toFixed(4)}° E · r. 1.5km
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
              <MapPreview lat={pc.lat} lng={pc.lng} name={pc.name} />
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
                Fig. 1 · {pc.name}
              </div>
            </div>

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
                Within the pincode
              </p>

              {amenities.map((a) => (
                <div
                  key={a.label}
                  className="py-1.5 flex items-baseline justify-between"
                  style={{ borderBottom: "1px dotted var(--rule)" }}
                >
                  <span
                    className={serif.className}
                    style={{ fontStyle: "italic", fontSize: 15, color: "var(--ink)" }}
                  >
                    {a.label}
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
                    {a.value}
                  </span>
                </div>
              ))}

              {transit?.nearest_metro_name && (
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
                    style={{ fontSize: "1rem", color: "var(--ink)", fontStyle: "italic", lineHeight: 1.35 }}
                  >
                    {transit.nearest_metro_name}{" "}
                    {transit.nearest_metro_km != null && (
                      <span
                        className={mono.className}
                        style={{ color: "var(--ochre)", fontSize: 12, fontStyle: "normal" }}
                      >
                        · {transit.nearest_metro_km.toFixed(1)} km
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § II SMALL MULTIPLES */}
        <section
          className="mb-16 md:mb-20"
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
            {dims.map((dim) => {
              const s = dim.value;
              const color = s >= 70 ? "var(--ochre)" : s >= 45 ? "var(--ink)" : "var(--alarm)";
              return (
                <div key={dim.label}>
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
                    {dim.label}
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
                    {s}
                  </p>
                  <div style={{ height: 3, background: "var(--rule)", marginTop: 10, position: "relative" }}>
                    <div style={{ width: `${s}%`, height: "100%", background: color }} />
                  </div>
                  <p
                    className={mono.className}
                    style={{ fontSize: "10px", color: "var(--muted)", marginTop: 6, letterSpacing: "0.04em" }}
                  >
                    {dim.meta}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* § III ESSAY + AT-A-GLANCE */}
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
                {narrative.charAt(0)}
              </span>
              {narrative.slice(1)}
            </p>

            <blockquote
              className={display.className}
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                lineHeight: 1.2,
                fontStyle: "italic",
                color: "var(--ink)",
                margin: "2.5rem 0",
                paddingLeft: "1.5rem",
                borderLeft: "3px solid var(--ochre)",
                fontWeight: 400,
              }}
            >
              &ldquo;{pullQuote}&rdquo;
            </blockquote>

            {firstFact && (
              <p
                className={serif.className}
                style={{ fontSize: "1.0625rem", lineHeight: 1.7, color: "var(--ink)" }}
              >
                {firstFact}
              </p>
            )}
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
                  {areaGrade}
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
                    {overall}
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
                  ["Nationally", `#${scores?.national_rank.toLocaleString()}`, `of ${scores?.national_total.toLocaleString()}`],
                  [`In ${pc.state}`, `#${scores?.state_rank.toLocaleString()}`, `of ${scores?.state_total.toLocaleString()}`],
                  [`In ${pc.district}`, `#${scores?.district_rank.toLocaleString()}`, `of ${scores?.district_total.toLocaleString()}`],
                  ...(scores?.metro_rank && scores.metro_total && pc.metro_city
                    ? [[`In metro ${pc.metro_city}`, `#${scores.metro_rank.toLocaleString()}`, `of ${scores.metro_total.toLocaleString()}`] as [string, string, string]]
                    : []),
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
                        style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.06em", fontStyle: "normal" }}
                      >
                        {total}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {scores?.superlative_label && (
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
                    style={{ fontSize: "1.125rem", fontWeight: 400, fontStyle: "italic", lineHeight: 1.25 }}
                  >
                    {scores.superlative_label}
                  </p>
                </div>
              )}

              {rep && (
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
                    {rep.name}
                    {rep.party && (
                      <>
                        ,{" "}
                        <span style={{ color: "var(--ochre-dark)" }}>{rep.party}</span>
                      </>
                    )}
                  </p>
                  <p style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                    {rep.constituency}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* § IV FINDINGS */}
        <section className="mb-12 md:mb-16">
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
                stat: topDim.value,
                statLabel: `${topDim.label} Score`,
                body: `${pc.name} sits in the top ${topPctLabel}% of Indian pincodes on ${topDim.label.toLowerCase()}.`,
              },
              {
                tag: "Weakness",
                tagColor: "var(--alarm)",
                stat: lowDim.value,
                statLabel: `${lowDim.label} Score`,
                body: `Bottom ${lowPctLabel}% on ${lowDim.label.toLowerCase()} — the dimension that drags the overall grade down.`,
              },
              {
                tag: "Caveat",
                tagColor: "var(--muted)",
                stat: Math.round(scores?.cleanliness_score ?? 0),
                statLabel: "Cleanliness",
                body: cleanliness?.ss_rank
                  ? `${cleanliness.ulb_name}'s Swachh Survekshan rank of ${cleanliness.ss_rank} shapes the cleanliness picture across the ULB, not just this pincode.`
                  : "Cleanliness is scored at the ULB (urban local body) level — it describes the wider city, not this block alone.",
              },
            ].map((f) => (
              <div key={f.tag} style={{ borderTop: "2px solid var(--ink)", paddingTop: "1rem" }}>
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
                <p className={serif.className} style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--ink)" }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* colophon */}
        <footer
          style={{
            marginTop: "4rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--rule)",
            fontSize: "10px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
          className={`${mono.className} flex flex-wrap justify-between gap-y-2 gap-x-4`}
        >
          <span className="min-w-0">
            <span className="hidden sm:inline">Methodology · </span>
            Census · CPCB · NCRB · OSM · Swachh · MyNeta
          </span>
          <span className="shrink-0">
            § {reportNo.toLocaleString()} / {reportTotal.toLocaleString()}
          </span>
        </footer>
      </div>
    </div>
  );
}
