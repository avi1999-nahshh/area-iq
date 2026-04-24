"""
Extract cafes, restaurants, and bars from OSM India extract.
Adds cafe_count, restaurant_count, bar_count to infrastructure.json.
"""
import json, subprocess, geopandas as gpd, pandas as pd
from pathlib import Path
from shapely.geometry import Point

RAW = Path(__file__).resolve().parents[2] / "data" / "raw"
OUT = Path(__file__).resolve().parents[2] / "data" / "processed"

# ── Step 1: Extract relevant amenities from OSM ──────────────────────────
print("Extracting cafe/restaurant/bar POIs from OSM...")
osm_in  = str(RAW / "india-latest.osm.pbf")
osm_out = str(RAW / "cafes.osm.pbf")
geoj    = str(RAW / "cafes.geojsonseq")

# Extract matching nodes/ways
subprocess.run([
    "osmium", "tags-filter",
    osm_in,
    "n/amenity=cafe,restaurant,bar,pub,fast_food,food_court,ice_cream,biergarten",
    "n/shop=coffee,tea",
    "-o", osm_out, "--overwrite",
], check=True)

# Export as GeoJSON sequence (nodes only → lat/lng available)
subprocess.run([
    "osmium", "export",
    osm_out,
    "--geometry-types=point",
    "-f", "geojsonseq",
    "-o", geoj, "--overwrite",
], check=True)
print("  extraction done")

# ── Step 2: Parse GeoJSON-seq into POI records ────────────────────────────
CAFE_AMENITIES   = {"cafe", "coffee_shop", "ice_cream"}
CAFE_SHOPS       = {"coffee", "tea"}
RESTAURANT_AMENITIES = {"restaurant", "fast_food", "food_court", "biergarten"}
BAR_AMENITIES    = {"bar", "pub"}

def categorise(props):
    a = props.get("amenity", "")
    s = props.get("shop", "")
    if a in CAFE_AMENITIES or s in CAFE_SHOPS:
        return "cafe"
    if a in RESTAURANT_AMENITIES:
        return "restaurant"
    if a in BAR_AMENITIES:
        return "bar"
    return None

pois = []
with open(geoj) as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        feat = json.loads(line)
        props = feat.get("properties") or {}
        cat = categorise(props)
        if cat is None:
            continue
        coords = feat["geometry"]["coordinates"]  # [lng, lat]
        pois.append({
            "cat": cat,
            "lat": coords[1],
            "lng": coords[0],
            "name": props.get("name", ""),
        })

print(f"  parsed {len(pois)} POIs  (cafe={sum(1 for p in pois if p['cat']=='cafe')}, "
      f"restaurant={sum(1 for p in pois if p['cat']=='restaurant')}, "
      f"bar={sum(1 for p in pois if p['cat']=='bar')})")

# ── Step 3: Spatial join to pincode polygons ──────────────────────────────
print("Loading pincode boundaries...")
gdf = gpd.read_file(RAW / "pincode_boundaries.shp")
gdf["pincode"] = gdf["pincode"].astype(str).str.strip().str.zfill(6)
gdf = gdf.set_index("pincode")

poi_gdf = gpd.GeoDataFrame(
    pois,
    geometry=[Point(p["lng"], p["lat"]) for p in pois],
    crs="EPSG:4326",
)

print("Spatial join (may take several minutes)...")
joined = gpd.sjoin(poi_gdf, gdf[["geometry"]], how="left", predicate="within")
_idx_col = "pincode" if "pincode" in joined.columns else (
    "index_right" if "index_right" in joined.columns else None
)
if _idx_col is None:
    raise RuntimeError(f"sjoin did not produce expected index column. Got: {list(joined.columns)}")
joined = joined.dropna(subset=[_idx_col])
counts = joined.groupby([_idx_col, "cat"]).size().unstack(fill_value=0).reset_index()
counts.columns.name = None
if _idx_col != "pincode":
    counts = counts.rename(columns={_idx_col: "pincode"})

print(f"  joined: {len(joined)} POIs assigned to pincodes")

# ── Step 4: Merge into existing infrastructure.json ───────────────────────
print("Merging into infrastructure.json...")
existing = json.load(open(OUT / "infrastructure.json"))

# Build lookup from counts
counts_map = {}
for _, row in counts.iterrows():
    pc = str(row["pincode"]).zfill(6)
    counts_map[pc] = {
        "cafe_count":       int(row.get("cafe", 0)),
        "restaurant_count": int(row.get("restaurant", 0)),
        "bar_count":        int(row.get("bar", 0)),
    }

for rec in existing:
    pc = str(rec["pincode"]).zfill(6)
    extra = counts_map.get(pc, {"cafe_count": 0, "restaurant_count": 0, "bar_count": 0})
    rec["cafe_count"]       = extra["cafe_count"]
    rec["restaurant_count"] = extra["restaurant_count"]
    rec["bar_count"]        = extra["bar_count"]

with open(OUT / "infrastructure.json", "w") as f:
    json.dump(existing, f)

# ── Stats ─────────────────────────────────────────────────────────────────
cafe_pos   = sum(1 for r in existing if r.get("cafe_count", 0) > 0)
rest_pos   = sum(1 for r in existing if r.get("restaurant_count", 0) > 0)
bar_pos    = sum(1 for r in existing if r.get("bar_count", 0) > 0)
print(f"Saved {len(existing)} records → data/processed/infrastructure.json")
print(f"Stats — pincodes with field > 0:")
print(f"  cafe_count:       {cafe_pos}")
print(f"  restaurant_count: {rest_pos}")
print(f"  bar_count:        {bar_pos}")
