"""
Processes Census 2011 PCA (demographics) and B-28 (commute distance).
Maps district-level data to all pincodes using fuzzy district-name matching.
Falls back to state averages, then national defaults.
"""
import json, sys, pandas as pd
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from utils.district_match import DistrictLookup, normalize

RAW = Path("../../data/raw")
OUT = Path("../../data/processed")
pincodes = json.load(open(OUT / "pincodes.json"))

# ── PCA demographics ─────────────────────────────────────
pca = pd.read_csv(RAW / "census_pca_2011.csv", dtype=str)
pca.columns = [c.lower().strip().replace(" ", "_") for c in pca.columns]

# Keep district-level rows (level == "DISTRICT")
dist = pca[pca["level"].str.upper() == "DISTRICT"].copy()
dist["total_population"] = pd.to_numeric(dist["tot_p"], errors="coerce")
dist["male_pop"] = pd.to_numeric(dist["tot_m"], errors="coerce")
dist["female_pop"] = pd.to_numeric(dist["tot_f"], errors="coerce")
dist["literacy_total"] = pd.to_numeric(dist["p_lit"], errors="coerce")
dist["literacy_male"] = pd.to_numeric(dist["m_lit"], errors="coerce")
dist["literacy_female"] = pd.to_numeric(dist["f_lit"], errors="coerce")
_hh_col = next((c for c in ["tot_hh", "no_hh", "hh", "households"] if c in dist.columns), None)
if _hh_col is None:
    raise KeyError(f"No household column in PCA. Found: {sorted(dist.columns)[:30]}...")
dist["households"] = pd.to_numeric(dist[_hh_col], errors="coerce")
dist["main_workers"] = pd.to_numeric(dist.get("mainwork_p", pd.Series(0)), errors="coerce").fillna(0)
dist["marginal_workers"] = pd.to_numeric(dist.get("margwork_p", pd.Series(0)), errors="coerce").fillna(0)

dist["gender_ratio"] = (dist["female_pop"] / dist["male_pop"] * 1000).round(1)
dist["literacy_rate"] = (dist["literacy_total"] / dist["total_population"] * 100).round(2)
dist["literacy_rate_female"] = (dist["literacy_female"] / dist["female_pop"] * 100).round(2)
dist["avg_household_size"] = (dist["total_population"] / dist["households"]).round(2)
dist["worker_participation"] = ((dist["main_workers"] + dist["marginal_workers"]) / dist["total_population"] * 100).round(2)

# Normalize district name for join — PCA column varies by source
_name_col = next((c for c in ["name", "district", "district_name", "district_t"] if c in dist.columns), None)
if _name_col is None:
    raise KeyError(f"No district name column in PCA. Found: {sorted(dist.columns)}")
dist["district_key"] = dist[_name_col].str.upper().str.strip()
# Duplicate district names exist across states (e.g. "Aurangabad" in MH and BR) — keep first
dist = dist.drop_duplicates("district_key", keep="first")

# ── B-28 commute distance (district-level, from NADA catalogs 13955-13989) ─
# Field names preserve the script's time-based vocabulary, but are derived from
# Census 2011 B-28 distance-to-work buckets:
#   under_30min ≈ workers commuting <5km  (walkable/very short)
#   30_60min    ≈ 6-20km                   (short)
#   1_2hr       ≈ 21-50km                  (long)
#   2plus_hr    ≈ 51+km                    (very long)
try:
    b28 = pd.read_csv(RAW / "census_b28_commute.csv", dtype=str)
    b28.columns = [c.lower().strip().replace(" ", "_") for c in b28.columns]
    b28["district_key"] = b28["district"].str.upper().str.strip()
    b28 = b28.drop_duplicates("district_key", keep="first")
    b28["pct_under_30"] = pd.to_numeric(b28["under_30min"], errors="coerce").fillna(0)
    b28["pct_30_60"]    = pd.to_numeric(b28["30_60min"],    errors="coerce").fillna(0)
    b28["pct_1_2hr"]    = pd.to_numeric(b28["1_2hr"],       errors="coerce").fillna(0)
    b28["pct_2plus"]    = pd.to_numeric(b28["2plus_hr"],    errors="coerce").fillna(0)
    has_commute = True
except FileNotFoundError:
    print("⚠ B-28 commute file not found — using national average fallback")
    has_commute = False

# ── build lookups: district-level + state-level averages ──────────────
dist_map = dist.set_index("district_key").to_dict("index")
dist_lookup = DistrictLookup(dist_map)
commute_map = b28.set_index("district_key").to_dict("index") if has_commute else {}
commute_lookup = DistrictLookup(commute_map) if has_commute else None

# state-level averages from PCA (state code → dict of averages)
_state_col = next((c for c in ["state", "state_code", "state_name"] if c in pca.columns), None)
state_pca = {}
if _state_col:
    for sc, grp in dist.groupby(_state_col):
        state_pca[str(sc).strip()] = {
            "total_population": grp["total_population"].mean(),
            "male_pop": grp["male_pop"].mean(),
            "female_pop": grp["female_pop"].mean(),
            "gender_ratio": grp["gender_ratio"].mean(),
            "literacy_rate": grp["literacy_rate"].mean(),
            "literacy_rate_female": grp["literacy_rate_female"].mean(),
            "households": grp["households"].mean(),
            "avg_household_size": grp["avg_household_size"].mean(),
            "worker_participation": grp["worker_participation"].mean(),
        }

