"""
IQ v2 — Bangalore urban-only POC dimension engine.

Drops cleanliness + safety + nightlight-as-property entirely. Composes six
defensible dimensions from existing tables for the 115 tier=urban pincodes
in Bangalore district. Ranks each pincode within BLR urban per dimension and
generates an auto headline label ("The #1 Connectivity Hub" etc).

Output: data/processed/iq_v2_blr.json (one record per BLR urban pincode).

The /insights/[pincode] route reads this file at server-render time. No
Convex schema additions needed for the POC.

Run:
    python3 scripts/score/14_iq_v2_blr.py
"""
import json
import math
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "data" / "processed"
OUT_FILE = PROCESSED / "iq_v2_blr.json"


def load(name: str) -> list[dict[str, Any]]:
    return json.load(open(PROCESSED / f"{name}.json"))


def idx(rows, key="pincode"):
    return {str(r[key]): r for r in rows}


# ── load corpus ────────────────────────────────────────────────────────────
P = load("pincodes")
S = load("scores_final")
INFRA = load("infrastructure")
AQ = load("air_quality")
T = load("transit")
PR = load("property")
C = load("census")

iS, iI, iAQ, iT, iPR, iC = (idx(x) for x in (S, INFRA, AQ, T, PR, C))


# ── filter to BLR urban ────────────────────────────────────────────────────
def is_blr(p):
    d = (p.get("district") or "").lower()
    # district can be composite like "Bangalore, Bangalore Rural" — match any token
    return any(tok in d for tok in ("bangalore", "bengaluru"))


blr_urban = [
    p
    for p in P
    if is_blr(p) and iS.get(str(p["pincode"]), {}).get("tier") == "urban"
]
print(f"BLR urban pincodes: {len(blr_urban)}")


# ── helpers ────────────────────────────────────────────────────────────────
def safe(x, default=None):
    return default if x is None else x


def percentile_rank(values: list[float], v: float | None) -> float:
    """0..100 percentile of v within values (higher v → higher pct).
    Returns 50 if v is None."""
    if v is None:
        return 50.0
    sorted_vals = sorted(values)
    if not sorted_vals:
        return 50.0
    below = sum(1 for x in sorted_vals if x < v)
    equal = sum(1 for x in sorted_vals if x == v)
    return 100.0 * (below + equal / 2) / len(sorted_vals)


def inverted_pct(values: list[float], v: float | None) -> float:
    """Lower-is-better percentile. 100 = best (lowest)."""
    if v is None:
        return 50.0
    return 100.0 - percentile_rank(values, v)


def aqi_score(aqi: float | None, station_km: float | None) -> tuple[float, bool]:
    """Returns (0..100 score, confidence_flag).
    Linear: AQI 30 → 100, AQI 200 → 0. Confidence True if station ≤15km."""
    if aqi is None:
        return 50.0, False
    score = max(0.0, min(100.0, 100.0 - (aqi - 30.0) * (100.0 / 170.0)))
    return score, (station_km is not None and station_km <= 15.0)


