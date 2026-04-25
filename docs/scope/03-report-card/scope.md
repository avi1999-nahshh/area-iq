# Story 3 — Neighbourhood report card

> ↩ Back to [main scoping](../README.md) · See [status](./status.md)

## User story

> As a user, I want a comprehensive view of one Bangalore neighbourhood across the dimensions that matter, so I can understand its trade-offs and decide whether to act on it.

## Routes

- `/insights/[pincode]` — **canonical report card** (Stitch white-amber direction with flippable share card, 4-card bento, alias-aware search). Both `/area/[pincode]` (Civic Brief) and `/insights-lab/[pincode]` (lab preview) have been removed; `/insights/` is the single source of truth as of 2026-04-25.

## Page anatomy (lab direction)

1. **Top nav** — sticky `bg-white/85 backdrop-blur` with logo, name search, "Lab Preview" badge, hamburger drawer on mobile
2. **Breadcrumb** — `Insights / Bangalore / {Name}` — both segments are real links (Insights → lab landing, Bangalore → lab landing)
3. **Hero** — asymmetric on lg+, centered on smaller screens:
   - **Left**: brag chip (rank-aware: trophy / shield-check / shield / dot), big italic h1 "Indiranagar: Top 5% Cleanest Air", outperform subhead, Claim CTA (gated as "Soon"), ghost "Read methodology ↓" link
   - **Right**: flippable share card — front shows live AreaIQ + real CARTO Dark Matter map (1.5km amber radius + amber pin) + big overall score; back shows 6-dimension breakdown
4. **Bento** — 4 feature cards: Walkability (loud, 2-col on lg+), Air Quality (narrow, with celebrate/warn tones), Transit Proximity (dark variant), Lifestyle Density (horizontal split, 2-col on lg+)
5. **Deep Dive** — 7-row table: Air, Essentials, Lifestyle, Connectivity, Density & Activity, Affordability, Walkability. Each row: score, percentile, mini-bar, contextual blurb. Mobile collapses note under the bar.
6. **Methodology line** — `Pincode {pc} · {district} · Sources: CPCB · OSM · Census · 99acres · Bengaluru Metro · BMTC` next to the table
7. **Footer + skip-link**

## Cross-cutting work that lands in this feature

Tracked centrally in [cross-cutting.md](../cross-cutting.md). The pieces that belong on this surface specifically:

- **Share hooks** — OG route `/api/og/insights?pc={pincode}` wired into `generateMetadata`, `<ShareButton>` placed near the FlippableCard + at the bottom of Deep Dive. Share copy: *"{Name} scored {overall}/100 on AreaIQ — {brag_label}. {url}"*
- **Analytics events** — `Pincode Viewed`, `Card Flipped`, `Search Suggested` (when the autocomplete fires), `Share Clicked` (when share hooks ship)

## Acceptance criteria — must-have

- [x] Search by name (autocomplete with disambiguation, Bangalore-only filter, alias-aware)
- [x] All 6 dimensions render with proper composition + subhead generated honestly
- [x] Auto brag label (rank-aware, gated on absolute air quality + station distance)
- [x] Mobile responsive (375px+)
- [x] A11y: skip-to-content, focus-visible rings, mobile drawer nav, custom 404
- [x] Custom 404 for out-of-scope pincodes
- [x] Real Leaflet map on the share card with dark-mode tiles + amber palette
- [x] Flippable share card with score breakdown on back
- [ ] Claim flow wired (currently inert "Soon" pill)
- [ ] OG image generation per pincode

## Acceptance criteria — nice-to-have

- [x] Ghost methodology link scrolls to Deep Dive (`#deep-dive` anchor)
- [x] Idle wobble animation on the share card suggests back face exists
- [x] Wobble pauses when card is offscreen (IntersectionObserver)
- [x] Live pulse pauses when card is flipped to the back

## Dependencies

- Convex `area.searchByName` query with `withSearchIndex` (✓ shipped)
- IQ v2 dimension engine in `data/processed/iq_v2_blr.json` (✓ shipped)
- Brag label generator with absolute-AQI honesty gate (✓ shipped)
- BLR alias map for India Post → colloquial names (✓ shipped)
- `<AreaSearch>` component with alias-aware client-side fallback (✓ shipped)

## Open questions

- **Should the Claim CTA collect email or open a sign-up modal?** Defer until Story 2 is built so we can share the same email-capture infra.
- **When we expand beyond Bangalore, where does the alias map live?** Per-city files vs denormalized `name_search` field on the Convex `pincodes` table.
- ~~**Final route name**~~ — resolved 2026-04-25: `/insights/[pincode]` is canonical. `/area/` and `/insights-lab/` removed.

## Out of scope (this feature)

- Sharing affordances (deferred per user 2026-04-25)
- Cross-pincode comparison (lives in Story 1)
- Saved shortlist (deferred — ties to sign-up infra in Story 2)
- Cities other than Bangalore
