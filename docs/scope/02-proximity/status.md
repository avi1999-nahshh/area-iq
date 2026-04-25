# Story 2 — Status

> ↩ [Main rollup](../STATUS.md) · [Main scope](../README.md) · [This feature's scope](./scope.md)

Last updated: 2026-04-25.

## Production state

| Variant | URL | State |
|---|---|---|
| Live | `/proximity` | Shipped 2026-04-25 — Phase A (real OSRM road-network routing + Nominatim geocoding). Tab live in shared TopNav. |
| Lab preview | — | n/a — built directly on the canonical route. |

## Known open bugs

- **Address search dropdown not surfacing results to the user.** Reported 2026-04-25 at session close, both prod and localhost. Geocode action is verified working server-side (`npx convex run proximity:geocode '{"query":"Indiranagar"}'` returns 6 results), so the failure is in the client-side flow somewhere between `setSearchQuery` → debounce → `useAction` → `setSearchResults` → render. **First debug step**: temporarily add `console.log` in the `useEffect` of `proximity-client.tsx` (search for "geocode state") on (a) the `searchQuery changed` event, (b) the `firing geocode action` after debounce, (c) the `geocode returned` callback. Hard-refresh the page, type 4-5 chars, observe which log line never prints — that pinpoints the broken step. Suspect candidates in priority order: `useSearchParams()` causing client-side rendering opt-out without Suspense boundary in `app/proximity/page.tsx`; the URL-write `useEffect` re-renders interfering with the debounce; an unhandled error in the `pickGeocoded`/`pickPreset` analytics `track()` call swallowing later code.

## Stitch reference

Local design files (used as starting point, adapted to project's Inter + amber + cream system):

```
/Users/avinashdubey/Downloads/stitch_area_iq_intelligence_platform/commute_based_search/
├── code.html        — Tailwind reference for the layout
└── screen.png       — visual reference
```

## Components shipped

**Frontend (`app/proximity/`)**
- `page.tsx` — server shell, mounts shared TopNav, loads `iq_v2_blr.json`
- `proximity-client.tsx` — form, results, modal, geocode debounce, action wiring
- `proximity-map.tsx` — Leaflet map with office pin, amber commute-window radius, numbered match pins, double-click → `/insights/[pincode]` navigation
- `lib.ts` — mode coefficients, weighted score, haversine fallback, `rankFromMinutes` helper

**Backend (`convex/proximity.ts`)**
- `commuteMatrix` action — OSRM `/table` (chunked at 100), bucketed cache lookup/write
- `geocode` action — Nominatim free-text, Bangalore-bounded viewbox
- `prewarmPresets` action — idempotent batch fill (6 presets × 3 modes; ran 2026-04-25 → 18/18 cells warm)
- `getCachedMatrix` / `upsertCachedMatrix` — internal helpers
- `commute_cache` schema table (parallel-array layout, `by_bucket` index)

**Design polish (audit 2026-04-25)**
- Card stagger via CSS `@keyframes pxFadeUp` (600ms cubic-bezier, 70ms cascade, reduced-motion respected)
- `active:translate-y-[1px]` on cards, transport toggle, prioritize chips, modal segments
- Inline grade ladder replacing the boxed trio (`Air A · Lifestyle A+ · Value B-`)
- Tinted shadows matching project ladder (no `shadow-2xl`)
- Single bottom-left map chip (merged from two)
- Mobile map height bumped (360 / 460 / 640)
- Route status pip beside "Top Matches" header (idle / loading / live / fallback)

## Honest limits (Phase A)

- **No traffic model.** OSRM gives free-flow road times. BLR drives at 9am are ~1.5–2× the displayed number.
- **Public OSRM rate-limited.** Demo server is shared.
- **Nominatim ToS = 1 req/sec.** Address input is debounced 800ms.
- **"Adjust hours" modal selection captured but not wired.** Defers to Phase B.

## Next milestones

1. **Phase B swap** — Mapbox Matrix (`driving-traffic`) for traffic-aware drive times. ~30-min change: replace `OSRM_BASE` + URL builder in `convex/proximity.ts`, add `MAPBOX_TOKEN` to Convex env. Free tier 100k matrix elements/mo covers POC.
2. Wire the "Adjust hours" selection into commute math (rush-hour multiplier or Phase B time-aware API).
3. Replace radius circle with real isochrone polygon (Mapbox Isochrones API).
4. URL state persistence for shareable `/proximity?...` links.
5. OG image for `/proximity`.
6. "Save this search" → email capture (ties to Claim flow infra in Story 3).

## Recent updates

- 2026-04-25 — **Address search dropdown broken in browser** (open). Server-side geocode action fine. Debug path documented above. Defaulted office (Manyata) loads and ranking still works; only the typed-address autocomplete is silent. Session closed mid-debug with logs reverted.
- 2026-04-25 — Removed the user-facing presets dropdown. Work Location is now a pure typeable address search; default initial value (Manyata) lives as an inline `DEFAULT_OFFICE` constant in the client. `OFFICE_PRESETS` array kept in `lib.ts` only to feed the `prewarmPresets` cache-warming action.
- 2026-04-25 — Geocode multi-pass + alias dictionary (`BIAL`, `ORR`, `ECity`, `Forum`, `Phoenix`, etc. expand server-side before Nominatim). Limit bumped to 12, viewbox widened to BLR outer ring + airport, `bounded=0` with hard BLR-bbox filter.
- 2026-04-25 — Office combobox UX: select-all on focus, dropdown opens only when actively searching (no presets-vs-search competition), tri-mode rendering (empty / typing-1-2 / typing-3+).
- 2026-04-25 — **Phase A shipped.** Backend (`convex/proximity.ts`) + frontend live at `/proximity`. OSRM road-network commute matrix, Nominatim geocoding, 7-day cache with 6 presets pre-warmed (18/18 cells filled). Cards click and map pins double-click through to `/insights/[pincode]`.
- 2026-04-25 — Design audit applied: stagger animation, active translate, inline grade ladder, tinted shadows, merged map chips, mobile map bump, route-status pip, skeleton loaders.
- 2026-04-25 — UI freeze on the dummy build: typeable office input, slider, transport toggle, 5 priority chips (Walkability removed), commute-hours modal, ranked match cards, Leaflet map with double-click navigation. Commute math was straight-line × mode coefficient at this point.
