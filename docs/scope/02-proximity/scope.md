# Story 2 — Office-centric proximity search

> ↩ Back to [main scoping](../README.md) · See [status](./status.md)

## User story

> As someone moving to Bangalore, I want to enter my office address, set a max commute time, and see the best neighbourhoods to live in — ranked by my own dimension priorities.

## Routes

- `/proximity` — single-page form + ranked results

## Page anatomy

Reference: Stitch design at `/Users/avinashdubey/Downloads/stitch_area_iq_intelligence_platform/commute_based_search/`.

1. **Top nav** — same shared TopNav, "Proximity" tab active
2. **Form row**:
   - **Work Location**: address input with geocoding autocomplete
   - **Max Commute Time**: slider with stops at 15 / 25 / 35 / 45 / 60 min
   - **Preferred Transport**: toggle group (Transit / Drive / Walk)
3. **Prioritize chips** — multi-select for which dimensions to weight more heavily: Safety, Lifestyle, Affordability, Air, Walkability, Connectivity. Default: equal weighting.
4. **Map** — shows the office location pin + a transit isochrone overlay (or fallback to a circle for the simple case)
5. **Top Matches list** — right side (or below map on mobile). Ranked pincodes within commute window, each with:
   - Rank badge (#1 with "Best Match" amber pill, ranks 2+ neutral)
   - Big mono overall score
   - Area name + brag label
   - Commute time estimate + chosen transport mode
   - Rent estimate (if available)
   - Click-through to `/insights/[pincode]` report card

## Acceptance criteria — must-have

- [ ] Address input with geocoding (free-tier provider TBD — see open questions)
- [ ] Commute time computation: at minimum, straight-line distance × transport mode coefficient (e.g. 2 km/min for transit, 0.5 for walk; refine later with real isochrone API)
- [ ] Filter pincodes by commute window
- [ ] Re-rank pincodes within the window using user-supplied dimension weights
- [ ] Render top 6–10 matches in a ranked list
- [ ] Each match links through to its `/insights/[pincode]` report card
- [ ] Mobile responsive (375px+) — form collapses into a column, list and map stack

## Acceptance criteria — nice-to-have

- [ ] Real isochrone via OSRM-self-hosted or Mapbox Isochrones API
- [ ] "Save this search" → email capture (gated; ties to Claim flow infra)
- [ ] OG image: "Find your Bangalore neighbourhood" with a map preview
- [ ] Persist state to URL params so the search is shareable: `/proximity?office=lat,lng&t=35&mode=transit&w=safety,lifestyle`

## Dependencies

- IQ v2 dimension engine (✓ shipped — same scoring used in Stories 1 + 3)
- Geocoding API — **not chosen yet** (see open questions)
- Commute computation — **strategy not chosen yet**

## Open questions

- **Geocoding provider?**
  - Mapbox: free tier 100k req/mo — best ergonomics, requires account + token
  - OpenCage: free tier 2.5k/day — fine for POC
  - Nominatim (OSM): no key, but rate-limited and slow under load; ToS limits
  - Recommendation: start with Nominatim for the POC, swap when we have real traffic
- **Commute estimation strategy?**
  - Straight-line × mode coefficient: trivially fast, very rough — Bangalore traffic mocks this
  - OSRM hosted: accurate, free, ops cost
  - Mapbox Isochrones: accurate, paid above free tier
  - Recommendation: ship straight-line for v1 with a clear "estimated, road traffic ignored" label; upgrade after the search has user signal
- **How do we surface commute estimate uncertainty?** Probably a tooltip + inline "≈" prefix on the time figure

## Out of scope (this feature)

- Multi-office (commuting between two offices alternately)
- Carpool / public-transit-only modes (we offer Transit / Drive / Walk only)
- Real-time traffic adjustment
- Commercial property recommendation (residential pincodes only)
- Cross-city search (POC = Bangalore)
