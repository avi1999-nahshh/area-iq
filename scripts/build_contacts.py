#!/usr/bin/env /Library/Frameworks/Python.framework/Versions/3.13/bin/python3
"""
Build contacts.json — one record per pincode with MP/constituency info.

Sources:
  A. data/raw/pincode_political_map.dta  — pincode -> LS + assembly constituency
  B. MyNeta LS 2024 winners              — constituency -> MP name + party
"""

import json
import re
import ssl
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

import pandas as pd
from rapidfuzz import process as rfprocess, fuzz

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
PROCESSED.mkdir(parents=True, exist_ok=True)

PARTIAL_FILE = RAW / "myneta_ls2024_partial.json"
DTA_FILE = RAW / "pincode_political_map.dta"

# ── SSL context (bypass macOS cert issue) ─────────────────────────────────────
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as resp:
        return resp.read().decode("utf-8", errors="replace")


# ── Step 1 — Load .dta file ────────────────────────────────────────────────────
print("Loading .dta file …")
dta = pd.read_stata(str(DTA_FILE))
# Normalise pincode to str (zero-padded to 6 digits)
dta["pincode"] = dta["pincode"].astype(str).str.strip().str.zfill(6)
print(f"  .dta rows: {len(dta)}, columns: {dta.columns.tolist()}")
# parliament_name -> LS constituency, assembly_name -> VS constituency
dta = dta.rename(
    columns={
        "parliament_name": "ls_constituency_raw",
        "assembly_name": "vs_constituency_raw",
    }
)
print(f"  Unique LS constituencies: {dta['ls_constituency_raw'].nunique()}")
print(f"  Unique assembly constituencies: {dta['vs_constituency_raw'].nunique()}")


# ── Step 2 — Scrape MyNeta winners ────────────────────────────────────────────
def scrape_winners() -> list[dict]:
    """Returns list of {num, name, constituency, party}."""
    if PARTIAL_FILE.exists():
        data = json.loads(PARTIAL_FILE.read_text())
        if len(data) >= 540:
            print(f"  Using cached partial file ({len(data)} winners)")
            return data

    print("  Fetching MyNeta winners page …")
    html = fetch(
        "https://myneta.info/LokSabha2024/index.php?action=show_winners&sort=candidate"
    )
    print(f"  Page length: {len(html)}")

    # Parse visible rows
    row_pattern = re.compile(
        r"<td>(\d+)</td>\s*\n\s*"
        r"<td>(.*?)</td><td>([^<]+)</td>\s*\n\s*"
        r"<td>([^<]+)</td>",
        re.DOTALL,
    )
    winners = []
    for m in row_pattern.finditer(html):
        num = int(m.group(1))
        name_cell = m.group(2)
        name_match = re.search(r">([^<>]+)</a>", name_cell)
        name = name_match.group(1).strip() if name_match else name_cell.strip()
        constituency = m.group(3).strip()
        party = m.group(4).strip()
        winners.append(
            {"num": num, "name": name, "constituency": constituency, "party": party}
        )
    print(f"  Visible rows parsed: {len(winners)}")

    # Decode obfuscated script blocks (every 9th row is hidden)
    scripts = re.findall(r"<script>(var _0x[a-f0-9]+=\[\"\".*?)</script>", html, re.DOTALL)
    print(f"  Obfuscated script blocks: {len(scripts)}")

    if scripts:
        # Use Node.js to decode them
        tmp_scripts = Path(tempfile.mktemp(suffix=".json"))
        tmp_script_js = Path(tempfile.mktemp(suffix=".js"))
        tmp_scripts.write_text(json.dumps(scripts))
        tmp_script_js.write_text(
            """
const fs = require('fs');
const scripts = JSON.parse(fs.readFileSync('%s', 'utf8'));
const results = [];
for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    try {
        let captured = null;
        const fakeEval = (x) => { captured = x; return x; };
        const modScript = script.replace(/\\beval\\b/, '__fakeEval__');
        const fn = new Function('__fakeEval__', modScript);
        fn(fakeEval);
        results.push({idx: i, html: captured});
    } catch(e) {
        results.push({idx: i, html: 'ERROR: ' + e.message.slice(0, 100)});
    }
}
console.log(JSON.stringify(results));
"""
            % str(tmp_scripts)
        )
        node_out = subprocess.check_output(["node", str(tmp_script_js)], timeout=30)
        decoded = json.loads(node_out)

        hidden_pattern = re.compile(
            r"<td>(\d+)</td>\s*"
            r"<td>(?:<a[^>]*>)*([^<]+)(?:</a>)*.*?</td>\s*<td>([^<]+)</td>\s*"
            r"<td>([^<]+)</td>",
            re.DOTALL,
        )
        for item in decoded:
            h = item.get("html") or ""
            hm = hidden_pattern.search(h)
            if hm:
                winners.append(
                    {
                        "num": int(hm.group(1)),
                        "name": hm.group(2).strip(),
                        "constituency": hm.group(3).strip(),
                        "party": hm.group(4).strip(),
                    }
                )
        tmp_scripts.unlink(missing_ok=True)
        tmp_script_js.unlink(missing_ok=True)

    winners.sort(key=lambda x: x["num"])
    print(f"  Total winners after decoding: {len(winners)}")
    PARTIAL_FILE.write_text(json.dumps(winners, ensure_ascii=False, indent=2))
    return winners


