"use client";

import { useEffect, useState } from "react";

interface Props {
  lat: number;
  lng: number;
  name: string;
  pincode: string;
}

export function MiniMap({ lat, lng, name, pincode }: Props) {
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: typeof import("react-leaflet")["MapContainer"];
    TileLayer: typeof import("react-leaflet")["TileLayer"];
    CircleMarker: typeof import("react-leaflet")["CircleMarker"];
  } | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues with Leaflet
    Promise.all([
      import("react-leaflet"),
      import("leaflet/dist/leaflet.css" as never),
    ]).then(([rl]) => {
      setMapComponents({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        CircleMarker: rl.CircleMarker,
      });
    });
  }, []);

  if (!MapComponents) {
    return (
      <div
        className="skeleton-shimmer w-full h-full rounded-xl flex items-center justify-center"
        style={{ minHeight: 200 }}
        aria-label={`Loading map for ${name}`}
      />
    );
  }

  const { MapContainer, TileLayer, CircleMarker } = MapComponents;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      style={{ height: "100%", width: "100%", background: "#FAF6EE" }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <CircleMarker
        center={[lat, lng]}
        radius={12}
        pathOptions={{
          fillColor: "#C88A1F",
          fillOpacity: 0.95,
          color: "#1A2633",
          weight: 2,
        }}
      />
    </MapContainer>
  );
}
