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

from shapely.geometry import Point, shape
from shapely.geometry.base import BaseGeometry

ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "data" / "processed"
RAW = ROOT / "data" / "raw"
OUT_FILE = PROCESSED / "iq_v2_blr.json"
POLYGONS_FILE = RAW / "blr_pincode_polygons.geojson"


def load(name: str) -> list[dict[str, Any]]:
    return json.load(open(PROCESSED / f"{name}.json"))


def idx(rows, key="pincode"):
    return {str(r[key]): r for r in rows}


# ── load corpus ────────────────────────────────────────────────────────────
P = load("pincodes")
S = load("scores_final")
INFRA = load("infrastructure")
# OpenAQ v3 ingest (scripts/ingest/03_air_quality_v2.py) — 25 BLR stations
# with native coords, vs the legacy WAQI ingest's 4 stations.
AQ = load("air_quality_v2")
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


# CPCB-band-aligned air score curve. Linear interpolation between anchor points
# tied to CPCB AQI bands (Good / Satisfactory / Moderate / Poor / Very Poor /
# Severe). Replaces the old uniform-linear ramp which over-penalised mid-range
# AQI and didn't respect band semantics.
_AIR_CURVE = [(0, 100), (50, 80), (100, 50), (200, 25), (300, 10), (400, 0)]


# Affordability bell curve. (rent ₹/mo for 2BHK) → score 0-100.
# Rewards the realistic-rent sweet spot (~₹15k-₹22k); penalises both
# luxury (>₹30k) and suspiciously-cheap (<₹10k → too-remote signal).
_RENT_CURVE = [
    (0,      60),
    (10000,  60),
    (12500,  80),
    (18500,  90),
    (26000,  70),
    (37500,  45),
    (45000,  25),
    (100000, 25),
]


def rent_curve_score(rent: float | None) -> float:
    """Score a 2BHK monthly rent (₹) on the affordability curve."""
    if rent is None:
        return 50.0
    if rent <= _RENT_CURVE[0][0]:
        return float(_RENT_CURVE[0][1])
    if rent >= _RENT_CURVE[-1][0]:
        return float(_RENT_CURVE[-1][1])
    for (r1, s1), (r2, s2) in zip(_RENT_CURVE, _RENT_CURVE[1:]):
        if r1 <= rent <= r2:
            return s1 + (rent - r1) * (s2 - s1) / (r2 - r1)
    return 50.0


def aqi_score(aqi: float | None, station_km: float | None) -> tuple[float, bool]:
    """Returns (0..100 score, confidence_flag).

    Curve anchors:
      AQI 0   → 100  (Good top)
      AQI 50  →  80  (Good/Satisfactory boundary)
      AQI 100 →  50  (Satisfactory/Moderate boundary)
      AQI 200 →  25  (Moderate/Poor boundary)
      AQI 300 →  10  (Poor/Very Poor boundary)
      AQI 400+→   0  (Severe)

    Confidence flag (used only for brag-label gating, not the score) is True
    when a real ground station sits within 15 km — kept for backwards compat
    even though all pincodes currently score off the satellite tier.
    """
    if aqi is None:
        return 50.0, False
    if aqi <= 0:
        score = 100.0
    elif aqi >= 400:
        score = 0.0
    else:
        score = 50.0
        for (a1, s1), (a2, s2) in zip(_AIR_CURVE, _AIR_CURVE[1:]):
            if a1 <= aqi <= a2:
                score = s1 + (aqi - a1) * (s2 - s1) / (a2 - a1)
                break
    return score, (station_km is not None and station_km <= 15.0)


def haversine_km(lat1, lng1, lat2, lng2) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── load CPCB station coords directly from OpenAQ v2 ingest ────────────────
# `air_quality_v2.json` persists station_lat/station_lng directly per row,
# so no centroid recovery is needed. Each unique station_id is collapsed to
# one record with its first-seen coords + AQI.
def build_station_index(AQ_all) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for row in AQ_all:
        sid = row.get("station_id")
        aqi = row.get("aqi")
        lat = row.get("station_lat")
        lng = row.get("station_lng")
        if not sid or aqi is None or lat is None or lng is None:
            continue
        if sid in out:
            continue
        out[sid] = {
            "station_id": sid,
            "name": row.get("station_name"),
            "aqi": float(aqi),
            "lat": float(lat),
            "lng": float(lng),
        }
    return out


