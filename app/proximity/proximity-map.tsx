"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Match } from "./lib";
import type { Mode } from "./lib";
import { MODE_KMPM, MODE_LABEL } from "./lib";

interface Props {
  origin: { lat: number; lng: number; label: string };
  matches: Match[];
  maxMinutes: number;
  mode: Mode;
}

export function ProximityMap({ origin, matches, maxMinutes, mode }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const layersRef = useRef<unknown[]>([]);

  // Pre-fetch the report card pages for visible matches so the navigation
  // feels instant when the user double-clicks.
  useEffect(() => {
    for (const m of matches.slice(0, 6)) {
      router.prefetch(`/insights/${m.pincode.pincode}`);
    }
  }, [matches, router]);

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!isMounted || !containerRef.current) return;

      // Build map once.
      let map = mapRef.current as ReturnType<typeof L.map> | null;
      if (!map) {
        map = L.map(containerRef.current, {
          center: [origin.lat, origin.lng],
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: false,
          doubleClickZoom: false, // free up dblclick for marker → report-card navigation
          attributionControl: false,
        });
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          { subdomains: "abcd", maxZoom: 19 }
        ).addTo(map);
        mapRef.current = map;
      }

      // Wipe previous overlay layers.
      for (const layer of layersRef.current) {
        (layer as { remove: () => void }).remove();
      }
      layersRef.current = [];

      // Commute "blob" — straight-line proxy for an isochrone.
      const radiusM = MODE_KMPM[mode] * maxMinutes * 1000;
      const blob = L.circle([origin.lat, origin.lng], {
        radius: radiusM,
        color: "#f59e0b",
        weight: 1.5,
        opacity: 0.55,
        fillColor: "#fbbf24",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map);
      layersRef.current.push(blob);

      // Office pin (amber square with work icon).
      const officeIcon = L.divIcon({
        className: "",
        html: `<div style="width:34px;height:34px;border-radius:8px;background:#f59e0b;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 4px 12px rgba(245,158,11,0.45);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const officeMarker = L.marker([origin.lat, origin.lng], {
        icon: officeIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindTooltip(origin.label, {
          permanent: false,
          direction: "top",
          offset: [0, -16],
          className: "px-map-tooltip",
        });
      layersRef.current.push(officeMarker);

      // Numbered match pins.
      const top = matches.slice(0, 6);
      const bounds = L.latLngBounds([[origin.lat, origin.lng]]);
      top.forEach((m, i) => {
        const isTop = i === 0;
        const ring = isTop ? "#92400e" : "#475569";
        const fill = isTop ? "#f59e0b" : "white";
        const ink = isTop ? "white" : "#0f172a";
        const matchIcon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;border-radius:999px;background:${fill};color:${ink};border:2px solid ${ring};display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;font-size:12px;box-shadow:0 4px 10px rgba(15,23,42,0.18);">${i + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([m.pincode.lat, m.pincode.lng], {
          icon: matchIcon,
        })
          .addTo(map)
          .bindTooltip(
            `<strong>${m.pincode.name}</strong> · ${Math.round(m.minutes)} min<br/><span style="opacity:.7">double-click to open</span>`,
            {
              direction: "top",
              offset: [0, -14],
              className: "px-map-tooltip",
            }
          );
        marker.on("dblclick", () => {
          router.push(`/insights/${m.pincode.pincode}`);
        });
        layersRef.current.push(marker);
        bounds.extend([m.pincode.lat, m.pincode.lng]);
      });

      // Fit to commute window unless empty.
      if (top.length > 0) {
        map.fitBounds(bounds.pad(0.15), { animate: false });
      } else {
        map.setView([origin.lat, origin.lng], 12, { animate: false });
      }
    }

    init().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [origin.lat, origin.lng, origin.label, matches, maxMinutes, mode, router]);

  // Tear down map only when component unmounts.
  useEffect(() => {
    return () => {
      const map = mapRef.current as { remove?: () => void } | null;
      if (map?.remove) map.remove();
      mapRef.current = null;
      layersRef.current = [];
    };
  }, []);

  return (
    <>
      <style>{`
        .px-map-tooltip {
          background: #0f172a !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          letter-spacing: 0.02em !important;
          padding: 6px 9px !important;
          box-shadow: 0 4px 12px rgba(15,23,42,0.18) !important;
          line-height: 1.4 !important;
          text-align: center !important;
        }
        .px-map-tooltip strong { font-weight: 700; letter-spacing: 0.04em; }
        .px-map-tooltip::before { border-top-color: #0f172a !important; }
        .leaflet-marker-icon { cursor: pointer !important; }
        .leaflet-control-zoom a {
          background: white !important;
          color: #475569 !important;
          border: 1px solid #e2e8f0 !important;
        }
        .leaflet-control-zoom a:hover { background: #f8fafc !important; }
      `}</style>
      {/*
        Z-index scale (project-wide):
          nav        z-40    (sticky TopNav)
          map chips  z-[400] (sit above Leaflet's 200–400 panes, below popups at 700)
          modal      z-[1100] (above all Leaflet panes incl. popup at 700)
      */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md border border-slate-200 flex flex-wrap items-center gap-x-2 gap-y-1 max-w-[calc(100%-1.5rem)]"
        style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 6px 18px -10px rgba(15,23,42,0.18)" }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden />
          <span className="text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
            {maxMinutes} min · {MODE_LABEL[mode]} window
          </span>
        </span>
        <span className="text-slate-300 text-[10px]" aria-hidden>·</span>
        <span className="text-[10px] tracking-wide text-slate-500">
          double-click pin to open
        </span>
      </div>
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label="Map showing commute window and top matches"
        role="img"
      />
    </>
  );
}
