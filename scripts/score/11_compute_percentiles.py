"""
Computes national / state / district / metro percentile ranks for each pincode.
"""
import json, numpy as np
from pathlib import Path
from scipy.stats import percentileofscore

OUT = Path("../../data/processed")
scores = json.load(open(OUT / "scores_raw.json"))

def add_percentiles(group_key, key_field, suffix):
    groups = {}
    for s in scores:
        k = s.get(key_field)
        if k:
            groups.setdefault(k, []).append(s)
    for k, members in groups.items():
        vals = [m["overall_score"] for m in members]
        for m in members:
            pct = round(percentileofscore(vals, m["overall_score"], kind="rank"), 1)
            rank = sorted(vals, reverse=True).index(m["overall_score"]) + 1
            m[f"overall_{suffix}_pct"] = pct
            m[f"{suffix}_rank"] = rank
            m[f"{suffix}_total"] = len(members)

# National
all_scores = [s["overall_score"] for s in scores]
for s in scores:
    s["overall_national_pct"] = round(percentileofscore(all_scores, s["overall_score"], kind="rank"), 1)
    s["national_rank"] = sorted(all_scores, reverse=True).index(s["overall_score"]) + 1
    s["national_total"] = len(scores)

    # Per-dimension national percentiles
    for dim in ["air_quality", "safety", "infrastructure", "transit", "cleanliness"]:
        dim_vals = [x[f"{dim}_score"] for x in scores]
        s[f"{dim}_national_pct"] = round(percentileofscore(dim_vals, s[f"{dim}_score"], kind="rank"), 1)

add_percentiles("state", "state", "state")
add_percentiles("district", "district", "district")

# Metro (only for pincodes with metro_city set)
metro_scores = {}
for s in scores:
    if s.get("metro_city"):
        metro_scores.setdefault(s["metro_city"], []).append(s)
for city, members in metro_scores.items():
    vals = [m["overall_score"] for m in members]
    for m in members:
        m["overall_metro_pct"] = round(percentileofscore(vals, m["overall_score"], kind="rank"), 1)
        m["metro_rank"] = sorted(vals, reverse=True).index(m["overall_score"]) + 1
        m["metro_total"] = len(members)

# Hidden gem index: high overall but low property score (undervalued)
for s in scores:
    if s.get("property_score") and s["property_score"] > 0:
        s["hidden_gem_index"] = round(s["overall_score"] / max(s["property_score"], 1) * 50, 2)
    else:
        s["hidden_gem_index"] = None

with open(OUT / "scores_with_percentiles.json", "w") as f:
    json.dump(scores, f)
print(f"Saved {len(scores)} scores with percentiles")
