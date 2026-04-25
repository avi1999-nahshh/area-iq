import Link from "next/link";
import { Geist, JetBrains_Mono } from "next/font/google";
import { UseCaseRotator } from "./_components/use-case-rotator";
import { TopNav } from "./insights/top-nav";
import { FlippableCard } from "./insights/[pincode]/flippable-card";
import { getIQv2 } from "./insights/lib";
import { displayName } from "./insights/blr-aliases";

const sans = Geist({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const KICKER = "text-[11px] tracking-[0.22em] uppercase font-semibold";

export default function Home() {
  // Real Indiranagar data drives the hero card — same shape and component
  // as /insights/[pincode], so the landing preview matches the live thing.
  const heroSample = getIQv2("560038");

  return (
    <div className={`${sans.className} relative min-h-[100dvh] bg-[#f9f7f3] text-slate-900`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-amber-500 focus:text-white focus:rounded-md focus:font-semibold"
      >
        Skip to content
      </a>
      <GrainOverlay />
      <PageStagger />

      <TopNav />

      <main id="main" className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-20 sm:pb-28">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-center">
          <div className="stagger-1">
            <p className={`${mono.className} ${KICKER} text-amber-700`}>
              Bangalore neighbourhoods, decided
            </p>
            <h1
              className="mt-4 text-[2.5rem] leading-[1.04] sm:text-6xl lg:text-[5.25rem] font-extrabold tracking-tighter"
              style={{ textWrap: "balance" }}
            >
              Choose your{" "}
              <span className="italic text-amber-600">next</span>{" "}
              Bangalore neighbourhood.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed italic max-w-xl">
              The argument-ender for HSR vs Whitefield, the report card for any pincode, and the commute-aware shortlist when you&apos;re moving for work.
            </p>

            {/* Kinetic rotator — surfaces the 3 use cases on a 6s loop with
                always-visible chips below for instant scan. */}
            <div className="mt-7 sm:mt-8">
              <UseCaseRotator monoClass={mono.className} />
            </div>
          </div>

          {/* Right: live sample card — same component as /insights/[pincode] */}
          <div className="stagger-2 relative justify-self-center lg:justify-self-end pt-6 lg:pt-0">
            {heroSample && (
              <FlippableCard
                d={heroSample}
                name={displayName(heroSample.pincode, heroSample.name)}
                monoClass={mono.className}
                surface="landing-hero"
              />
            )}
          </div>
        </section>

        {/* ── Three feature panels ─────────────────────────────── */}
        <section
          aria-label="Three ways to use AreaIQ"
          className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          <FeaturePanel
            num="01"
            kicker="Insights"
            headline="Read the report card."
            body="Search any Bangalore neighbourhood. Get a six-dimension report card in five seconds."
            sub="6 scores · 1 share-card · 1 deep dive"
            href="/insights"
            cta="See a report card"
            variant="hero"
            className="lg:col-span-2"
            staggerIdx={3}
          />
          <FeaturePanel
            num="02"
            kicker="Compare"
            headline="End the argument."
            body="Indiranagar vs Koramangala? Two areas, head-to-head."
            sub="Verdict · trash-talk · numbers"
            href="/compare"
            cta="Pick two areas"
            staggerIdx={4}
          />
          <FeaturePanel
            num="03"
            kicker="Reach"
            headline="Live within reach."
            body="Pin your office. We rank Bangalore neighbourhoods within your commute window, weighted by the dimensions you care about."
            sub="Office address · commute slider · ranked matches"
            href="/proximity"
            cta="Find your area"
            variant="wide"
            className="lg:col-span-3"
            staggerIdx={5}
          />
        </section>

        {/* ── Closing typographic statement ────────────────────── */}
        <section className="stagger-6 mt-16 sm:mt-24 border-t border-slate-200/70 pt-10 sm:pt-12">
          <p className={`${mono.className} ${KICKER} text-slate-400 mb-4`}>
            What you&apos;re looking at
          </p>
          <p
            className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-slate-900 leading-[1.1] max-w-4xl"
            style={{ textWrap: "balance" }}
          >
            <span className={`${mono.className} tabular-nums`}>129</span> pincodes.{" "}
            <span className={`${mono.className} tabular-nums`}>6</span> dimensions.{" "}
            <span className="text-amber-700">Air. Essentials. Lifestyle. Connectivity. Density. Affordability.</span>
          </p>
          <p className="mt-5 text-sm sm:text-base text-slate-600 italic max-w-2xl leading-relaxed">
            We&apos;d rather show less, honestly, than more, badly.{" "}
            <Link
              href="/methodology"
              className="not-italic text-amber-700 hover:text-amber-900 underline underline-offset-2 decoration-amber-300 hover:decoration-amber-600 font-semibold transition-colors"
            >
              How we score each one →
            </Link>
          </p>
        </section>
      </main>

      <footer className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-gray-200/70 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <span className="font-semibold text-slate-900">
          Area<span className="text-amber-500">IQ</span>
        </span>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <FooterLink href="/insights">Insights</FooterLink>
          <FooterLink href="/compare">Compare</FooterLink>
          <FooterLink href="/proximity">Reach</FooterLink>
          <FooterLink href="/methodology">Methodology</FooterLink>
          <span aria-hidden className="text-slate-300">·</span>
          <span className={mono.className}>Bangalore · {new Date().getFullYear()}</span>
        </nav>
      </footer>
    </div>
  );
}

// ── Feature panel ────────────────────────────────────────────────────────

function FeaturePanel({
  num,
  kicker,
  headline,
  body,
  sub,
  href,
  cta,
  variant,
  className,
  staggerIdx,
}: {
  num: string;
  kicker: string;
  headline: string;
  body: string;
  sub: string;
  href: string;
  cta: string;
  variant?: "hero" | "wide";
  className?: string;
  staggerIdx: number;
}) {
  const isHero = variant === "hero";
  const isWide = variant === "wide";
  const headlineSize = isHero
    ? "text-3xl sm:text-4xl lg:text-5xl"
    : isWide
      ? "text-3xl sm:text-4xl"
      : "text-2xl sm:text-3xl";

  const sharedShell =
    "group relative bg-white rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3]";
  const shadowStyle = {
    boxShadow:
      "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.10)",
  };

  if (isWide) {
    return (
      <Link
        href={href}
        className={`stagger-${staggerIdx} ${sharedShell} p-6 sm:p-8 hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_18px_40px_-16px_rgba(15,23,42,0.16)] ${className ?? ""}`}
        style={shadowStyle}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-12 items-center">
          <div>
            <CardKicker num={num} kicker={kicker} monoClass={mono.className} />
            <h2
              className={`${headlineSize} font-extrabold tracking-tighter text-slate-900 leading-[1.05] mt-4 mb-2`}
              style={{ textWrap: "balance" }}
            >
              {headline}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              {body}
            </p>
            <p className={`${mono.className} mt-3 ${KICKER} text-slate-400`}>
              {sub}
            </p>
          </div>
          <div className="lg:justify-self-end">
            <CTAButton cta={cta} variant="solid" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`stagger-${staggerIdx} ${sharedShell} ${isHero ? "p-6 sm:p-8" : "p-5 sm:p-6"} flex flex-col hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_18px_40px_-16px_rgba(15,23,42,0.16)] ${className ?? ""}`}
      style={shadowStyle}
    >
      <CardKicker num={num} kicker={kicker} monoClass={mono.className} />
      <h2
        className={`${headlineSize} font-extrabold tracking-tighter text-slate-900 leading-[1.05] mt-4 mb-2`}
        style={{ textWrap: "balance" }}
      >
        {headline}
      </h2>
      <p className="text-base text-slate-600 leading-relaxed max-w-md">{body}</p>
      <p className={`${mono.className} mt-3 ${KICKER} text-slate-400`}>{sub}</p>
      <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 group-hover:text-amber-700 transition-colors">
        {cta}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

function CardKicker({
  num,
  kicker,
  monoClass,
}: {
  num: string;
  kicker: string;
  monoClass: string;
}) {
  return (
    <span className={`${monoClass} ${KICKER} text-slate-400`}>
      {num} · {kicker}
    </span>
  );
}

function CTAButton({ cta, variant }: { cta: string; variant: "solid" | "ghost" }) {
  const cls =
    variant === "solid"
      ? "bg-slate-900 text-white group-hover:bg-amber-500 group-hover:text-slate-900"
      : "text-slate-700 group-hover:text-amber-700";
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md ${cls} text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`}
    >
      {cta}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </span>
  );
}

// ── Footer link ──────────────────────────────────────────────────────────

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hover:text-amber-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f7f3] rounded-sm"
    >
      {children}
    </Link>
  );
}

// ── Page-rise stagger (CSS-only) ────────────────────────────────────────

function PageStagger() {
  return (
    <style>{`
      .stagger-1, .stagger-2, .stagger-3, .stagger-4, .stagger-5, .stagger-6 {
        opacity: 0;
        transform: translateY(10px);
        animation: page-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        will-change: transform, opacity;
      }
      .stagger-1 { animation-delay: 0ms; }
      .stagger-2 { animation-delay: 80ms; }
      .stagger-3 { animation-delay: 220ms; }
      .stagger-4 { animation-delay: 300ms; }
      .stagger-5 { animation-delay: 380ms; }
      .stagger-6 { animation-delay: 460ms; }
      @keyframes page-rise {
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .stagger-1, .stagger-2, .stagger-3, .stagger-4, .stagger-5, .stagger-6 {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }
    `}</style>
  );
}

// ── Grain overlay ────────────────────────────────────────────────────────

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
