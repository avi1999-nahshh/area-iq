"""
K-means clustering on normalized score vectors, finds optimal k in [15, 30].
Uses Google Gemini (via Vertex AI + ADC) to name each cluster from its centroid profile.
"""
import json, os, time
from pathlib import Path
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv("../../.env.local")
PROJECT  = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL    = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
if not PROJECT:
    raise SystemExit("GOOGLE_CLOUD_PROJECT not set in .env.local")

OUT = Path("../../data/processed")
scores = json.load(open(OUT / "scores_with_percentiles.json"))

FEATURES = ["air_quality_score","safety_score","infrastructure_score",
            "transit_score","cleanliness_score","property_score",
            "gender_equality_index"]

X = np.array([[s.get(f, 50.0) for f in FEATURES] for s in scores])
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print("Finding optimal k (testing 15-30)...")
best_k, best_sil = 22, -1
for k in range(15, 31):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km.fit_predict(X_scaled)
    sil = silhouette_score(X_scaled, labels, sample_size=5000)
    print(f"  k={k} silhouette={sil:.4f}")
    if sil > best_sil:
        best_sil, best_k = sil, k

print(f"\nBest k={best_k} (silhouette={best_sil:.4f})")
km = KMeans(n_clusters=best_k, random_state=42, n_init=20)
labels = km.fit_predict(X_scaled)
centroids_raw = scaler.inverse_transform(km.cluster_centers_)

for i, s in enumerate(scores):
    s["cluster_id"] = int(labels[i])

# ── Name clusters with Gemini ──────────────────────────────
client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)

def name_cluster(cluster_id, centroid):
    profile = dict(zip(FEATURES, centroid))
    prompt = f"""You are naming a neighbourhood archetype for an Indian neighbourhood intelligence app.

This archetype's score profile (0-100, higher is better):
- Air quality: {profile['air_quality_score']:.0f}/100
- Safety: {profile['safety_score']:.0f}/100
- Infrastructure (hospitals, schools, parks, malls): {profile['infrastructure_score']:.0f}/100
- Transit connectivity: {profile['transit_score']:.0f}/100
- Cleanliness: {profile['cleanliness_score']:.0f}/100
- Economic activity (property/nighttime lights): {profile['property_score']:.0f}/100
- Gender equality index: {profile['gender_equality_index']:.0f}/100

Give this archetype:
1. A punchy 2-3 word name (e.g. "The Green Oasis", "The Urban Pulse", "The Hidden Gem")
2. A one-line tagline under 60 characters that makes people proud or curious about their area
3. One emoji that captures the vibe
4. A 2-sentence description of what life feels like here

Reply in JSON only with keys: name, tagline, emoji, description."""

    resp = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=4096,  # 2.5-pro reserves a lot for thinking
            temperature=0.7,
        ),
    )
    text = (resp.text or "").strip()
    if text.startswith("```"):
        text = text.strip("`").split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    if not text:
        raise ValueError(f"empty response (finish_reason={getattr(resp.candidates[0], 'finish_reason', '?') if resp.candidates else '?'})")
    return json.loads(text)

print(f"Naming archetypes with {MODEL}...")
archetypes = []
for cid in range(best_k):
    centroid = centroids_raw[cid]
    count = int((labels == cid).sum())
    try:
        result = name_cluster(cid, centroid)
    except Exception as e:
        print(f"  Cluster {cid}: FAILED ({e}) — using fallback name")
        result = {"name": f"Archetype {cid}", "tagline": "A distinct neighbourhood type", "emoji": "🏘️", "description": "A cluster with unique score profile."}
    archetypes.append({
        "cluster_id": cid,
        "name": result["name"],
        "tagline": result["tagline"],
        "emoji": result["emoji"],
        "description": result["description"],
        "centroid": centroid.tolist(),
        "pincode_count": count,
    })
    print(f"  Cluster {cid} ({count} pincodes): {result['emoji']} {result['name']}")

archetype_map = {a["cluster_id"]: a for a in archetypes}
for s in scores:
    a = archetype_map[s["cluster_id"]]
    s["archetype_id"] = f"cluster_{s['cluster_id']}"
    s["archetype_name"] = a["name"]
    s["archetype_tagline"] = a["tagline"]
    s["archetype_emoji"] = a["emoji"]
    s["computed_at"] = int(time.time() * 1000)

with open(OUT / "archetypes.json", "w") as f:
    json.dump(archetypes, f, indent=2)
with open(OUT / "scores_final.json", "w") as f:
    json.dump(scores, f)

print(f"\nSaved {best_k} archetypes → data/processed/archetypes.json")
print(f"Saved {len(scores)} final scores → data/processed/scores_final.json")