# state-level commute averages from B-28 (state_code → averages)
state_commute = {}
if has_commute and "state_code" in b28.columns:
    for sc, grp in b28.groupby("state_code"):
        state_commute[str(sc).strip()] = {
            "pct_under_30": pd.to_numeric(grp["pct_under_30"], errors="coerce").mean(),
            "pct_30_60":    pd.to_numeric(grp["pct_30_60"],    errors="coerce").mean(),
            "pct_1_2hr":    pd.to_numeric(grp["pct_1_2hr"],    errors="coerce").mean(),
            "pct_2plus":    pd.to_numeric(grp["pct_2plus"],    errors="coerce").mean(),
        }

# We need a state-name → state-code mapping to use state_pca/state_commute from pincodes.
# PCA state codes are the 2-digit codes; pincode file has state name. Build via joining:
# each state's most common pincode-state name per PCA state code.
STATE_NAMES = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Nct Of Delhi", "08": "Rajasthan",
    "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
    "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
    "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
    "28": "Andhra Pradesh", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
    "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar",
}
STATE_NAME_TO_CODE = {normalize(v): k for k, v in STATE_NAMES.items()}

NATIONAL_PCA = {
    "total_population": 50000, "male_pop": 25000, "female_pop": 25000, "gender_ratio": 940,
    "literacy_rate": 74.0, "literacy_rate_female": 65.0, "households": 12000,
    "avg_household_size": 4.2, "worker_participation": 40.0,
}
NATIONAL_COMMUTE = {"pct_under_30": 52.3, "pct_30_60": 26.1, "pct_1_2hr": 14.8, "pct_2plus": 6.8}

def _g(d, k, default):
    v = d.get(k)
    try:
        if v is None or (isinstance(v, float) and (v != v)): return default
        return float(v)
    except Exception:
        return default

# also build name-keyed state lookups with fuzzy matching for robustness
# (STATE_NAMES already canonical; this resolves "Nct Of Delhi" → code "07")
state_name_lookup = DistrictLookup({v: k for k, v in STATE_NAMES.items()})

def _state_code_from(name: str):
    if not name: return None
    code = STATE_NAME_TO_CODE.get(normalize(name))
    if code: return code
    rec, _, _ = state_name_lookup.find(name, threshold=70)
    return rec  # returns the state code value from the reversed dict

matched_by_district = 0
matched_by_state = 0
fallback_national = 0

output = []
for p in pincodes:
    state_code = _state_code_from(p["state"])
    # PCA: district → state → national
    d, _, _ = dist_lookup.find(p["district"], state_hint=p["state"])
    if d is None:
        d = state_pca.get(state_code) if state_code else None
        if d:
            matched_by_state += 1
        else:
            d = NATIONAL_PCA
            fallback_national += 1
    else:
        matched_by_district += 1

    # Commute: district → state → national
    if commute_lookup:
        c, _, _ = commute_lookup.find(p["district"], state_hint=p["state"])
        if c is None:
            c = state_commute.get(state_code) if state_code else None
            if c is None:
                c = NATIONAL_COMMUTE
    else:
        c = NATIONAL_COMMUTE

    output.append({
        "pincode": p["pincode"],
        "district": p["district"],
        "state": p["state"],
        "population": int(_g(d, "total_population", NATIONAL_PCA["total_population"])),
        "population_male": int(_g(d, "male_pop", NATIONAL_PCA["male_pop"])),
        "population_female": int(_g(d, "female_pop", NATIONAL_PCA["female_pop"])),
        "gender_ratio": round(_g(d, "gender_ratio", NATIONAL_PCA["gender_ratio"]), 1),
        "literacy_rate": round(_g(d, "literacy_rate", NATIONAL_PCA["literacy_rate"]), 2),
        "literacy_rate_female": round(_g(d, "literacy_rate_female", NATIONAL_PCA["literacy_rate_female"]), 2),
        "household_count": int(_g(d, "households", NATIONAL_PCA["households"])),
        "avg_household_size": round(_g(d, "avg_household_size", NATIONAL_PCA["avg_household_size"]), 2),
        "worker_participation_rate": round(_g(d, "worker_participation", NATIONAL_PCA["worker_participation"]), 2),
        "commute_under_30_pct": round(_g(c, "pct_under_30", NATIONAL_COMMUTE["pct_under_30"]), 2),
        "commute_30_60_pct":    round(_g(c, "pct_30_60",    NATIONAL_COMMUTE["pct_30_60"]),    2),
        "commute_1_2hr_pct":    round(_g(c, "pct_1_2hr",    NATIONAL_COMMUTE["pct_1_2hr"]),    2),
        "commute_2plus_pct":    round(_g(c, "pct_2plus",    NATIONAL_COMMUTE["pct_2plus"]),    2),
    })

with open(OUT / "census.json", "w") as f:
    json.dump(output, f)
print(f"Saved {len(output)} records → data/processed/census.json")
print(f"  match: district={matched_by_district}, state_avg={matched_by_state}, national_fallback={fallback_national}")
