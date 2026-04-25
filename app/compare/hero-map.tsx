"use client";

import { useEffect, useRef } from "react";

interface Props {
  a: { lat: number; lng: number; name: string };
  b: { lat: number; lng: number; name: string };
}

/**
 * Hero "vs" map. Single CARTO Positron (light) map showing both pincodes with
 * amber pins, 1.5km radius around each, and a thin amber line connecting
 * them. Light treatment matches the warm cream page background; the dark
 * insights CardMap stays dark on its own page.
 */
export function HeroMap({ a, b }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let alive = true;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!alive || !containerRef.current || mapRef.current) return;

      const center: [number, number] = [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2];
      const map = L.map(containerRef.current, {
        center,
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
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 },
      ).addTo(map);

      const radiusOpts = {
        radius: 1500,
        color: "#b45309",
        weight: 1.5,
        opacity: 0.75,
        fillColor: "#d97706",
        fillOpacity: 0.14,
        interactive: false,
      };
      L.circle([a.lat, a.lng], radiusOpts).addTo(map);
      L.circle([b.lat, b.lng], radiusOpts).addTo(map);

      // Connecting line — communicates "head-to-head".
      L.polyline(
        [
          [a.lat, a.lng],
          [b.lat, b.lng],
        ],
        {
          color: "#b45309",
          weight: 1.5,
          opacity: 0.55,
          dashArray: "5 6",
          interactive: false,
        },
      ).addTo(map);

      const pin = (label: string) =>
        L.divIcon({
          className: "",
          html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <span style="font:600 9px/1 ui-monospace,'JetBrains Mono',monospace;letter-spacing:0.16em;text-transform:uppercase;color:#b45309;background:#fff;padding:3px 6px;border-radius:3px;border:1px solid #d97706;margin-bottom:4px;white-space:nowrap;box-shadow:0 1px 2px rgba(15,23,42,0.06);">${label}</span>
            <span style="width:11px;height:11px;background:#d97706;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(217,119,6,0.20),0 1px 2px rgba(15,23,42,0.18);"></span>
          </div>`,
          iconSize: [11, 11],
          iconAnchor: [5.5, 5.5],
        });
      L.marker([a.lat, a.lng], { icon: pin("A"), interactive: false }).addTo(map);
      L.marker([b.lat, b.lng], { icon: pin("B"), interactive: false }).addTo(map);

      const bounds = L.latLngBounds([
        [a.lat, a.lng],
        [b.lat, b.lng],
      ]).pad(0.6);
      map.fitBounds(bounds, { animate: false });
    }

    init().catch(console.error);

    return () => {
      alive = false;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [a.lat, a.lng, b.lat, b.lng, a.name, b.name]);

  return (
    <>
      <style>{`
        .hero-map-skin .leaflet-container {
          background: #fbf7ee !important;
          font-family: inherit !important;
        }
        .hero-map-skin .leaflet-pane,
        .hero-map-skin .leaflet-tile-pane,
        .hero-map-skin .leaflet-overlay-pane {
          pointer-events: none;
        }
      `}</style>
      <div className="hero-map-skin relative w-full h-full bg-[#fbf7ee]">
        <div
          ref={containerRef}
          className="relative w-full h-full"
          aria-label={`Map showing ${a.name} and ${b.name} in Bangalore`}
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
