"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

type FilterKey = "overall" | "safety" | "airQuality" | "infrastructure" | "cleanliness" | "affordability";

// Curated sample across India for geographic spread
const CURATED_PINCODES = [
  "560034", // Koramangala, Bengaluru
  "400050", // Bandra West, Mumbai
  "110043", // Najafgarh, Delhi
  "600034", // Nungambakkam, Chennai
  "500034", // Banjara Hills, Hyderabad
  "700016", // Park Street, Kolkata
  "411001", // Camp, Pune
  "380009", // Navrangpura, Ahmedabad
  "302001", // MI Road, Jaipur
  "682011", // MG Road, Kochi
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

function SinglePinMarker({
  pincode,
  filter,
}: {
  pincode: string;
  filter: FilterKey;
}) {
  const data = useQuery(api.area.getByPincode, { pincode });

  if (!data || !data.pincode || !data.scores) return null;

  const { lat, lng, name } = data.pincode;
  const s = data.scores;

  const scoreMap: Record<FilterKey, number> = {
    overall: Math.round(s.overall_score),
    safety: Math.round(s.safety_score),
    airQuality: Math.round(s.air_quality_score),
    infrastructure: Math.round(s.infrastructure_score),
    cleanliness: Math.round(s.cleanliness_score),
    // affordability uses property_score as a proxy
    affordability: Math.round(s.property_score),
  };

  const score = scoreMap[filter];
  const color = scoreToColor(score);

  return (
    <CircleMarker
      center={[lat, lng]}
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
            {name}
          </p>
          <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
            {pincode}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(Object.keys(scoreMap) as FilterKey[])
              .filter((k) => k !== "overall")
              .map((k) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "#64748b", textTransform: "capitalize" }}>
                    {k === "airQuality" ? "Air quality" : k.charAt(0).toUpperCase() + k.slice(1)}
                  </span>
                  <span style={{ fontWeight: 600, color: "#1a1a18" }}>{scoreMap[k]}</span>
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
}

export function MapInner({ filter }: { filter: FilterKey }) {
  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
      zoomControl={true}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {CURATED_PINCODES.map((pincode) => (
        <SinglePinMarker key={pincode} pincode={pincode} filter={filter} />
      ))}
    </MapContainer>
  );
}
