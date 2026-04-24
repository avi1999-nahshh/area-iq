"""
Builds the pincode master from the INDIA_PINCODES shapefile (data.gov.in 1:1M).
Extracts pincode, state, district, office name, centroid lat/lng, and area.
No API key required — the shapefile is the single source of truth.
"""
import json
from pathlib import Path
import geopandas as gpd

RAW = Path("../../data/raw")
OUT = Path("../../data/processed")
OUT.mkdir(parents=True, exist_ok=True)

SHP = RAW / "pincode_boundaries.shp"
if not SHP.exists():
    raise FileNotFoundError(
        f"{SHP} not found. Extract INDIA_PINCODES split-zip into data/raw/ first."
    )

METRO_CITIES = {
    "Delhi": ["Delhi", "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi",
              "Central Delhi", "North East Delhi", "North West Delhi", "South East Delhi",
              "South West Delhi", "Shahdara"],
    "Mumbai": ["Mumbai", "Mumbai Suburban"],
    "Bengaluru": ["Bengaluru Urban", "Bengaluru Rural", "Bangalore", "Bangalore Urban", "Bangalore Rural"],
    "Chennai": ["Chennai"],
    "Hyderabad": ["Hyderabad", "Rangareddy", "Medchal-Malkajgiri"],
    "Kolkata": ["Kolkata"],
    "Pune": ["Pune"],
    "Ahmedabad": ["Ahmedabad"],
    "Jaipur": ["Jaipur"],
    "Kochi": ["Ernakulam"],
}
DISTRICT_TO_METRO = {d.upper(): m for m, ds in METRO_CITIES.items() for d in ds}

print(f"Loading {SHP}...")
gdf = gpd.read_file(SHP)
print(f"Loaded {len(gdf)} records. Columns: {list(gdf.columns)}")

gdf["pincode"] = gdf["pincode"].astype(str).str.strip().str.zfill(6)

# Compute centroids in WGS84 and area in km² via equal-area projection
gdf_proj = gdf.to_crs("EPSG:6933")  # equal-area world
gdf["area_sq_km"] = (gdf_proj.geometry.area / 1e6).round(3)
centroids = gdf.geometry.centroid
gdf["lat"] = centroids.y.round(6)
gdf["lng"] = centroids.x.round(6)

# Deduplicate — keep Head Office (HO) over Sub Office (SO) over Branch Office (BO)
order = {"HO": 0, "SO": 1, "BO": 2}
gdf["_ord"] = gdf["officetype"].fillna("BO").map(lambda x: order.get(x.strip().upper(), 3))
gdf = gdf.sort_values("_ord").drop_duplicates("pincode", keep="first")

gdf["district"] = gdf["district"].fillna("").str.strip()
gdf["state"] = gdf["state"].fillna("").str.strip()
gdf["metro_city"] = gdf["district"].str.upper().map(DISTRICT_TO_METRO).where(lambda s: s.notna(), None)

import math
def _clean(v):
    if v is None: return None
    try:
        if isinstance(v, float) and math.isnan(v): return None
    except TypeError:
        pass
    return v

output = [
    {
        "pincode": r["pincode"],
        "name": (r.get("officename") or "").strip(),
        "district": r["district"],
        "state": r["state"],
        "lat": _clean(float(r["lat"])) if r["lat"] is not None else None,
        "lng": _clean(float(r["lng"])) if r["lng"] is not None else None,
        "area_sq_km": _clean(float(r["area_sq_km"])) if r["area_sq_km"] is not None else None,
        "metro_city": _clean(r["metro_city"]),
    }
    for _, r in gdf.iterrows()
]

with open(OUT / "pincodes.json", "w") as f:
    json.dump(output, f)

print(f"Saved {len(output)} pincodes → data/processed/pincodes.json")
