"""
Computes 0-100 scores for each dimension per pincode.
All normalizations use percentile-based winsorization (p5 to p95 range).
"""
import json, numpy as np, pandas as pd
from pathlib import Path
from scipy.stats import percentileofscore

OUT = Path("../../data/processed")

def _load(name, required=True):
    p = OUT / name
    if not p.exists():
        if required:
            raise FileNotFoundError(p)
        print(f"  [skip] {name} not found — using empty dict")
        return {}
    return {r["pincode"]: r for r in json.load(open(p))}

pincodes = _load("pincodes.json")
census   = _load("census.json")
aq       = _load("air_quality.json")
safety   = _load("safety.json")
infra    = _load("infrastructure.json")
transit  = _load("transit.json")
clean    = _load("cleanliness.json")
prop     = _load("property.json", required=False)

def _is_num(v):
    if v is None: return False
    try:
        f = float(v)
        return not (f != f)  # NaN check without ufunc
    except (TypeError, ValueError):
        return False

def pct_score(values, val, invert=False):
    """Convert a value to 0-100 score based on percentile in distribution."""
    arr = [float(v) for v in values if _is_num(v)]
    if not arr or not _is_num(val):
        return 50.0  # neutral default
    val = float(val)
    s = percentileofscore(arr, val, kind="rank")
    return round(100 - s if invert else s, 2)

# Collect all values for normalization
def _c(r, *keys):
    """Sum 0-or-number across keys on a record."""
    return sum((r.get(k) or 0) for k in keys)

all_aqi       = [r.get("aqi") for r in aq.values()]
all_pm25      = [r.get("pm25") for r in aq.values()]
all_crime     = [r.get("crime_rate_per_lakh") for r in safety.values()]
all_ps_dist   = [r.get("nearest_police_station_km") for r in safety.values()]

# Infrastructure categories — grouped for balanced weight
all_5min       = [r.get("five_minute_city_score") for r in infra.values()]
all_healthcare = [_c(r, "hospital_count", "clinic_count") for r in infra.values()]
all_education  = [_c(r, "school_count", "college_count") for r in infra.values()]
all_green      = [_c(r, "park_count", "playground_count", "sports_centre_count") for r in infra.values()]
all_retail     = [_c(r, "mall_count", "market_count") for r in infra.values()]
all_pharmacy   = [r.get("pharmacy_count") for r in infra.values()]

# Total POI density (used for urban/rural classification)
INFRA_KEYS = ["hospital_count","clinic_count","school_count","college_count",
              "park_count","playground_count","sports_centre_count",
              "mall_count","market_count","pharmacy_count","bank_count","atm_count","bus_stop_count"]

all_rail      = [r.get("nearest_railway_km") for r in transit.values()]
all_metro     = [r.get("nearest_metro_km") for r in transit.values() if r.get("nearest_metro_km")]
all_road      = [r.get("road_density") for r in transit.values()]
all_commute   = [r.get("commute_under_30_pct") for r in census.values()]
all_ss        = [r.get("ss_score") for r in clean.values()]
all_lights    = [r.get("nighttime_light") for r in prop.values()]
all_hpi       = [r.get("hpi_value") for r in prop.values()]

# ── Tier classification (urban / semi-urban / rural) ─────────────────
# Uses metro_city membership + POI density per sq km.
def classify_tier(p, infra_row):
    if p.get("metro_city"):
        return "urban"
    total_pois = sum((infra_row.get(k) or 0) for k in INFRA_KEYS)
    area = max(p.get("area_sq_km") or 1.0, 0.5)
    density = total_pois / area
    if density >= 8:  return "urban"
    if density >= 1.5: return "semi-urban"
    return "rural"

# ── Tier-specific weights for overall_score ──────────────────────────
WEIGHTS = {
    "urban": {
        "air_quality":    0.22,
        "cleanliness":    0.18,
        "safety":         0.15,
        "infrastructure": 0.15,
        "transit":        0.20,
        "property":       0.10,
    },
    "semi-urban": {
        "air_quality":    0.18,
        "cleanliness":    0.15,
        "safety":         0.20,
        "infrastructure": 0.20,
        "transit":        0.17,
        "property":       0.10,
    },
    "rural": {
        "air_quality":    0.10,
        "cleanliness":    0.05,
        "safety":         0.25,
        "infrastructure": 0.30,
        "transit":        0.15,
        "property":       0.15,
    },
}