# ── extract per-pincode primitives ─────────────────────────────────────────
def extract(p):
    pc = str(p["pincode"])
    s = iS.get(pc, {})
    i = iI.get(pc, {})
    aq = iAQ.get(pc, {})
    t = iT.get(pc, {})
    pr = iPR.get(pc, {})
    ce = iC.get(pc, {})

    # Counts
    hospitals = (i.get("hospital_count") or 0) + (i.get("clinic_count") or 0)
    schools = (i.get("school_count") or 0) + (i.get("college_count") or 0)
    banks = (i.get("bank_count") or 0)
    cafes = i.get("cafe_count") or 0
    restaurants = i.get("restaurant_count") or 0
    malls = (i.get("mall_count") or 0) + (i.get("market_count") or 0)
    parks = (i.get("park_count") or 0) + (i.get("playground_count") or 0)

    essentials_raw = hospitals + schools + banks
    lifestyle_raw = cafes + restaurants + malls * 2 + parks  # mall weighted higher

    # Connectivity primitives
    metro_km = t.get("nearest_metro_km")
    rail_km = t.get("nearest_railway_km") or t.get("nearest_major_railway_km")
    bus_count = i.get("bus_stop_count") or 0
    commute30 = ce.get("commute_under_30_pct") or 50

    # Density / demographics
    pop = ce.get("population") or 0
    area = max(p.get("area_sq_km") or 1, 0.5)
    pop_density = pop / area
    wpr = ce.get("worker_participation_rate") or 0
    hh_size = ce.get("avg_household_size") or 4.5

    # Affordability — rent (lower 2BHK rent for the city = more affordable)
    rent = pr.get("city_rent_median_2bhk")
    rent_match = pr.get("rent_match_level")

    # Walkability
    five_min = i.get("five_minute_city_score") or 0  # 0-10 scale

    # Air
    aqi = aq.get("aqi")
    station_km = aq.get("station_distance_km")

    return {
        "pincode": pc,
        "name": p["name"],
        "district": p["district"],
        "state": p["state"],
        "lat": p["lat"],
        "lng": p["lng"],
        "_essentials_raw": essentials_raw,
        "_lifestyle_raw": lifestyle_raw,
        "_metro_km": metro_km,
        "_rail_km": rail_km,
        "_bus_count": bus_count,
        "_commute30": commute30,
        "_pop_density": pop_density,
        "_wpr": wpr,
        "_hh_size": hh_size,
        "_rent": rent,
        "_rent_match": rent_match,
        "_five_min": five_min,
        "_aqi": aqi,
        "_station_km": station_km,
        # Raw counts kept for display
        "counts": {
            "hospitals": hospitals,
            "schools": schools,
            "banks": banks,
            "cafes": cafes,
            "restaurants": restaurants,
            "malls": malls,
            "parks": parks,
            "buses": bus_count,
        },
        "raw": {
            "aqi": aqi,
            "station_distance_km": station_km,
            "metro_km": metro_km,
            "rail_km": rail_km,
            "rent_2bhk": rent,
            "rent_match": rent_match,
            "pop_density": pop_density,
            "wpr": wpr,
            "hh_size": hh_size,
            "five_min_city": five_min,
            "commute_under_30_pct": commute30,
        },
    }


peers = [extract(p) for p in blr_urban]


# ── compute peer-normalised scores ─────────────────────────────────────────
all_essentials = [p["_essentials_raw"] for p in peers]
all_lifestyle = [p["_lifestyle_raw"] for p in peers]
all_metro = [p["_metro_km"] for p in peers if p["_metro_km"] is not None]
all_rail = [p["_rail_km"] for p in peers if p["_rail_km"] is not None]
all_bus = [p["_bus_count"] for p in peers]
all_commute30 = [p["_commute30"] for p in peers]
all_density = [p["_pop_density"] for p in peers]
all_wpr = [p["_wpr"] for p in peers]
all_hh = [p["_hh_size"] for p in peers]
all_rent = [p["_rent"] for p in peers if p["_rent"]]
all_five_min = [p["_five_min"] for p in peers]
all_aqi = [p["_aqi"] for p in peers if p["_aqi"] is not None]


