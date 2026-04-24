"""
Maps Swachh Survekshan ULB rankings to pincodes using fuzzy city-name matching.
Falls back to state-average SS score, then national average.
"""
import json, sys
from pathlib import Path
import pandas as pd
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from utils.district_match import DistrictLookup, normalize

RAW = Path("../../data/raw")
OUT = Path("../../data/processed")
pincodes = json.load(open(OUT / "pincodes.json"))

# ── Swachh Survekshan ─────────────────────────────────────
ss_path = RAW / "swachh_survekshan.csv"
if not ss_path.exists():
    print("⚠ swachh_survekshan.csv not found — every pincode defaults")
    ss_records = {}
else:
    ss = pd.read_csv(ss_path, dtype=str)
    ss.columns = [c.lower().strip().replace(" ", "_") for c in ss.columns]
    _city_col = next((c for c in ["city", "ulb_name", "city_name"] if c in ss.columns), None)
    _state_col = next((c for c in ["state", "state_name"] if c in ss.columns), None)
    _rank_col = next((c for c in ["rank", "city_rank", "national_rank", "ss_rank"] if c in ss.columns), None)
    _score_col = next((c for c in ["total_score", "score", "total_marks", "marks"] if c in ss.columns), None)

    ss_records = {}
    for _, r in ss.iterrows():
        city = str(r.get(_city_col, "")).strip() if _city_col else ""
        if not city: continue
        ss_records[city] = {
            "ulb_name": city,
            "state_name": str(r.get(_state_col, "")).strip() if _state_col else "",
            "ss_rank": pd.to_numeric(r.get(_rank_col), errors="coerce") if _rank_col else None,
            "ss_score": pd.to_numeric(r.get(_score_col), errors="coerce") if _score_col else None,
        }

ss_lookup = DistrictLookup(ss_records) if ss_records else None

# state-average SS score (state name → mean score)
state_ss = {}
if ss_records:
    all_scores = [v["ss_score"] for v in ss_records.values() if v["ss_score"] is not None and v["ss_score"] == v["ss_score"]]
    national_score = sum(all_scores) / len(all_scores) if all_scores else 5000.0
    by_state = {}
    for v in ss_records.values():
        s = normalize(v["state_name"])
        if not s: continue
        by_state.setdefault(s, []).append(v["ss_score"])
    for s, lst in by_state.items():
        lst = [x for x in lst if x is not None and x == x]
        if lst:
            state_ss[s] = sum(lst) / len(lst)
else:
    national_score = 5000.0

state_ss_lookup = DistrictLookup({k: {"ss_score": v} for k, v in state_ss.items()}) if state_ss else None

stats = {"city": 0, "state": 0, "national": 0}
output = []
for p in pincodes:
    rec, matched_name, score = (None, None, 0)
    if ss_lookup:
        rec, matched_name, score = ss_lookup.find(p["district"], state_hint=p["state"])

    if rec is not None:
        level = "city"
        ss_rank = rec.get("ss_rank")
        ss_score = rec.get("ss_score")
    else:
        ss_rank = None
        avg_rec = None
        if state_ss_lookup is not None:
            avg_rec, _, _ = state_ss_lookup.find(p["state"], threshold=70)
        if avg_rec is not None:
            level = "state"
            ss_score = avg_rec["ss_score"]
        else:
            level = "national"
            ss_score = national_score
    stats[level] += 1

    output.append({
        "pincode": p["pincode"],
        "ulb_name": matched_name or p["district"],
        "ss_rank": int(ss_rank) if ss_rank is not None and ss_rank == ss_rank else None,
        "ss_score": float(ss_score) if ss_score is not None and ss_score == ss_score else None,
        "ss_source": level,          # "city" | "state" | "national"
        "ss_year": "2024-25",
    })

with open(OUT / "cleanliness.json", "w") as f:
    json.dump(output, f)
print(f"Saved {len(output)} records → data/processed/cleanliness.json")
print(f"  fallback: city={stats['city']}, state={stats['state']}, national={stats['national']}")
