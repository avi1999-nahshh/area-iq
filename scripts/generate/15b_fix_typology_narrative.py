"""
Repair for the district/narrative mismatch in trivia.json.

Root cause: 15_typology_narrative.py matched response rows to districts by line
index in the batch output file, but Vertex AI batch jobs do not preserve input
order. ~1078/1079 narratives were filed against the wrong district as a result.

This script recovers the correct mapping by parsing the prompt text echoed back
inside each output row — the prompt begins with "Given {district}, {state} —",
so the true district is recoverable from the response itself.

Run:
    python3 scripts/generate/15b_fix_typology_narrative.py
"""
import json
import re
import sys
from pathlib import Path

# normalize() is inlined here (rather than imported from scripts/utils/district_match.py)
# so this repair runs on any Python without the rapidfuzz dep that module requires.
# Keep these patterns + aliases IN SYNC with scripts/utils/district_match.py.
_STRIP_WORDS = re.compile(
    r"\b(district|dist\.?|urban|rural|city|municipal|corporation|ulb|"
    r"north|south|east|west|central|new|old|greater)\b",
    re.IGNORECASE,
)
_STRIP_PAREN = re.compile(r"\([^)]*\)")
_NONALPHA = re.compile(r"[^a-z0-9\s]")
_SPACES = re.compile(r"\s+")
_ALIASES = {
    "bangalore": "bengaluru",
    "bangalore urban": "bengaluru urban",
    "bangalore rural": "bengaluru rural",
    "allahabad": "prayagraj",
    "mysore": "mysuru",
    "gurgaon": "gurugram",
    "poona": "pune",
    "baroda": "vadodara",
    "calicut": "kozhikode",
    "trivandrum": "thiruvananthapuram",
    "cochin": "ernakulam",
    "kochi": "ernakulam",
    "tuticorin": "thoothukudi",
    "nct of delhi": "delhi",
    "delhi ut": "delhi",
    "delhi nct": "delhi",
    "j k": "jammu kashmir",
    "jammu  kashmir": "jammu kashmir",
    "chhatisgarh": "chhattisgarh",
    "orissa": "odisha",
    "pondicherry": "puducherry",
    "uttaranchal": "uttarakhand",
    "dn haveli": "dadra nagar haveli",
    "dadra  nagar haveli": "dadra nagar haveli",
    "a n islands": "andaman nicobar",
    "andaman  nicobar islands": "andaman nicobar",
    "andaman  nicobar": "andaman nicobar",
}


def normalize(name: str) -> str:
    if not name:
        return ""
    s = str(name).lower().strip()
    s = _STRIP_PAREN.sub(" ", s)
    s = _NONALPHA.sub(" ", s)
    s_stripped = _STRIP_WORDS.sub(" ", s)
    s_stripped = _SPACES.sub(" ", s_stripped).strip()
    final = s_stripped if s_stripped else _SPACES.sub(" ", s).strip()
    return _ALIASES.get(final, final)


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "processed"
TRIVIA_FILE = OUT / "trivia.json"
BATCH_OUT = OUT / "typology_batch_output.jsonl"

# "Given Dindori, Madhya Pradesh —" — district is everything up to the first
# comma before the state; state runs until the em dash. Some districts are
# comma-concatenated ("Barddhaman, Murshidabad") so we greedily grab up to the
# last comma before the em dash.
PROMPT_RE = re.compile(r"Given (.+?), ([^,]+?) [—–-]")


def extract_district_state(prompt_text: str) -> tuple[str, str] | None:
    m = PROMPT_RE.search(prompt_text)
    if not m:
        return None
    return m.group(1).strip(), m.group(2).strip()


def extract_narrative(row: dict) -> str | None:
    resp = row.get("response") or {}
    cands = resp.get("candidates") or []
    if not cands:
        return None
    parts = (cands[0].get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        return None
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        return None
    narr = (obj.get("narrative") or "").strip()
    return narr or None


def main() -> int:
    if not BATCH_OUT.exists():
        print(f"Missing {BATCH_OUT}", file=sys.stderr)
        return 1

    # Build (norm_district, norm_state) -> narrative from the batch output.
    # Primary join: regex-extract (d, s) from the echoed prompt.
    # Fallback: keep the raw prompt text so composite-comma rows — where the
    # "Given d, s —" regex splits at the wrong comma (e.g. "Dadra & Nagar
    # Haveli, Valsad, Dadra & Nagar Haveli, Gujarat") — can still be rejoined
    # by direct substring search against trivia's (d, s) pairs.
    narrative_map: dict[tuple[str, str], str] = {}
    raw_responses: list[tuple[str, str]] = []  # (prompt_text, narrative)
    parsed = 0
    prompt_extract_fail = 0
    narr_extract_fail = 0

    with open(BATCH_OUT) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue

            prompt = (
                (((row.get("request") or {}).get("contents") or [{}])[0].get("parts") or [{}])[0]
                .get("text")
                or ""
            )
            narr = extract_narrative(row)
            if not narr:
                narr_extract_fail += 1
                continue

            raw_responses.append((prompt, narr))

            ds = extract_district_state(prompt)
            if not ds:
                prompt_extract_fail += 1
                continue
            d, s = ds
            key = (normalize(d), normalize(s))
            narrative_map.setdefault(key, narr)
            parsed += 1

    print(f"parsed responses:         {parsed}")
    print(f"prompt-extract failures:  {prompt_extract_fail}")
    print(f"narrative-extract fails:  {narr_extract_fail}")
    print(f"unique narratives mapped: {len(narrative_map)}")

    # Re-merge into trivia.json
    trivia = json.load(open(TRIVIA_FILE))
    fixed = 0
    unchanged = 0
    missing = 0
    for rec in trivia:
        raw_d = rec.get("district") or ""
        raw_s = rec.get("state") or ""
        key = (normalize(raw_d), normalize(raw_s))
        true_narr = narrative_map.get(key)
        if true_narr is None:
            # Fallback: scan raw prompts for an exact "Given {d}, {s} —" match.
            marker = f"Given {raw_d}, {raw_s} "
            for prompt, narr in raw_responses:
                if marker in prompt:
                    true_narr = narr
                    break
        if true_narr is None:
            missing += 1
            continue
        if rec.get("narrative") == true_narr:
            unchanged += 1
        else:
            rec["narrative"] = true_narr
            fixed += 1

    print(f"trivia rows fixed:        {fixed}")
    print(f"trivia rows already ok:   {unchanged}")
    print(f"trivia rows w/o match:    {missing}")

    with open(TRIVIA_FILE, "w") as f:
        json.dump(trivia, f, ensure_ascii=False)
    print(f"wrote {TRIVIA_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
