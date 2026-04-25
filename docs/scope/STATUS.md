# AreaIQ — Production Status

> Rollup. For per-feature detail follow the links. For scope-level decisions see [README.md](./README.md).

Last updated: 2026-04-26.

## At a glance

| Story | Live in prod? | Live URL | Lab preview | Detail |
|---|---|---|---|---|
| 1 — Compare | yes | https://area-iq-one.vercel.app/compare · /compare/{slug-a}-vs-{slug-b} | — | [01-compare/status.md](./01-compare/status.md) |
| 2 — Proximity | yes (search dropdown bug open) | https://area-iq-one.vercel.app/proximity | — | [02-proximity/status.md](./02-proximity/status.md) |
| 3 — Report card | yes | https://area-iq-one.vercel.app/insights · /{pincode} | — | [03-report-card/status.md](./03-report-card/status.md) |

## Convex

| Deployment | URL | State |
|---|---|---|
| dev | https://calculating-sturgeon-828.convex.cloud | Active. Used by Vercel prod via `NEXT_PUBLIC_CONVEX_URL`. Last reseeded 2026-04-25. |
| prod | https://posh-lyrebird-724.convex.cloud | Exists, unseeded, no traffic. |

## Vercel

| Project | URL | State |
|---|---|---|
| area-iq | https://area-iq-one.vercel.app | Live, latest deploy 2026-04-25 (commits `a092ea9` compare ship + `82c6ad1` Suspense fix). Pushed via `vercel --prod` after the GitHub webhook was slow. |

## Open follow-ups

Cross-cutting items that don't belong inside a single feature's status. Move them into a feature's `status.md` once they're scoped, then check off here.

- [ ] **Copy review pass.** Headlines, subheads, brag labels, trash-talk lines, methodology prose, the landing-page voice. Currently a mix of placeholder-sharp and product-final — needs an editor's read once the three features are visually settled. Surfaces to cover: `/`, `/insights`, `/insights/[pincode]`, `/compare`, `/methodology`, share-card text, OG titles + descriptions.
- [ ] **Share hooks** — OG image routes (`/api/og/insights`, `/api/og/compare`), `<ShareButton>` with native Web Share API + WhatsApp/X/LinkedIn/Copy fallbacks, share-copy helper. Full plan: [cross-cutting.md § A](./cross-cutting.md#a-share-hooks). Phasing: Insights OG + button first, Compare second, share-as-image deferred.
- [ ] **Analytics** — Plausible custom events for the funnel (`Feature Click`, `Search Submitted`, `Pincode Viewed`, `Card Flipped`, `Compare Submitted`, `Share Clicked`, `404 Hit`). Plausible + Vercel Analytics already wired in `app/layout.tsx` — only the `track()` helper + call sites remain. Full plan: [cross-cutting.md § B](./cross-cutting.md#b-analytics). Phasing: top-of-funnel first, share events depend on the hook above shipping.

## Recent rollouts

- 2026-04-25 — `app/proximity/page.tsx` wrapped in `<Suspense>` to unblock the Next.js 16 static prerender (`useSearchParams()` was firing during prerender). Commit `82c6ad1`. Same prod deploy as Story 1.
- 2026-04-25 — Proximity v1.1: removed user-facing presets, geocode multi-pass + alias dictionary (BIAL/ORR/ECity etc), tri-mode dropdown, select-all-on-focus. **Address autocomplete dropdown bug open** — geocode action returns results server-side but the typed-search results don't render in the browser. Session closed mid-debug; first reproduction step + suspect list in `02-proximity/status.md`. Default Manyata office still loads and the ranked-card flow still works, so the page isn't broken — only typed-address autocomplete is silent.
- 2026-04-25 — **Story 1 (Compare) shipped end-to-end redesign.** `/compare` is now the canonical route with slug-form URLs (`/compare/indiranagar-vs-koramangala`); legacy `?a=&b=` URLs 307 to slug. New page anatomy: asymmetric hero with light single-map plate (CARTO Positron, both pincodes pinned + dashed amber connector), two-bar autocomplete picker row, dramatic verdict card with `<ShareButton>`, three-card delta bento (Lifestyle / Rent / Air), six-dim "Tale of the Tape". Engine fixes: IDW air-quality smoothing across K=3 nearest CPCB stations, IDW rent smoothing across K=3 nearest locality-confident pincodes (rent coverage 45% → 86%), confidence-aware `(city median)` UI tags. Plausible analytics wired: `Compare Viewed`, `Compare Picker Changed`, `Share Clicked`. TopNav `Compare` flipped to `ready=true`.
- 2026-04-25 — `/methodology` page documented Proximity. New section "How proximity search works" (3-step user-friendly explainer + honest limits). Sources table picks up OpenStreetMap routing + Nominatim entries. Stale "starts with straight-line" bullet in Limitations corrected.
- 2026-04-25 — **Story 2 (Proximity) shipped Phase A.** New route `/proximity` with typeable office combobox (Nominatim geocoding, Bangalore-bounded), commute-window slider, transport toggle, 5 priority chips (Air / Lifestyle / Essentials / Connectivity / Affordability), Leaflet map with double-click pin → `/insights/[pincode]` navigation, ranked match cards with inline grade ladders. Backend: `convex/proximity.ts` (commuteMatrix + geocode + prewarmPresets actions, `commute_cache` table with 7-day TTL and 110m origin bucketing). Real OSRM road-network routing (free-flow; no traffic model — Phase B = Mapbox). 6 BLR tech parks × 3 modes pre-warmed (18/18 cells).
- 2026-04-25 — `/area/[pincode]` (Civic Brief) **removed**. `/insights/[pincode]` is now the sole canonical report-card route. Proximity cards, proximity map double-click, and compare CTAs all repointed. Convex `area.getByPincode` query unchanged (still backs `/insights/`).
- 2026-04-26 — `/insights-lab` design merged into live `/insights`. The lab tree is deleted; `/insights` and `/insights/{pincode}` now carry the locked Stitch direction with the flippable card, real CARTO Dark Matter map, 4-card bento, custom 404, alias-aware search, rank-#1 emphasis, and the full a11y pass.
- 2026-04-26 — `/insights-lab` Stitch-direction preview built local-only first; merged same day after sign-off.
- 2026-04-25 — Trash-talk verdict engine (Story 1) shipped to `/compare` in prod with decisive headlines.
- 2026-04-25 — Trivia narrative misalignment fixed: 1077 of 1079 narratives recovered. Pipeline patched to prevent regression. Convex dev reseeded.
- 2026-04-25 — `NEXT_PUBLIC_CONVEX_URL` set on Vercel prod (was empty); report-card routes now resolve correctly in prod.
- 2026-04-25 — `PincodeSearch` removed from landing page per "keep area separate" decision.

## How to update this file

When something changes prod state for any of the three stories:

1. Update the **At a glance** table row for that story.
2. Add a one-line entry to **Recent rollouts** with the date.
3. Update the *Last updated* date at the top.
4. Update the corresponding `0X-{story}/status.md` with the deeper detail.
