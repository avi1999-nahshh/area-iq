"use client";

import { useRef, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const PINCODE_A = "560034"; // Koramangala, Bengaluru
const PINCODE_B = "400050"; // Bandra West, Mumbai

export function CompareCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const dataA = useQuery(api.area.getByPincode, { pincode: PINCODE_A });
  const dataB = useQuery(api.area.getByPincode, { pincode: PINCODE_B });

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

  const isLoading = dataA === undefined || dataB === undefined;

  if (isLoading) {
    return (
      <div className="relative bg-white rounded-2xl p-5 w-full max-w-md border border-slate-100">
        {/* Header skeleton */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 mb-4 pb-4 border-b border-slate-100 items-center">
          <div className="space-y-1.5">
            <div className="skeleton-shimmer h-5 w-16 rounded" />
            <div className="skeleton-shimmer h-3 w-28 rounded" />
          </div>
          <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">VS</span>
          <div className="space-y-1.5 flex flex-col items-end">
            <div className="skeleton-shimmer h-5 w-16 rounded" />
            <div className="skeleton-shimmer h-3 w-28 rounded" />
          </div>
        </div>
        {/* Bar skeletons */}
        <div className="space-y-4 mb-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr] gap-x-4 items-center">
              <div className="skeleton-shimmer h-3 w-20 rounded" />
              <div className="skeleton-shimmer h-1.5 rounded-full" />
              <div className="skeleton-shimmer h-1.5 rounded-full" />
            </div>
          ))}
        </div>
        {/* Stats skeleton */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr] gap-x-4">
              <div className="skeleton-shimmer h-3 w-20 rounded" />
              <div className="skeleton-shimmer h-3 w-20 rounded" />
              <div className="skeleton-shimmer h-3 w-20 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const aScores = dataA?.scores;
  const bScores = dataB?.scores;
  const aTransit = dataA?.transit;
  const bTransit = dataB?.transit;
  const aAirQuality = dataA?.airQuality;
  const bAirQuality = dataB?.airQuality;
  const aProperty = dataA?.property;
  const bProperty = dataB?.property;
  const aPincode = dataA?.pincode;
  const bPincode = dataB?.pincode;

  const scores = [
    {
      label: "Infrastructure",
      a: Math.round(aScores?.infrastructure_score ?? 0),
      b: Math.round(bScores?.infrastructure_score ?? 0),
    },
    {
      label: "Safety",
      a: Math.round(aScores?.safety_score ?? 0),
      b: Math.round(bScores?.safety_score ?? 0),
    },
    {
      label: "Cleanliness",
      a: Math.round(aScores?.cleanliness_score ?? 0),
      b: Math.round(bScores?.cleanliness_score ?? 0),
    },
    {
      label: "Air quality",
      a: Math.round(aScores?.air_quality_score ?? 0),
      b: Math.round(bScores?.air_quality_score ?? 0),
    },
  ];

  const aRentRaw = aProperty?.city_rent_median_2bhk;
  const bRentRaw = bProperty?.city_rent_median_2bhk;
  const aRent = aRentRaw ? `₹${(aRentRaw / 1000).toFixed(0)}k/mo` : "N/A";
  const bRent = bRentRaw ? `₹${(bRentRaw / 1000).toFixed(0)}k/mo` : "N/A";

  const aMetro = aTransit?.nearest_metro_km != null
    ? `${aTransit.nearest_metro_km.toFixed(1)} km`
    : "N/A";
  const bMetro = bTransit?.nearest_metro_km != null
    ? `${bTransit.nearest_metro_km.toFixed(1)} km`
    : "N/A";

  const aAqi = aAirQuality?.aqi != null ? String(Math.round(aAirQuality.aqi)) : "N/A";
  const bAqi = bAirQuality?.aqi != null ? String(Math.round(bAirQuality.aqi)) : "N/A";

  const stats = [
    { label: "2BHK rent", a: aRent, b: bRent },
    { label: "Metro",     a: aMetro, b: bMetro },
    { label: "AQI",       a: aAqi,   b: bAqi },
  ];

  const aName = aPincode ? `${aPincode.name}, ${aPincode.district}` : PINCODE_A;
  const bName = bPincode ? `${bPincode.name}, ${bPincode.district}` : PINCODE_B;

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
            {PINCODE_A}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{aName}</p>
        </div>
        <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
          VS
        </span>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">
            {PINCODE_B}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{bName}</p>
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
