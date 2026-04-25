import { Geist, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { TopNav } from "@/app/insights/top-nav";
import { getIQv2 } from "@/app/insights/lib";
import { displayName } from "@/app/insights/blr-aliases";
import { parsePairSlug, pairSlug as makePairSlug } from "../lib";
import { HeadToHead } from "../head-to-head";

const sans = Geist({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

interface Props {
  params: Promise<{ pair: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parsePairSlug(pair);
  if (!parsed) return { title: "Compare — AreaIQ" };
  const a = getIQv2(parsed.a);
  const b = getIQv2(parsed.b);
  if (!a || !b) return { title: "Compare — AreaIQ" };
  const aName = displayName(a.pincode, a.name).replace(/\s*\(Bangalore\)\s*$/i, "");
  const bName = displayName(b.pincode, b.name).replace(/\s*\(Bangalore\)\s*$/i, "");
  return {
    title: `${aName} vs ${bName} — AreaIQ`,
    description: `Head-to-head AreaIQ comparison: ${aName} vs ${bName}.`,
  };
}

export default async function CompareMockupPage({ params }: Props) {
  const { pair } = await params;
  const parsed = parsePairSlug(pair);

  const a = parsed ? getIQv2(parsed.a) : null;
  const b = parsed ? getIQv2(parsed.b) : null;

  if (!parsed || !a || !b) {
    return <OutOfScopePanel pair={pair} />;
  }

  // Re-derive the canonical slug so the URL printed on the share card always
  // matches our chosen form, even if the inbound URL was a legacy variant.
  const canonical = makePairSlug(a.pincode, b.pincode);

  // Build the canonical absolute URL for the verdict-card footer + copy-link.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "areaiq.app";
  const shareUrl = `${proto}://${host}/compare/${canonical}`;

  return (
    <div className={`${sans.className} relative min-h-[100dvh] bg-[#f9f7f3] text-slate-900`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-amber-500 focus:text-white focus:rounded-md focus:font-semibold"
      >
        Skip to content
      </a>
      <GrainOverlay />
      <TopNav />
      <main id="main" className={mono.className.length > 0 ? "" : ""}>
        <HeadToHead a={a} b={b} shareUrl={shareUrl} />
      </main>
    </div>
  );
}

function OutOfScopePanel({ pair }: { pair: string }) {
  return (
    <div className={`${sans.className} relative min-h-[100dvh] bg-[#f9f7f3] text-slate-900`}>
      <GrainOverlay />
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-amber-700 font-semibold">
          Out of scope
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
          AreaIQ is Bangalore-only for now.
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Our scoring engine has only been built for Bangalore urban pincodes
          this week. More cities are launching soon — until then, both sides
          have to be in Bangalore.
        </p>
        <p className="mt-6 font-mono text-xs text-slate-400 break-all">
          Tried: <span className="text-slate-700">{pair}</span>
        </p>
        <div className="mt-8">
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            Try Indiranagar vs Koramangala →
          </Link>
        </div>
      </main>
    </div>
  );
}

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        opacity: 0.04,
        mixBlendMode: "multiply",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.7'/></svg>\")",
      }}
    />
  );
}
