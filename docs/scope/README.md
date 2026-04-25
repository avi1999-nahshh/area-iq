# AreaIQ — Scoping

AreaIQ is a neighbourhood intelligence product. The MVP focuses on one city, one tier, and three user stories that share a single dimension engine.

> Status rollup lives in [STATUS.md](./STATUS.md). Per-feature deep dives in the folders below.

## Three user stories

| # | Story | Spec | Status |
|---|---|---|---|
| 1 | Compare two neighbourhoods (head-to-head) | [01-compare/scope.md](./01-compare/scope.md) | [01-compare/status.md](./01-compare/status.md) |
| 2 | Find an area by office commute + tweakable dimensions | [02-proximity/scope.md](./02-proximity/scope.md) | [02-proximity/status.md](./02-proximity/status.md) |
| 3 | Report card for a single neighbourhood | [03-report-card/scope.md](./03-report-card/scope.md) | [03-report-card/status.md](./03-report-card/status.md) |

All three are anchored to the same dimension engine + design system below. **Build the engine once, present it three ways.**

## POC scope

- **City:** Bangalore only.
- **Tier:** Urban pincodes only (`tier=urban` in scoring) — ~129 pincodes.
- **Why narrow:** the dataset's cleanliness, safety, and property signals are sparse / unreliable nationally. Bangalore urban tier has 100% AQI/metro/rent presence with 76% AQI station ≤15km and 49% locality-level rent matches. Cutting scope is what makes the score defensible. See `scripts/score/14_iq_v2_blr.py` for the data audit codified.

## Dimensions (single source of truth)

The same six dimensions feed all three stories. Each score is 0–100, **peer-relative within Bangalore urban tier**.

| Dimension | Composition | Source |
|---|---|---|
| Air | CPCB AQI from station ≤15km. Confidence flag if station >15km away | `data/processed/air_quality.json` |
| Amenities — Essentials | hospital + school + college + bank counts within pincode | `data/processed/infrastructure.json` |
| Amenities — Lifestyle | café + restaurant + mall/market + park counts | `data/processed/infrastructure.json` |
| Connectivity | metro km (40%) + rail km (15%) + bus stops (20%) + commute<30min % (25%) | `transit.json`, `infrastructure.json`, `census.json` |
| Density & Demographics | pop density + worker participation + (small avg HH size = young proxy) | `data/processed/census.json` |
| Affordability | inverted 99acres 2BHK rent percentile (locality match preferred, city median fallback) | `data/processed/property.json` |
| Walkability | five_minute_city_score (60%) + commute<30min % (40%) | `infrastructure.json`, `census.json` |

**Auto-generated brag label:** for each pincode, pick the dimension where it ranks best citywide. Skips air when absolute AQI > 100 or station distance > 15km. Skips affordability when not locality-confident unless top-3.

**Dropped from scoring** (per data-quality audit, 2026-04-25):
- Cleanliness — broadcast 925-ULB signal, low cardinality, single year
- Safety — district-level NCRB 2014 data, 12 years stale
- Nightlight-as-property — `hpi_value` was a nightlight intensity score mislabeled as property

## Design system

- **Typography:** Inter (display + body), JetBrains Mono (numerals, labels, mono kickers)
- **Palette:** page bg `#f9f7f3` (warm cream), cards bg-white with tinted shadow, slate-900 ink, amber-50/200/300/500/700/800 accent ladder
- **Visual treatment:** SVG noise overlay at 4% opacity (`pointer-events: none`, `mix-blend-multiply`), borderless cards, mono tabular numerals on every metric, flag-style chips with leading colored bar
- **Motion:** Spring-eased `cubic-bezier(0.32, 0.72, 0, 1)`, stagger fade-in on grids (CSS `animation-delay: calc(var(--i) * 80ms)`), respects `prefers-reduced-motion`
- **Reference:** `app/insights-lab/` is the **locked direction**. `app/insights/` is the prior iteration kept for A/B comparison.

## Out of scope (POC)

- Cities other than Bangalore
- Rural and semi-urban tiers
- Cleanliness, safety, age-bracket data (vendor procurement deferred)
- Sharing CTAs (deferred per user, 2026-04-25)
- Saved shortlists / accounts / sign-up
- OG images for compare and proximity
- Custom road density (currently null in schema)
- Cross-pincode comparisons across cities

## Data sources & pipelines

- Convex dev: `dev:calculating-sturgeon-828` (used by Vercel prod via `NEXT_PUBLIC_CONVEX_URL`)
- Convex prod: `posh-lyrebird-724` (exists, unseeded, no traffic)
- Reseed pipeline: `python3 scripts/seed/14_seed_convex.py` (destructive `--replace --yes` per table)
- IQ v2 compute: `python3 scripts/score/14_iq_v2_blr.py` → `data/processed/iq_v2_blr.json`
- Trivia narrative repair: `scripts/generate/15b_fix_typology_narrative.py` (idempotent)

## How to update this folder

- **Scope file** (`scope.md`): change when product spec changes — add/remove acceptance criteria, refine the user story, capture open questions.
- **Status file** (`status.md`): change when something ships, regresses, or moves between live / lab / not-started. Update the *Last updated* line every time.
- **STATUS.md** (root): update the per-story rollup row whenever any feature changes prod state.
