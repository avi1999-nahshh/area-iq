"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { IQv2 } from "../lib";

const CardMap = dynamic(
  () => import("./card-map").then((m) => m.CardMap),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="w-full h-full"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, rgba(245,158,11,0.18), transparent 55%), #0d1219",
        }}
      />
    ),
  },
);

interface Props {
  d: IQv2;
  name: string;
  monoClass: string;
}

/**
 * Flippable share-preview card.
 * Front: AreaIQ visual + dark CARTO map with amber 1.5km radius + pin.
 * Back: 6-dimension breakdown of the score.
 *
 * Idle wobble every 8s suggests the back exists. Pauses when off-screen
 * (IntersectionObserver) and respects prefers-reduced-motion.
 */
export function FlippableCard({ d, name, monoClass }: Props) {
  const [flipped, setFlipped] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-onscreen");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.3) {
            el.classList.add("is-onscreen");
          } else {
            el.classList.remove("is-onscreen");
          }
        }
      },
      { threshold: [0, 0.3, 0.6, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dims: { label: string; value: number }[] = [
    { label: "Air", value: d.scores.air },
    { label: "Essentials", value: d.scores.essentials },
    { label: "Lifestyle", value: d.scores.lifestyle },
    { label: "Connectivity", value: d.scores.connectivity },
    { label: "Density", value: d.scores.density },
    { label: "Affordability", value: d.scores.affordability },
  ];

  return (
    <div className="relative flex justify-center">
      <div
        ref={wrapperRef}
        className="card-perspective relative w-[280px] sm:w-[300px] aspect-[3/4]"
        style={{ perspective: "1400px" }}
      >
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={
            flipped
              ? "Show share preview front"
              : "Show score breakdown back"
          }
          className={`flip-stage group absolute inset-0 w-full h-full text-left rounded-2xl ${
            flipped ? "is-flipped" : "is-front"
          }`}
        >
          {/* FRONT */}
          <CardFace
            side="front"
            className="bg-slate-900 text-white"
            style={{
              boxShadow:
                "0 4px 8px rgba(15,23,42,0.06), 0 24px 48px -16px rgba(15,23,42,0.30)",
            }}
          >
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="live-pulse w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span
                className={`${monoClass} text-[9px] tracking-[0.22em] uppercase text-amber-300/80 font-semibold`}
              >
                Live
              </span>
            </div>
            <div
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-700 group-hover:rotate-[-12deg] group-hover:scale-110"
              style={{
                transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                background: "rgba(255,255,255,0.08)",
              }}
              aria-hidden
            >
              <FlipIcon />
            </div>

            <div className="pt-6">
              <p
                className={`${monoClass} text-[10px] tracking-[0.22em] uppercase text-amber-300 font-semibold truncate`}
              >
                AreaIQ · {d.pincode}
              </p>
              <p className="mt-1.5 text-[20px] sm:text-[22px] font-bold leading-[1.05] tracking-tight truncate">
                {name}
              </p>
              <p
                className={`${monoClass} mt-0.5 text-[10px] tracking-[0.18em] uppercase text-slate-400 truncate`}
              >
                {d.district} · Bangalore
              </p>
            </div>

            <div className="my-3 w-full h-[110px] rounded-xl overflow-hidden bg-[#0d1219]">
              <CardMap lat={d.lat} lng={d.lng} />
            </div>

            <div className="mt-auto pb-6">
              <p
                className={`${monoClass} text-[10px] tracking-[0.16em] uppercase text-amber-300 font-semibold leading-tight`}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {d.brag_label}
              </p>
              <p
                className={`${monoClass} mt-1 text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight leading-[0.9]`}
              >
                {Math.round(d.scores.overall)}
              </p>
              <p
                className={`${monoClass} mt-1 text-[10px] tracking-[0.18em] uppercase text-slate-400 truncate`}
              >
                of 100 · Overall AreaIQ
              </p>
            </div>

            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 text-[9.5px] tracking-[0.16em] uppercase font-semibold text-amber-300/90">
              <span className={monoClass}>Tap for breakdown</span>
              <ArrowIcon />
            </div>
          </CardFace>

          {/* BACK */}
          <CardFace
            side="back"
            className="bg-amber-50 text-slate-900"
            style={{
              boxShadow:
                "0 4px 8px rgba(217,119,6,0.06), 0 24px 48px -16px rgba(217,119,6,0.22)",
            }}
          >
            <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center" aria-hidden>
              <FlipIcon className="text-amber-700" />
            </div>

            <div className="pt-6">
              <p className={`${monoClass} text-[10px] tracking-[0.22em] uppercase text-amber-700 font-semibold truncate`}>
                Score breakdown · {d.pincode}
              </p>
              <p className="mt-1 text-[20px] sm:text-[22px] font-bold leading-[1.05] tracking-tight text-slate-900 truncate">
                {name}
              </p>
            </div>

            <ul className="mt-4 space-y-2">
              {dims.map((dim) => {
                const v = Math.round(dim.value);
                const tone =
                  v >= 70
                    ? "text-amber-700 bg-amber-700"
                    : v >= 45
                      ? "text-slate-800 bg-slate-700"
                      : "text-rose-700 bg-rose-500";
                const [textTone, barTone] = tone.split(" ");
                return (
                  <li key={dim.label}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-medium text-slate-700 truncate">
                        {dim.label}
                      </span>
                      <span className={`${monoClass} text-[13px] font-bold tabular-nums ${textTone} shrink-0`}>
                        {v}
                      </span>
                    </div>
                    <div className="mt-1 h-[3px] bg-amber-200/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barTone}`}
                        style={{ width: `${Math.max(2, v)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto pb-6">
              <div className="flex items-baseline justify-between pt-3 border-t border-amber-200/70 gap-2">
                <span className={`${monoClass} text-[10px] tracking-[0.18em] uppercase text-amber-700 font-semibold truncate`}>
                  Overall AreaIQ
                </span>
                <span className={`${monoClass} text-2xl font-extrabold tabular-nums text-slate-900 shrink-0`}>
                  {Math.round(d.scores.overall)}
                </span>
              </div>
            </div>

            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 text-[9.5px] tracking-[0.16em] uppercase font-semibold text-amber-700">
              <ArrowIcon flipped />
              <span className={monoClass}>Tap for share preview</span>
            </div>
          </CardFace>
        </button>

        <p
          className={`${monoClass} absolute -top-6 left-0 text-[10px] tracking-[0.22em] uppercase text-slate-400 font-semibold`}
        >
          Share preview · tap to flip
        </p>
      </div>

      <style>{`
        .card-perspective .flip-stage {
          transform-style: preserve-3d;
          transition: transform 700ms cubic-bezier(0.32, 0.72, 0, 1);
          transform: rotateY(0deg);
          cursor: pointer;
          outline: none;
        }
        .card-perspective .flip-stage:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 6px;
          border-radius: 1.25rem;
        }
        .card-perspective .flip-stage.is-flipped {
          transform: rotateY(180deg);
        }
        .card-perspective.is-onscreen .flip-stage.is-front {
          animation: card-wobble 8s cubic-bezier(0.32, 0.72, 0, 1) infinite;
        }
        .card-perspective.is-onscreen .flip-stage.is-front:hover,
        .card-perspective.is-onscreen .flip-stage.is-front:focus-visible,
        .card-perspective .flip-stage:active {
          animation: none;
        }
        .flip-stage.is-flipped .live-pulse {
          animation-play-state: paused;
        }
        @keyframes card-wobble {
          0%, 70%, 100% { transform: rotateY(0deg); }
          78%           { transform: rotateY(-12deg); }
          86%           { transform: rotateY(8deg); }
          92%           { transform: rotateY(-3deg); }
        }
        .card-perspective .flip-stage:active:not(.is-flipped) {
          transform: rotateY(0deg) scale(0.985);
        }
        .card-perspective .flip-stage.is-flipped:active {
          transform: rotateY(180deg) scale(0.985);
        }
        @media (prefers-reduced-motion: reduce) {
          .card-perspective .flip-stage,
          .card-perspective.is-onscreen .flip-stage.is-front {
            animation: none;
            transition: transform 200ms linear;
          }
        }
      `}</style>
    </div>
  );
}

function CardFace({
  side,
  className,
  style,
  children,
}: {
  side: "front" | "back";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 rounded-2xl p-6 flex flex-col overflow-hidden ${className ?? ""}`}
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: side === "back" ? "rotateY(180deg)" : "rotateY(0deg)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function FlipIcon({ className }: { className?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12c0-4.4 3.6-8 8-8h4" />
      <path d="m11 1 3 3-3 3" />
      <path d="M22 12c0 4.4-3.6 8-8 8h-4" />
      <path d="m13 23-3-3 3-3" />
    </svg>
  );
}

function ArrowIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: flipped ? "rotate(180deg)" : "none" }}
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
