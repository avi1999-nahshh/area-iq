import os, sys
from dotenv import load_dotenv
load_dotenv("../.env.local")

REQUIRED = [
    ("DATA_GOV_IN_API_KEY", "https://data.gov.in — register free"),
    ("OPENAQ_API_KEY",       "https://explore.openaq.org/register — free"),
    ("WAQI_API_KEY",         "https://aqicn.org/data-platform/token/ — free"),
    ("CONVEX_URL",           "Your Convex deployment URL"),
    ("CONVEX_DEPLOY_KEY",    "Convex dashboard → Settings → Deploy key"),
    ("ANTHROPIC_API_KEY",    "https://console.anthropic.com"),
]

missing = []
for key, url in REQUIRED:
    if not os.getenv(key):
        missing.append(f"  {key}  →  {url}")

if missing:
    print("Missing env vars in .env.local:\n" + "\n".join(missing))
    sys.exit(1)

print("✓ All API keys present")
