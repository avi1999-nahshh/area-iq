"""
Seeds the Convex dev deployment from processed JSONs using `npx convex import`.

No deploy key required: `convex import` authenticates via the local CLI state
set up by `npx convex dev` (which reads .env.local's CONVEX_DEPLOYMENT).

Behaviour:
- Each table is loaded with --replace (destructive: wipes existing rows first).
- JSONs are converted to JSONL on the fly into a temp file per table.
- Missing source files print a SKIP line instead of crashing.
"""
import json
import subprocess
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PROCESSED = PROJECT_ROOT / "data" / "processed"

TABLES = [
    ("pincodes.json",       "pincodes"),
    ("census.json",         "census"),
    ("air_quality.json",    "air_quality"),
    ("safety.json",         "safety"),
    ("infrastructure.json", "infrastructure"),
    ("transit.json",        "transit"),
    ("cleanliness.json",    "cleanliness"),
    ("property.json",       "property"),
    ("contacts.json",       "contacts"),
    ("archetypes.json",     "archetypes"),
    ("scores_final.json",   "scores"),
    ("trivia.json",         "trivia"),
]

def load_records(path: Path):
    data = json.load(open(path))
    if isinstance(data, dict):
        for v in data.values():
            if isinstance(v, list):
                return v
        raise ValueError(f"{path}: no list found in top-level dict")
    return data

def seed_table(src: Path, table: str):
    records = load_records(src)
    if not records:
        print(f"  {table}: empty source, skipping")
        return
    # Drop null values for optional fields; Convex's v.optional means "absent", not null.
    # Also scrub NaN (not valid JSON) which can sneak in from pandas/geopandas.
    import math
    def _scrub(r):
        out = {}
        for k, v in r.items():
            if v is None: continue
            if isinstance(v, float) and math.isnan(v): continue
            out[k] = v
        return out
    with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as tmp:
        for r in records:
            tmp.write(json.dumps(_scrub(r), ensure_ascii=False) + "\n")
        tmp_path = tmp.name

    cmd = ["npx", "convex", "import", "--replace", "--yes", "--table", table, tmp_path]
    print(f"  {table}: importing {len(records)} records...")
    try:
        result = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            print(f"    FAIL: {result.stderr.strip()[:400]}")
        else:
            print(f"    ✓ done")
    finally:
        Path(tmp_path).unlink(missing_ok=True)

if __name__ == "__main__":
    for filename, table in TABLES:
        src = PROCESSED / filename
        if not src.exists():
            print(f"  {table}: SKIP (missing {src.name})")
            continue
        seed_table(src, table)
    print("\nSeeding complete.")
