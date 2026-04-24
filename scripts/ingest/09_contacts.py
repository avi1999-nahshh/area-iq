"""
Maps constituency winners (MP/MLA) to pincodes via Political-Map dataset.
"""
import json, pandas as pd
from pathlib import Path

RAW = Path("../../data/raw")
OUT = Path("../../data/processed")
pincodes = json.load(open(OUT / "pincodes.json"))

pol = pd.read_csv(RAW / "political_map.csv", dtype=str)
pol.columns = [c.lower().strip().replace(" ", "_") for c in pol.columns]

# Fix B: fallback column lookup for "pincode" after normalization
_pincode_col = next(
    (c for c in pol.columns if c in ("pincode", "pin_code", "postal_code", "zipcode")),
    pol.columns[0],
)
pol[_pincode_col] = pol[_pincode_col].astype(str).str.zfill(6)
pol_map = pol.set_index(_pincode_col).to_dict("index")

try:
    ls = pd.read_csv(RAW / "myneta_ls2024.csv", dtype=str)
    ls.columns = [c.lower().strip().replace(" ", "_") for c in ls.columns]
    # Fix B: fallback column lookup for "constituency"
    _ls_const_col = next(
        (c for c in ls.columns if "constituency" in c),
        None,
    )
    ls["const_key"] = (
        ls[_ls_const_col].str.upper().str.strip()
        if _ls_const_col
        else pd.Series(dtype=str)
    )
    ls["const_key"] = ls.get("const_key", pd.Series(dtype=str))
    # Fix B: fallback column lookup for "winner"/"position"
    _ls_winner_col = next(
        (c for c in ls.columns if c in ("winner", "position")),
        None,
    )
    if _ls_winner_col:
        ls_map = ls[ls[_ls_winner_col] == "1"].set_index("const_key").to_dict("index")
    else:
        ls_map = {}
except FileNotFoundError:
    ls_map = {}

try:
    vs = pd.read_csv(RAW / "myneta_vs_state.csv", dtype=str)
    vs.columns = [c.lower().strip().replace(" ", "_") for c in vs.columns]
    # Fix B: fallback column lookup for "constituency"
    _vs_const_col = next(
        (c for c in vs.columns if "constituency" in c),
        None,
    )
    vs["const_key"] = (
        vs[_vs_const_col].str.upper().str.strip()
        if _vs_const_col
        else pd.Series(dtype=str)
    )
    vs["const_key"] = vs.get("const_key", pd.Series(dtype=str))
    # Fix B: fallback column lookup for "winner"/"position"
    _vs_winner_col = next(
        (c for c in vs.columns if c in ("winner", "position")),
        None,
    )
    if _vs_winner_col:
        vs_map = vs[vs[_vs_winner_col] == "1"].set_index("const_key").to_dict("index")
    else:
        vs_map = {}
except FileNotFoundError:
    vs_map = {}

# Fix B: fallback column lookups for constituency columns in pol_map values
_ls_const_key = next(
    (k for k in ("lok_sabha_constituency", "ls_constituency", "parliament_constituency")
     if any(k in row for row in list(pol_map.values())[:1])),
    "lok_sabha_constituency",
)
_vs_const_key = next(
    (k for k in ("assembly_constituency", "vidhan_sabha_constituency", "state_constituency")
     if any(k in row for row in list(pol_map.values())[:1])),
    "assembly_constituency",
)

# Fix B: fallback column lookups for candidate/party in winner dicts
def _get_candidate(d):
    return next((d[k] for k in ("candidate", "candidate_name", "name") if k in d), None)

def _get_party(d):
    return next((d[k] for k in ("party", "party_name", "party_abbreviation") if k in d), None)

output = []
for p in pincodes:
    pm = pol_map.get(p["pincode"], {})
    ls_const = str(pm.get(_ls_const_key, "")).upper().strip()
    vs_const = str(pm.get(_vs_const_key, "")).upper().strip()
    ls_winner = ls_map.get(ls_const, {})
    vs_winner = vs_map.get(vs_const, {})

    output.append({
        "pincode": p["pincode"],
        "ls_constituency": pm.get(_ls_const_key, ""),
        "ls_mp_name": _get_candidate(ls_winner),
        "ls_mp_party": _get_party(ls_winner),
        "vs_constituency": pm.get(_vs_const_key, ""),
        "vs_mla_name": _get_candidate(vs_winner),
        "vs_mla_party": _get_party(vs_winner),
        "ward_councillor": None,
    })

with open(OUT / "contacts.json", "w") as f:
    json.dump(output, f)
print(f"Saved {len(output)} records → data/processed/contacts.json")
