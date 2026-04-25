# Story 1 — Compare two neighbourhoods

> ↩ Back to [main scoping](../README.md) · See [status](./status.md)

## User story

> As an urban citizen, I want to compare two Bangalore neighbourhoods side-by-side **by name** (not pincode), so I can decide between them or settle a debate.

## Routes

- `/compare?a={pincode}&b={pincode}` — current live
- `/compare?a={name}&b={name}` — proposed: accept names too, resolve client-side via Convex `searchByName` + alias map

## Page anatomy

1. **Top nav** — same as `/insights-lab`: logo, search, "Lab Preview" badge (or "Compare" tab active), Back-to-live link
2. **Hero** — "Head-to-Head" title + a one-liner ("Compare any two Bangalore neighbourhoods")
3. **Two name-search inputs** — A and B side-by-side with "VS" divider; each input behaves like the existing `<AreaSearch>` autocomplete with Bangalore filter
4. **Two MiniMaps** — one per area, real Leaflet with CARTO Dark Matter base + amber 1.5km radius (matching Story 3 lab card style)
5. **Verdict block**:
   - Decisive headline (`{Winner} wins by {N} points` / `edges it by {N}` / `dead heat`)
   - Trash-talk subhead (rent delta / AQI delta / crime delta / metro km / café count / fallback)
   - Audience tag chip ("Best for Young Professionals")
   - Dim-wins counter ("4 of 5 dimensions")
6. **Receipts table** — 6 rows, side-by-side comparison (rent, AQI, metro km, cafés, restaurants, walkability). Winner per row in amber.
7. **CTA row** — `→ {A} report card` and `→ {B} report card` links to `/insights-lab/[pincode]`. (Share / Save deferred.)

## Acceptance criteria — must-have

- [x] Decisive verdict engine (no hedging — always picks a winner or "dead heat")
- [x] Trash-talk subhead with concrete tradeoff clause
- [x] Audience tag derivation
- [x] 5+ dimension comparison rows
- [ ] **Name-search inputs** at the top (replace pincode-only)
- [ ] **Migrate UI to lab design system** (Inter, JetBrains Mono numerals, white cards, amber accents, grain overlay) — currently slate-amber Civic Brief
- [ ] **Real Leaflet maps** with CARTO Dark Matter + amber overlay (matching Story 3 card map)
- [ ] Mobile responsive (375px+)
- [ ] Custom 404 / fallback when one or both inputs are out of scope (e.g. user inputs Mumbai pincode)
- [ ] Both inputs default to Bangalore neighbourhoods (e.g. Indiranagar vs Koramangala instead of current `560034 vs 400050`)

## Acceptance criteria — nice-to-have

- [ ] Pre-fill from URL: `/compare?a=indiranagar&b=koramangala` (resolve names → pincodes server-side via Convex)
- [ ] OG image at `/api/og/compare?a={pincode}&b={pincode}` (1200×630 horizontal social card with verdict + both names + score delta)
- [ ] "Battle another" CTA at the bottom (clears inputs)

## Dependencies

- IQ v2 dimension engine (✓ shipped, shared with Stories 2 + 3)
- Convex `searchByName` query (✓ shipped, shared)
- BLR alias map for India Post → colloquial names (✓ shipped, shared)
- `app/compare/verdict.ts` — pure function (✓ shipped — reusable for OG image route)

## Open questions

- **Default empty state:** which two pincodes? Currently `560034 vs 400050` (Mumbai out of scope). Pick two viral-baited Bangalore battles like Indiranagar vs Koramangala or HSR vs Whitefield.
- **Ambiguous lookup:** when user types "Indiranagar" — Solapur also has one. Do we autocomplete-only, or fall through to Bangalore-first match?
- **Tie-breaker copy:** "dead heat" lands well; should the in-laws joke stay, or rotate from a small bank?

## Out of scope (this feature)

- Sharing CTAs (deferred)
- Saved comparisons (deferred — ties to sign-up infra)
- Cross-city comparisons (POC scope = Bangalore only)
- 3-way and N-way comparisons
