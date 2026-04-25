"use client";

import { useEffect, useRef } from "react";
import type { IQv2 } from "./lib";

interface Props {
  pincodes: IQv2[];
}

/**
 * Bangalore overview map for the /insights index. Same visual treatment as
 * compare/hero-map: CARTO Positron tiles, light cream background, amber
 * accents — but with all 129 pincodes plotted as score-scaled circles
 * instead of a two-pin head-to-head.
 *
 * Read-only: no zoom, drag, or scroll-wheel.
 */
export function BlrMap({ pincodes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let alive = true;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!alive || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        keyboard: false,
        touchZoom: false,
        boxZoom: false,
        attributionControl: false,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 },
      ).addTo(map);

      // One amber circle marker per pincode, sized by score band.
      const allLatLngs: [number, number][] = [];
      for (const p of pincodes) {
        const score = p.scores.overall;
        const radius = score >= 70 ? 5.5 : score >= 50 ? 4.5 : 3.5;
        const fillOpacity = Math.max(
          0.35,
          Math.min(0.85, 0.35 + (score - 30) / 110),
        );
        L.circleMarker([p.lat, p.lng], {
          radius,
          color: "#b45309",
          weight: 1,
          fillColor: "#d97706",
          fillOpacity,
          interactive: false,
        }).addTo(map);
        allLatLngs.push([p.lat, p.lng]);
      }

      if (allLatLngs.length > 0) {
        const bounds = L.latLngBounds(allLatLngs).pad(0.05);
        map.fitBounds(bounds, { animate: false });
      } else {
        map.setView([12.9716, 77.5946], 11);
      }
    }

    init().catch(console.error);

    return () => {
      alive = false;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [pincodes]);

  return (
    <>
      <style>{`
        .blr-map-skin .leaflet-container {
          background: #fbf7ee !important;
          font-family: inherit !important;
        }
        .blr-map-skin .leaflet-pane,
        .blr-map-skin .leaflet-tile-pane,
        .blr-map-skin .leaflet-overlay-pane {
          pointer-events: none;
        }
      `}</style>
      <div className="blr-map-skin relative w-full h-full bg-[#fbf7ee]">
        <div
          ref={containerRef}
          className="relative w-full h-full"
          aria-label={`Map of ${pincodes.length} scored Bangalore pincodes`}
          role="img"
          style={{ pointerEvents: "none" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(217,119,6,0.18), inset 0 1px 2px rgba(15,23,42,0.05)",
            borderRadius: "inherit",
          }}
        />
      </div>
    </>
  );
}
