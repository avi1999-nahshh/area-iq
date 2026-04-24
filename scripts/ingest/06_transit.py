"""
Maps nearest Indian Railways station + nearest metro station to each pincode.
Reads from data/raw/transit_v2.geojsonseq (OSM features: railway=station|halt|stop,
station=subway|light_rail), using the station tag to distinguish metro from rail.

Road density is omitted in this MVP — Census B-28 commute distance carries the
bulk of the transit weight in the scoring engine.
"""
import json
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree

RAW = Path("../../data/raw")
OUT = Path("../../data/processed")
pincodes = json.load(open(OUT / "pincodes.json"))

import re
# "Major" Indian Railways stations = real connectivity hubs.
# Word-boundary match on terminal keywords used in IR naming conventions.
# Intentionally does NOT include "Terminal" (too broad — matches airport terminals).
MAJOR_RE = re.compile(r"\b(junction|jn|central|terminus)\b", re.IGNORECASE)
AIRPORT_RE = re.compile(r"\bairport\b", re.IGNORECASE)

railway_all, railway_major, metro = [], [], []
# Dedupe by (name, rounded coords) — OSM has multiple nodes per physical station
seen_rail = set()
seen_metro = set()

with open(RAW / "transit_v2.geojsonseq", "rb") as f:
    for line in f:
        line = line.strip(b"\x1e \n\r\t")
        if not line: continue
        try:
            feat = json.loads(line)
        except Exception:
            continue
        if feat.get("geometry", {}).get("type") != "Point":
            continue
        lng, lat = feat["geometry"]["coordinates"][:2]
        props = feat.get("properties") or {}
        name = (props.get("name") or "").strip()
        station_tag = props.get("station", "")
        railway_tag = props.get("railway", "")
        pt_tag = props.get("public_transport", "")

        # Skip stop_position sub-nodes — these are internal platform markers,
        # not separate stations. The main station node has station/railway tags
        # without pt=stop_position.
        if pt_tag == "stop_position":
            continue

        rec = {"lat": lat, "lng": lng, "name": name}
        key = (name.lower(), round(lat, 3), round(lng, 3))

        if station_tag in ("subway", "light_rail"):
            if key not in seen_metro:
                seen_metro.add(key)
                metro.append(rec)
            continue  # metro station — don't also count as railway

        if railway_tag in ("station", "halt", "stop"):
            if key in seen_rail: continue
            seen_rail.add(key)
            railway_all.append(rec)
            if MAJOR_RE.search(name) and not AIRPORT_RE.search(name):
                railway_major.append(rec)

print(f"Railway (all): {len(railway_all)}, Major (Junction/Central/Terminus): {len(railway_major)}, Metro: {len(metro)}")

EARTH_R = 6371
def make_tree(pts):
    return cKDTree(np.radians([[p["lat"], p["lng"]] for p in pts]))

def nearest(tree, pts, lat, lng):
    q = np.radians([lat, lng])
    dist_rad, idx = tree.query(q, k=1)
    if idx >= len(pts): return (None, None)
    return (round(dist_rad * EARTH_R, 2), pts[idx]["name"])

r_all_tree   = make_tree(railway_all)   if railway_all   else None
r_major_tree = make_tree(railway_major) if railway_major else None
m_tree       = make_tree(metro)         if metro         else None

output = []
for p in pincodes:
    if not p.get("lat") or not p.get("lng"):
        continue
    any_km,   any_name   = nearest(r_all_tree,   railway_all,   p["lat"], p["lng"]) if r_all_tree   else (None, None)
    major_km, major_name = nearest(r_major_tree, railway_major, p["lat"], p["lng"]) if r_major_tree else (None, None)
    metro_km, metro_name = nearest(m_tree,       metro,         p["lat"], p["lng"]) if m_tree       else (None, None)
    output.append({
        "pincode": p["pincode"],
        # nearest major station (Junction/Central/Terminus) — real connectivity signal
        "nearest_major_railway_km":   major_km,
        "nearest_major_railway_name": major_name or None,
        # nearest any station (halts + stops too) — walkable-rail signal
        "nearest_railway_km":   any_km,
        "nearest_railway_name": any_name or None,
        # metro (city subway networks only)
        "nearest_metro_km":   metro_km,
        "nearest_metro_name": metro_name or None,
        "road_density": None,  # omitted in MVP
    })

with open(OUT / "transit.json", "w") as f:
    json.dump(output, f)
print(f"Saved {len(output)} records → data/processed/transit.json")
