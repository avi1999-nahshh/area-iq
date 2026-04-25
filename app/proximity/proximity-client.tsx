"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { api } from "@/convex/_generated/api";
import type { IQv2 } from "@/app/insights/lib";
import { displayName } from "@/app/insights/blr-aliases";
import { ShareButton } from "@/app/_components/share-button";
import { proximityShareText } from "@/app/_lib/share-copy";
import { track } from "@/app/_lib/track";
import {
  DIMS,
  MODE_LABEL,
  OFFICE_PRESETS,
  rankMatches,
  rankFromMinutes,
  gradeFromScore,
  type DimKey,
  type Mode,
  type OfficePreset,
} from "./lib";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const ProximityMap = dynamic(
  () => import("./proximity-map").then((m) => m.ProximityMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-amber-50 via-stone-50 to-slate-50 animate-pulse" />
    ),
  }
);

const MIN_STOPS = [15, 25, 35, 45, 60];

const DEPART_OPTIONS = ["7am", "8am", "9am", "10am", "11am"] as const;
const RETURN_OPTIONS = ["5pm", "6pm", "7pm", "8pm", "9pm"] as const;
type DepartTime = (typeof DEPART_OPTIONS)[number];
type ReturnTime = (typeof RETURN_OPTIONS)[number];

interface Props {
  pincodes: IQv2[];
}

