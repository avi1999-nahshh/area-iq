# Story 1 — Status

> ↩ [Main rollup](../STATUS.md) · [Main scope](../README.md) · [This feature's scope](./scope.md)

Last updated: 2026-04-25.

## Production state

| Variant | URL | State |
|---|---|---|
| Live | `https://area-iq-one.vercel.app/compare` · `/compare/{slug-a}-vs-{slug-b}` | Live as of 2026-04-25 deploy. Full redesign — asymmetric hero with light hero map, slug-canonical URL, verdict card with `<ShareButton>`, three-card delta bento, six-dim Tale of the Tape, IDW-smoothed air + rent. TopNav `Compare` tab active. Legacy `?a=&b=` URLs preserved via server-side 307 to slug. |
| Lab preview | — | Mockup tree at `/mockup/compare` was deleted on merge to live. |

## Components shipped

- `app/compare/[pair]/page.tsx` — server component, slug parsing + canonical URL + out-of-scope panel
- `app/compare/page.tsx` — root redirect: empty → default pair, legacy `?a=&b=` 307 → slug
- `app/compare/head-to-head.tsx` — client interactive surface (asymmetric hero, picker row, verdict card with `<ShareButton>`, bento, Tale of the Tape, CTA links, card-stagger keyframes)
- `app/compare/hero-map.tsx` — single CARTO Positron light map, both pincodes pinned in amber, dashed amber connecting line
- `app/compare/area-picker.tsx` — two-bar autocomplete, alias-aware, calls back instead of routing
- `app/compare/verdict.ts` — v2 dim engine: 6 dims (Air, Essentials, Lifestyle, Connectivity, Density, Affordability), decisive headline tones, audience derivation, deterministic share-line picker
- `app/compare/share-copy.ts` — rotating bank of edgy trash-talk lines per (winner-dim × delta-band)
- `app/compare/lib.ts` — slug ↔ pincode resolution with auto-disambiguator suffixes (Whitefield → `whitefield-epip` etc.)
- `app/insights/brag-chip.tsx` — extracted from `/insights/[pincode]/page.tsx`, shared between insights and compare
- `app/_components/share-button.tsx` (cross-cutting) — wired into the verdict card footer
- `app/_lib/share-copy.ts` — `compareShareText` updated to slug URL form
- `app/_lib/track.ts` (cross-cutting) — `Compare Viewed`, `Compare Picker Changed`, `Share Clicked` events fired

## Engine fixes that landed in this feature

- **Air quality — IDW smoothing**. `scripts/score/14_iq_v2_blr.py` now recovers CPCB station coordinates via inverse-distance-weighted centroid of referencing pincodes (175 BLR-region stations triangulated), then IDW-smooths each pincode's AQI across the K=3 nearest stations within 15 km. Confidence flag tightened to "≥2 contributing stations AND nearest within 8 km". A 50/50 BLR-median fallback (city median 150.9) is applied to under-monitored pincodes (76 of 129 needed it).
- **Rent — IDW smoothing**. Same idea applied to rent: for each pincode that previously fell back to the static city median, find the K=3 nearest locality-confident pincodes within 8 km and IDW-blend their 2BHK rents. Real coverage went from **45% → 86%** (58 locality + 53 locality_inferred + 18 fringe-city + 0 null).
- **EPIP rent gap-filler**. The single orphan pincode (560066, `rent_match_level=None`) was patched in the score script to inherit the BLR city median; the IDW step then upgraded it to a real locality_inferred value.

## Sample verdicts in prod (sanity check)

| Pair | Headline | Trash-talk |
|---|---|---|
| Indiranagar vs Koramangala 1st | Indiranagar wins by 13 points. | "Indiranagar > Koramangala 1st Block. 46 AQI cleaner. Your lungs already moved." |
| Whitefield (EPIP) vs Marathahalli | EPIP wins by 8 points. | (rotates from bank by `hash(pair_slug)`) |
| Indiranagar vs Yelahanka | Indiranagar wins by ~12. | (rent gap surfaces honestly: ₹25k vs ₹14k Yelahanka) |

## Sample brag labels driving compare verdicts

| Pincode | Area | Brag label |
|---|---|---|
| 560038 | Indiranagar | Top 5% Lifestyle Density in Bangalore |
| 560066 | Whitefield (EPIP) | Top 5% Lifestyle Density in Bangalore |
| 560034 | Koramangala 1st Block | Top 25% Essentials Coverage in Bangalore |
| 560048 | Whitefield (Mahadevapura) | Bangalore's #2 Connectivity Hub |
| 560037 | Marathahalli | Bangalore's #1 Cleanest Air *(eastern station bias — see methodology limitations)* |

## Rent coverage detail (post-IDW)

| Match level | Count | Meaning |
|---|---|---|
| `locality` | 58 | Real 99acres locality match |
| `locality_inferred` | 53 | IDW-blended from K=3 nearest locality pincodes within 8 km |
| `city` | 18 | Genuine BLR-fringe pincodes (BIAL, Devanahalli, Hessarghatta, Dodballapura, etc.) — no locality neighbour within 8 km, fall back to city median |
| `city_inferred` | 0 | EPIP-style orphans, all upgraded |
| `null` | 0 | None |

The 18 remaining `city` pincodes are correctly outside the dense locality grid; their compare rows show a `(city median)` micro-tag.

## Known gaps

- OG image route for `/api/og/compare` not built — chat unfurls don't show the verdict inline; users still need to screenshot
- Marathahalli's "#1 Cleanest Air" brag is plausible but feels strong — eastern BLR stations skew clean and IDW doesn't fully wash that out for a single fringe pincode
- 18 BLR-fringe pincodes (mostly outside the urban core) still rent-fall back to the city median; addressed by the surfaced caveat in the bento + table

## Recent updates

- 2026-04-25 — **Production deploy landed.** Commits `a092ea9` (compare ship) + `82c6ad1` (Suspense fix on `/proximity` to unblock the prerender). Pushed via `vercel --prod` after the GitHub→Vercel webhook was slow to fire. Live URL alias `area-iq-one.vercel.app/compare` confirmed serving the new build; all three URL contracts (root redirect, slug, legacy query 307) verified against prod.
- 2026-04-25 — Mockup at `/mockup/compare` lifted into live `/compare`. Old slate-amber implementation (v1 dim engine, query-param URL) replaced. TopNav `Compare` tab flipped to `ready=true`. `<ShareButton>` wired into the verdict card; legacy `?a=&b=` URLs preserved via 307. Plausible custom events wired: `Compare Viewed`, `Compare Picker Changed`, `Share Clicked` (via the shared `<ShareButton>`).
- 2026-04-25 — IDW rent smoothing added to score pipeline; rent coverage 45% → 86%. UI surfaces `(city median)` tag for fallback pincodes.
- 2026-04-25 — IDW air-quality smoothing added; Indiranagar AQI corrected from 38 → 113, Koramangala from 185 → 160 — both now in BLR-realistic moderate-to-unhealthy range.
- 2026-04-25 — Full design refactor: asymmetric hero with light single-map plate, single dramatic verdict card, three-card delta bento, richer Tale of the Tape rows, shared `<BragChip>` extracted, card-stagger motion. Mono kicker pass.
- 2026-04-25 — Side-with poll built and removed (hard to control across sessions, didn't add share value).
- 2026-04-25 — Trash-talk verdict engine v2 — migrated to `iq_v2_blr.json` shape (6 dims), edgy share-copy bank with deterministic per-pair line picker.

## How to update

- When something ships or regresses, update the **Production state** table.
- Add a one-line entry to **Recent updates** with the date.
- Update *Last updated* at the top.
- Update the rollup at `../STATUS.md` if the feature's prod state row changes.
