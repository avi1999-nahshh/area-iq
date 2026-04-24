"""
Maps NCRB district crime rates + police station proximity to pincodes.
Fallback cascade: district → state average → national average.
Uses fuzzy district name matching (rapidfuzz) + state-hint tiebreaker.
"""
import json, sys
from pathlib import Path
import pandas as pd, geopandas as gpd, numpy as np
from scipy.spatial import cKDTree
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from utils.district_match import DistrictLookup, normalize

RAW = Path("../../data/raw")
OUT = Path("../../data/processed")
pincodes = json.load(open(OUT / "pincodes.json"))

# ── NCRB crime data ──────────────────────────────────────
ncrb = pd.read_csv(RAW / "ncrb_district_2022.csv", dtype=str)
ncrb.columns = [c.lower().strip().replace(" ", "_") for c in ncrb.columns]
CRIME_COLS = ["murder", "robbery", "theft", "crimes_against_women", "rape"]
for col in CRIME_COLS:
    if col in ncrb.columns:
        ncrb[col] = pd.to_numeric(ncrb[col], errors="coerce").fillna(0)

ncrb["total_ipc"] = ncrb[[c for c in CRIME_COLS if c in ncrb.columns]].sum(axis=1)
# many NCRB CSVs use 1-lakh-aggregated counts without a population column;
# assume pop=100k as denominator so "rate" = raw count if no pop given
_pop_col = next((c for c in ["population", "pop", "total_population"] if c in ncrb.columns), None)
if _pop_col:
    ncrb["population"] = pd.to_numeric(ncrb[_pop_col], errors="coerce").fillna(100000)
else:
    ncrb["population"] = 100000
ncrb["crime_rate"] = (ncrb["total_ipc"] / ncrb["population"] * 100000).round(2)

_dist_col = next((c for c in ["district", "district_name", "district/state", "name", "districts"] if c in ncrb.columns), None)
_state_col = next((c for c in ["states/uts", "state", "state/ut", "state_name"] if c in ncrb.columns), None)
if _dist_col is None:
    raise KeyError(f"No district column in NCRB. Found: {sorted(ncrb.columns)[:30]}")
ncrb["district_key"] = ncrb[_dist_col].astype(str).str.strip()
ncrb = ncrb.drop_duplicates("district_key", keep="first")

crime_map = ncrb.set_index("district_key").to_dict("index")
crime_lookup = DistrictLookup(crime_map)

# state-level aggregates (state name → rates)
state_crime = {}
if _state_col:
    for sn, grp in ncrb.groupby(_state_col):
        pop_sum = pd.to_numeric(grp["population"], errors="coerce").sum()
        if pop_sum <= 0: continue
        state_crime[normalize(str(sn))] = {
            "crime_rate": (grp["total_ipc"].sum() / pop_sum * 100000),
            "murder":     grp.get("murder",   pd.Series(0)).sum(),
            "theft":      grp.get("theft",    pd.Series(0)).sum(),
            "crimes_against_women": grp.get("crimes_against_women", pd.Series(0)).sum(),
            "population": pop_sum,
        }

# national average (from all districts)
pop_total = ncrb["population"].sum()
NATIONAL = {
    "crime_rate": float(ncrb["total_ipc"].sum() / pop_total * 100000) if pop_total else 422.0,
    "murder":     float(ncrb.get("murder",   pd.Series(0)).sum()),
    "theft":      float(ncrb.get("theft",    pd.Series(0)).sum()),
    "crimes_against_women": float(ncrb.get("crimes_against_women", pd.Series(0)).sum()),
    "population": float(pop_total) if pop_total else 1.3e9,
}

# ── Police stations ──────────────────────────────────────
gdf = gpd.read_file(RAW / "police_stations.geojson")
ps_coords = np.array([[row.geometry.y, row.geometry.x] for _, row in gdf.iterrows()])
ps_names = gdf.get("name", pd.Series([""] * len(gdf))).tolist()
ps_tree = cKDTree(np.radians(ps_coords))
EARTH_R = 6371

state_lookup = DistrictLookup(state_crime) if state_crime else None

stats = {"district": 0, "state": 0, "national": 0}
output = []
for p in pincodes:
    rec, _, _ = crime_lookup.find(p["district"], state_hint=p["state"])
    level = "district"
    if rec is None:
        # state fallback — fuzzy match on state name (NCRB "Delhi UT" vs pincode "Nct Of Delhi" etc.)
        rec = None
        if state_lookup is not None:
            rec, _, _ = state_lookup.find(p["state"], threshold=70)
        level = "state" if rec else "national"
        if rec is None:
            rec = NATIONAL
    stats[level] += 1

    pop = max(float(rec.get("population", 1e5)), 1.0)
    crime_rate = float(rec.get("crime_rate", NATIONAL["crime_rate"]))
    murder_rate = float(rec.get("murder", 0)) / pop * 100000
    theft_rate  = float(rec.get("theft", 0))  / pop * 100000
    caw_rate    = float(rec.get("crimes_against_women", 0)) / pop * 100000

    nearest_ps_km, nearest_ps_name = None, None
    if p.get("lat") and p.get("lng"):
        q = np.radians([p["lat"], p["lng"]])
        dist_rad, idx = ps_tree.query(q, k=1)
        nearest_ps_km = round(dist_rad * EARTH_R, 2)
        nearest_ps_name = ps_names[idx] if idx < len(ps_names) else None

    output.append({
        "pincode": p["pincode"],
        "district": p["district"],
        "crime_rate_per_lakh": round(crime_rate, 2),
        "murder_rate": round(murder_rate, 3),
        "theft_rate": round(theft_rate, 3),
        "crimes_against_women_rate": round(caw_rate, 3),
        "nearest_police_station_km": nearest_ps_km if nearest_ps_km is not None else None,
        "nearest_police_station_name": nearest_ps_name,
        "crime_data_source": level,   # "district" | "state" | "national"
        "data_year": 2014,            # NCRB 2014 as stand-in until 2022 PDFs are parsed
    })

with open(OUT / "safety.json", "w") as f:
    json.dump(output, f)
print(f"Saved {len(output)} records → data/processed/safety.json")
print(f"  fallback: district={stats['district']}, state={stats['state']}, national={stats['national']}")
