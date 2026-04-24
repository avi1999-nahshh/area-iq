"""
Fetches all CPCB stations from WAQI API.
For each pincode centroid, finds nearest station within 50km.
Stores latest pollutant readings.
"""
import json, time, requests, numpy as np
from pathlib import Path
from scipy.spatial import cKDTree
from dotenv import load_dotenv
import os

load_dotenv("../../.env.local")
WAQI_KEY = os.getenv("WAQI_API_KEY")
RAW = Path("../../data/raw")
OUT = Path("../../data/processed")

pincodes = json.load(open(OUT / "pincodes.json"))

def fetch_stations_india():
    """Fetch all India stations from WAQI."""
    bounds = "6.5,68.0,37.0,97.5"  # India bounding box
    url = f"https://api.waqi.info/map/bounds/?token={WAQI_KEY}&latlng={bounds}"
    r = requests.get(url)
    r.raise_for_status()
    stations = r.json().get("data", [])
    print(f"Fetched {len(stations)} stations in India")
    return stations

def fetch_station_data(uid):
    """Fetch detailed pollutant readings for one station."""
    url = f"https://api.waqi.info/feed/@{uid}/?token={WAQI_KEY}"
    r = requests.get(url)
    if r.status_code != 200:
        return None
    d = r.json().get("data", {})
    if not isinstance(d, dict):
        return None  # WAQI sometimes returns "Unknown station" as a string
    iaqi = d.get("iaqi", {}) if isinstance(d.get("iaqi"), dict) else {}
    def _v(key):
        x = iaqi.get(key)
        return x.get("v") if isinstance(x, dict) else None
    return {
        "aqi": d.get("aqi"),
        "pm25": _v("pm25"), "pm10": _v("pm10"),
        "no2": _v("no2"), "so2": _v("so2"), "o3": _v("o3"),
    }

print("Fetching India stations from WAQI...")
stations = fetch_stations_india()

# Fetch readings for all stations (rate-limited)
print("Fetching pollutant readings for each station (this takes ~10 min)...")
station_data = {}
for i, s in enumerate(stations):
    readings = fetch_station_data(s["uid"])
    if readings:
        station_data[s["uid"]] = {**s, **readings}
    if i % 50 == 0:
        print(f"  {i}/{len(stations)} stations fetched...")
    time.sleep(0.1)

station_list = [v for v in station_data.values()]
station_coords = np.array([[s["lat"], s["lon"]] for s in station_list])
station_tree = cKDTree(np.radians(station_coords))
MAX_DIST_KM = 50
EARTH_R = 6371

print("Mapping pincodes to nearest stations...")
output = []
for p in pincodes:
    if not p.get("lat") or not p.get("lng"):
        continue
    q = np.radians([p["lat"], p["lng"]])
    dist_rad, idx = station_tree.query(q, k=1, distance_upper_bound=MAX_DIST_KM / EARTH_R)
    if idx >= len(station_list):
        continue  # no station within 50km
    s = station_list[idx]
    dist_km = dist_rad * EARTH_R
    output.append({
        "pincode": p["pincode"],
        "station_id": str(s["uid"]),
        "station_name": s.get("station", {}).get("name", ""),
        "station_distance_km": round(dist_km, 2),
        "aqi": s.get("aqi"),
        "pm25": s.get("pm25"),
        "pm10": s.get("pm10"),
        "no2": s.get("no2"),
        "so2": s.get("so2"),
        "o3": s.get("o3"),
        "updated_at": int(time.time() * 1000),
    })

with open(OUT / "air_quality.json", "w") as f:
    json.dump(output, f)
print(f"Saved {len(output)} records → data/processed/air_quality.json")
