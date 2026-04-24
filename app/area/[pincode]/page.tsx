import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreCard } from "./score-card";
import { ShareButton } from "./share-button";

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

  const { pincode: pc, scores, contacts } = data;
  const overallScore = scores?.overall_score ?? 0;
  const nationalPct = scores?.overall_national_pct ?? 0;
  const topPct = Math.round(100 - nationalPct);

  const shareUrl =
    typeof window === "undefined"
      ? `https://area-iq-one.vercel.app/area/${pincode}`
      : `${window.location.origin}/area/${pincode}`;

  const shareText = `🏘️ ${pc.name} just scored ${overallScore}/100 on @AreaIQ. Top ${topPct}% in India. What's your area? → ${shareUrl}`;

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] grain">
      <a href="#main" className="skip-link">
        skip to content
      </a>

      <header
        className="px-6 py-5 max-w-3xl mx-auto w-full flex items-center justify-between animate-fade-in-up"
        style={{ animationDelay: "0ms" }}
      >
        <a
          href="/"
          className="font-semibold text-lg tracking-tight text-slate-900 hover:opacity-80 transition-opacity"
        >
          Area<span className="text-amber-500">IQ</span>
        </a>
        <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
          report card
        </span>
      </header>

      <main id="main" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 pb-32">
        <ScoreCard data={data} />
      </main>

      {/* sticky share bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-6 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <ShareButton
            text={shareText}
            url={`/area/${pincode}`}
            score={overallScore}
            name={pc.name}
            topPct={topPct}
          />
        </div>
      </div>

      <footer className="border-t border-slate-200/70 px-6 py-6 bg-[#fdfcf7]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-semibold text-slate-900 text-sm">
            Area<span className="text-amber-500">IQ</span>
          </span>
          <span className="text-xs text-slate-400">
            © {new Date().getFullYear()} AreaIQ. Built for India.
          </span>
        </div>
      </footer>
    </div>
  );
}
