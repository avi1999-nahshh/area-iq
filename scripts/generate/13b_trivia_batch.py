"""
Submits remaining districts to Vertex AI Gemini **batch prediction**.
Much higher quota than online/interactive inference — no rate-limit dance.

Flow:
  1. Load pincodes, dedupe districts, skip any already present in trivia.json
  2. Write a JSONL of requests, upload to GCS
  3. Submit batch job, poll until done
  4. Download results from GCS, merge into trivia.json
"""
import json, os, sys, time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.cloud import storage

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from utils.district_match import normalize

load_dotenv("../../.env.local")
PROJECT  = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL    = os.getenv("GEMINI_TRIVIA_MODEL", "gemini-2.5-flash")
BUCKET   = os.getenv("GEMINI_TRIVIA_BUCKET", "areaiq-trivia-e060078d")

OUT = Path("../../data/processed")
TRIVIA_FILE = OUT / "trivia.json"
GCS_PREFIX = "trivia-batch"
LOCAL_IN   = OUT / "trivia_batch_input.jsonl"
LOCAL_OUT  = OUT / "trivia_batch_output.jsonl"

client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)
gcs = storage.Client(project=PROJECT)
bucket = gcs.bucket(BUCKET)

# ── Build list of districts still needing trivia ─────────────────────────
pincodes = json.load(open(OUT / "pincodes.json"))
existing = []
already_done: set[tuple[str, str]] = set()
if TRIVIA_FILE.exists():
    existing = json.load(open(TRIVIA_FILE))
    already_done = {(normalize(r["district"]), normalize(r["state"])) for r in existing}

seen = set()
districts = []
for p in pincodes:
    d, s = p["district"], p["state"]
    k = (normalize(d), normalize(s))
    if k in seen or k in already_done:
        continue
    seen.add(k)
    districts.append((d, s))

print(f"Already done: {len(already_done)}")
print(f"To submit:    {len(districts)}")

if not districts:
    print("Nothing to do.")
    sys.exit(0)

# ── Build the JSONL of requests (order = response order) ─────────────────
def build_prompt(d, s):
    return f"""Generate exactly 3 interesting, specific, surprising facts about {d} district in {s}, India.

Requirements for each fact:
- Must contain a specific number, ranking, or comparison (not vague)
- Must be genuinely surprising to a resident of the area
- Must be usable as a social media caption on its own — punchy, shareable
- Should cover different aspects: history/geography/culture/economy/achievement
- NO generic statements like "known for its temples" or "one of the major cities"
- Must be TRUE and verifiable

Reply in JSON only with a single key "facts" whose value is an array of 3 strings."""

with open(LOCAL_IN, "w") as f:
    for d, s in districts:
        req = {
            "request": {
                "contents": [{"role": "user", "parts": [{"text": build_prompt(d, s)}]}],
                "generationConfig": {
                    "temperature": 0.9,
                    "maxOutputTokens": 4096,  # flash sometimes runs long; 2048 truncated ~90% mid-string
                    "responseMimeType": "application/json",
                },
            }
        }
        f.write(json.dumps(req, ensure_ascii=False) + "\n")

# Remember district/state by line index for mapping responses back
index_map = list(districts)

# ── Upload input to GCS ──────────────────────────────────────────────────
ts = int(time.time())
in_blob  = f"{GCS_PREFIX}/input-{ts}.jsonl"
out_dir  = f"{GCS_PREFIX}/output-{ts}/"
bucket.blob(in_blob).upload_from_filename(str(LOCAL_IN))
in_gcs  = f"gs://{BUCKET}/{in_blob}"
out_gcs = f"gs://{BUCKET}/{out_dir}"
print(f"uploaded {in_gcs}")
print(f"output will land under {out_gcs}")

# ── Submit batch ─────────────────────────────────────────────────────────
job = client.batches.create(
    model=MODEL,
    src=in_gcs,
    config=types.CreateBatchJobConfig(dest=out_gcs),
)
print(f"submitted job: {job.name}")

# ── Poll ─────────────────────────────────────────────────────────────────
terminal = {"JOB_STATE_SUCCEEDED", "JOB_STATE_FAILED", "JOB_STATE_CANCELLED",
            "JOB_STATE_PAUSED", "JOB_STATE_EXPIRED"}
while True:
    job = client.batches.get(name=job.name)
    state = str(job.state).split(".")[-1]
    print(f"  state={state}")
    if state in terminal:
        break
    time.sleep(30)

if state != "JOB_STATE_SUCCEEDED":
    print(f"batch failed: {job.error}")
    sys.exit(1)

# ── Download results ─────────────────────────────────────────────────────
# Vertex writes one or more predictions-*.jsonl files under the dest folder
result_files = list(bucket.list_blobs(prefix=out_dir))
print(f"downloading {len(result_files)} result file(s)")

with open(LOCAL_OUT, "wb") as fout:
    for b in result_files:
        if b.name.endswith(".jsonl"):
            fout.write(b.download_as_bytes())

# ── Parse and merge ──────────────────────────────────────────────────────
added = 0
with open(LOCAL_OUT) as f:
    lines = [ln for ln in f if ln.strip()]

if len(lines) != len(index_map):
    print(f"⚠ result count {len(lines)} != submitted {len(index_map)} — order mapping unreliable")

merged = list(existing)
for i, line in enumerate(lines):
    try:
        rec = json.loads(line)
        # Vertex wraps: {"request": {...}, "response": {"candidates": [{"content": {"parts": [{"text": "..."}]}}]}, "status": "..."}
        resp = rec.get("response") or {}
        cands = resp.get("candidates") or []
        if not cands:
            continue
        parts = (cands[0].get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts).strip()
        if not text: continue
        facts = json.loads(text).get("facts") or []
        if len(facts) < 1: continue
        d, s = index_map[i] if i < len(index_map) else (None, None)
        if not d: continue
        merged.append({"district": d, "state": s, "facts": facts,
                       "generated_at": int(time.time() * 1000)})
        added += 1
    except Exception as e:
        print(f"  parse error line {i}: {e}")

with open(TRIVIA_FILE, "w") as f:
    json.dump(merged, f, ensure_ascii=False)
print(f"Saved {len(merged)} total trivia records (+{added} from batch)")
