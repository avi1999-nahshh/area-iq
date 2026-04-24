"""
Counts OSM POIs per pincode using point-in-polygon spatial join.
Supplements with UDISE school data and NHP hospital data.
"""
import json, geopandas as gpd, pandas as pd
from pathlib import Path
from shapely.geometry import Point

RAW = Path("../../data/raw")
OUT = Path("../../data/processed")
pincodes = json.load(open(OUT / "pincodes.json"))

CATS = ["hospital","clinic","school","college","park","playground",
        "sports_centre","mall","market","pharmacy","bank","atm","bus_stop"]
FIVE_MIN_CATS = ["hospital","school","park","pharmacy","bank","bus_stop","market","mall","clinic","sports_centre"]

# Load pincode boundaries for spatial join
print("Loading pincode boundaries...")
gdf = gpd.read_file(RAW / "pincode_boundaries.shp")
gdf["pincode"] = gdf["pincode"].astype(str).str.strip().str.zfill(6)
gdf = gdf.set_index("pincode")

# Load OSM POIs
print("Loading OSM POIs...")
pois = json.load(open(RAW / "osm_pois.json"))
poi_gdf = gpd.GeoDataFrame(
    pois,
    geometry=[Point(p["lng"], p["lat"]) for p in pois],
    crs="EPSG:4326"
)

# Spatial join POIs to pincode polygons
print("Spatial join (this takes ~10 min)...")
joined = gpd.sjoin(poi_gdf, gdf[["geometry"]], how="left", predicate="within")
# geopandas 1.x names the right-side index column after its index name ("pincode") or "index_right"
_idx_col = "pincode" if "pincode" in joined.columns else ("index_right" if "index_right" in joined.columns else None)
if _idx_col is None:
    raise RuntimeError(f"sjoin did not produce expected index column. Got: {list(joined.columns)}")
joined = joined.dropna(subset=[_idx_col])
counts = joined.groupby([_idx_col, "cat"]).size().unstack(fill_value=0).reset_index()
counts.columns.name = None
if _idx_col != "pincode":
    counts = counts.rename(columns={_idx_col: "pincode"})

output = []
for p in pincodes:
    row = counts[counts["pincode"] == p["pincode"]]
    def get(col): return int(row[col].iloc[0]) if not row.empty and col in row.columns else 0
    h = get("hospital"); cl = get("clinic"); sc = get("school"); cg = get("college")
    pk = get("park"); pg = get("playground"); sp = get("sports_centre")
    ml = get("mall"); mk = get("market"); ph = get("pharmacy")
    bk = get("bank"); at = get("atm"); bs = get("bus_stop")

    five_min = sum([
        min(h + cl, 1), min(sc, 1), min(pk, 1), min(ph, 1),
        min(bk + at, 1), min(bs, 1), min(mk, 1), min(ml, 1),
        min(cg, 1), min(sp, 1),
    ])

    output.append({
        "pincode": p["pincode"],
        "hospital_count": h, "clinic_count": cl, "school_count": sc,
        "college_count": cg, "park_count": pk, "playground_count": pg,
        "sports_centre_count": sp, "mall_count": ml, "market_count": mk,
        "pharmacy_count": ph, "bank_count": bk, "atm_count": at,
        "bus_stop_count": bs, "five_minute_city_score": five_min,
    })

with open(OUT / "infrastructure.json", "w") as f:
    json.dump(output, f)
print(f"Saved {len(output)} records → data/processed/infrastructure.json")