print("\nStep 2: Scraping MyNeta …")
winners = scrape_winners()

# Build lookup: normalised constituency -> (mp_name, party)
def normalise(s: str) -> str:
    """Upper-case, strip reservation suffix like (SC)/(ST)."""
    s = str(s).upper().strip()
    s = re.sub(r"\s*\([A-Z]+\)\s*$", "", s).strip()
    return s


mp_lookup: dict[str, tuple[str, str]] = {}
for w in winners:
    key = normalise(w["constituency"])
    mp_lookup[key] = (w["name"], w["party"])

print(f"\n  MP lookup entries: {len(mp_lookup)}")
print("  Sample:", list(mp_lookup.items())[:3])


# ── Step 3 — Load pincodes list ────────────────────────────────────────────────
print("\nStep 3: Loading pincodes …")
pincodes_data = json.loads((PROCESSED / "pincodes.json").read_text())
all_pincodes = [str(p["pincode"]).zfill(6) for p in pincodes_data]
print(f"  Total pincodes: {len(all_pincodes)}")


# ── Step 4 — Join .dta to pincodes ────────────────────────────────────────────
print("\nStep 4: Joining .dta to pincodes …")
dta_map: dict[str, dict] = {}
for _, row in dta.iterrows():
    pc = str(row["pincode"]).strip().zfill(6)
    dta_map[pc] = {
        "ls_constituency": str(row.get("ls_constituency_raw", "") or "").strip(),
        "vs_constituency": str(row.get("vs_constituency_raw", "") or "").strip(),
    }

matched_dta = sum(1 for p in all_pincodes if p in dta_map)
print(f"  Pincodes matched in .dta: {matched_dta}/{len(all_pincodes)}")


# ── Step 5 — Fuzzy-match LS constituency to MP lookup ─────────────────────────
print("\nStep 5: Fuzzy-matching constituencies to MPs …")
mp_keys = list(mp_lookup.keys())

# Cache fuzzy results
fuzzy_cache: dict[str, tuple[str, str] | None] = {}


def lookup_mp(raw_constituency: str) -> tuple[str | None, str | None]:
    if not raw_constituency:
        return None, None
    norm = normalise(raw_constituency)
    if norm in fuzzy_cache:
        return fuzzy_cache[norm]
    # Exact match first
    if norm in mp_lookup:
        fuzzy_cache[norm] = mp_lookup[norm]
        return mp_lookup[norm]
    # Fuzzy match
    best = rfprocess.extractOne(norm, mp_keys, scorer=fuzz.token_sort_ratio, score_cutoff=80)
    if best:
        result = mp_lookup[best[0]]
        fuzzy_cache[norm] = result
        return result
    fuzzy_cache[norm] = (None, None)
    return None, None


# ── Step 6 — Build contacts records ───────────────────────────────────────────
print("\nStep 6: Building contacts records …")
contacts = []
mp_matched = 0
mla_matched = 0  # not implemented

for p in pincodes_data:
    pc = str(p["pincode"]).zfill(6)
    dta_row = dta_map.get(pc, {})

    ls_const = dta_row.get("ls_constituency", "") or ""
    vs_const = dta_row.get("vs_constituency", "") or ""

    mp_name, mp_party = lookup_mp(ls_const)
    if mp_name:
        mp_matched += 1

    contacts.append(
        {
            "pincode": pc,
            "ls_constituency": ls_const,
            "ls_mp_name": mp_name if mp_name else None,
            "ls_mp_party": mp_party if mp_party else None,
            "vs_constituency": vs_const,
            "vs_mla_name": None,
            "vs_mla_party": None,
            "ward_councillor": None,
        }
    )

print(f"\n  Total records: {len(contacts)}")
print(f"  MP name matched: {mp_matched}")
print(f"  MLA name matched: {mla_matched}")
print(f"  No MP name (null): {len(contacts) - mp_matched}")

# ── Step 7 — Write output ──────────────────────────────────────────────────────
out_path = PROCESSED / "contacts.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(contacts, f, allow_nan=False, ensure_ascii=False, indent=2)

print(f"\nWrote {len(contacts)} records to {out_path}")
print(f"\nFinal stats:")
print(f"  MP name matched:  {mp_matched}/{len(contacts)}")
print(f"  MLA name matched: {mla_matched}/{len(contacts)}")
print(f"  Null MP name:     {len(contacts) - mp_matched}/{len(contacts)}")
