"""
Sentinel-5P NO2 satellite ingest for BLR pincodes.

Why this matters:
  Our ground-station AQI gives only ~4 distinct values across 129 BLR pincodes
  (4 CPCB stations -> nearest-neighbour collapse). Sentinel-5P TROPOMI delivers
  ~5.5 x 3.5 km NO2 swaths daily. Aggregated to each pincode polygon, we get a
  unique satellite-derived NO2 value per area -> the spatial gradient our
  ground network is missing.

Access path: Google Earth Engine (earthengine-api).
  Picked over Copernicus Data Space / Sentinel Hub because EE does the heavy
  lifting server-side: collection filtering, cloud masking, mosaicing,
  reprojection, polygon-level reduceRegions. Whole pipeline is one round-trip,
  no raster downloads, no GDAL dance. Free for non-commercial.

Auth model:
  EE auth is two parts: (1) OAuth credentials from `earthengine authenticate`,
  (2) a Google Cloud project id with the Earth Engine API enabled. We try
  ee.Initialize() first; if it fails we print exact instructions and exit
  cleanly. We never run interactive auth from inside the script.

Calibration recipe (executed by 16_calibrate_no2_to_aqi.py, not here):
  1. From data/processed/air_quality.json, take each unique CPCB station
     (station_id + lat/lng + reported AQI). Station coords aren't in the JSON
     today; either re-hit WAQI for them or stash lat/lng during 03_air_quality.
  2. Sample the same 30-day S5P NO2 mosaic at each station's point geometry
     using image.sample() -> get satellite NO2 at each ground station.
  3. Fit linear regression: aqi_ground = a * no2_satellite + b
     (4 BLR stations is enough for a coarse slope; ideally use all India CPCB
     stations the satellite covers for a more stable fit.)
  4. Apply (a, b) to each pincode's mean NO2 from no2_per_pincode.json
     -> per-pincode "AQI-equivalent". Clamp to [0, 500].
  Caveats: NO2 is a proxy for traffic/combustion, not a full AQI driver
  (PM2.5 dominates). For production, do multi-month fits and combine with a
  PM2.5 satellite proxy (e.g. MODIS AOD or CAMS reanalysis) per pollutant.

Usage:
    python3 scripts/ingest/15_no2_satellite.py [--project YOUR_GCP_PROJECT]

Outputs:
    data/processed/no2_per_pincode.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from statistics import median

REPO_ROOT = Path(__file__).resolve().parents[2]
GEOJSON_PATH = REPO_ROOT / "data" / "raw" / "blr_pincode_polygons.geojson"
OUT_PATH = REPO_ROOT / "data" / "processed" / "no2_per_pincode.json"

S5P_COLLECTION = "COPERNICUS/S5P/OFFL/L3_NO2"
S5P_BAND = "tropospheric_NO2_column_number_density"
CLOUD_FRACTION_MAX = 0.3
LOOKBACK_DAYS = 30
# S5P native resolution ~5.5x3.5 km but the L3 product is gridded at ~1113.2 m
# (1/100 deg). reduceRegions at native scale avoids extra resampling.
SCALE_M = 1113.2


AUTH_HELP = """
Earth Engine is not authenticated for this machine.

