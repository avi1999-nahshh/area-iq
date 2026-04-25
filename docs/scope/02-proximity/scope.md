# Story 2 — Office-centric proximity search

> ↩ Back to [main scoping](../README.md) · See [status](./status.md)

## User story

> As a Bangalore resident with a fixed office, I want to enter my office address, set a max commute time, and see the best neighbourhoods to live in — ranked by the dimensions that matter to me.

## Routes

- `/proximity` — single-page form + ranked results (live)

## Page anatomy

Reference: Stitch design at `/Users/avinashdubey/Downloads/stitch_area_iq_intelligence_platform/commute_based_search/`.

1. **Top nav** — shared TopNav, "Proximity" tab live
2. **Form row**:
   - **Work Location**: typeable combobox — Nominatim address autocomplete (debounced 800ms) + 6 BLR tech-park presets ("Quick picks") in the dropdown
   - **Max Commute Time**: slider with stops at 15 / 25 / 35 / 45 / 60 min, default 35
   - **Preferred Transport**: toggle group (Transit / Drive / Walk)
3. **Prioritize chips** — multi-select for which dimensions to weight more heavily: Air, Lifestyle, Essentials, Connectivity, Affordability. Default: equal weighting. (Walkability removed per 2026-04-25; Safety not in engine.)
4. **Commute hours modal** — micro-disclaimer line below the slider: "Assumes standard office hours · 10am out · 7pm back · Adjust hours". Click opens a modal with two segmented selectors. Selection captured in state; not yet wired into commute math (deferred to Phase B / traffic-aware routing).
5. **Map** — Leaflet (CARTO Voyager tiles): office pin, amber commute-window radius, numbered match pins. Double-click any pin → navigates to `/insights/[pincode]`. Single bottom-left chip shows the active window + dblclick hint.
6. **Top Matches list** — top 6 within commute window, ranked by re-weighted overall score:
   - Rank badge (#1 with amber "Best Match" pill, 2+ neutral)
   - Big mono IQ score
   - Area name + brag label
   - Commute time (≈ N min) + transport icon
   - Rent estimate (2BHK, when available)
   - Inline grade ladder: `Air A · Lifestyle A+ · Value B-`
   - Click-through to `/insights/[pincode]` report card (canonical)
7. **Route status pip** — beside "Top Matches" header: `warming up` / `routing…` / `live · road network` / `fallback · straight-line`. Surfaces whether OSRM is responding.

## Backend (Phase A — live)

- **`convex/proximity.ts`** with three actions:
  - `commuteMatrix({originLat, originLng, mode, destinations[]})` — calls OSRM public `/table` (chunked at 100), caches by 3-decimal-place origin bucket × mode, 7-day TTL
  - `geocode({query})` — Nominatim free-text, Bangalore-bounded viewbox, 5-result cap
  - `prewarmPresets({presets[], destinations[]})` — idempotent batch fill for the 6 preset offices × 3 modes; warmed 18/18 cells on 2026-04-25
- **`commute_cache` Convex table** (parallel arrays for minutes + pincodes), indexed by `bucketKey = "${lat3dp},${lng3dp}|${mode}"`
- **Mode multipliers**: drive 1.0× · transit 0.95× · walk 1.0× (foot profile)
- **Honest limit**: free-flow only — no traffic model. BLR rush-hour drives undersold by ~1.5–2×. Phase B (Mapbox Matrix `driving-traffic`) is a 30-min URL swap when ready.

## Cross-cutting work that lands in this feature

Tracked centrally in [cross-cutting.md](../cross-cutting.md):

- **Share hooks** — eventually a "Share this shortlist" CTA. URL state must be persisted as query params first (`/proximity?office=lat,lng&t=35&mode=transit&w=…`) so the link carries meaning when shared. OG image lower priority than Stories 1 and 3. Share copy TBD.
- **Analytics events** — `Search Submitted` (`surface=proximity`, the office address geocode), `Pincode Viewed` from each Top Match click-through, `Share Clicked` once the shortlist URL is shareable.

## Acceptance criteria — must-have

- [x] Address input with geocoding (Nominatim, debounced 800ms)
- [x] Commute time computation — real road network via OSRM `/table` (free-flow; no traffic model)
- [x] Filter pincodes by commute window
- [x] Re-rank pincodes within the window using user-supplied dimension weights
- [x] Render top 6 matches in a ranked list
- [x] Each match links through to its `/insights/[pincode]` report card
- [x] Mobile responsive (375px+) — form collapses to single column, map+results stack
- [x] Route-status pip + skeleton loaders + haversine fallback if OSRM fails
- [x] Convex cache (7-day TTL, ~110m origin bucketing, pre-warmed presets)

## Acceptance criteria — nice-to-have

- [ ] Phase B: traffic-aware routing via Mapbox Matrix (`driving-traffic`)
- [ ] Wire the "Adjust hours" modal selection into the commute math (rush-hour multiplier or real time-aware API)
- [ ] Real isochrone polygon overlay (replace radius circle)
- [ ] "Save this search" → email capture (gated; ties to Claim flow infra)
- [ ] OG image: "Find your Bangalore neighbourhood" with map preview
- [ ] Persist state to URL params: `/proximity?office=lat,lng&t=35&mode=transit&w=lifestyle,air`

## Dependencies

- IQ v2 dimension engine (✓ shipped)
- OSRM public demo (✓ live; rate-limited; Phase B swap planned)
- Nominatim public (✓ live; ToS = 1 req/sec; debounced)
- Convex `commute_cache` table (✓ shipped)

## Resolved decisions

- ~~**Geocoding provider?**~~ → **Nominatim for Phase A.** Mapbox in Phase B.
- ~~**Commute estimation strategy?**~~ → **OSRM `/table` (road network, free-flow) for Phase A.** Mapbox Matrix `driving-traffic` in Phase B.
- ~~**Click-through target?**~~ → `/insights/[pincode]` (canonical report card; `/area/` removed).
- ~~**Walkability in priority chips?**~~ → removed.

## Open questions

- **Phase B trigger** — when do we add a Mapbox token and swap for traffic-aware drive times? (Free tier covers 100k matrix elements/mo; needs card on file.)
- **Adjust-hours wiring** — should the modal selection apply a rush-hour multiplier (cheap) or wait for real time-of-day data via Phase B (accurate)?
- **Save-search → email capture** — defer until a Claim flow is built (shared infra with Story 3).

## Out of scope (this feature)

- Multi-office (commuting between two offices alternately)
- Carpool / public-transit-only modes (Transit / Drive / Walk only)
- Real-time traffic adjustment beyond what Mapbox Matrix provides
- Commercial property recommendation (residential pincodes only)
- Cross-city search (POC = Bangalore urban tier only)
