import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CivicBrief } from "./civic-brief";
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

  const pc = data.pincode;
  const overallScore = data.scores?.overall_score ?? 0;
  const nationalPct = data.scores?.overall_national_pct ?? 0;
  const topPct = Math.round(100 - nationalPct);
  const shareText = `${pc.name} just scored ${overallScore}/100 on @AreaIQ. Top ${topPct}% in India. What's your area? -> https://area-iq-one.vercel.app/area/${pincode}`;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#FAF6EE" }}>
      <a href="#main" className="skip-link">
        skip to content
      </a>

      {/* ── Top bar ─────────────────────────────────────── */}
      <header
        className="px-5 sm:px-6 py-3 w-full flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm"
        style={{
          background: "rgba(250,246,238,0.92)",
          borderBottom: "1px solid #D9D1B8",
        }}
      >
        <a
          href="/"
          className="text-base font-bold tracking-tight"
          style={{ color: "#1A2633" }}
        >
          Area<span style={{ color: "#C88A1F" }}>IQ</span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <ShareButton
            text={shareText}
            url={`/area/${pincode}`}
            score={overallScore}
            name={pc.name}
            topPct={topPct}
          />
          <a
            href={`/area/${pincode}#add-review`}
            className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap"
            style={{
              border: "1px solid #1A2633",
              color: "#1A2633",
              background: "transparent",
            }}
          >
            Add Review
          </a>
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────── */}
      <div className="w-full max-w-[1180px] mx-auto px-5 sm:px-8 md:px-12 pt-4">
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{
            background: "#F0E9D6",
            border: "1px solid #D9D1B8",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
            style={{ color: "#706B5D" }}
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

      {/* ── Main content ────────────────────────────────── */}
      <main id="main" className="flex-1 w-full">
        <CivicBrief data={data} />
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer
        className="px-5 sm:px-6 py-5"
        style={{ background: "#FAF6EE", borderTop: "1px solid #D9D1B8" }}
      >
        <div
          className="max-w-[1180px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ color: "#706B5D", fontSize: "12px" }}
        >
          <span className="font-bold text-sm" style={{ color: "#1A2633" }}>
            Area<span style={{ color: "#C88A1F" }}>IQ</span>
          </span>
          <span>&copy; {new Date().getFullYear()} AreaIQ. Built for India.</span>
        </div>
      </footer>
    </div>
  );
}