export function ProximityClient({ pincodes }: Props) {
  const [office, setOffice] = useState<OfficePreset>(OFFICE_PRESETS[0]);
  const [addressText, setAddressText] = useState<string>(OFFICE_PRESETS[0].label);
  const [showPresets, setShowPresets] = useState(false);
  const [maxMinutes, setMaxMinutes] = useState<number>(35);
  const [mode, setMode] = useState<Mode>("transit");
  const [priorities, setPriorities] = useState<Set<DimKey>>(new Set());
  const [departTime, setDepartTime] = useState<DepartTime>("10am");
  const [returnTime, setReturnTime] = useState<ReturnTime>("7pm");
  const [hoursModalOpen, setHoursModalOpen] = useState(false);

  // ─── real-routing state ─────────────────────────────
  // minutesByPincode = OSRM road-network commute times for the current (office, mode)
  // pair. Refreshed on origin/mode change, cached on the Convex side. Slider and
  // priority chips re-filter against this cache without hitting the API.
  const commuteMatrix = useAction(api.proximity.commuteMatrix);
  const [minutesByPincode, setMinutesByPincode] = useState<Map<string, number>>(new Map());
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "live" | "error">(
    "idle"
  );

  // ─── geocode state (Nominatim address autocomplete) ────────
  // Debounced 800ms (Nominatim ToS = 1 req/sec). Empty input shows presets;
  // 3+ chars triggers a live search. Picking a result builds an ad-hoc
  // OfficePreset keyed by `nominatim-{placeId}` so the "selected" pip works.
  const geocode = useAction(api.proximity.geocode);
  type GeocodeResult = { label: string; lat: number; lng: number; placeId: string };
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // ─── URL state persistence ─────────────────────────────────
  // Read once on mount so a shared link (e.g. /proximity?t=35&mode=transit&p=air,lifestyle)
  // re-creates the search. Then on form changes, replace the URL (no history
  // entry) so a copy-link captures the current state.
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("t");
    const m = searchParams.get("mode");
    const p = searchParams.get("p");
    const q = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (t) {
      const num = Number(t);
      if (MIN_STOPS.includes(num)) setMaxMinutes(num);
    }
    if (m === "transit" || m === "drive" || m === "walk") {
      setMode(m);
    }
    if (p) {
      const valid = new Set(DIMS.map((d) => d.key));
      const next = new Set(
        p.split(",").filter((k): k is DimKey => valid.has(k as DimKey)),
      );
      if (next.size > 0) setPriorities(next);
    }
    // If the URL carries a custom geocoded location, restore it.
    if (q && lat && lng) {
      const latN = Number(lat);
      const lngN = Number(lng);
      if (Number.isFinite(latN) && Number.isFinite(lngN)) {
        setOffice({ id: `url-${q}`, label: q, lat: latN, lng: lngN });
        setAddressText(q);
      }
    } else if (q) {
      // try matching a preset by label
      const preset = OFFICE_PRESETS.find(
        (o) => o.label.toLowerCase() === q.toLowerCase(),
      );
      if (preset) {
        setOffice(preset);
        setAddressText(preset.label);
      }
    }
    // Run once on mount; we don't want re-applying on subsequent renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write to URL on key form changes. router.replace is cheap and doesn't
  // pollute history; coalesce via a microtask so multiple updates batch.
  useEffect(() => {
    const params = new URLSearchParams();
    if (office.label) params.set("q", office.label);
    // Persist lat/lng for non-preset offices so the destination is restorable
    if (!OFFICE_PRESETS.some((p) => p.id === office.id)) {
      params.set("lat", office.lat.toFixed(6));
      params.set("lng", office.lng.toFixed(6));
    }
    params.set("t", String(maxMinutes));
    params.set("mode", mode);
    if (priorities.size > 0) {
      params.set("p", Array.from(priorities).join(","));
    }
    router.replace(`/proximity?${params.toString()}`, { scroll: false });
  }, [office, maxMinutes, mode, priorities, router]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(() => {
      geocode({ query: q })
        .then((results) => setSearchResults(results))
        .catch((err) => {
          console.error("[proximity] geocode failed:", err);
          setSearchResults([]);
        })
        .finally(() => setSearchLoading(false));
    }, 800);
    return () => clearTimeout(t);
  }, [geocode, searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setRouteStatus("loading");
    commuteMatrix({
      originLat: office.lat,
      originLng: office.lng,
      mode,
      destinations: pincodes.map((p) => ({
        pincode: p.pincode,
        lat: p.lat,
        lng: p.lng,
      })),
    })
      .then((result) => {
        if (cancelled) return;
        const map = new Map<string, number>();
        for (const r of result) map.set(r.pincode, r.minutes);
        setMinutesByPincode(map);
        setRouteStatus("live");
      })
      .catch((err) => {
        console.error("[proximity] OSRM matrix failed, falling back to haversine:", err);
        if (cancelled) return;
        setMinutesByPincode(new Map()); // signals fallback path below
        setRouteStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [commuteMatrix, office.lat, office.lng, mode, pincodes]);

  const matches = useMemo(() => {
    // Real routing: rank from minutes map. Fallback (error or first paint): straight-line.
    if (minutesByPincode.size > 0) {
      return rankFromMinutes(pincodes, minutesByPincode, maxMinutes, priorities);
    }
    return rankMatches(
      pincodes,
      { lat: office.lat, lng: office.lng },
      mode,
      maxMinutes,
      priorities
    );
  }, [pincodes, minutesByPincode, office.lat, office.lng, mode, maxMinutes, priorities]);

  const top = matches.slice(0, 6);
  const remainingCount = Math.max(0, matches.length - top.length);

  function togglePriority(key: DimKey) {
    setPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function pickPreset(p: OfficePreset) {
    track("Search Submitted", {
      surface: "proximity",
      source: "preset",
      preset_id: p.id,
    });
    setOffice(p);
    setAddressText(p.label);
    setSearchQuery("");
    setSearchResults([]);
    setShowPresets(false);
  }

  function pickGeocoded(r: GeocodeResult) {
    track("Search Submitted", {
      surface: "proximity",
      source: "geocode",
      query_length: searchQuery.trim().length,
    });
    const next: OfficePreset = {
      id: `nominatim-${r.placeId}`,
      label: r.label.split(",").slice(0, 2).join(",").trim(), // first two address parts, readable
      lat: r.lat,
      lng: r.lng,
    };
    setOffice(next);
    setAddressText(next.label);
    setSearchQuery("");
    setSearchResults([]);
    setShowPresets(false);
  }

  return (
    <div className={`${inter.className} flex flex-col gap-6`}>
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className={`${mono.className} text-[11px] font-semibold tracking-[0.2em] uppercase text-amber-700`}>
            Proximity · Bangalore
          </p>
          <h1 className="text-3xl sm:text-[2.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Where should you live, given where you work?
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            Tell us where you work, how far you&rsquo;ll commute, and what matters most.
            We rank Bangalore&rsquo;s urban pincodes by what fits — not by what&rsquo;s marketable.
          </p>
        </div>
        <div className="shrink-0">
          <ShareButton
            surface="proximity"
            size="sm"
            variant="ghost"
            label="Share search"
            share={proximityShareText({
              officeLabel: office.label,
              maxMinutes,
              mode: MODE_LABEL[mode],
              query: office.label,
            })}
            trackProps={{
              max_minutes: maxMinutes,
              mode,
              priorities: Array.from(priorities).join(",") || "none",
            }}
          />
        </div>
      </header>

      {/* Form panel */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 flex flex-col gap-5"
        style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 30px -12px rgba(15,23,42,0.10)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Office input — typeable combobox: search any BLR address or pick a preset */}
          <div className="lg:col-span-5 flex flex-col gap-2 relative">
            <label className={`${mono.className} text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500`}>
              Work Location
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery !== "" ? searchQuery : addressText}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowPresets(true);
                }}
                onFocus={(e) => {
                  // Select-all on focus so the user can type to replace the current
                  // office without manually clearing it first. Without this, the
                  // field looks "filled" and the search affordance is hidden.
                  e.target.select();
                  setShowPresets(true);
                }}
                onBlur={() => setTimeout(() => setShowPresets(false), 200)}
                placeholder="Type any Bangalore address — MG Road, Indiranagar, your home…"
                aria-haspopup="listbox"
                aria-expanded={showPresets}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden>
                {searchLoading ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
              </span>
              {showPresets && (
                <div
                  role="listbox"
                  className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[28rem] overflow-y-auto"
                  style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 18px 40px -16px rgba(15,23,42,0.18)" }}
                >
                  {/* Mode A — empty input: show presets only (no search noise). */}
                  {searchQuery.trim().length === 0 && (
                    <div>
                      <div className={`${mono.className} px-3 pt-3 pb-1 text-[9px] font-semibold tracking-[0.18em] uppercase text-slate-400`}>
                        Quick picks · Bangalore tech parks
                      </div>
                      {OFFICE_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          role="option"
                          aria-selected={office.id === p.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickPreset(p)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-50 flex items-center gap-2 transition ${
                            office.id === p.id ? "bg-amber-50/60" : ""
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              office.id === p.id ? "bg-amber-500" : "bg-slate-200"
                            }`}
                            aria-hidden
                          />
                          <span className="text-slate-800">{p.label}</span>
                        </button>
                      ))}
                      <div className={`${mono.className} px-3 py-2 text-[10px] text-slate-400 border-t border-slate-100`}>
                        or start typing — any Bangalore address works
                      </div>
                    </div>
                  )}

                  {/* Mode B — typing 1-2 chars: hint, no API call yet. */}
                  {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                    <div className={`${mono.className} px-3 py-3 text-[11px] text-slate-500`}>
                      Keep typing… <span className="text-slate-400">(at least 3 characters)</span>
                    </div>
                  )}

                  {/* Mode C — typing 3+ chars: search results only, no preset clutter. */}
                  {searchQuery.trim().length >= 3 && (
                    <div>
                      <div className={`${mono.className} px-3 pt-3 pb-1 text-[9px] font-semibold tracking-[0.18em] uppercase text-slate-400 flex items-center justify-between`}>
                        <span>{searchLoading ? "Searching…" : searchResults.length > 0 ? `${searchResults.length} matches in Bangalore` : "No matches"}</span>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="text-amber-700 hover:text-amber-900 normal-case tracking-normal text-[10px] font-semibold"
                        >
                          ← back to presets
                        </button>
                      </div>
                      {searchResults.map((r) => (
                        <button
                          key={r.placeId}
                          type="button"
                          role="option"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickGeocoded(r)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 flex items-start gap-2 transition"
                        >
                          <span className="text-amber-500 mt-0.5 shrink-0" aria-hidden>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                              <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z" />
                            </svg>
                          </span>
                          <span className="text-slate-800 leading-snug line-clamp-2">{r.label}</span>
                        </button>
                      ))}
                      {!searchLoading && searchResults.length === 0 && (
                        <div className="px-3 py-3 text-[12px] text-slate-500 leading-relaxed">
                          Try a road name (&ldquo;Sarjapur Road&rdquo;, &ldquo;100 Feet Road&rdquo;) or
                          a locality (&ldquo;Indiranagar&rdquo;, &ldquo;Bellandur&rdquo;). OSM data is
                          thin for individual buildings.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Type any Bangalore address, or pick a preset.
            </p>
          </div>

          {/* Slider */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className={`${mono.className} text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500`}>
                Max Commute Time
              </label>
              <span className={`${mono.className} text-sm font-bold text-amber-600 tabular-nums`}>
                {maxMinutes} min
              </span>
            </div>
            <div className="py-2">
              <input
                type="range"
                min={15}
                max={60}
                step={5}
                value={maxMinutes}
                onChange={(e) => setMaxMinutes(Number(e.target.value))}
                className="w-full px-slider"
                aria-label="Max commute time in minutes"
              />
            </div>
            <div className={`${mono.className} flex justify-between text-[10px] text-slate-400 tabular-nums`}>
              {MIN_STOPS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMaxMinutes(m)}
                  className={`hover:text-slate-700 transition ${
                    maxMinutes === m ? "text-amber-600 font-bold" : ""
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <p className={`${mono.className} text-[10px] text-slate-500 leading-snug mt-1`}>
              Assumes standard office hours · {departTime} out · {returnTime} back ·{" "}
              <button
                type="button"
                onClick={() => setHoursModalOpen(true)}
                className="text-amber-700 hover:text-amber-900 underline underline-offset-2 decoration-amber-300 hover:decoration-amber-600 font-semibold transition"
              >
                Adjust hours
              </button>
            </p>
          </div>

          {/* Transport toggle */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <label className={`${mono.className} text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500`}>
              Preferred Transport
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["transit", "drive", "walk"] as Mode[]).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={active}
                    className={`py-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition active:translate-y-[1px] ${
                      active
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <ModeIcon mode={m} active={active} />
                    <span className="text-[11px] font-semibold">{MODE_LABEL[m]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Prioritize chips */}
        <div className="pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className={`${mono.className} text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500 sm:min-w-[90px]`}>
            Prioritize
          </span>
          <div className="flex flex-wrap gap-2">
            {DIMS.map((d) => {
              const active = priorities.has(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => togglePriority(d.key)}
                  aria-pressed={active}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition active:translate-y-[1px] ${
                    active
                      ? "bg-amber-50 text-amber-800 ring-1 ring-amber-300"
                      : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <DimIcon name={d.icon} active={active} />
                  {d.label}
                </button>
              );
            })}
            {priorities.size > 0 && (
              <button
                type="button"
                onClick={() => setPriorities(new Set())}
                className="text-[12px] text-slate-500 hover:text-slate-800 underline underline-offset-2 ml-1"
              >
                clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Map + results */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* Map */}
        <div
          className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 h-[360px] sm:h-[460px] lg:h-[640px]"
          style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 30px -12px rgba(15,23,42,0.10)" }}
        >
          <ProximityMap
            origin={{ lat: office.lat, lng: office.lng, label: office.label }}
            matches={top}
            maxMinutes={maxMinutes}
            mode={mode}
          />
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4 lg:max-h-[640px] lg:overflow-y-auto lg:pr-2">
          <div className="flex items-end justify-between mb-1 gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Top Matches</h2>
              <RouteStatusPip status={routeStatus} />
            </div>
            <span className={`${mono.className} text-xs text-slate-500 tabular-nums`}>
              {matches.length} {matches.length === 1 ? "area" : "areas"} in window
            </span>
          </div>

          {routeStatus === "loading" && top.length === 0 ? (
            <MatchSkeletons />
          ) : top.length === 0 ? (
            <EmptyState mode={mode} maxMinutes={maxMinutes} />
          ) : (
            <>
              {top.map((m, i) => (
                <MatchCard key={m.pincode.pincode} match={m} rank={i + 1} mode={mode} />
              ))}
              {remainingCount > 0 && (
                <p className={`${mono.className} text-[11px] text-slate-400 text-center pt-2`}>
                  +{remainingCount} more in window — narrow priorities to surface
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {hoursModalOpen && (
        <HoursModal
          depart={departTime}
          back={returnTime}
          onSave={(d, r) => {
            setDepartTime(d);
            setReturnTime(r);
            setHoursModalOpen(false);
          }}
          onClose={() => setHoursModalOpen(false)}
        />
      )}

      <style>{`
        input.px-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(to right, #f59e0b 0%, #f59e0b ${
            ((35 - 15) / (60 - 15)) * 100
          }%, #e2e8f0 0%);
          outline: none;
        }
        input.px-slider {
          background: linear-gradient(to right, #f59e0b var(--p, 50%), #e2e8f0 var(--p, 50%));
        }
        input.px-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f59e0b;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(245,158,11,0.45);
          cursor: pointer;
        }
        input.px-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f59e0b;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(245,158,11,0.45);
          cursor: pointer;
        }
        @keyframes pxFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .px-card {
          animation: pxFadeUp 600ms cubic-bezier(0.32, 0.72, 0, 1) both;
          animation-delay: calc(var(--i, 0) * 70ms);
        }
        @media (prefers-reduced-motion: reduce) {
          .px-card { animation: none; }
        }
      `}</style>
      <SliderProgress maxMinutes={maxMinutes} />
    </div>
  );
}

// Renders the slider's filled-track percentage as a CSS variable so the gradient
// updates live without inline-style churn on every render of the input.
function SliderProgress({ maxMinutes }: { maxMinutes: number }) {
  const pct = ((maxMinutes - 15) / (60 - 15)) * 100;
  return (
    <style>{`input.px-slider { --p: ${pct}%; }`}</style>
  );
}

function MatchCard({
  match,
  rank,
  mode,
}: {
  match: ReturnType<typeof rankMatches>[number];
  rank: number;
  mode: Mode;
}) {
  const p = match.pincode;
  const isTop = rank === 1;
  const name = displayName(p.pincode, p.name);
  const minutes = Math.round(match.minutes);
  const rent = p.raw.rent_2bhk;
  const overall = Math.round(match.weighted);

  const trio: { label: string; key: keyof typeof p.scores }[] = [
    { label: "Air", key: "air" },
    { label: "Lifestyle", key: "lifestyle" },
    { label: "Value", key: "affordability" },
  ];

  return (
    <Link
      href={`/insights/${p.pincode}`}
      className={`px-card group relative block rounded-2xl p-6 sm:p-7 transition active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
        isTop
          ? "bg-white ring-2 ring-amber-300"
          : "bg-white ring-1 ring-slate-200/80 hover:ring-slate-300"
      }`}
      style={{
        boxShadow: isTop
          ? "0 8px 30px rgba(245,158,11,0.18), 0 1px 2px rgba(15,23,42,0.04)"
          : "0 1px 2px rgba(15,23,42,0.04), 0 6px 20px -12px rgba(15,23,42,0.08)",
        ["--i" as string]: rank - 1,
      } as React.CSSProperties}
    >
      {/* Top row: rank badge + score, balanced */}
      <div className="flex items-start justify-between gap-4 mb-5">
        {isTop ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 text-white text-[10px] font-bold tracking-[0.18em] uppercase">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            Best Match
          </span>
        ) : (
          <span className={`${mono.className} inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold tracking-[0.18em] uppercase`}>
            Rank #{rank}
          </span>
        )}
        <div className="text-right shrink-0">
          <span className={`${mono.className} block text-[9px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-0.5`}>
            IQ Score
          </span>
          <span className={`${mono.className} block font-extrabold tabular-nums leading-[0.9] ${
            isTop ? "text-[46px] text-amber-600" : "text-[34px] text-slate-900"
          }`}>
            {overall}
          </span>
        </div>
      </div>

      {/* Name + brag label */}
      <div className="mb-5">
        <h3 className="text-[19px] font-bold text-slate-900 leading-tight mb-1.5 break-words">
          {name}
        </h3>
        <p className="text-[13px] text-amber-700 font-medium leading-snug">
          {p.brag_label}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div>
          <p className={`${mono.className} text-[9px] font-semibold tracking-[0.16em] uppercase text-slate-400 mb-1.5`}>
            Commute
          </p>
          <div className="flex items-center gap-2 text-slate-800">
            <ModeIcon mode={mode} active={false} small />
            <span className={`${mono.className} font-bold text-[14px] tabular-nums`}>
              ≈ {minutes} min
            </span>
          </div>
        </div>
        <div>
          <p className={`${mono.className} text-[9px] font-semibold tracking-[0.16em] uppercase text-slate-400 mb-1.5`}>
            Rent · 2BHK
          </p>
          <div className="flex items-center gap-2 text-slate-800">
            <span className="text-slate-400" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" />
              </svg>
            </span>
            <span className={`${mono.className} font-bold text-[14px] tabular-nums`}>
              {rent != null ? `₹${Math.round(rent / 100) / 10}k` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Inline grade ladder */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {trio.map((t, idx) => {
          const score = p.scores[t.key] as number;
          const grade = gradeFromScore(score);
          const tone =
            score >= 75 ? "text-amber-700" : score >= 55 ? "text-slate-700" : "text-slate-400";
          return (
            <span key={t.label} className="inline-flex items-baseline gap-1.5">
              <span className="text-[10px] tracking-[0.14em] uppercase text-slate-400 font-semibold">
                {t.label}
              </span>
              <span className={`${mono.className} text-[13px] font-bold tabular-nums ${tone}`}>
                {grade}
              </span>
              {idx < trio.length - 1 && (
                <span className="text-slate-300 ml-1" aria-hidden>·</span>
              )}
            </span>
          );
        })}
      </div>

    </Link>
  );
}

function HoursModal({
  depart,
  back,
  onSave,
  onClose,
}: {
  depart: DepartTime;
  back: ReturnTime;
  onSave: (d: DepartTime, r: ReturnTime) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<DepartTime>(depart);
  const [r, setR] = useState<ReturnTime>(back);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hours-modal-title"
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${inter.className} bg-white rounded-2xl w-full max-w-md p-6 sm:p-7`}
        style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 24px 60px -20px rgba(15,23,42,0.30)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 id="hours-modal-title" className="text-lg font-extrabold tracking-tight text-slate-900">
              Adjust commute hours
            </h2>
            <p className="text-[13px] text-slate-500 leading-snug mt-1">
              We assume a standard office day. Pick the times that match your schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 -mt-1 -mr-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <fieldset className="mb-4">
          <legend className={`${mono.className} text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500 mb-2`}>
            Morning departure
          </legend>
          <div className="grid grid-cols-5 gap-1.5">
            {DEPART_OPTIONS.map((opt) => {
              const active = d === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setD(opt)}
                  aria-pressed={active}
                  className={`py-2 rounded-lg border text-[13px] font-semibold transition active:translate-y-[1px] ${
                    active
                      ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mb-6">
          <legend className={`${mono.className} text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500 mb-2`}>
            Evening return
          </legend>
          <div className="grid grid-cols-5 gap-1.5">
            {RETURN_OPTIONS.map((opt) => {
              const active = r === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setR(opt)}
                  aria-pressed={active}
                  className={`py-2 rounded-lg border text-[13px] font-semibold transition active:translate-y-[1px] ${
                    active
                      ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition active:translate-y-[1px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(d, r)}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-amber-500 hover:bg-amber-600 shadow-sm transition active:translate-y-[1px]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function RouteStatusPip({
  status,
}: {
  status: "idle" | "loading" | "live" | "error";
}) {
  const cfg = {
    idle: { label: "warming up", dot: "bg-slate-300", text: "text-slate-400" },
    loading: { label: "routing…", dot: "bg-amber-500 animate-pulse", text: "text-amber-700" },
    live: { label: "live · road network", dot: "bg-emerald-500", text: "text-emerald-700" },
    error: { label: "fallback · straight-line", dot: "bg-slate-400", text: "text-slate-500" },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden />
      <span className={cfg.text}>{cfg.label}</span>
    </span>
  );
}

function MatchSkeletons() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-6 sm:p-7 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-5">
            <div className="h-5 w-16 bg-slate-100 rounded" />
            <div className="h-9 w-14 bg-slate-100 rounded" />
          </div>
          <div className="h-5 w-2/3 bg-slate-100 rounded mb-2" />
          <div className="h-3 w-1/2 bg-slate-100 rounded mb-5" />
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="h-7 bg-slate-100 rounded" />
            <div className="h-7 bg-slate-100 rounded" />
          </div>
          <div className="h-4 bg-slate-50 rounded" />
        </div>
      ))}
    </>
  );
}

function EmptyState({ mode, maxMinutes }: { mode: Mode; maxMinutes: number }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center">
      <p className="text-sm text-slate-700 font-semibold mb-1">Nothing in this window</p>
      <p className="text-[13px] text-slate-500 leading-relaxed">
        Nothing within {maxMinutes} min by {MODE_LABEL[mode].toLowerCase()}. Widen the slider, or switch transport.
      </p>
    </div>
  );
}

function ModeIcon({
  mode,
  active,
  small,
}: {
  mode: Mode;
  active: boolean;
  small?: boolean;
}) {
  const size = small ? 14 : 18;
  const stroke = active ? "white" : "currentColor";
  if (mode === "transit") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="16" rx="3" />
        <path d="M4 11h16" /><path d="M8 19l-2 3" /><path d="M16 19l2 3" />
        <circle cx="9" cy="15" r="1" /><circle cx="15" cy="15" r="1" />
      </svg>
    );
  }
  if (mode === "drive") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 16H9m10 0h1.5a1.5 1.5 0 0 0 1.5-1.5v-2a1.5 1.5 0 0 0-1.5-1.5H17l-2-4H7L5 11H3.5A1.5 1.5 0 0 0 2 12.5v2A1.5 1.5 0 0 0 3.5 16H5" />
        <circle cx="7" cy="16" r="2" /><circle cx="17" cy="16" r="2" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2" /><path d="m9 20 3-6 3 4 4-3" /><path d="M5 22 9 14" /><path d="m13 14 1.5-3 4 1" />
    </svg>
  );
}

function DimIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "#92400e" : "currentColor";
  const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "air":
      return <svg {...props}><path d="M3 8h12a3 3 0 1 0-3-3" /><path d="M3 14h17a3 3 0 1 1-3 3" /><path d="M3 11h7" /></svg>;
    case "lifestyle":
      return <svg {...props}><path d="M5 11a7 7 0 0 1 14 0v3a7 7 0 0 1-14 0z" /><path d="M9 21h6" /></svg>;
    case "essentials":
      return <svg {...props}><path d="M3 9 12 3l9 6v11a1 1 0 0 1-1 1h-5v-7H10v7H4a1 1 0 0 1-1-1z" /></svg>;
    case "connectivity":
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></svg>;
    case "rupee":
      return <svg {...props}><path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" /></svg>;
    default:
      return null;
  }
}