STATIONS_ALL = build_station_index(AQ)
print(f"Loaded {len(STATIONS_ALL)} unique OpenAQ stations")


def stations_near(lat: float, lng: float, max_km: float = 25.0) -> list[tuple[float, dict]]:
    """All stations within max_km of (lat, lng), sorted nearest-first."""
    out: list[tuple[float, dict]] = []
    for s in STATIONS_ALL.values():
        d = haversine_km(lat, lng, s["lat"], s["lng"])
        if d <= max_km:
            out.append((d, s))
    out.sort(key=lambda x: x[0])
    return out


# ── pincode polygons (point-in-polygon AQI assignment) ────────────────────
# Source: justinelliotmeyers/INDIA_PINCODES (GitHub, community-digitized,
# vintage 2018). Coverage = 129/129 BLR pincodes in our dataset.
def load_pincode_polygons() -> dict[str, BaseGeometry]:
    if not POLYGONS_FILE.exists():
        raise FileNotFoundError(
            f"Pincode polygons missing at {POLYGONS_FILE}. "
            "Run the polygon-source agent or download manually."
        )
    geo = json.load(open(POLYGONS_FILE))
    out: dict[str, BaseGeometry] = {}
    for f in geo.get("features", []):
        pc = str(f.get("properties", {}).get("pincode", "")).strip()
        if not pc:
            continue
        out[pc] = shape(f["geometry"])
    return out


PINCODE_POLYGONS = load_pincode_polygons()
print(f"Loaded {len(PINCODE_POLYGONS)} pincode polygons")


# ── satellite-calibrated AQI per pincode ───────────────────────────────────
# Built by scripts/ingest/15_no2_satellite.py + 16_calibrate_no2_to_aqi.py.
# 30-day Sentinel-5P NO2 mosaic, mean per polygon, linearly calibrated to
# ground-station AQI. Each pincode gets a unique value — used as the
# secondary tier when no ground station sits inside the polygon.
def load_satellite_aqi() -> dict[str, float]:
    p = PROCESSED / "aqi_satellite_per_pincode.json"
    if not p.exists():
        print("WARN: satellite AQI file missing — secondary tier disabled.")
        return {}
    out: dict[str, float] = {}
    for r in json.load(open(p)):
        v = r.get("aqi_satellite")
        if v is not None:
            out[str(r["pincode"])] = float(v)
    return out


SATELLITE_AQI = load_satellite_aqi()
print(f"Loaded satellite-calibrated AQI for {len(SATELLITE_AQI)} pincodes")


# Single-sensor sanity floor. With BLR's 4-station CPCB network, a pincode
# whose polygon contains exactly 1 station inherits that station's reading
# directly — no aggregation to dampen outliers. Kadabesanahalli reads AQI 38
# while every other BLR station reads 137-185, which makes Marathahalli look
# unrealistically clean (top 1% nationally) when neighbouring pincodes can't
# physically have different air. We clamp to a floor of 90 (still "Satisfactory"
# per CPCB) so a single anomalous sensor can't push a pincode above what
# Bangalore can plausibly support given its city-wide pollution levels.
SINGLE_SENSOR_FLOOR = 90.0


