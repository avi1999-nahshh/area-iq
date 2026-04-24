"""
Compute superlative claims per pincode.

For each pincode, find the dimension where it ranks BEST within its context
(metro > district > state), then build a human-readable label.
"""
import json
from pathlib import Path
from collections import defaultdict

OUT = Path(__file__).resolve().parents[2] / "data" / "processed"

DIMENSIONS = {
    "air_quality":     "Cleanest Air",
    "safety":          "Safest Pocket",
    "infrastructure":  "Amenity Hub",
    "transit":         "Connectivity Hub",
    "cleanliness":     "Tidiest Locality",
    "property":        "Hottest Hub",
}

DIM_SCORE_KEY = {
    "air_quality":    "air_quality_score",
    "safety":         "safety_score",
    "infrastructure": "infrastructure_score",
    "transit":        "transit_score",
    "cleanliness":    "cleanliness_score",
    "property":       "property_score",
}

print("Loading scores_final.json...")
scores = json.load(open(OUT / "scores_final.json"))

# ── Build per-dimension ranks within each context ─────────────────────────
# We rank each dimension independently (not overall) within metro/district/state.

def rank_dimension_in_context(scores, dim_key, context_key):
    """
    Returns a dict {pincode: rank_within_context} for the given dimension score
    grouped by context_key value.
    """
    groups = defaultdict(list)
    for s in scores:
        ctx = s.get(context_key)
        if ctx is None:
            continue
        groups[ctx].append((s["pincode"], s.get(dim_key, 0) or 0))

    result = {}
    for ctx, entries in groups.items():
        # Sort descending by score; rank 1 = highest score
        sorted_entries = sorted(entries, key=lambda x: -x[1])
        for rank, (pc, _) in enumerate(sorted_entries, 1):
            result[pc] = rank
    return result

# Pre-compute per-dimension ranks for metro, district, state
print("Computing per-dimension ranks...")
dim_metro_ranks    = {}  # dim -> {pincode: rank}
dim_district_ranks = {}
dim_state_ranks    = {}

for dim, score_key in DIM_SCORE_KEY.items():
    dim_metro_ranks[dim]    = rank_dimension_in_context(scores, score_key, "metro_city")
    dim_district_ranks[dim] = rank_dimension_in_context(scores, score_key, "district")
    dim_state_ranks[dim]    = rank_dimension_in_context(scores, score_key, "state")

# ── Build superlatives ────────────────────────────────────────────────────
print("Building superlative labels...")
superlatives = []

stats = {"metro": 0, "district": 0, "state": 0, "null": 0}

for s in scores:
    pc        = s["pincode"]
    metro     = s.get("metro_city")
    district  = s.get("district", "")
    state     = s.get("state", "")

    best_label = None
    best_scope = None
    best_priority = 999  # lower = better

    for dim, hub_label in DIMENSIONS.items():
        # Try metro first
        if metro:
            metro_rank = dim_metro_ranks[dim].get(pc)
            if metro_rank is not None and metro_rank <= 3:
                # Priority: lower rank is better; dimension order is secondary
                priority = (0, metro_rank, list(DIMENSIONS.keys()).index(dim))
                if priority < (best_priority,) + (0, 0) if best_label else True:
                    if best_label is None or priority[1] < best_priority:
                        best_label = f"{metro}'s #1 {hub_label}" if metro_rank == 1 else f"{metro}'s #{metro_rank} {hub_label}"
                        best_scope = "metro"
                        best_priority = priority[1] + priority[2] * 0.001

        # Try district
        dist_rank = dim_district_ranks[dim].get(pc)
        if dist_rank is not None and dist_rank <= 3:
            # Only use district if no metro label found yet, or district rank is better
            if best_scope != "metro":
                score_val = dist_rank + list(DIMENSIONS.keys()).index(dim) * 0.001
                if best_label is None or best_scope not in ("metro",) and score_val < best_priority:
                    best_label = f"{district}'s #1 {hub_label}" if dist_rank == 1 else f"{district}'s #{dist_rank} {hub_label}"
                    best_scope = "district"
                    best_priority = score_val

        # Try state
        st_rank = dim_state_ranks[dim].get(pc)
        if st_rank is not None and st_rank <= 10:
            if best_scope not in ("metro", "district"):
                score_val = st_rank + list(DIMENSIONS.keys()).index(dim) * 0.001
                if best_label is None or best_scope == "state" and score_val < best_priority:
                    best_label = f"{state}'s Top {hub_label}"
                    best_scope = "state"
                    best_priority = score_val

    # Choose the single BEST dimension for each pincode
    # Re-do cleanly: pick the best context + best rank across all dims
    best_label = None
    best_scope = None

    # Collect all candidates
    candidates = []  # (scope_priority, rank, dim_idx, label, scope)
    for dim, hub_label in DIMENSIONS.items():
        dim_idx = list(DIMENSIONS.keys()).index(dim)

        if metro:
            metro_rank = dim_metro_ranks[dim].get(pc)
            if metro_rank is not None and metro_rank <= 3:
                label = f"{metro}'s #1 {hub_label}" if metro_rank == 1 else f"{metro}'s #{metro_rank} {hub_label}"
                candidates.append((0, metro_rank, dim_idx, label, "metro"))

        dist_rank = dim_district_ranks[dim].get(pc)
        if dist_rank is not None and dist_rank <= 3:
            label = f"{district}'s #1 {hub_label}" if dist_rank == 1 else f"{district}'s #{dist_rank} {hub_label}"
            candidates.append((1, dist_rank, dim_idx, label, "district"))

        st_rank = dim_state_ranks[dim].get(pc)
        if st_rank is not None and st_rank <= 10:
            label = f"{state}'s Top {hub_label}"
            candidates.append((2, st_rank, dim_idx, label, "state"))

    if candidates:
        # Sort: metro > district > state, then by rank (ascending), then by dim_idx
        candidates.sort(key=lambda x: (x[0], x[1], x[2]))
        _, _, _, best_label, best_scope = candidates[0]

    stats[best_scope if best_scope else "null"] += 1
    superlatives.append({
        "pincode":           pc,
        "superlative_label": best_label,
        "superlative_scope": best_scope,
    })

# ── Save superlatives.json ────────────────────────────────────────────────
with open(OUT / "superlatives.json", "w") as f:
    json.dump(superlatives, f)
print(f"Saved {len(superlatives)} records → data/processed/superlatives.json")

# ── Merge into scores_final.json ──────────────────────────────────────────
sup_map = {r["pincode"]: r for r in superlatives}
for s in scores:
    sup = sup_map.get(s["pincode"], {})
    s["superlative_label"] = sup.get("superlative_label")
    s["superlative_scope"] = sup.get("superlative_scope")

with open(OUT / "scores_final.json", "w") as f:
    json.dump(scores, f)
print(f"Merged superlatives into scores_final.json")

# ── Stats ──────────────────────────────────────────────────────────────────
print(f"\nSuperlative coverage:")
print(f"  metro  label: {stats['metro']}")
print(f"  district label: {stats['district']}")
print(f"  state  label: {stats['state']}")
print(f"  null   (no superlative): {stats['null']}")
