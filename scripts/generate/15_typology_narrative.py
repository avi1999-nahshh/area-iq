"""
Generates 2-sentence editorial typology narratives per district via Gemini batch.

Flow:
  1. Load pincodes + scores, compute district-level average score profile
  2. Map each district to its dominant archetype (mode of pincode archetypes)
  3. Build JSONL of batch requests, upload to GCS
  4. Submit Vertex AI batch job, poll until done
  5. Download + parse results, merge narrative into trivia.json
"""
import json, os, sys, time
from pathlib import Path
from collections import defaultdict, Counter
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.cloud import storage

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from utils.district_match import normalize

load_dotenv(str(Path(__file__).resolve().parents[2] / ".env.local"))
PROJECT  = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL    = "gemini-2.5-flash"
BUCKET   = os.getenv("GEMINI_TRIVIA_BUCKET", "areaiq-trivia-e060078d")

if not PROJECT:
    raise SystemExit("GOOGLE_CLOUD_PROJECT not set in .env.local")

OUT          = Path(__file__).resolve().parents[2] / "data" / "processed"
TRIVIA_FILE  = OUT / "trivia.json"
GCS_PREFIX   = "typology-batch"
LOCAL_IN     = OUT / "typology_batch_input.jsonl"
LOCAL_OUT    = OUT / "typology_batch_output.jsonl"

client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)
gcs    = storage.Client(project=PROJECT)
bucket = gcs.bucket(BUCKET)

# ── Load data ─────────────────────────────────────────────────────────────
pincodes  = json.load(open(OUT / "pincodes.json"))
scores_raw = json.load(open(OUT / "scores_final.json"))
scores_map = {s["pincode"]: s for s in scores_raw}
archetypes_list = json.load(open(OUT / "archetypes.json"))
# Archetypes are keyed by cluster_id (int); scores store archetype_id as "cluster_N"
arch_by_cluster_id = {a["cluster_id"]: a for a in archetypes_list}

# ── Dedupe districts (same pattern as 13_district_trivia.py) ──────────────
seen_norm = set()
district_pincodes = defaultdict(list)  # (norm_district, norm_state) -> [pincode]
district_raw      = {}  # (norm_d, norm_s) -> (raw_d, raw_s)

for p in pincodes:
    d, s = p["district"], p["state"]
    key  = (normalize(d), normalize(s))
    if key not in seen_norm:
        seen_norm.add(key)
        district_raw[key] = (d, s)
    district_pincodes[key].append(p["pincode"])

print(f"Unique districts: {len(seen_norm)}")

# ── Build score profile per district ──────────────────────────────────────
def avg_scores(pincode_list):
    dims = ["air_quality_score", "safety_score", "infrastructure_score",
            "transit_score", "cleanliness_score", "property_score"]
    totals = defaultdict(float)
    counts = defaultdict(int)
    arch_votes = Counter()
    for pc in pincode_list:
        s = scores_map.get(pc)
        if not s:
            continue
        for d in dims:
            v = s.get(d)
            if v is not None:
                totals[d] += v
                counts[d] += 1
        # archetype_id is "cluster_N" — extract N
    arch_id_str = s.get("archetype_id", "")
    try:
        cid = int(arch_id_str.replace("cluster_", ""))
        arch_votes[cid] += 1
    except Exception:
        pass

    avgs = {d: round(totals[d] / counts[d], 1) if counts[d] else 50.0 for d in dims}
    dominant_cluster_id = arch_votes.most_common(1)[0][0] if arch_votes else None
    return avgs, dominant_cluster_id

def build_prompt(d, s, avgs, arch):
    arch_name    = arch.get("name", "Mixed Character")
    arch_tagline = arch.get("tagline", "")
    return (
        f"You're writing for an enlightened urbanism publication. "
        f"Given {d}, {s} — whose dominant archetype is {arch_name} ({arch_tagline}), "
        f"and whose score profile is: "
        f"air {avgs['air_quality_score']}/100, "
        f"safety {avgs['safety_score']}/100, "
        f"infrastructure {avgs['infrastructure_score']}/100, "
        f"transit {avgs['transit_score']}/100, "
        f"cleanliness {avgs['cleanliness_score']}/100, "
        f"buzz {avgs['property_score']}/100 — "
        f"write EXACTLY 2 sentences (no more, no less) describing the neighborhood's character. "
        f"Use specific urban-planning language. Don't cite the numbers directly; evoke the lived experience. "
        f'Reply in JSON: {{"narrative": "..."}}'
    )

# ── Check which districts already have narratives ─────────────────────────
existing_trivia = json.load(open(TRIVIA_FILE)) if TRIVIA_FILE.exists() else []
already_done = {
    (normalize(r["district"]), normalize(r["state"]))
    for r in existing_trivia
    if r.get("narrative")
}
print(f"Districts already have narrative: {len(already_done)}")

todo_keys = [k for k in seen_norm if k not in already_done]
print(f"Districts to process: {len(todo_keys)}")

if not todo_keys:
    print("Nothing to do.")
    sys.exit(0)

# ── Build JSONL ────────────────────────────────────────────────────────────
index_map = []  # ordered list of (norm_key, raw_d, raw_s) for response mapping

