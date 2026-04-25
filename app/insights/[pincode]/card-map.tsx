"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
}

/**
 * Card-sized map: dark CARTO tiles with an amber 1.5km radius circle and
 * amber pin to match the share-card palette. Non-interactive — pointer-events
 * pass through so the click bubbles to the parent flip button.
 */
export function CardMap({ lat, lng }: Props) {
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
        center: [lat, lng],
        zoom: 12,
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
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 },
      ).addTo(map);

      L.circle([lat, lng], {
        radius: 1500,
        color: "#fbbf24",
        weight: 1.25,
        opacity: 0.85,
        fillColor: "#f59e0b",
        fillOpacity: 0.16,
        interactive: false,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="width:10px;height:10px;background:#fbbf24;border:2px solid #0f1620;border-radius:50%;box-shadow:0 0 0 4px rgba(245,158,11,0.18);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });
      L.marker([lat, lng], { icon: pinIcon, interactive: false }).addTo(map);
    }

    init().catch(console.error);

    return () => {
      alive = false;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <>
      <style>{`
        .card-map-skin .leaflet-container {
          background: #0d1219 !important;
          font-family: inherit !important;
        }
        .card-map-skin .leaflet-pane,
        .card-map-skin .leaflet-tile-pane,
        .card-map-skin .leaflet-overlay-pane {
          pointer-events: none;
        }
      `}</style>
      <div className="card-map-skin relative w-full h-full">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 55%, rgba(245,158,11,0.18), transparent 55%), #0d1219",
          }}
        />
        <div
          ref={containerRef}
          className="relative w-full h-full"
          aria-label="Pincode neighbourhood map"
          role="img"
          style={{ pointerEvents: "none" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(251,191,36,0.18), inset 0 1px 2px rgba(0,0,0,0.45)",
            borderRadius: "inherit",
          }}
        />
      </div>
    </>
  );
}
