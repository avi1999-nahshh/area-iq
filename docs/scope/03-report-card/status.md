# Story 3 — Status

> ↩ [Main rollup](../STATUS.md) · [Main scope](../README.md) · [This feature's scope](./scope.md)

Last updated: 2026-04-25.

## Production state

| Variant | URL | State |
|---|---|---|
| Live (Stitch direction, canonical) | `https://area-iq-one.vercel.app/insights` and `/insights/{pincode}` | Sole report-card route. Carries the flippable card with real CARTO Dark Matter map, asymmetric hero, alias-aware search, rank-#1 emphasis, custom 404, full a11y. |
| `/area/[pincode]` (Civic Brief) | — | **Removed 2026-04-25.** Folded out of the codebase; redirected callers to `/insights/`. |
| `/insights-lab/[pincode]` | — | Removed 2026-04-26 when lab merged into live `/insights`. |

## Components shipped

- IQ v2 dimension engine (`scripts/score/14_iq_v2_blr.py`, persisted to `data/processed/iq_v2_blr.json`, read by server components)
- BLR alias map for ~22 colloquial neighbourhood names (`app/insights/blr-aliases.ts`)
- Convex `searchByName` query with `withSearchIndex` + Bangalore urban filter
- Alias-aware client-side search fallback (handles "Whitefield" → 560066/560067/560048)
- Hero with rank-aware brag chip + auto label + outperform subhead
- Bento layout: 4 cards, asymmetric on lg+, 2×2 on md, single col mobile
- Deep Dive table — 7 dimensions, mobile-stacked notes
- Flippable share-preview card (`flippable-card.tsx`) with:
  - Front: AreaIQ visual + real CARTO Dark Matter map + 1.5km amber radius + pin
  - Back: 6-dimension breakdown with bars
  - 700ms `cubic-bezier(0.32, 0.72, 0, 1)` flip
  - Idle wobble (paused offscreen via IntersectionObserver)
  - Live-pulse pip (paused when flipped)
  - Lazy-loaded via `next/dynamic` with skeleton
- Custom 404 page for out-of-scope pincodes (`app/insights/not-found.tsx`)
- Mobile drawer nav, skip-to-content links, focus-visible rings throughout
- Top 5 ranking on landing with rank-#1 emphasis ("Editor's Pick" flag chip + amber wash + ring)
- Top 5 dedup by display root (one Whitefield max)

## Sample brag labels (sanity check)

| Pincode | Area | Brag label |
|---|---|---|
| 560038 | Indiranagar | Top 5% Cleanest Air in Bangalore |
| 560037 | Marathahalli | Bangalore's #1 Lifestyle Density |
| 560066 | Whitefield (EPIP) | Top 5% Lifestyle Density in Bangalore |
| 560048 | Whitefield (Mahadevapura) | Bangalore's #1 Cleanest Air |
| 560034 | Koramangala 1st Block | Top 10% Walkability in Bangalore |

## Known gaps

- Claim CTA is inert (gated with "Soon" pill)
- OG image route per pincode not yet built

## Next milestones

1. Build OG image generation route for `/insights/[pincode]`
2. Wire Claim flow (email collect, ties to Story 2 infra)

## Recent updates

- 2026-04-25 — `/area/[pincode]` (Civic Brief direction) removed. `app/area/` deleted from the codebase; proximity cards, proximity map double-click, and compare CTAs all repointed to `/insights/[pincode]`. `convex/area.ts` (the joined-record query) is unchanged — it backed both routes.
- 2026-04-26 — Lab → live merge: `/insights-lab` deleted; live `/insights` + `/insights/{pincode}` now carry the locked Stitch design with flippable card + real map. Lab-only chrome (Lab Preview badge, Back-to-live link, "Lab Preview" footer text) stripped from the merge.
- 2026-04-26 — One-pass UI audit fixes shipped to lab (carried into the merge): dead-link gating ("Soon" pill on Claim), skip-to-content, focus-visible rings, custom 404, Top-5 rank-1 emphasis, BragChip slate→amber consolidation, methodology ghost link, CardMap lazy-loaded, Live-pulse paused when flipped, wobble paused offscreen.
- 2026-04-26 — Search alias support: typing "Whitefield" now finds 560066/560067/560048 even though Convex search index only knows India Post names ("EPIP" / "Mahadevapura").
- 2026-04-26 — Top 5 dedup by display root + disambiguator visible (no more two "Whitefield" entries).
- 2026-04-26 — Bangalore breadcrumb now a real link to lab landing.
- 2026-04-26 — Flippable card shipped with real Leaflet map (CARTO Dark Matter).
- 2026-04-25 — Civic Brief direction shipped to prod `/area/[pincode]`.
- 2026-04-25 — Trivia narrative misalignment fixed; Convex dev reseeded.
