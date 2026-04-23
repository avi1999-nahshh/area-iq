"use client";

import { useRef, useEffect, useState } from "react";

const areas = [
  { pincode: "560008", name: "Halasuru, Bengaluru" },
  { pincode: "560038", name: "Indiranagar, Bengaluru" },
];

const scores = [
  { label: "Infrastructure", a: 85, b: 92 },
  { label: "Safety",         a: 70, b: 74 },
  { label: "Cleanliness",    a: 60, b: 68 },
  { label: "Air quality",    a: 50, b: 53 },
];

const stats = [
  { label: "Avg price", a: "₹14,150/sqft", b: "₹18,200/sqft" },
  { label: "Metro",     a: "0.8 km",       b: "0.3 km"        },
  { label: "AQI",       a: "105",          b: "98"            },
];

export function CompareCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--mouse-x", "-999px");
    el.style.setProperty("--mouse-y", "-999px");
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="spotlight-card relative bg-white rounded-2xl p-5 w-full max-w-md"
    >
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 mb-4 pb-4 border-b border-slate-100 items-center">
        <div>
          <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">
            {areas[0].pincode}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{areas[0].name}</p>
        </div>
        <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
          VS
        </span>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">
            {areas[1].pincode}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{areas[1].name}</p>
        </div>
      </div>

      {/* Score bars — animate from 0 on mount, staggered per row */}
      <div className="space-y-4 mb-5">
        {scores.map((s, i) => {
          const aWins = s.a >= s.b;
          const delay = `${i * 110}ms`;
          return (
            <div key={s.label} className="grid grid-cols-[auto_1fr_1fr] gap-x-4 items-center">
              <span className="text-[11px] text-slate-400 w-20 shrink-0">{s.label}</span>
              {/* Left bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${aWins ? "bg-amber-400" : "bg-slate-300"}`}
                    style={{
                      width: mounted ? `${s.a}%` : "0%",
                      transition: `width 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}`,
                    }}
                  />
                </div>
                <span className={`text-[11px] tabular-nums font-semibold w-6 ${aWins ? "text-amber-600" : "text-slate-400"}`}>
                  {s.a}
                </span>
              </div>
              {/* Right bar */}
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${!aWins ? "bg-amber-400" : "bg-slate-300"}`}
                    style={{
                      width: mounted ? `${s.b}%` : "0%",
                      transition: `width 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}`,
                    }}
                  />
                </div>
                <span className={`text-[11px] tabular-nums font-semibold w-6 text-right ${!aWins ? "text-amber-600" : "text-slate-400"}`}>
                  {s.b}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      <div className="border-t border-slate-100 pt-4 grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-2">
        {stats.map((s) => (
          <>
            <span key={`label-${s.label}`} className="text-[10px] text-slate-400 w-20">
              {s.label}
            </span>
            <span key={`a-${s.label}`} className="text-[11px] font-medium text-slate-700">
              {s.a}
            </span>
            <span key={`b-${s.label}`} className="text-[11px] font-medium text-slate-700 text-right">
              {s.b}
            </span>
          </>
        ))}
      </div>
    </div>
  );
}
