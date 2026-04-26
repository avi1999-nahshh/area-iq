"""
OpenAQ v3 ingest for Bangalore air-quality.

Replaces 03_air_quality.py (WAQI) for the BLR cohort. Pulls every OpenAQ v3
station within 50 km of the Bangalore centroid, fetches its latest hourly
sensor readings, computes a CPCB sub-index AQI per station, and maps each of
the 129 BLR pincodes to its nearest station.

Output: data/processed/air_quality_v2.json
"""

import json
import math
import os
import statistics
import sys
import time
from pathlib import Path

import requests
from shapely.geometry import Point, shape

# ---------------------------------------------------------------------------
# paths + config
# ---------------------------------------------------------------------------
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"
ENV_FILE = ROOT / ".env.local"

BLR_LAT, BLR_LNG = 12.9716, 77.5946
RADIUS_M = 25_000  # OpenAQ v3 caps the /locations radius at 25km
MAX_DIST_KM = 50.0
EARTH_R_KM = 6371.0

OPENAQ_BASE = "https://api.openaq.org/v3"
SLEEP_BETWEEN_CALLS = 1.0  # OpenAQ v3: 60 req/min, 2000 req/hr

# ---------------------------------------------------------------------------
# env loading (avoid python-dotenv dep)
# ---------------------------------------------------------------------------
def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)


_load_env_file(ENV_FILE)
API_KEY = os.environ.get("OPENAQ_API_KEY")

if not API_KEY:
    print(
        "ERROR: OPENAQ_API_KEY is not set.\n"
        "\n"
        "OpenAQ v3 requires a free API key. To get one:\n"
        "  1. Sign up at https://api.openaq.org (or https://explore.openaq.org)\n"
        "  2. Visit your account page → API Keys → create a new key\n"
        "  3. Add the key to .env.local at the repo root, e.g.:\n"
        "       OPENAQ_API_KEY=oaq_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n"
        "  4. Re-run: python scripts/ingest/03_air_quality_v2.py\n",
        file=sys.stderr,
    )
    sys.exit(1)

HEADERS = {"X-API-Key": API_KEY, "Accept": "application/json"}

# ---------------------------------------------------------------------------
# CPCB sub-index AQI (linear interpolation within band)
# ---------------------------------------------------------------------------
PM25_BREAKS = [
    (0, 30, 0, 50),
    (31, 60, 51, 100),
    (61, 90, 101, 200),
    (91, 120, 201, 300),
    (121, 250, 301, 400),
    (251, 500, 401, 500),
]
PM10_BREAKS = [
    (0, 50, 0, 50),
    (51, 100, 51, 100),
    (101, 250, 101, 200),
    (251, 350, 201, 300),
    (351, 430, 301, 400),
    (431, 1000, 401, 500),
]
NO2_BREAKS = [
    (0, 40, 0, 50),
    (41, 80, 51, 100),
    (81, 180, 101, 200),
    (181, 280, 201, 300),
    (281, 400, 301, 400),
    (401, 1000, 401, 500),
]


def _subindex(value, breaks):
    if value is None:
        return None
    v = float(value)
    if v < 0:
        return None
    for c_lo, c_hi, i_lo, i_hi in breaks:
        if v <= c_hi:
            v_clamped = max(v, c_lo)
            return round(i_lo + (i_hi - i_lo) * (v_clamped - c_lo) / (c_hi - c_lo))
    return 500  # off-the-charts


def compute_aqi(pm25, pm10, no2):
    """CPCB: AQI = max of available sub-indices. We use PM2.5 ⊕ PM10 ⊕ NO2."""
    sub = []
    if pm25 is not None:
        s = _subindex(pm25, PM25_BREAKS)
        if s is not None:
            sub.append(s)
    if pm10 is not None:
        s = _subindex(pm10, PM10_BREAKS)
        if s is not None:
            sub.append(s)
    if no2 is not None:
        s = _subindex(no2, NO2_BREAKS)
        if s is not None:
            sub.append(s)
    return max(sub) if sub else None


