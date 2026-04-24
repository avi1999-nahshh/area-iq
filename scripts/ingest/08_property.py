"""
Property / economic-activity signal per pincode.

Two components written into property.json:

1. **economic_activity_score** (0-100) — primary, covers ALL pincodes.
   Derived from OSM density of financial infrastructure (banks + ATMs + malls +
   markets) per sq km, percentile-ranked across India.

2. **city_rent_median_2bhk** — secondary, display-only, covers subset.
   From the 99acres 2019 locality scrape, aggregated to city medians. Honestly
   labeled as city-level ("typical rent in your city").

Schema notes (for Convex compatibility):
 - `hpi_value` field carries the 0-100 economic activity score.
 - `hpi_quarter` is set to "99acres-2019" on records that have a city rent,
   otherwise null. Distinguishes "have city rent" from "score only".
 - `nighttime_light` is null — VIIRS not ingested in this build.
 - NHB RESIDEX was unavailable (portal has no bulk download).
"""
import json, csv, re, sys, statistics
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from utils.district_match import normalize

RAW = Path("../../data/raw")
OUT = Path("../../data/processed")

pincodes = json.load(open(OUT / "pincodes.json"))
infra    = {r["pincode"]: r for r in json.load(open(OUT / "infrastructure.json"))}

# ── Raw economic-activity density per pincode ────────────────────────────
def density_score_raw(p):
    pc = p["pincode"]
    area = max(p.get("area_sq_km") or 1.0, 0.5)  # avoid div-0 / tiny-area inflation
    i = infra.get(pc, {})
    weighted = (
        (i.get("bank_count", 0) or 0) * 1.0 +
        (i.get("atm_count", 0) or 0) * 0.5 +
        (i.get("mall_count", 0) or 0) * 3.0 +
        (i.get("market_count", 0) or 0) * 0.5
    )
    return weighted / area

raw_scores = [density_score_raw(p) for p in pincodes]
from scipy.stats import percentileofscore
sorted_raw = sorted(raw_scores)
def to_percentile(v):
    return round(percentileofscore(sorted_raw, v, kind="weak"), 2)

# ── City-level 2BHK rent from 99acres ────────────────────────────────────
_RE_RANGE = re.compile(r"([\d,]+)\s*-\s*([\d,]+)")
def parse_rent(s):
    if not s or s.strip() in ("-", ""): return None
    m = _RE_RANGE.search(s)
    if not m: return None
    lo = int(m.group(1).replace(",", ""))
    hi = int(m.group(2).replace(",", ""))
    return (lo + hi) / 2

city_rents: dict[str, list[float]] = {}
locality_rents: dict[tuple[str, str], float] = {}  # (normalized_city, normalized_locality) → midpoint
ninety_path = RAW / "99acres_price.csv"
if ninety_path.exists():
    with open(ninety_path) as f:
        for row in csv.DictReader(f):
            rent = parse_rent(row.get("two_bhk_rent_range", ""))
            if rent is None: continue
            c = normalize(row["city_name"])
            loc = normalize(row["locality_name"])
            city_rents.setdefault(c, []).append(rent)
            if loc:
                # If multiple 99acres rows per locality, keep max (main block usually)
                key = (c, loc)
                locality_rents[key] = max(locality_rents.get(key, 0), rent)

city_median = {c: round(statistics.median(vs)) for c, vs in city_rents.items() if vs}

CITY_ALIASES = {
    "delhi": "ncr",
    "nct of delhi": "ncr",
    "gurugram": "gurgaon",
}

# Build locality index per city for fuzzy lookup
from rapidfuzz import process, fuzz
locs_by_city: dict[str, list[str]] = {}
for (c, loc) in locality_rents.keys():
    locs_by_city.setdefault(c, []).append(loc)

def _city_key(p):
    for candidate in [p.get("metro_city"), p.get("district"), p.get("state")]:
        if not candidate: continue
        key = CITY_ALIASES.get(normalize(candidate), normalize(candidate))
        if key in city_median:
            return key
    return None

def lookup_rent(p):
    """Returns (city_key, locality_match_name, rent, level) where level ∈ {'locality','city',None}."""
    city = _city_key(p)
    if city is None:
        return None, None, None, None

    # Try locality match using pincode.name (e.g., "Koramangala I Block")
    pname = normalize(p.get("name") or "")
    candidates = locs_by_city.get(city, [])
    if pname and candidates:
        m = process.extractOne(pname, candidates, scorer=fuzz.token_set_ratio, score_cutoff=75)
        if m:
            matched, score, _ = m
            return city, matched, locality_rents[(city, matched)], "locality"

    # Fallback to city median
    return city, None, city_median[city], "city"

# ── Build output ─────────────────────────────────────────────────────────
output = []
level_counts = {"locality": 0, "city": 0, "none": 0}
for p, raw in zip(pincodes, raw_scores):
    score = to_percentile(raw)
    city_key, loc_name, rent, level = lookup_rent(p)
    level_counts[level or "none"] += 1
    output.append({
        "pincode": p["pincode"],
        "city": city_key,
        "hpi_value": score,                       # 0-100 econ score
        "city_rent_median_2bhk": rent,            # ₹/month — locality-specific if matched, else city median
        "rent_match_level": level,                # "locality" | "city" | None
        "rent_matched_locality": loc_name,        # 99acres locality name when level="locality"
        "hpi_quarter": "99acres-2019" if rent is not None else None,
        "nighttime_light": None,
    })

with open(OUT / "property.json", "w") as f:
    json.dump(output, f)

print(f"Saved {len(output)} records → data/processed/property.json")
print(f"  economic_activity_score: 0-100 for all {len(output)} pincodes")
print(f"  rent match: locality={level_counts['locality']}, city={level_counts['city']}, none={level_counts['none']}")
print(f"  cities covered ({len(city_median)}): {sorted(city_median.keys())}")