with open(LOCAL_IN, "w") as f:
    for key in todo_keys:
        raw_d, raw_s = district_raw[key]
        pcs          = district_pincodes[key]
        avgs, cluster_id = avg_scores(pcs)
        arch         = arch_by_cluster_id.get(cluster_id, archetypes_list[0])
        prompt_text  = build_prompt(raw_d, raw_s, avgs, arch)

        req = {
            "request": {
                "contents": [{"role": "user", "parts": [{"text": prompt_text}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 4096,
                    "responseMimeType": "application/json",
                },
            }
        }
        f.write(json.dumps(req, ensure_ascii=False) + "\n")
        index_map.append((key, raw_d, raw_s))

print(f"Wrote {len(index_map)} requests to {LOCAL_IN}")

# ── Upload input to GCS ────────────────────────────────────────────────────
ts      = int(time.time())
in_blob = f"{GCS_PREFIX}/input-{ts}.jsonl"
out_dir = f"{GCS_PREFIX}/output-{ts}/"
bucket.blob(in_blob).upload_from_filename(str(LOCAL_IN))
in_gcs  = f"gs://{BUCKET}/{in_blob}"
out_gcs = f"gs://{BUCKET}/{out_dir}"
print(f"Uploaded: {in_gcs}")
print(f"Output dir: {out_gcs}")

# ── Submit batch job ────────────────────────────────────────────────────────
job = client.batches.create(
    model=MODEL,
    src=in_gcs,
    config=types.CreateBatchJobConfig(dest=out_gcs),
)
print(f"Submitted job: {job.name}")

# ── Poll ────────────────────────────────────────────────────────────────────
terminal = {"JOB_STATE_SUCCEEDED", "JOB_STATE_FAILED",
            "JOB_STATE_CANCELLED", "JOB_STATE_PAUSED", "JOB_STATE_EXPIRED"}
while True:
    job   = client.batches.get(name=job.name)
    state = str(job.state).split(".")[-1]
    print(f"  state={state}")
    if state in terminal:
        break
    time.sleep(30)

if state != "JOB_STATE_SUCCEEDED":
    print(f"Batch failed: {job.error}")
    sys.exit(1)

# ── Download results ────────────────────────────────────────────────────────
result_blobs = list(bucket.list_blobs(prefix=out_dir))
print(f"Downloading {len(result_blobs)} result file(s)")
with open(LOCAL_OUT, "wb") as fout:
    for b in result_blobs:
        if b.name.endswith(".jsonl"):
            fout.write(b.download_as_bytes())

# ── Parse + merge into trivia.json ─────────────────────────────────────────
# Build lookup: norm_key -> narrative
# IMPORTANT: Vertex batch output rows are NOT guaranteed to preserve input
# order. Match each response to its district via the echoed prompt text
# (`request.contents[0].parts[0].text`), not the line index. Falling back to
# positional matching silently corrupted ~1078/1079 narratives in the first run.
import re as _re
PROMPT_RE = _re.compile(r"Given (.+?), ([^,]+?) [—–-]")
# (raw_d, raw_s) index for exact-substring fallback when districts/states
# themselves contain commas (e.g. "Dadra & Nagar Haveli, Valsad").
index_by_raw = {(raw_d, raw_s): key for key, raw_d, raw_s in index_map}

narrative_map = {}
with open(LOCAL_OUT) as f:
    lines = [ln for ln in f if ln.strip()]

if len(lines) != len(index_map):
    print(f"Warning: result count {len(lines)} != submitted {len(index_map)}")

parse_fail = 0
for line in lines:
    try:
        rec   = json.loads(line)
        req   = rec.get("request") or {}
        prompt_parts = ((req.get("contents") or [{}])[0].get("parts") or [{}])
        prompt_text  = prompt_parts[0].get("text", "") if prompt_parts else ""

        resp  = rec.get("response") or {}
        cands = resp.get("candidates") or []
        if not cands:
            continue
        parts = (cands[0].get("content") or {}).get("parts") or []
        text  = "".join(p.get("text", "") for p in parts).strip()
        if not text:
            continue
        obj       = json.loads(text)
        narrative = obj.get("narrative", "").strip()
        if not narrative:
            continue

        # Primary: regex-extract (d, s) from the echoed prompt.
        m = PROMPT_RE.search(prompt_text)
        key = None
        if m:
            key = (normalize(m.group(1).strip()), normalize(m.group(2).strip()))

        # Fallback: scan submitted (raw_d, raw_s) pairs for an exact "Given d, s "
        # substring in the prompt (handles composite-comma districts).
        if key is None or key not in index_by_raw.values():
            for (raw_d, raw_s), k in index_by_raw.items():
                if f"Given {raw_d}, {raw_s} " in prompt_text:
                    key = k
                    break

        if key:
            narrative_map.setdefault(key, narrative)
    except Exception as e:
        parse_fail += 1
        print(f"  parse error: {e}")

print(f"Parsed {len(narrative_map)} narratives from batch output (errors: {parse_fail})")

# Merge narrative into each trivia record
added = 0
for rec in existing_trivia:
    key = (normalize(rec["district"]), normalize(rec["state"]))
    if key in narrative_map and not rec.get("narrative"):
        rec["narrative"] = narrative_map[key]
        added += 1

# Also add narrative to trivia records that don't have a narrative yet
# (shouldn't happen since all 1079 are in trivia, but cover edge case)
existing_keys = {(normalize(r["district"]), normalize(r["state"])) for r in existing_trivia}
for key, narr in narrative_map.items():
    if key not in existing_keys:
        raw_d, raw_s = district_raw[key]
        existing_trivia.append({
            "district": raw_d,
            "state": raw_s,
            "facts": [],
            "narrative": narr,
            "generated_at": int(time.time() * 1000),
        })
        added += 1

with open(TRIVIA_FILE, "w") as f:
    json.dump(existing_trivia, f, ensure_ascii=False)

print(f"Saved {len(existing_trivia)} trivia records with {added} new narratives added")
