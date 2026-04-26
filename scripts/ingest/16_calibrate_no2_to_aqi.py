"""
Calibrate satellite NO2 -> ground-station AQI for BLR.

GOAL
  Translate per-pincode satellite NO2 (mol/m^2) into an "AQI-equivalent" so it
  can layer onto our existing ground AQI as a per-area gradient.

INPUTS
  - data/processed/no2_per_pincode.json  (built by 15_no2_satellite.py)
  - data/processed/air_quality.json      (per-pincode CPCB readings, AQI + NO2)
  - earthengine-api initialized (same auth as 15_no2_satellite.py)

NOTE on station coordinates:
  air_quality.json today stores station_id but NOT station lat/lng. There are
  two ways to get them:
    (a) Re-hit WAQI: GET https://api.waqi.info/feed/@{station_id}/?token=...
        -> response.data.city.geo = [lat, lng]. Cache locally.
    (b) Patch 03_air_quality.py to persist station lat/lng during ingest.
  This script implements (a) so calibration is self-contained.

RECIPE
  1. Build the same 30-day S5P NO2 mosaic used by 15_no2_satellite.py.
  2. For each unique BLR-region station in air_quality.json, fetch its lat/lng
     from WAQI, then sample the mosaic at that point with image.sample(
       region=ee.Geometry.Point([lng, lat]), scale=1113.2).first().
     Result: pairs of (no2_satellite, aqi_ground).
  3. Fit ordinary least squares: aqi_ground = a * no2_satellite + b
     (numpy.polyfit deg=1 is fine; 4 BLR stations = degenerate but workable.
      For a more stable slope, optionally widen to all India CPCB stations
      that fall inside Indian S5P swaths.)
  4. Apply (a, b) to every row in no2_per_pincode.json and emit:
       data/processed/aqi_satellite_per_pincode.json
       [{ "pincode": "560001", "aqi_satellite": 87, "no2_mol_m2": 1.2e-4 }, ...]
     Clamp aqi to [0, 500].

CAVEATS
  - NO2 indexes traffic + combustion; PM2.5 (which dominates AQI) tracks it
    only loosely. Treat the output as a *gradient* on top of ground AQI, not
    a replacement.
  - For production, fit per-pollutant (NO2 -> NO2 sub-index, MODIS AOD ->
    PM2.5 sub-index) and recombine via the CPCB AQI formula.
  - 4 BLR stations means the fit will be sensitive to outliers. The avinash
    integration step should blend (calibrated_satellite, ground_nearest) using
    distance-to-station as the weight.

WIRING (avinash will do this)
  In the scoring engine, replace the "AQI per pincode" lookup with:
    final_aqi = w * aqi_satellite + (1 - w) * aqi_ground_nearest
    where w grows with distance to the nearest CPCB station, capped at e.g. 0.7.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
NO2_PATH = REPO_ROOT / "data" / "processed" / "no2_per_pincode.json"
# OpenAQ ingest persists station_lat/station_lng directly so we don't need
# a second-hop lookup (WAQI / etc.) to recover station coords.
AQ_PATH = REPO_ROOT / "data" / "processed" / "air_quality_v2.json"
OUT_PATH = REPO_ROOT / "data" / "processed" / "aqi_satellite_per_pincode.json"
GEOJSON_PATH = REPO_ROOT / "data" / "raw" / "blr_pincode_polygons.geojson"

S5P_COLLECTION = "COPERNICUS/S5P/OFFL/L3_NO2"
S5P_BAND = "tropospheric_NO2_column_number_density"
CLOUD_FRACTION_MAX = 0.3
LOOKBACK_DAYS = 30
SCALE_M = 1113.2


def init_ee(project: str | None):
    import ee  # type: ignore

    try:
        if project:
            ee.Initialize(project=project)
        else:
            ee.Initialize()
        ee.Number(1).getInfo()
    except Exception as e:  # noqa: BLE001
        print(f"ERROR initializing Earth Engine: {e}", file=sys.stderr)
        print("Run `earthengine authenticate` first; see 15_no2_satellite.py.", file=sys.stderr)
        sys.exit(1)
    return ee


def blr_pincodes() -> set[str]:
    with open(GEOJSON_PATH) as f:
        gj = json.load(f)
    return {str(f["properties"]["pincode"]) for f in gj["features"] if f.get("properties")}


def fetch_station_latlng(station_id: str, token: str) -> tuple[float, float] | None:
    import requests

    r = requests.get(f"https://api.waqi.info/feed/@{station_id}/?token={token}", timeout=15)
    if r.status_code != 200:
        return None
    d = r.json().get("data") or {}
    geo = (d.get("city") or {}).get("geo") or []
    if len(geo) == 2:
        return float(geo[0]), float(geo[1])
    return None


def build_no2_mosaic(ee):
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=LOOKBACK_DAYS)
    coll = (
        ee.ImageCollection(S5P_COLLECTION)
        .filterDate(start.isoformat(), end.isoformat())
        .select([S5P_BAND, "cloud_fraction"])
    )

    def _mask(img):
        cloudy = img.select("cloud_fraction").gt(CLOUD_FRACTION_MAX)
        return img.updateMask(cloudy.Not()).select(S5P_BAND)

    return coll.map(_mask).mean().rename("no2")


def sample_at(ee, image, lat: float, lng: float) -> float | None:
    pt = ee.Geometry.Point([lng, lat])
    fc = image.sample(region=pt, scale=SCALE_M, numPixels=1, geometries=False)
    feats = fc.getInfo().get("features", [])
    if not feats:
        return None
    return feats[0]["properties"].get("no2")


def fit_linear(x: list[float], y: list[float]) -> tuple[float, float]:
    """OLS y = a*x + b. Pure-python so we don't add a numpy dep here."""
    n = len(x)
    if n < 2:
        raise ValueError("need at least 2 points for a linear fit")
    mx = sum(x) / n
    my = sum(y) / n
    num = sum((xi - mx) * (yi - my) for xi, yi in zip(x, y))
    den = sum((xi - mx) ** 2 for xi in x)
    if den == 0:
        raise ValueError("zero variance in NO2 samples")
    a = num / den
    b = my - a * mx
    return a, b


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=None)
    args = ap.parse_args()

    if not NO2_PATH.exists():
        print(f"ERROR: {NO2_PATH} missing. Run 15_no2_satellite.py first.", file=sys.stderr)
        sys.exit(2)

    ee = init_ee(args.project)

    blr = blr_pincodes()
    aq = json.load(open(AQ_PATH))

    # Unique BLR stations with coords + AQI from OpenAQ v2 ingest.
    stations: dict[str, dict] = OrderedDict()
    for r in aq:
        if str(r.get("pincode")) in blr:
            sid = str(r.get("station_id"))
            lat = r.get("station_lat")
            lng = r.get("station_lng")
            aqi = r.get("aqi")
            if sid and sid not in stations and lat is not None and lng is not None and aqi is not None:
                stations[sid] = {
                    "aqi": float(aqi),
                    "name": r.get("station_name", ""),
                    "lat": float(lat),
                    "lng": float(lng),
                }
    print(f"Found {len(stations)} unique BLR-mapped stations with coords + AQI.")

    image = build_no2_mosaic(ee)

    pairs: list[tuple[float, float, str]] = []  # (no2_sat, aqi_ground, name)
    for sid, info in stations.items():
        no2 = sample_at(ee, image, info["lat"], info["lng"])
        if no2 is None:
            print(f"  station {sid} ({info['name']}): no satellite sample, skipping")
            continue
        print(f"  station {sid} ({info['name']}): no2={no2:.3e}, aqi={info['aqi']}")
        pairs.append((no2, info["aqi"], info["name"]))

    if len(pairs) < 2:
        print("ERROR: not enough station/satellite pairs for a fit.", file=sys.stderr)
        sys.exit(3)

    a, b = fit_linear([p[0] for p in pairs], [p[1] for p in pairs])
    print(f"\nLinear fit: aqi = {a:.3e} * no2 + {b:.3f}   (n={len(pairs)})")

    no2_rows = json.load(open(NO2_PATH))
    out = []
    for r in no2_rows:
        no2 = r.get("no2_mol_m2")
        if no2 is None:
            out.append({"pincode": r["pincode"], "aqi_satellite": None, "no2_mol_m2": None})
            continue
        aqi = a * no2 + b
        aqi = max(0.0, min(500.0, aqi))
        out.append(
            {
                "pincode": r["pincode"],
                "aqi_satellite": round(aqi, 1),
                "no2_mol_m2": no2,
            }
        )

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(out, f)
    print(f"Wrote {len(out)} rows -> {OUT_PATH.relative_to(REPO_ROOT)}")

    valid = [r["aqi_satellite"] for r in out if r["aqi_satellite"] is not None]
    if valid:
        print(
            f"aqi_satellite range: {min(valid):.1f} -> {max(valid):.1f} "
            f"(distinct={len({round(v, 1) for v in valid})})"
        )


if __name__ == "__main__":
    main()