def score_one(p):
    # Air — direct linear, then optionally floor by city percentile if station too far
    air, air_conf = aqi_score(p["_aqi"], p["_station_km"])

    # Amenities — split
    essentials = percentile_rank(all_essentials, p["_essentials_raw"])
    lifestyle = percentile_rank(all_lifestyle, p["_lifestyle_raw"])
    amenities = essentials * 0.5 + lifestyle * 0.5

    # Connectivity composite
    metro_s = inverted_pct(all_metro, p["_metro_km"]) if p["_metro_km"] is not None else 30
    rail_s = inverted_pct(all_rail, p["_rail_km"]) if p["_rail_km"] is not None else 30
    bus_s = percentile_rank(all_bus, p["_bus_count"])
    commute_s = percentile_rank(all_commute30, p["_commute30"])
    connectivity = metro_s * 0.40 + rail_s * 0.15 + bus_s * 0.20 + commute_s * 0.25

    # Density / demographics — pop density + worker participation + (small HH = youth proxy)
    dens_s = percentile_rank(all_density, p["_pop_density"])
    wpr_s = percentile_rank(all_wpr, p["_wpr"])
    youth_proxy = inverted_pct(all_hh, p["_hh_size"])  # small HH → high score
    density_score = dens_s * 0.35 + wpr_s * 0.35 + youth_proxy * 0.30

    # Affordability — lower rent = more affordable. If no rent at all in BLR, score 50.
    if p["_rent"]:
        afford_s = inverted_pct(all_rent, p["_rent"])
    else:
        afford_s = 50.0
    afford_conf = p["_rent_match"] in ("locality",)

    # Walkability — 5-min city (0-10) + commute<30% blend
    walk_five = (p["_five_min"] / 10.0) * 100.0
    walk_commute = p["_commute30"]  # already 0-100ish %
    walkability = walk_five * 0.6 + walk_commute * 0.4

    # Overall composite for the POC.
    # Walkability is weighted 0 — the composite (5-min-city × 0.6 + commute<30
    # min × 0.4) reads as confusing in the report and is hidden from every
    # user-facing surface. Score still computed and persisted for future use.
    # Its old 15% has been redistributed: +4 each to air and amenities (the
    # user's stated #1 + #2 priorities), +2 to connectivity, +3 to density,
    # +2 to affordability. Weights now sum to 1.00 across the visible 5 dims.
    overall = (
        air * 0.24
        + amenities * 0.24
        + connectivity * 0.22
        + density_score * 0.18
        + afford_s * 0.12
        + walkability * 0.0
    )

    return {
        "air": round(air, 1),
        "air_confident": air_conf,
        "amenities": round(amenities, 1),
        "essentials": round(essentials, 1),
        "lifestyle": round(lifestyle, 1),
        "connectivity": round(connectivity, 1),
        "density": round(density_score, 1),
        "affordability": round(afford_s, 1),
        "affordability_confident": afford_conf,
        "walkability": round(walkability, 1),
        "overall": round(overall, 1),
    }


for p in peers:
    p["scores"] = score_one(p)


# ── compute citywide ranks per dimension ───────────────────────────────────
DIM_LABELS = {
    "air": "Cleanest Air",
    "amenities": "Amenity Density",
    "essentials": "Essentials Coverage",
    "lifestyle": "Lifestyle Density",
    "connectivity": "Connectivity Hub",
    "density": "Density & Activity",
    "affordability": "Affordable Living",
    "walkability": "Walkability",
}

n = len(peers)
for dim_key in DIM_LABELS:
    sorted_peers = sorted(peers, key=lambda x: -x["scores"][dim_key])
    for rank, p in enumerate(sorted_peers, start=1):
        p.setdefault("ranks", {})[dim_key] = rank
        p.setdefault("percentile_blr", {})[dim_key] = round(100 * (n - rank + 1) / n, 1)


