import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreCard } from "./score-card";
import { ShareButton } from "./share-button";
import { PincodeNavInput } from "./pincode-nav-input";

interface Props {
  params: Promise<{ pincode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pincode } = await params;
  const data = await fetchQuery(api.area.getByPincode, { pincode });

  if (!data) {
    return { title: "pincode not found — AreaIQ" };
  }

  const name = data.pincode.name;
  const score = data.scores?.overall_score ?? 0;
  const pct = data.scores?.overall_national_pct ?? 0;
  const topPct = Math.round(100 - pct);
  const description = `${name} scores ${score}/100 on AreaIQ. Top ${topPct}% in India. See air quality, safety, infrastructure, transit, and more.`;
  const ogUrl = `/api/og?pincode=${pincode}`;

  return {
    title: `${pincode} · ${name} — AreaIQ`,
    description,
    openGraph: {
      title: `${pincode} · ${name} — AreaIQ report card`,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${pincode} · ${name} — AreaIQ`,
      description,
      images: [ogUrl],
    },
  };
}

export default async function PincodePage({ params }: Props) {
  const { pincode } = await params;
  const data = await fetchQuery(api.area.getByPincode, { pincode });

  if (!data) notFound();

  const { pincode: pc, scores } = data;
  const overallScore = scores?.overall_score ?? 0;
  const nationalPct = scores?.overall_national_pct ?? 0;
  const topPct = Math.round(100 - nationalPct);
  const superlativeLabel = scores?.superlative_label;

  // Build subtitle: district, state
  const subtitle = [pc.district, pc.state].filter(Boolean).join(", ");

  const shareText = `${pc.name} just scored ${overallScore}/100 on @AreaIQ. Top ${topPct}% in India. What's your area? -> https://area-iq-one.vercel.app/area/${pincode}`;

  return (
    <div
      className="flex flex-col min-h-screen grain"
      style={{ background: "#FDFCF7", fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <a href="#main" className="skip-link">
        skip to content
      </a>

      {/* ── Top bar ─────────────────────────────────────── */}
      <header
        className="px-6 py-4 w-full flex items-center justify-between border-b border-slate-100/80 sticky top-0 z-40 backdrop-blur-sm"
        style={{ background: "rgba(253,252,247,0.92)" }}
      >
        <a
          href="/"
          className="text-base font-bold tracking-tight"
          style={{ color: "#0A0A0A" }}
        >
          Area<span style={{ color: "#DCA800" }}>IQ</span>
        </a>
        <span
          className="text-[10px] font-bold tracking-[0.14em] uppercase px-3 py-1.5 rounded-full"
          style={{
            background: "#FFF9E6",
            color: "#DCA800",
            border: "1px solid #F5C518",
          }}
        >
          Early Access
        </span>
      </header>

      {/* ── Search bar ──────────────────────────────────── */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 shadow-sm"
          style={{ background: "#fff" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0 text-slate-400"
            aria-hidden="true"
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <PincodeNavInput currentPincode={pincode} />
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────── */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          {/* Left: name + subtitle + optional badge */}
          <div className="flex flex-col gap-2 min-w-0">
            <h1
              className="leading-none tracking-[-0.02em] break-words"
              style={{
                fontWeight: 700,
                color: "#0A0A0A",
                fontFamily: "var(--font-fraunces), serif",
                fontSize: "clamp(2.75rem, 7vw, 5rem)",
              }}
            >
              {pc.name}
            </h1>
            <p
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: "#64748b" }}
            >
              {subtitle}
            </p>
            {/* Superlative badge — feature-flagged, only renders if data present */}
            {superlativeLabel && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold w-fit mt-1"
                style={{
                  background: "#FFF9E6",
                  color: "#DCA800",
                  border: "1.5px solid #F5C518",
                }}
              >
                {scores?.archetype_emoji && (
                  <span aria-hidden="true">{scores.archetype_emoji}</span>
                )}
                {superlativeLabel}
              </span>
            )}
          </div>

          {/* Right: Share + Add Review */}
          <div className="flex items-center gap-3 shrink-0 sm:mt-2">
            <ShareButton
              text={shareText}
              url={`/area/${pincode}`}
              score={overallScore}
              name={pc.name}
              topPct={topPct}
            />
            <a
              href={`/area/${pincode}#add-review`}
              className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap"
              style={{
                border: "1.5px solid #0A0A0A",
                color: "#0A0A0A",
                background: "transparent",
              }}
            >
              Add Review
            </a>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────── */}
      <main
        id="main"
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-24"
      >
        <ScoreCard data={data} />
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer
        className="border-t border-slate-200/70 px-6 py-6"
        style={{ background: "#FDFCF7" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-bold text-sm" style={{ color: "#0A0A0A" }}>
            Area<span style={{ color: "#DCA800" }}>IQ</span>
          </span>
          <span className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} AreaIQ. Built for India.
          </span>
        </div>
      </footer>
    </div>
  );
}
