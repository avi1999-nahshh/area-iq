# Story 1 — Compare two neighbourhoods

> ↩ Back to [main scoping](../README.md) · See [status](./status.md)

## User story

> As a Bangalorean about to settle a debate ("HSR or Koramangala?"), I pick two areas by name, get a verdict that's playful enough to screenshot and share, and the friend who sees it clicks in to run their own.

## Why this is the virality hook

The Virality rubric is explicit (`handbook/09-scoring.md`, lines 41-47): "what does a user screenshot from your product?" — it has to be a personalised artifact (a stat, label, score, ranking) about something the user cares about. Compare is the only one of the three AreaIQ stories where the artifact is generated *by the user's choice*: two named places they care about, judged on shared math, with a punchy verdict on top.

Story 3 (`/insights`) gives users a report card about an area. Story 1 turns that engine into a *contest the user authored* — and a contest is the unit people share.

## The viral loop (target)

1. **Pick** — type two area names (e.g. Indiranagar, Koramangala). No pincode friction.
2. **Verdict** — one-screen result with a screenshotable card: headline, trash-talk subhead, audience tag, dim-wins counter, receipts.
3. **Share** — WhatsApp first, then X/LinkedIn, then copy-link. Link unfurls with an OG image of the verdict so the artifact shows up inline in the chat.
4. **Click-through** — friend lands on the same `/compare?…`, sees the verdict, then *swaps one side* to challenge it ("but what about JP Nagar?").
5. Loop runs.

The screenshot test from the rubric: if a user can screenshot the verdict card on a 375px mobile screen and the image stands alone (winner, both names, the spicy line, the wordmark) — viral loop present.

## Routes

- `/compare?a={pincode|name}&b={pincode|name}` — accept either; resolve names server-side via Convex `searchByName` + alias map
- `/api/og/compare?a=&b=` — 1200×630 social card; verdict headline + both names + delta + AreaIQ wordmark
- (Nice-to-have) `/compare/{slug-a}-vs-{slug-b}` — clean shareable URL ("indiranagar-vs-koramangala") that resolves to canonical pincodes

## Page anatomy (functional, not visual)

Visual treatment comes from the design-research phase below. Functional blocks the page must contain:

1. Top nav (shared with `/insights`)
2. Two name-search inputs with a "VS" affordance, prefilled with a curated viral pair
3. Two area mini-cards — name, district, brag chip, overall score, real Leaflet map (CARTO Dark Matter + 1.5km amber radius, matching the `/insights` share card)
4. **Verdict block** — the screenshot moment: headline, trash-talk subhead, audience tag, dim-wins counter
5. **Receipts** — side-by-side rows aligned to the v2 dimensions (Air, Essentials, Lifestyle, Connectivity, Density, Affordability, Walkability), winner per row called out
6. **Share row** — WhatsApp / X / LinkedIn / Copy-link, each prefilled with verdict text + URL
7. **Battle another** — clears one or both inputs, refocuses A
8. CTA links to each side's `/insights/[pincode]` report

## The shareable artifact

The single most important surface in this feature. A self-contained card that:

- Reads in 3 seconds: who won, by how much, the tradeoff
- Has the AreaIQ wordmark + URL on it (screenshots route traffic back)
- Looks complete on a 375px mobile screenshot — no hanging chrome
- Renders identically as: the in-page verdict block, the OG image (`/api/og/compare`), and (optional) a "download as image" button

Design research should return 3 options for this card specifically. Everything else on the page is supporting cast.

## Playful mechanics — menu for the design phase

A grab-bag of devices that could carry the playful angle. Pick 1-2 during design — not all at once.

- **Trash-talk ladder** (shipped) — decisive headlines, tradeoff clauses, audience tags. Keep.
- **Curated rivalries** on the empty state — "HSR vs Whitefield", "Indiranagar vs Koramangala", "JP Nagar vs Jayanagar" as one-tap presets. Lowers input friction, primes the loop.
- **Verdict grid** (Wordle-ish) — 6 emoji squares, one per dimension, coloured by winner. Copy-paste-able into any chat without a screenshot.
- **Audience tag as headline** — "Better for Young Professionals" framed as the shareable claim, not a footnote.
- **Side-with poll** — anonymous tally per browser; verdict card shows running totals ("63% sided with Indiranagar"). Backed by Convex.
- **Battle streak** — counts comparisons in a session, surfaces a "5 battles deep" badge for the bragger.