def aqi_in_polygon(pincode: str) -> tuple[float | None, float | None, int]:
    """AQI from CPCB stations whose lat/lng falls INSIDE the pincode polygon.
    Returns (aqi, distance_to_nearest, n_used).

    Strict containment — no radius proxy, no IDW noise. If 0 stations sit
    inside the polygon, the caller falls back to the BLR median. If exactly 1
    sits inside, the value is clamped to `SINGLE_SENSOR_FLOOR` to dampen
    single-sensor outliers. If 2+ sit inside (doesn't happen in BLR today
    given the sparse network), return the mean.
    """
    # Single-tier: satellite-calibrated AQI for ALL pincodes. We dropped the
    # ground-station-in-polygon tier because it created a lottery — only 16 of
    # 129 polygons happen to contain a station, and those 16 got a different
    # methodology (raw station readings) than the other 113 (satellite). Same
    # neighbourhood, different signal type, no per-pincode reason for the gap.
    # Ground stations still drive the calibration of the satellite layer (the
    # linear fit `aqi = a*no2 + b` was anchored to 22 BLR stations), so we're
    # using ground truth as anchors, not as primary values.
    sat = SATELLITE_AQI.get(pincode)
    if sat is not None:
        return (sat, None, 0)

    # No signal at all (polygon missing or satellite mosaic empty). Caller
    # falls back to BLR median.
    return (None, None, 0)


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

    # Air — strict point-in-polygon: only CPCB stations whose lat/lng falls
    # inside this pincode's polygon contribute. If none inside, the caller's
    # BLR-median fallback applies. No radius proxy, no IDW noise.
    smoothed_aqi, nearest_station_km, n_stations = aqi_in_polygon(pc)
    aqi = round(smoothed_aqi, 1) if smoothed_aqi is not None else None
    # `station_distance_km` becomes "distance to the nearest contributing
    # station" — used for confidence gating, not for value attribution.
    station_km = nearest_station_km
    # Tighter confidence: at least 2 contributing stations AND the nearest
    # within 8km. The IDW backstop lets us be stricter than the legacy
    # 15km-single-station gate without dropping pincodes wholesale.
    air_confident_override = (
        n_stations >= 2 and nearest_station_km is not None and nearest_station_km <= 8.0
    )

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
        "_air_confident_override": air_confident_override,
        "_n_air_stations": n_stations,
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


