"""
Generates 3 specific, shareable, surprising facts per Indian district via Gemini.

Performance:
- Concurrent: N workers hit Vertex AI in parallel (default 10)
- Fast model: defaults to gemini-2.5-flash (override via GEMINI_TRIVIA_MODEL)
- District dedup: normalize names before uniquing so "South West, West" and
  "South West Delhi" don't both consume API calls

Hardening:
- Resume-safe: skips districts already present in trivia.json
- Checkpoint-saves every 25 successful districts
- Per-district try/except: single failure does not kill the batch
"""
import json, os, sys, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from dotenv import load_dotenv
from google import genai
from google.genai import types

# unbuffered prints so log tails update live
_orig_print = print
def print(*args, **kw):
    _orig_print(*args, **{**kw, "flush": True})

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from utils.district_match import normalize

load_dotenv("../../.env.local")
PROJECT  = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
# Trivia-specific model override — falls back to global GEMINI_MODEL, then flash
MODEL    = os.getenv("GEMINI_TRIVIA_MODEL", os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))
MAX_WORKERS = int(os.getenv("GEMINI_TRIVIA_WORKERS", "5"))
MAX_RETRIES = 4
if not PROJECT:
    raise SystemExit("GOOGLE_CLOUD_PROJECT not set in .env.local")

OUT = Path("../../data/processed")
TRIVIA_FILE = OUT / "trivia.json"
CHECKPOINT_EVERY = 25

pincodes = json.load(open(OUT / "pincodes.json"))
client = genai.Client(
    vertexai=True, project=PROJECT, location=LOCATION,
    http_options=types.HttpOptions(timeout=120_000),  # 120s — flash sometimes slow
)

# ── Dedupe districts by normalized (district, state) ─────────────────────
# Multiple shapefile spellings ("South West, West" vs "South West Delhi") collapse
# to one API call; we keep the first raw (district, state) as the canonical entry.
seen_norm = set()
districts = []
for p in pincodes:
    d, s = p["district"], p["state"]
    key = (normalize(d), normalize(s))
    if key in seen_norm:
        continue
    seen_norm.add(key)
    districts.append((d, s))
print(f"Deduped: {len(districts)} unique districts (from {len(pincodes)} pincodes)")

# ── Resume-safe ──────────────────────────────────────────────────────────
output = []
already_done: set[tuple[str, str]] = set()
if TRIVIA_FILE.exists():
    output = json.load(open(TRIVIA_FILE))
    already_done = {(normalize(r["district"]), normalize(r["state"])) for r in output}
    print(f"Resuming: {len(already_done)} already done, {len(districts) - len(already_done)} remaining")

todo = [(d, s) for d, s in districts if (normalize(d), normalize(s)) not in already_done]
print(f"Processing {len(todo)} districts with model={MODEL}, workers={MAX_WORKERS}")

# ── API call ─────────────────────────────────────────────────────────────
import random
def _with_retry(fn, *args, **kw):
    """Retry with exponential backoff on 429 / transient errors."""
    for attempt in range(MAX_RETRIES):
        try:
            return fn(*args, **kw)
        except Exception as e:
            msg = str(e).lower()
            is_retryable = ("429" in msg or "resource_exhausted" in msg
                            or "deadline" in msg or "503" in msg or "unavailable" in msg
                            or "timed out" in msg or "timeout" in msg
                            or "connection" in msg)
            if not is_retryable or attempt == MAX_RETRIES - 1:
                raise
            # exponential backoff with jitter: 2s, 5s, 12s, 30s
            wait = (2 ** attempt) * 1.5 + random.uniform(0, 2)
            time.sleep(wait)
    raise RuntimeError("unreachable")

def generate_facts(district, state):
    prompt = f"""Generate exactly 3 interesting, specific, surprising facts about {district} district in {state}, India.

Requirements for each fact:
- Must contain a specific number, ranking, or comparison (not vague)
- Must be genuinely surprising to a resident of the area
- Must be usable as a social media caption on its own — punchy, shareable
- Should cover different aspects: history/geography/culture/economy/achievement
- NO generic statements like "known for its temples" or "one of the major cities"
- Must be TRUE and verifiable

Examples of GOOD facts:
- "Koramangala alone has more startups per square kilometre than all of Pune combined."
- "Jayanagar's 4th Block market has been operating continuously since 1954 — making it older than Infosys."
- "Indiranagar's 100 Feet Road was planned in 1972, when Bengaluru's entire IT sector didn't exist yet."

Reply in JSON only with a single key "facts" whose value is an array of 3 strings."""

    resp = _with_retry(client.models.generate_content,
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=4096,
            temperature=0.9,
        ),
    )
    text = (resp.text or "").strip()
    if text.startswith("```"):
        text = text.strip("`").split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    if not text:
        raise ValueError("empty response from Gemini")
    return json.loads(text)["facts"]

# ── Concurrent execution ─────────────────────────────────────────────────
lock = Lock()
succ_since_ckpt = [0]       # mutable so worker callback can update
attempted = [0]

def _worker(d, s):
    try:
        facts = generate_facts(d, s)
        return ("ok", d, s, facts, None)
    except Exception as e:
        return ("err", d, s, None, str(e))

def _record(result):
    kind, d, s, facts, err = result
    with lock:
        attempted[0] += 1
        if kind == "ok":
            output.append({"district": d, "state": s, "facts": facts,
                           "generated_at": int(time.time() * 1000)})
            succ_since_ckpt[0] += 1
            if succ_since_ckpt[0] >= CHECKPOINT_EVERY:
                with open(TRIVIA_FILE, "w") as f:
                    json.dump(output, f, ensure_ascii=False)
                print(f"  [checkpoint] saved {len(output)} records")
                succ_since_ckpt[0] = 0
        else:
            print(f"  Error for {d}, {s}: {err[:120]}")
        if attempted[0] % 25 == 0:
            print(f"  {attempted[0]}/{len(todo)} attempted (saved={len(output)})")

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
    futs = [pool.submit(_worker, d, s) for d, s in todo]
    for fut in as_completed(futs):
        _record(fut.result())

# ── Final save ───────────────────────────────────────────────────────────
with open(TRIVIA_FILE, "w") as f:
    json.dump(output, f, ensure_ascii=False)
print(f"Saved {len(output)} district trivia records")