## Acceptance criteria — must-have

- [ ] **Name-search inputs** at top, alias-aware (Whitefield → 560066/067/048), Bangalore-only filter
- [ ] **Curated default pair** on empty state — two well-known BLR neighbourhoods (current default is `560034 vs 400050`, Mumbai is out of POC scope)
- [ ] **Scope guard** — friendly fallback when either input resolves outside the BLR urban set
- [ ] **Receipts table aligned to v2 dimensions** (Air, Essentials, Lifestyle, Connectivity, Density, Affordability, Walkability). Verdict engine currently still references v1 dims (safety, cleanliness, infra) and reads from a v1 shape — needs migration to `iq_v2_blr.json`
- [ ] **Real Leaflet maps** per side (CARTO Dark Matter + amber 1.5km radius), matching `/insights`
- [ ] **Share row** — WhatsApp + X + LinkedIn + copy-link, each prefilled with verdict text + URL
- [ ] **OG image** at `/api/og/compare?a=&b=` (1200×630), AreaIQ wordmark + URL on-card
- [ ] **Mobile-first responsive** (375px+); verdict card screenshotable without horizontal scroll
- [ ] **Migrate UI to locked design system** (Inter, JetBrains Mono numerals, white cards, amber accents, grain overlay) — current `/compare` is still on the older slate-amber Civic Brief
- [ ] Custom 404 / fallback for invalid inputs

## Acceptance criteria — nice-to-have

- [ ] **Pretty slug URLs** — `/compare/indiranagar-vs-koramangala`
- [ ] **Curated rivalries strip** on the empty state (4-6 one-tap battles)
- [ ] **Battle another** CTA at bottom (clears inputs)
- [ ] **Verdict grid** (Wordle-style emoji recap) embedded in WhatsApp share text
- [ ] **Side-with poll** with Convex-backed tally
- [ ] **Disambiguation tooltip** — when "Indiranagar" matches Bangalore + Solapur, show city next to suggestion

## Dependencies

- IQ v2 dimension engine — `data/processed/iq_v2_blr.json` (✓ shipped, shared)
- Convex `area.searchByName` (✓ shipped, shared)
- BLR alias map — `app/insights/blr-aliases.ts` (✓ shipped, shared)
- `<AreaSearch>` from `app/insights/area-search.tsx` (✓ shipped, reusable)
- `app/compare/verdict.ts` — pure function (✓ shipped, but needs v1→v2 dim migration before the receipts row work)
- New: `/api/og/compare` route using `@vercel/og` (or equivalent)

## Open questions (need alignment before design phase)

1. **Default empty-state pair** — Indiranagar vs Koramangala? HSR vs Whitefield? Or rotate the default weekly to seed novelty?
2. **Pretty slug URLs** — ship in v1, or defer until analytics show share patterns warrant the routing work?
3. **Side-with poll** — does the running tally make the artifact more share-worthy, or is it scope creep against a 4-day window?
4. **Share copy** — one canonical line ("HSR edges Koramangala by 7. Receipts: areaiq.app/…") or rotate from a small bank?
5. **OG image style** — mirror the in-page verdict card 1:1, or design a tighter "winner takes all" frame purpose-built for chat unfurl?
6. **Pincode disambiguation** — autocomplete-only, or fall through to Bangalore-first silently when the user types a name like "Indiranagar"?
7. **Three-way / N-way battles** — currently out of scope. Confirm.

## Out of scope (this feature)

- Saved comparisons / accounts (ties to sign-up infra)
- Cross-city comparisons (POC = Bangalore only)
- 3-way and N-way battles
- Leaderboards ("most-battled BLR area this week") — interesting later, not now
- Editable / weighted dimensions (lives in Story 2 — Proximity)

## Next step

Design-research phase. Pull references from comparison UIs in the wild — Wirecutter head-to-heads, Spotify Wrapped, Wordle's score grid, Strava activity comparisons, Cricinfo head-to-heads, dating-app match cards, BuzzFeed quizzes, Polymarket result cards — alongside the existing Stitch boards that informed `/insights`. Return with **3 options for the shareable artifact** specifically, plus **2 directions for the page that surrounds it**.