# ---------------------------------------------------------------------------
# distance helper
# ---------------------------------------------------------------------------
def haversine_km(lat1, lng1, lat2, lng2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_R_KM * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# OpenAQ fetchers
# ---------------------------------------------------------------------------
def _get(url, params=None, retries=3):
    for attempt in range(retries):
        r = requests.get(url, headers=HEADERS, params=params, timeout=30)
        if r.status_code == 200:
            return r.json()
        if r.status_code in (429, 502, 503, 504):
            wait = 2 ** attempt
            print(f"  rate-limited/transient {r.status_code}, sleeping {wait}s")
            time.sleep(wait)
            continue
        r.raise_for_status()
    raise RuntimeError(f"GET {url} failed after {retries} retries")


def fetch_locations(lat, lng, radius_m, limit=200):
    page = 1
    all_results = []
    while True:
        data = _get(
            f"{OPENAQ_BASE}/locations",
            params={
                "coordinates": f"{lat},{lng}",
                "radius": radius_m,
                "limit": limit,
                "page": page,
            },
        )
        results = data.get("results", []) or []
        all_results.extend(results)
        meta = data.get("meta", {}) or {}
        # stop when we've consumed everything OpenAQ knows about
        if len(results) < limit or len(all_results) >= meta.get("found", len(all_results)):
            break
        page += 1
        time.sleep(SLEEP_BETWEEN_CALLS)
    return all_results


def fetch_location_latest(loc_id):
    data = _get(f"{OPENAQ_BASE}/locations/{loc_id}/latest")
    return data.get("results", []) or []


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------
def main():
    print(f"Loading 129 BLR pincodes from {OUT/'iq_v2_blr.json'}...")
    blr = json.load(open(OUT / "iq_v2_blr.json"))
    pincodes = [
        {"pincode": p["pincode"], "lat": p["lat"], "lng": p["lng"]}
        for p in blr
        if p.get("lat") and p.get("lng")
    ]
    print(f"  {len(pincodes)} BLR pincodes with centroids")

    print(f"Loading pincode polygons from {RAW/'blr_pincode_polygons.geojson'}...")
    polygons_raw = json.load(open(RAW / "blr_pincode_polygons.geojson"))
    polygons = {
        f["properties"]["pincode"]: shape(f["geometry"])
        for f in polygons_raw["features"]
    }
    print(f"  {len(polygons)} polygons loaded")

    print(f"\nFetching OpenAQ v3 locations within {RADIUS_M/1000:.0f} km of "
          f"({BLR_LAT}, {BLR_LNG})...")
    locations = fetch_locations(BLR_LAT, BLR_LNG, RADIUS_M)
    print(f"  {len(locations)} OpenAQ locations returned")

    # Deduplicate / drop ones without coordinates
    locations = [
        l for l in locations
        if l.get("coordinates")
        and l["coordinates"].get("latitude") is not None
        and l["coordinates"].get("longitude") is not None
    ]
    print(f"  {len(locations)} locations with valid coordinates")

    print("\nFetching latest readings per location (~1 sec each)...")
    stations = []
    for i, loc in enumerate(locations, 1):
        loc_id = loc["id"]
        # build sensor_id -> parameter_name map from the location object
        sensor_param = {}
        for s in loc.get("sensors", []) or []:
            param = (s.get("parameter") or {}).get("name")
            if param:
                sensor_param[s["id"]] = param.lower()

        try:
            latest = fetch_location_latest(loc_id)
        except Exception as e:
            print(f"  [{i}/{len(locations)}] {loc.get('name','?')} (id {loc_id}) "
                  f"failed: {e}")
            time.sleep(SLEEP_BETWEEN_CALLS)
            continue

        # Pick the freshest reading per pollutant
        # latest entries: {datetime, value, coordinates, sensorsId, locationsId}
        readings = {}  # param -> (value, datetime_str)
        for entry in latest:
            sid = entry.get("sensorsId")
            param = sensor_param.get(sid)
            if not param:
                continue
            val = entry.get("value")
            if val is None or val < 0:
                continue
            dt_obj = entry.get("datetime") or {}
            dt_utc = dt_obj.get("utc") if isinstance(dt_obj, dict) else None
            prev = readings.get(param)
            if not prev or (dt_utc and dt_utc > prev[1]):
                readings[param] = (float(val), dt_utc or "")

        pm25 = readings.get("pm25", (None, None))[0]
        pm10 = readings.get("pm10", (None, None))[0]
        no2 = readings.get("no2", (None, None))[0]
        so2 = readings.get("so2", (None, None))[0]
        o3 = readings.get("o3", (None, None))[0]

        aqi = compute_aqi(pm25, pm10, no2)

        # newest datetime across pollutants → updated_at (ms)
        newest_dt = None
        for _, (_, dt_str) in readings.items():
            if dt_str and (newest_dt is None or dt_str > newest_dt):
                newest_dt = dt_str
        updated_at_ms = None
        if newest_dt:
            try:
                from datetime import datetime
                updated_at_ms = int(
                    datetime.fromisoformat(newest_dt.replace("Z", "+00:00"))
                    .timestamp() * 1000
                )
            except Exception:
                updated_at_ms = None

        stations.append({
            "id": loc_id,
            "name": loc.get("name") or "",
            "lat": loc["coordinates"]["latitude"],
            "lng": loc["coordinates"]["longitude"],
            "aqi": aqi,
            "pm25": pm25,
            "pm10": pm10,
            "no2": no2,
            "so2": so2,
            "o3": o3,
            "updated_at": updated_at_ms,
        })

        if i % 10 == 0:
            print(f"  [{i}/{len(locations)}] processed")
        time.sleep(SLEEP_BETWEEN_CALLS)

    print(f"\n{len(stations)} stations with sensor data")

    # Drop stations with no usable AQI (no PM2.5/PM10/NO2 reading at all)
    usable = [s for s in stations if s["aqi"] is not None]
    print(f"{len(usable)} stations have a computable AQI")

    # ----- map pincodes -> nearest station -----
    print("\nMapping each pincode → nearest OpenAQ station within 50 km...")
    output = []
    distances = []
    inside_polygon = 0
    now_ms = int(time.time() * 1000)

    for p in pincodes:
        best = None
        best_d = None
        for s in usable:
            d = haversine_km(p["lat"], p["lng"], s["lat"], s["lng"])
            if d <= MAX_DIST_KM and (best_d is None or d < best_d):
                best_d = d
                best = s
        if not best:
            continue
        distances.append(best_d)

        # is this station inside the pincode polygon?
        poly = polygons.get(p["pincode"])
        if poly is not None and poly.contains(Point(best["lng"], best["lat"])):
            inside_polygon += 1

        output.append({
            "pincode": p["pincode"],
            "station_id": str(best["id"]),
            "station_name": best["name"],
            "station_lat": best["lat"],
            "station_lng": best["lng"],
            "station_distance_km": round(best_d, 2),
            "aqi": best["aqi"],
            "pm25": best["pm25"],
            "pm10": best["pm10"],
            "no2": best["no2"],
            "so2": best["so2"],
            "o3": best["o3"],
            "updated_at": best["updated_at"] or now_ms,
        })

    out_path = OUT / "air_quality_v2.json"
    with open(out_path, "w") as f:
        json.dump(output, f)
    print(f"\nSaved {len(output)} pincode records → {out_path}")

    # ----- coverage report -----
    print("\n" + "=" * 60)
    print("COVERAGE REPORT")
    print("=" * 60)
    print(f"Total OpenAQ locations near BLR (50 km): {len(locations)}")
    print(f"  with sensor data:                       {len(stations)}")
    print(f"  with computable AQI:                    {len(usable)}")
    print(f"BLR pincodes with a mapped station:       {len(output)} / {len(pincodes)}")

    aqis = [r["aqi"] for r in output if r["aqi"] is not None]
    print(f"Distinct AQI values across pincodes:      {len(set(aqis))}")
    if aqis:
        print(f"  AQI range: {min(aqis)} – {max(aqis)} "
              f"(median {statistics.median(aqis):.0f})")

    if distances:
        ds = sorted(distances)
        med = statistics.median(ds)
        p75 = ds[int(len(ds) * 0.75)] if len(ds) > 1 else ds[0]
        print(f"Distance to assigned station (km):")
        print(f"  median {med:.2f}  p75 {p75:.2f}  max {max(ds):.2f}")

    print(f"Pincodes with station inside their polygon: "
          f"{inside_polygon} / {len(output)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
