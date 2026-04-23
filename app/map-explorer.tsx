"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useLayoutEffect } from "react";

type FilterKey = "overall" | "safety" | "airQuality" | "infrastructure" | "cleanliness" | "affordability";

const MapInner = dynamic(() => import("./map-inner").then((m) => m.MapInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full skeleton-shimmer rounded-2xl" />
  ),
});

const filters: { key: FilterKey; label: string }[] = [
  { key: "overall",        label: "Overall"        },
  { key: "safety",         label: "Safety"         },
  { key: "airQuality",     label: "Air quality"    },
  { key: "infrastructure", label: "Infrastructure" },
  { key: "cleanliness",    label: "Cleanliness"    },
  { key: "affordability",  label: "Affordability"  },
];

export function MapExplorer() {
  const [active, setActive] = useState<FilterKey>("overall");
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [pillReady, setPillReady] = useState(false);

  useLayoutEffect(() => {
    const activeIndex = filters.findIndex((f) => f.key === active);
    const btn = buttonRefs.current[activeIndex];
    if (!btn) return;
    setPill({
      left:   btn.offsetLeft,
      top:    btn.offsetTop,
      width:  btn.offsetWidth,
      height: btn.offsetHeight,
    });
    if (!pillReady) setPillReady(true);
  }, [active, pillReady]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter chips with sliding pill */}
      <div className="relative flex flex-wrap gap-2">
        {/* Sliding amber pill — transitions smoothly between chips */}
        <div
          aria-hidden
          className="absolute bg-amber-500 rounded-full pointer-events-none"
          style={{
            left:    pill.left,
            top:     pill.top,
            width:   pill.width,
            height:  pill.height,
            opacity: pillReady ? 1 : 0,
            transition: pillReady
              ? "left 0.3s cubic-bezier(0.16,1,0.3,1), top 0.3s cubic-bezier(0.16,1,0.3,1), width 0.3s cubic-bezier(0.16,1,0.3,1), height 0.3s cubic-bezier(0.16,1,0.3,1)"
              : "none",
          }}
        />
        {filters.map((f, i) => (
          <button
            key={f.key}
            ref={(el) => { buttonRefs.current[i] = el; }}
            onClick={() => setActive(f.key)}
            className={[
              "relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
              active === f.key
                ? "text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-[0.97]",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="w-full h-[480px] rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <MapInner filter={active} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-[11px] text-slate-400">
        {[
          { color: "#f59e0b", label: "Great (80+)"   },
          { color: "#fbbf24", label: "Good (65–79)"  },
          { color: "#94a3b8", label: "Average (50–64)" },
          { color: "#cbd5e1", label: "Below avg"     },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ background: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
