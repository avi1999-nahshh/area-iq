"""
District name normalization + fuzzy matching for joining pincodes to Census, NCRB,
RESIDEX, Swachh, etc. The INDIA_PINCODES shapefile occasionally stuffs multiple
districts into one cell ("South West, West") — we split those and try each part.
Also handles common variants like "(Urban)", "Bangalore" vs "Bengaluru",
"Allahabad" vs "Prayagraj", trailing " District", etc.
"""
import re
from rapidfuzz import process, fuzz

DEFAULT_THRESHOLD = 85

# Well-known renames (old → new). We store BOTH keys so a match from either side works.
ALIASES = {
    # district renames
    "bangalore":       "bengaluru",
    "bangalore urban": "bengaluru urban",
    "bangalore rural": "bengaluru rural",
    "allahabad":       "prayagraj",
    "mysore":          "mysuru",
    "gurgaon":         "gurugram",
    "poona":           "pune",
    "baroda":          "vadodara",
    "calicut":         "kozhikode",
    "trivandrum":      "thiruvananthapuram",
    "cochin":          "ernakulam",
    "kochi":           "ernakulam",
    "tuticorin":       "thoothukudi",
    # state aliases — collapse variants to a single canonical form
    "nct of delhi":    "delhi",
    "delhi ut":        "delhi",
    "delhi nct":       "delhi",
    "j k":             "jammu kashmir",
    "jammu  kashmir":  "jammu kashmir",
    "chhatisgarh":     "chhattisgarh",
    "orissa":          "odisha",
    "pondicherry":     "puducherry",
    "uttaranchal":     "uttarakhand",
    "dn haveli":       "dadra nagar haveli",
    "dadra  nagar haveli": "dadra nagar haveli",
    "a n islands":     "andaman nicobar",
    "andaman  nicobar islands": "andaman nicobar",
    "andaman  nicobar": "andaman nicobar",
}

_STRIP_WORDS = re.compile(
    r"\b(district|dist\.?|urban|rural|city|municipal|corporation|ulb|"
    r"north|south|east|west|central|new|old|greater)\b",
    re.IGNORECASE,
)
_STRIP_PAREN = re.compile(r"\([^)]*\)")
_NONALPHA = re.compile(r"[^a-z0-9\s]")
_SPACES = re.compile(r"\s+")


def normalize(name: str) -> str:
    """Lowercase, strip parentheticals/direction words/punctuation, apply aliases.

    Direction words are only stripped when doing so leaves a non-empty result.
    This preserves Delhi district names ("South West", "North East", etc.) which
    are PURE direction phrases — stripping them would collapse ~12 distinct
    districts into one empty key.
    """
    if not name:
        return ""
    s = str(name).lower().strip()
    s = _STRIP_PAREN.sub(" ", s)
    s = _NONALPHA.sub(" ", s)
    s_stripped = _STRIP_WORDS.sub(" ", s)
    s_stripped = _SPACES.sub(" ", s_stripped).strip()
    # If stripping direction/qualifier words nukes everything, keep the original
    # (punctuation/case-normalized) form so directional districts stay distinct.
    final = s_stripped if s_stripped else _SPACES.sub(" ", s).strip()
    return ALIASES.get(final, final)


def split_candidates(raw: str) -> list[str]:
    """Given a raw district cell (possibly 'South West, West'), yield candidates.

    Returns both the full name and each comma-separated part, plus directional
    expansions like 'South West' + 'South West Delhi' if we can guess the state.
    """
    if not raw:
        return []
    raw = str(raw).strip()
    candidates = [raw]
    if "," in raw:
        candidates.extend(p.strip() for p in raw.split(",") if p.strip())
    if "/" in raw:
        candidates.extend(p.strip() for p in raw.split("/") if p.strip())
    # dedupe preserving order
    seen = set()
    out = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            out.append(c)
    return out


class DistrictLookup:
    """
    Build once from your reference dataset, query many times.

    >>> lut = DistrictLookup({"Bengaluru Urban": row1, "Bengaluru Rural": row2, ...})
    >>> row, matched_name, score = lut.find("Bangalore")
    >>> row, matched_name, score = lut.find("South West, West", state_hint="Delhi")
    """
    def __init__(self, table: dict):
        self.table = table                        # original name → row
        self.normalized = {normalize(k): k for k in table.keys()}
        self.norm_keys = list(self.normalized.keys())

    def find(self, raw_name: str, state_hint: str | None = None, threshold: int = DEFAULT_THRESHOLD):
        """Returns (row, matched_original_name, score) or (None, None, 0)."""
        for candidate in split_candidates(raw_name):
            norm = normalize(candidate)
            if not norm:
                continue
            # 1. exact normalized match
            if norm in self.normalized:
                key = self.normalized[norm]
                return self.table[key], key, 100
            # 2. state-decorated guess (e.g. "South West" + "Delhi" → "south west delhi")
            if state_hint:
                combined = normalize(f"{candidate} {state_hint}")
                if combined in self.normalized:
                    key = self.normalized[combined]
                    return self.table[key], key, 100
            # 3. fuzzy
            match = process.extractOne(norm, self.norm_keys, scorer=fuzz.WRatio, score_cutoff=threshold)
            if match:
                matched_norm, score, _ = match
                key = self.normalized[matched_norm]
                return self.table[key], key, int(score)
        return None, None, 0
