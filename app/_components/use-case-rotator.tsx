"use client";

import Link from "next/link";

const ITEMS = [
  { kicker: "Insights", headline: "Look it up.", tail: "Six dimensions. Five seconds.", href: "/insights" },
  { kicker: "Compare", headline: "Settle it.", tail: "Two areas, head-to-head.", href: "/compare" },
  { kicker: "Reach", headline: "Live within reach.", tail: "Pin your office. Rank by commute.", href: "/proximity" },
];

interface Props {
  monoClass: string;
}

export function UseCaseRotator({ monoClass }: Props) {
  return (
    <div className="rotator">
      {/* animated rotator — fixed height to avoid layout shift; reduced-motion stacks all 3 */}
      <div className="rotator-stage relative min-h-[88px] sm:min-h-[78px]" aria-hidden>
        {ITEMS.map((it, i) => (
          <div key={it.href} className={`rotator-item rotator-item-${i + 1}`}>
            <span
              className={`${monoClass} inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold tracking-[0.18em] uppercase bg-amber-50 text-amber-700`}
            >
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              {it.kicker}
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              {it.headline}{" "}
              <span className={`${monoClass} font-medium text-slate-500 text-sm sm:text-base tracking-tight`}>
                {it.tail}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* always-visible action chips — instant comprehension + reduced-motion fallback */}
      <ul className="mt-5 flex flex-wrap items-center gap-2">
        {ITEMS.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="group inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full border border-slate-900/10 bg-white text-slate-800 text-xs font-semibold tracking-tight transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-amber-500/40 hover:bg-amber-50 hover:text-amber-800 active:scale-[0.97]"
            >
              {it.kicker}
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-900/5 text-slate-700 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-[1px]"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <style>{`
        .rotator-item {
          position: absolute;
          inset: 0;
          opacity: 0;
          transform: translateY(8px);
          animation: rot-fade 6s infinite cubic-bezier(0.32, 0.72, 0, 1);
          will-change: opacity, transform;
        }
        .rotator-item-1 { animation-delay: 0s; }
        .rotator-item-2 { animation-delay: 2s; }
        .rotator-item-3 { animation-delay: 4s; }
        @keyframes rot-fade {
          0%   { opacity: 0; transform: translateY(8px); }
          5%   { opacity: 1; transform: translateY(0); }
          28%  { opacity: 1; transform: translateY(0); }
          33%  { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rotator-stage { min-height: 0 !important; }
          .rotator-item {
            position: static;
            opacity: 1;
            transform: none;
            animation: none;
            margin-bottom: 1rem;
          }
          .rotator-item:last-child { margin-bottom: 0; }
        }
      `}</style>
    </div>
  );
}