# ── rent gap-filler — none-rent pincodes inherit the BLR city-median ──────
# property.json has 1 BLR pincode (560066 EPIP) where the property row exists
# but `city_rent_median_2bhk` is null. The other 70 fallback pincodes already
# carry the city median (~₹16.5k). Substitute the same value for the orphan
# so the compare/affordability surface doesn't render a "—" gap. Confidence
# stays low (`rent_match` = "city_inferred") so brag claims remain gated.
_city_rents = [p["_rent"] for p in peers if p["_rent_match"] == "city" and p["_rent"]]
BLR_CITY_RENT_FALLBACK = (
    sorted(_city_rents)[len(_city_rents) // 2] if _city_rents else None
)
_rent_filled = 0
for p in peers:
    if p["_rent"] is None and BLR_CITY_RENT_FALLBACK is not None:
        p["_rent"] = BLR_CITY_RENT_FALLBACK
        p["_rent_match"] = "city_inferred"
        p["raw"]["rent_2bhk"] = BLR_CITY_RENT_FALLBACK
        p["raw"]["rent_match"] = "city_inferred"
        p["raw"]["rent_neighbors_used"] = 0
        _rent_filled += 1
print(f"Rent gap-filler applied to {_rent_filled} pincodes (city median ₹{BLR_CITY_RENT_FALLBACK})")


# ── rent IDW upgrade — borrow from nearby locality-confident pincodes ──────
# Mirrors the AQI IDW story: the 99acres 2019 scrape only matched 58 of 129
# BLR-urban pincodes via fuzzy locality-name lookup. The remaining 70 all
# carry the same BLR city-median value, which silently flattens the
# affordability dimension whenever two fallback pincodes are compared.
#
# For each fallback pincode (rent_match in {"city","city_inferred"}), find
# the K=3 nearest peers with rent_match == "locality" within 8km and
# IDW-blend their rents (weight = 1/d^2). If at least 2 such locality peers
# fall inside the radius, we trust the smoothed value enough to upgrade the
# pincode to "locality_inferred" — confident enough to count for honesty
# gates downstream, but explicitly distinct from a hard-matched "locality".
# If <2 locality peers within 8km, the city fallback stays put.
_LOCALITY_PEERS = [
    p for p in peers if p["_rent_match"] == "locality" and p["_rent"]
]


def _idw_rent(lat: float, lng: float, k: int = 3, max_km: float = 8.0,
              power: float = 2.0) -> tuple[float | None, int, float | None]:
    """IDW-smoothed 2BHK rent from nearby locality-confident pincodes.

    Returns (rent, n_used, nearest_km). n_used == 0 means no locality peer
    within max_km — caller should leave the city fallback in place.
    """
    near: list[tuple[float, dict]] = []
    for q in _LOCALITY_PEERS:
        d = haversine_km(lat, lng, q["lat"], q["lng"])
        if d <= max_km:
            near.append((d, q))
    if not near:
        return None, 0, None
    near.sort(key=lambda x: x[0])
    near = near[:k]
    nearest_d = near[0][0]
    num = 0.0
    den = 0.0
    for d, q in near:
        eff = max(d, 0.3)
        w = 1.0 / (eff ** power)
        num += q["_rent"] * w
        den += w
    return (num / den, len(near), nearest_d)


_rent_upgraded = 0
for p in peers:
    if p["_rent_match"] not in ("city", "city_inferred"):
        continue
    smoothed, n_used, nearest_d = _idw_rent(p["lat"], p["lng"])
    if smoothed is None or n_used < 2:
        # Leave city fallback in place — not enough nearby evidence.
        p["raw"]["rent_neighbors_used"] = n_used
        continue
    rounded = round(smoothed)
    p["_rent"] = rounded
    p["_rent_match"] = "locality_inferred"
    p["raw"]["rent_2bhk"] = rounded
    p["raw"]["rent_match"] = "locality_inferred"
    p["raw"]["rent_neighbors_used"] = n_used
    p["raw"]["rent_nearest_locality_km"] = round(nearest_d, 2)
    _rent_upgraded += 1
print(
    f"Rent IDW upgrade: {_rent_upgraded} pincodes promoted to 'locality_inferred' "
    f"from {len(_LOCALITY_PEERS)} locality-confident neighbours (K=3, ≤8km)"
)


# ── BLR-median fallback for pincodes with NO station inside polygon ────────
# Strict point-in-polygon means most BLR pincodes have 0 CPCB stations inside
# (only ~4 stations city-wide). For those, use BLR's empirical median AQI as
# a city-baseline default. 160 is the script's historical default and matches
# what the in-script median computation yields when no pincodes pass the old
# "confident" gate.
BLR_MEDIAN_AQI = 160.0
print(f"BLR median AQI fallback: {BLR_MEDIAN_AQI:.1f} (constant)")

_fallback_count = 0
for p in peers:
    if p["_aqi"] is not None:
        continue
    _fallback_count += 1
    p["_aqi"] = BLR_MEDIAN_AQI
    p["raw"]["aqi"] = p["_aqi"]
print(f"BLR-median fallback applied to {_fallback_count} of {len(peers)} pincodes (no station in polygon)")


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
    # Air — CPCB-band-aligned curve (see _AIR_CURVE) on the satellite-
    # calibrated AQI. Cap at 70 because all pincodes today are scored from
    # the satellite tier (not direct ground truth) — even pincodes with low
    # satellite-NO2 can't legitimately claim "clean air" without a real
    # ground station to verify, so the cap is the methodology's honesty gate.
    air, _legacy_conf = aqi_score(p["_aqi"], p["_station_km"])
    air = min(air, 70.0)
    air_conf = bool(p["_air_confident_override"])

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

    # Affordability — "reasonable-rent" bell curve in absolute rupees, not
    # inverted percentile. A pure inverted-rent percentile penalised premium
    # central pincodes (Indiranagar @ ₹25k → score 17) and rewarded far-out
    # cheap ones (Electronic City @ ₹13k → score 86), inverting how anyone
    # actually shops for rent. Real renters reject *both* luxury (₹40k+) and
    # suspiciously-cheap (₹10k —usually means too remote / poor amenities).
    # Curve peaks at ₹15-22k 2BHK — where most working Bangaloreans live.
    afford_s = rent_curve_score(p["_rent"])
    # "locality_inferred" = IDW-blended from ≥2 nearby locality-confident
    # pincodes within 8km; treated as confident (real-enough) for honesty
    # gates. Hard-matched "locality" rows still get the same status.
    afford_conf = p["_rent_match"] in ("locality", "locality_inferred")

    # Walkability — 5-min city (0-10) + commute<30% blend
    walk_five = (p["_five_min"] / 10.0) * 100.0
    walk_commute = p["_commute30"]  # already 0-100ish %
    walkability = walk_five * 0.6 + walk_commute * 0.4

    # Overall composite — "The Bangalore Pragmatist" weights. What working
    # Bangaloreans actually optimise for: commute > rent > essentials > air >
    # lifestyle > density. Equal weights washed out the lived experience —
    # connectivity and affordability are everyone's daily pain points and
    # deserve the heaviest slots. Walkability stays at 0% (hidden from UI).
    overall = (
        connectivity   * 0.25
      + afford_s       * 0.20
      + essentials     * 0.18
      + air            * 0.15
      + lifestyle      * 0.12
      + density_score  * 0.10
      + walkability    * 0.0
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
