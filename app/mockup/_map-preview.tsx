"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  name: string;
}

export function MapPreview({ lat, lng, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;

    async function initMap() {
      // Dynamically import leaflet to avoid SSR issues
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        attributionControl: false,
      });

      mapRef.current = map;

      // Light CARTO basemap
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // ~1.5 km radius circle tinted amber/yellow
      L.circle([lat, lng], {
        radius: 1500,
        color: "#DCA800",
        weight: 2,
        opacity: 0.7,
        fillColor: "#F5C518",
        fillOpacity: 0.15,
      }).addTo(map);

      // Center pin
      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="width:10px;height:10px;background:#DCA800;border:2px solid #0A0A0A;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      L.marker([lat, lng], { icon: pinIcon })
        .addTo(map)
        .bindTooltip(name, {
          permanent: true,
          direction: "top",
          offset: [0, -10],
          className: "map-tooltip",
        });
    }

    initMap().catch(console.error);

    return () => {
      isMounted = false;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, name]);

  return (
    <>
      <style>{`
        .map-tooltip {
          background: #0A0A0A !important;
          color: #FDFCF7 !important;
          border: none !important;
          border-radius: 4px !important;
          font-family: var(--font-geist-sans), sans-serif !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          letter-spacing: 0.06em !important;
          padding: 3px 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
          white-space: nowrap !important;
        }
        .map-tooltip::before {
          border-top-color: #0A0A0A !important;
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          opacity: 0.5 !important;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: "360px" }}
        aria-label={`Map showing ${name}`}
        role="img"
      />
    </>
  );
}
