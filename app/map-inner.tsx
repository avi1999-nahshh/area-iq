"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type FilterKey = "overall" | "safety" | "airQuality" | "infrastructure" | "cleanliness" | "affordability";

export type Area = {
  pincode: string;
  name: string;
  lat: number;
  lng: number;
  scores: Record<FilterKey, number>;
};

const areas: Area[] = [
  { pincode: "560008", name: "Halasuru",         lat: 12.9784, lng: 77.6184, scores: { overall: 73, infrastructure: 85, safety: 70, cleanliness: 60, airQuality: 50, affordability: 72 } },
  { pincode: "560038", name: "Indiranagar",       lat: 12.9784, lng: 77.6412, scores: { overall: 76, infrastructure: 92, safety: 74, cleanliness: 68, airQuality: 53, affordability: 45 } },
  { pincode: "560034", name: "Koramangala",       lat: 12.9352, lng: 77.6245, scores: { overall: 74, infrastructure: 88, safety: 72, cleanliness: 65, airQuality: 52, affordability: 42 } },
  { pincode: "560041", name: "Jayanagar",         lat: 12.9250, lng: 77.5938, scores: { overall: 78, infrastructure: 82, safety: 80, cleanliness: 78, airQuality: 62, affordability: 68 } },
  { pincode: "560066", name: "Whitefield",        lat: 12.9698, lng: 77.7500, scores: { overall: 65, infrastructure: 75, safety: 65, cleanliness: 58, airQuality: 44, affordability: 55 } },
  { pincode: "560102", name: "HSR Layout",        lat: 12.9116, lng: 77.6412, scores: { overall: 77, infrastructure: 86, safety: 76, cleanliness: 72, airQuality: 56, affordability: 50 } },
  { pincode: "560003", name: "Malleshwaram",      lat: 13.0038, lng: 77.5697, scores: { overall: 75, infrastructure: 80, safety: 78, cleanliness: 74, airQuality: 58, affordability: 65 } },
  { pincode: "560100", name: "Electronic City",   lat: 12.8450, lng: 77.6766, scores: { overall: 60, infrastructure: 70, safety: 62, cleanliness: 55, airQuality: 48, affordability: 78 } },
  { pincode: "560076", name: "Sarjapur Road",     lat: 12.9010, lng: 77.6850, scores: { overall: 62, infrastructure: 72, safety: 63, cleanliness: 57, airQuality: 46, affordability: 60 } },
  { pincode: "560043", name: "JP Nagar",          lat: 12.9085, lng: 77.5850, scores: { overall: 74, infrastructure: 80, safety: 76, cleanliness: 70, airQuality: 60, affordability: 62 } },
];

function scoreToColor(score: number): string {
  if (score >= 80) return "#f59e0b"; // amber-400 — great
  if (score >= 65) return "#fbbf24"; // amber-300 — good
  if (score >= 50) return "#94a3b8"; // slate-400 — average
  return "#cbd5e1";                   // slate-300 — below avg
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Great";
  if (score >= 65) return "Good";
  if (score >= 50) return "Average";
  return "Below avg";
}

export function MapInner({ filter }: { filter: FilterKey }) {
  return (
    <MapContainer
      center={[12.9716, 77.5946]}
      zoom={12}
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
      zoomControl={true}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {areas.map((area) => {
        const score = area.scores[filter];
        const color = scoreToColor(score);

        return (
          <CircleMarker
            key={area.pincode}
            center={[area.lat, area.lng]}
            radius={20}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.85,
              color: "#fff",
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: 160, fontFamily: "inherit" }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#1a1a18" }}>
                  {area.name}
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                  {area.pincode}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(Object.keys(area.scores) as FilterKey[])
                    .filter((k) => k !== "overall")
                    .map((k) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "#64748b", textTransform: "capitalize" }}>
                          {k === "airQuality" ? "Air quality" : k.charAt(0).toUpperCase() + k.slice(1)}
                        </span>
                        <span style={{ fontWeight: 600, color: "#1a1a18" }}>{area.scores[k]}</span>
                      </div>
                    ))}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid #f1f5f9",
                    fontSize: 11,
                    color: "#f59e0b",
                    fontWeight: 600,
                  }}
                >
                  {scoreLabel(score)} for {filter === "airQuality" ? "air quality" : filter === "overall" ? "overall" : filter}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