One-time setup (takes ~2 min):

  1. pip3 install --break-system-packages earthengine-api   # already done if you ran this script
  2. earthengine authenticate
       Opens a browser. Sign in with the Google account you want to use.
       Pick a Google Cloud project that has the Earth Engine API enabled.
       (If you don't have one, the auth flow will offer to create / link one.
        You can also enable it manually at:
          https://console.cloud.google.com/apis/library/earthengine.googleapis.com )
  3. Re-run this script:
       python3 scripts/ingest/15_no2_satellite.py
       (or pass --project YOUR_PROJECT_ID if you want to override the default)

If you saw an error like "Earth Engine API has not been used in project ...
before or it is disabled", the OAuth part worked but the project doesn't have
the API turned on. Either:
  - enable it for that project at the URL the error printed, OR
  - run `earthengine authenticate` and choose a different project, OR
  - re-run with --project SOME_OTHER_PROJECT_WITH_EE_ENABLED
""".strip()


def init_ee(project: str | None) -> "module":
    """Import + initialize Earth Engine. Exit cleanly with help text on failure."""
    try:
        import ee  # type: ignore
    except ImportError:
        print("ERROR: earthengine-api not installed.", file=sys.stderr)
        print("  pip3 install --break-system-packages earthengine-api", file=sys.stderr)
        sys.exit(2)

    try:
        if project:
            ee.Initialize(project=project)
        else:
            ee.Initialize()
        # Sanity check: a trivial server call to surface API-enablement errors now.
        ee.Number(1).getInfo()
        return ee
    except Exception as e:  # noqa: BLE001 -- we genuinely want to swallow & explain.
        print("ERROR: could not initialize Earth Engine.", file=sys.stderr)
        print(f"  {type(e).__name__}: {str(e)[:400]}", file=sys.stderr)
        print("", file=sys.stderr)
        print(AUTH_HELP, file=sys.stderr)
        sys.exit(1)


def load_polygons_as_fc(ee) -> "ee.FeatureCollection":
    """Load BLR pincode polygons GeoJSON into an ee.FeatureCollection."""
    with open(GEOJSON_PATH) as f:
        gj = json.load(f)

    features = []
    for feat in gj["features"]:
        props = feat.get("properties", {}) or {}
        pincode = props.get("pincode")
        if not pincode:
            continue
        geom = ee.Geometry(feat["geometry"], geodesic=False, proj="EPSG:4326")
        features.append(ee.Feature(geom, {"pincode": str(pincode)}))

    print(f"Loaded {len(features)} BLR pincode polygons.")
    return ee.FeatureCollection(features)


def build_no2_mosaic(ee, region: "ee.Geometry"):
    """Last-30-days S5P NO2 mosaic, masked for cloud_fraction < 0.3, mean reduced."""
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=LOOKBACK_DAYS)

    coll = (
        ee.ImageCollection(S5P_COLLECTION)
        .filterDate(start.isoformat(), end.isoformat())
        .filterBounds(region)
        .select([S5P_BAND, "cloud_fraction"])
    )

    n_images = coll.size().getInfo()
    print(
        f"S5P NO2 collection over BLR, {start} -> {end}: {n_images} images "
        f"(pre cloud-mask)."
    )
    if n_images == 0:
        print("No imagery found in the lookback window. Try a longer window.", file=sys.stderr)
        sys.exit(3)

    def _mask(img):
        cloudy = img.select("cloud_fraction").gt(CLOUD_FRACTION_MAX)
        return img.updateMask(cloudy.Not()).select(S5P_BAND)

    return coll.map(_mask).mean().rename("no2")


def reduce_to_pincodes(ee, image, fc):
    """Per-polygon mean NO2 + pixel count via reduceRegions."""
    reducer = ee.Reducer.mean().combine(ee.Reducer.count(), sharedInputs=True)
    reduced = image.reduceRegions(
        collection=fc,
        reducer=reducer,
        scale=SCALE_M,
        crs="EPSG:4326",
    )

    # getInfo() pulls the whole FC; 129 features is small, totally fine.
    info = reduced.getInfo()
    out = []
    for feat in info["features"]:
        props = feat["properties"]
        out.append(
            {
                "pincode": props.get("pincode"),
                "no2_mol_m2": props.get("mean"),
                "n_pixels": int(props.get("count") or 0),
            }
        )
    return out


def coverage_report(rows: list[dict]) -> None:
    valid = [r for r in rows if r["no2_mol_m2"] is not None]
    print()
    print("=== coverage report ===")
    print(f"  pincodes total:        {len(rows)}")
    print(f"  pincodes with NO2:     {len(valid)}")
    if not valid:
        return

    vals = sorted(r["no2_mol_m2"] for r in valid)

    def pct(p: float) -> float:
        if not vals:
            return float("nan")
        k = max(0, min(len(vals) - 1, int(round(p * (len(vals) - 1)))))
        return vals[k]

    print(f"  no2 min:               {vals[0]:.3e} mol/m^2")
    print(f"  no2 p25:               {pct(0.25):.3e}")
    print(f"  no2 median:            {median(vals):.3e}")
    print(f"  no2 p75:               {pct(0.75):.3e}")
    print(f"  no2 max:               {vals[-1]:.3e}")

    distinct_4sf = {f"{v:.4g}" for v in vals}
    print(f"  distinct values (4sf): {len(distinct_4sf)}   (target ~129, must be > 4)")

    px = [r["n_pixels"] for r in valid]
    print(f"  n_pixels min/median/max: {min(px)} / {int(median(px))} / {max(px)}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--project",
        default=None,
        help="Google Cloud project id with the Earth Engine API enabled. "
        "Optional if `earthengine authenticate` already set a default.",
    )
    args = ap.parse_args()

    ee = init_ee(args.project)

    fc = load_polygons_as_fc(ee)
    region = fc.geometry().bounds()

    image = build_no2_mosaic(ee, region)
    print("Reducing NO2 mosaic over each pincode polygon...")
    rows = reduce_to_pincodes(ee, image, fc)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(rows, f)
    print(f"Wrote {len(rows)} records -> {OUT_PATH.relative_to(REPO_ROOT)}")

    coverage_report(rows)


if __name__ == "__main__":
    main()