# ── auto-generate brag label ───────────────────────────────────────────────
def brag_label(p):
    """Pick the dim where this pincode ranks best in BLR. Tie-break by rank.

    Honesty rules — a brag must reflect absolute as well as relative reality:
    - Air is excluded when absolute AQI > 100 (CPCB "Moderate" threshold).
      BLR-wide AQI is uniformly bad (median 185); a "Top 5% Cleanest Air"
      label on a pincode with AQI 185 is technically true relatively but
      misleads the reader. We'd rather brag on the next-best dim.
    - Air is also excluded when the nearest CPCB station is >15km away
      (already gated by `air_confident`).
    - Affordability brags are restricted to locality-confident matches when
      not in the absolute top 10.
    - Walkability is excluded entirely from brag candidates: the composite
      mixes the 5-min-city score with commute<30min % (which is more about
      office distance than walkability), and the user found the framing
      confusing. We keep the score for internal use but never surface it.
    """
    candidates = []
    aqi = p["raw"].get("aqi")
    for dim_key, label in DIM_LABELS.items():
        if dim_key in ("amenities", "walkability"):
            continue  # amenities → split into essentials/lifestyle; walkability hidden
        rank = p["ranks"][dim_key]
        pct = p["percentile_blr"][dim_key]
        if dim_key == "air":
            if not p["scores"]["air_confident"]:
                continue
            if aqi is not None and aqi > 100:
                continue  # don't brag about air when absolute AQI is unhealthy
        if dim_key == "affordability" and not p["scores"]["affordability_confident"] and rank > 10:
            continue
        candidates.append((rank, pct, dim_key, label))

    if not candidates:
        # Fallback to overall rank
        return f"Bangalore Neighbourhood · #{p['ranks'].get('connectivity', n)} of {n}"

    candidates.sort()  # lowest rank first
    rank, pct, dim_key, label = candidates[0]

    if rank == 1:
        return f"Bangalore's #1 {label}"
    if rank <= 3:
        return f"Bangalore's #{rank} {label}"
    if pct >= 95:
        return f"Top 5% {label} in Bangalore"
    if pct >= 90:
        return f"Top 10% {label} in Bangalore"
    if pct >= 75:
        return f"Top 25% {label} in Bangalore"
    return f"{label} · #{rank} of {n}"


# ── outperform-summary subhead ─────────────────────────────────────────────
def outperform_subhead(p):
    """1-sentence summary anchored to the SINGLE strongest dimension.

    The previous version listed the top-3 dimensions and applied the top-1
    percentile to all of them, which overstated the weaker two and mixed
    relative ranking with absolute reality (e.g. claiming 97% on air for a
    pincode with AQI 185 because BLR-wide air is uniformly bad). One dim,
    one number, one honest sentence.
    """
    pct = p["percentile_blr"]
    aqi = p["raw"].get("aqi")
    label_map = {
        "connectivity": "transit access",
        "lifestyle": "lifestyle density",
        "essentials": "essentials coverage",
        "air": "air quality",
    }
    candidates = []
    # Walkability deliberately omitted — same hide-from-surface rule as brag_label.
    for k in ("connectivity", "lifestyle", "essentials", "air"):
        if k == "air":
            # Same honesty rule as brag_label: don't claim air when absolute is bad.
            if aqi is not None and aqi > 100:
                continue
            if not p["scores"].get("air_confident"):
                continue
        candidates.append((pct[k], k))

    if not candidates:
        return (
            "A balanced Bangalore neighbourhood — no single dimension stands out, "
            "but it doesn't fall behind either."
        )

    candidates.sort(reverse=True)
    top_pct, top_key = candidates[0]
    return (
        f"Your neighbourhood outperforms {round(top_pct)}% of Bangalore "
        f"on {label_map[top_key]}."
    )


for p in peers:
    p["brag_label"] = brag_label(p)
    p["subhead"] = outperform_subhead(p)


# ── strip working columns and write ────────────────────────────────────────
def clean(p):
    out = {k: v for k, v in p.items() if not k.startswith("_")}
    return out


cleaned = [clean(p) for p in peers]
OUT_FILE.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2))
print(f"Wrote {OUT_FILE}  ({len(cleaned)} pincodes)")

# Quick sample
print("\n=== Sample brag labels ===")
for p in sorted(cleaned, key=lambda x: -x["scores"]["overall"])[:8]:
    print(f"  {p['pincode']}  {p['name']:<30} overall={p['scores']['overall']:>5.1f}  → {p['brag_label']}")
print("\n=== A few well-known ones ===")
for pc in ("560038", "560034", "560066", "560102", "560011"):
    p = next((x for x in cleaned if x["pincode"] == pc), None)
    if p:
        print(f"  {pc}  {p['name']:<30} overall={p['scores']['overall']:>5.1f}  → {p['brag_label']}")