output = []
all_pincodes = list(pincodes.keys())
for pc in all_pincodes:
    a  = aq.get(pc, {})
    sa = safety.get(pc, {})
    i  = infra.get(pc, {})
    t  = transit.get(pc, {})
    ce = census.get(pc, {})
    cl = clean.get(pc, {})
    pr = prop.get(pc, {})
    p  = pincodes.get(pc, {})

    # ── air quality (lower AQI = better) ─────────────────
    aq_score = (
        pct_score(all_aqi, a.get("aqi"), invert=True) * 0.5 +
        pct_score(all_pm25, a.get("pm25"), invert=True) * 0.5
    )

    # ── safety ────────────────────────────────────────────
    safety_score = (
        pct_score(all_crime, sa.get("crime_rate_per_lakh"), invert=True) * 0.7 +
        pct_score(all_ps_dist, sa.get("nearest_police_station_km"), invert=True) * 0.3
    )

    # ── infrastructure (6-category weighted) ──────────────
    infra_score = (
        pct_score(all_5min, i.get("five_minute_city_score")) * 0.30 +
        pct_score(all_healthcare, _c(i, "hospital_count", "clinic_count")) * 0.20 +
        pct_score(all_education,  _c(i, "school_count", "college_count")) * 0.15 +
        pct_score(all_green,      _c(i, "park_count", "playground_count", "sports_centre_count")) * 0.15 +
        pct_score(all_retail,     _c(i, "mall_count", "market_count")) * 0.10 +
        pct_score(all_pharmacy,   i.get("pharmacy_count")) * 0.10
    )

    # ── transit ───────────────────────────────────────────
    commute_s = pct_score(all_commute, ce.get("commute_under_30_pct"))
    rail_s    = pct_score(all_rail, t.get("nearest_railway_km"), invert=True)
    metro_s   = pct_score(all_metro, t.get("nearest_metro_km"), invert=True) if t.get("nearest_metro_km") else 25.0
    road_s    = pct_score(all_road, t.get("road_density"))
    transit_score = commute_s * 0.45 + rail_s * 0.25 + metro_s * 0.20 + road_s * 0.10

    # ── cleanliness ───────────────────────────────────────
    clean_score = pct_score(all_ss, cl.get("ss_score")) if cl.get("ss_score") else 50.0

    # ── property / economic activity ─
    # Prefer hpi_value (0-100 econ-density score from 99acres + OSM); fall back
    # to nighttime_light (VIIRS) if present; else neutral 50.
    if _is_num(pr.get("hpi_value")):
        prop_score = float(pr["hpi_value"])  # already a 0-100 percentile, no re-rank
    elif _is_num(pr.get("nighttime_light")):
        prop_score = pct_score(all_lights, pr.get("nighttime_light"))
    else:
        prop_score = 50.0

    # ── overall — tier-aware weighted mean ────────────────
    tier = classify_tier(p, i)
    w = WEIGHTS[tier]
    overall = round(
        aq_score      * w["air_quality"]
        + clean_score * w["cleanliness"]
        + safety_score * w["safety"]
        + infra_score * w["infrastructure"]
        + transit_score * w["transit"]
        + prop_score * w["property"], 2)

    # ── derived ───────────────────────────────────────────
    lit_f = ce.get("literacy_rate_female", 65)
    worker_f = ce.get("worker_participation_rate", 40)
    gender_ratio = ce.get("gender_ratio", 940)
    gender_eq = round(
        pct_score([65, 70, 75, 80, 85], lit_f) * 0.4 +
        pct_score([30, 35, 40, 45, 50], worker_f) * 0.4 +
        pct_score([900, 920, 940, 960, 980], gender_ratio) * 0.2, 2
    )

    output.append({
        "pincode": pc,
        "air_quality_score": round(aq_score, 2),
        "safety_score": round(safety_score, 2),
        "infrastructure_score": round(infra_score, 2),
        "transit_score": round(transit_score, 2),
        "cleanliness_score": round(clean_score, 2),
        "property_score": round(prop_score, 2),
        "overall_score": overall,
        "tier": tier,
        "gender_equality_index": gender_eq,
        "state": p.get("state"),
        "district": p.get("district"),
        "metro_city": p.get("metro_city"),
    })

with open(OUT / "scores_raw.json", "w") as f:
    json.dump(output, f)
print(f"Saved {len(output)} raw scores → data/processed/scores_raw.json")
