# Story 1 — Compare two neighbourhoods

> ↩ Back to [main scoping](../README.md) · See [status](./status.md)

## User story

> As a Bangalorean about to settle a debate ("HSR or Koramangala?"), I pick two areas by name, get a verdict that's playful enough to screenshot and share, and the friend who sees it clicks in to run their own.

## Why this is the virality hook

The Virality rubric is explicit (`handbook/09-scoring.md`, lines 41-47): "what does a user screenshot from your product?" — it has to be a personalised artifact (a stat, label, score, ranking) about something the user cares about. Compare is the only one of the three AreaIQ stories where the artifact is generated *by the user's choice*: two named places they care about, judged on shared math, with a punchy verdict on top.

Story 3 (`/insights`) gives users a report card about an area. Story 1 turns that engine into a *contest the user authored* — and a contest is the unit people share.

## The viral loop (live)

1. **Pick** — two search bars at the top, type or autocomplete-select two BLR areas.
2. **Verdict** — one-screen result: dramatic headline, edgy trash-talk line from a deterministic copy bank, audience tag, two big mono scores with brag chips, a 3-card delta bento (Lifestyle / Rent / Air), the "Tale of the Tape" 6-dim row stack.
3. **Share** — primary path is the user screenshotting the verdict card to a group chat. The card carries the AreaIQ wordmark + URL slug printed on-card so screenshots route traffic back. A `<ShareButton>` (native Web Share on mobile, X / WhatsApp / LinkedIn / copy-link dropdown on desktop) lives in the card footer for the chats where screenshots don't paste cleanly.
4. **Click-through** — friend lands on the canonical slug (e.g. `areaiq.app/compare/indiranagar-vs-koramangala`), runs their own comparison, swaps a side ("but what about JP Nagar?").
5. Loop runs.

The screenshot test from the rubric: if a user can screenshot the verdict card on a 375px mobile screen and the image stands alone (winner, both names, spicy line, wordmark, URL) — viral loop present.

## Routes (live)

- `/compare/{slug-a}-vs-{slug-b}` — canonical URL (e.g. `/compare/indiranagar-vs-koramangala`). Slug parser handles auto-disambiguator suffixes (`whitefield-epip-vs-koramangala`).
- `/compare` (no params) — server-side 307 to the default pair `/compare/indiranagar-vs-koramangala`.
- Legacy `/compare?a=&b=` query-param URLs continue to resolve via server-side 307 to the slug form (preserves any previously-shared links).

## Page anatomy (live)

1. Top nav (shared with `/insights`) — `Compare` tab is now `ready=true`.
2. Breadcrumb: `Compare / Bangalore / {A} vs {B}`.
3. **Asymmetric hero** (`lg:grid-cols-[1.15fr_1fr]`) — heading + sub-line on the left, single light CARTO Positron map on the right with both pincodes pinned in amber and a dashed amber connecting line. Distance caption: "X.X km apart · same Bangalore".
4. **Two search bars** with a "VS" pill divider — type-ahead autocomplete, BLR-only, alias-aware. Picker selection rewrites the URL to a fresh canonical slug.
5. **Verdict card** — kicker, italic headline, share-line from the rotating copy bank, audience flag-chip, two ScoreBlocks (BragChip + mono score + name) flanking a black `VS` pill, footer with wordmark + URL slug + `<ShareButton>`.
6. **Bento — three deltas** (`lg:grid-cols-[2fr_1fr_1fr]`): Lifestyle Gap (amber hero card), Rent Gap (dark slate card, fallback-aware), Air Gap (white card with IDW caveat). Card-stagger entrance.
7. **Tale of the Tape** — six dimensions (Air, Essentials, Lifestyle, Connectivity, Density, Affordability). Each row: dim label + plain-English description + per-side mono score + "Top X% in BLR" micro-tag + bar. Affordability shows a `(city median)` micro-tag for fallback pincodes.
8. CTA links to each side's `/insights/[pincode]` report.

## The shareable artifact

Self-contained verdict card that:
- Reads in 3 seconds: who won, by how much, the spicy tradeoff
- Has the AreaIQ wordmark + URL slug printed on-card
- Looks complete on a 375px mobile screenshot — no hanging chrome, no clipped edges
- Carries a `<ShareButton>` in the footer for engineered share (native + WhatsApp / X / LinkedIn / copy-link)

## Playful mechanics

Locked in:
- **Trash-talk ladder** — decisive headlines + tradeoff clauses + audience tags. Migrated to the v2 dim engine.
- **Edgy share-copy bank** — small rotating bank of trash-talk lines per (winner-dim × delta-band) combination, picked deterministically by `hash(a, b)`. Tone: catchy, edgy, paste-able.

Tried and rejected:
- **Side-with poll** — built and removed 2026-04-25. Hard to control across sessions, didn't add enough share value. Don't re-propose without a different control story (see `feedback_compare_no_poll.md` memory).

Future menu (deferred):
- **Verdict grid** (Wordle-ish) — 6 coloured emoji squares, one per dimension. Useful as a paste-able fallback for chats where screenshots don't render.
- **Battle streak** — counts comparisons in a session, surfaces a "5 battles deep" badge.

## Analytics events (live)

Plausible custom events fired from `app/_lib/track.ts`. See `docs/scope/cross-cutting.md` for the full event taxonomy.

| Event | Fires when | Props |
|---|---|---|
| `Compare Viewed` | Page render (once per pair) | `pincode_a`, `pincode_b`, `winner_pincode` (or "tie"), `delta`, `tie` |
| `Compare Picker Changed` | User selects an area in either picker | `side` ("a" / "b"), `from_pincode`, `to_pincode` |
| `Share Clicked` | User taps share / picks a target in the dropdown | `surface` ("compare"), `target` ("native" / "whatsapp" / "x" / "linkedin" / "copy"), `pincode_a`, `pincode_b`, `winner_pincode` |

## Acceptance criteria — must-have (all shipped)

- [x] **Two search bars** at top, type-ahead autocomplete, alias-aware (Whitefield → 560066/067/048), Bangalore-only filter
- [x] **Default pair** on `/compare` (no params) = Indiranagar vs Koramangala; URL rewrites to slug
- [x] **Pretty slug URLs** — canonical form. Legacy `?a=&b=` 307s to slug
- [x] **Auto-disambiguated slugs** (`whitefield-epip-vs-koramangala`) — never asked of the user
- [x] **Out-of-Bangalore handler** — friendly "AreaIQ is Bangalore-only for now — more cities launching soon" panel
- [x] **Tale of the Tape — six dimensions** (Air, Essentials, Lifestyle, Connectivity, Density, Affordability), v2 engine, plain-English row descriptions
- [x] **Edgy share-copy bank** — small rotating bank, deterministic per pair, catchy/funny tone
- [x] **Single hero map** — CARTO Positron light, both pincodes pinned in amber, dashed amber connecting line, distance caption
- [x] **Verdict card prints AreaIQ wordmark + URL slug** so screenshots route traffic back
- [x] **Mobile-first responsive** (375px+); verdict card screenshotable without horizontal scroll
- [x] **UI on the locked design system** (Inter, JetBrains Mono numerals, white cards, amber accents, grain overlay) — matches `/insights`
- [x] **`<ShareButton>` integration** — native + WhatsApp / X / LinkedIn / copy-link, fires `Share Clicked` analytics
- [x] **Plausible analytics** wired for `Compare Viewed`, `Compare Picker Changed`, `Share Clicked`
- [x] **Confidence-aware rent surface** — Rent Gap card and Affordability row both flag `(city median)` when a side is a fallback rather than a real locality match
- [x] **IDW air-quality smoothing** — replaces single-station nearest-only assignment, with a 50/50 BLR-median fallback for under-monitored pincodes
- [x] **IDW rent smoothing** — fills 53 of the 71 city-median fallbacks with per-pincode estimates from the K=3 nearest locality-confident pincodes within 8 km

## Acceptance criteria — nice-to-have

- [ ] **Battle another** CTA at bottom (clears inputs, refocuses A)
- [ ] **Verdict grid** (Wordle-style emoji recap) — paste-able fallback for chats where screenshots don't render
- [ ] **Audience tag as headline** treatment (design-phase decision)
- [ ] **Battle streak** — session-counted "N battles deep" badge
- [ ] **OG image route** at `/api/og/compare` — would let the slug URL unfurl with the verdict pre-rendered in chats. Currently relying on screenshots.

## Decisions locked

- Default empty-state pair: **Indiranagar vs Koramangala**, URL rewrites to slug form
- URL strategy: **pretty slugs** are canonical, query params 307 to slug
- Slug disambiguation: **automatic** via the autocomplete pincode selection — user never picks the suffix
- Sharing: **both screenshot-first AND engineered share** (the original screenshot-only decision was relaxed when the cross-cutting `<ShareButton>` infra was built and adopted on `/insights`; same component reused here)
- Side-with poll: **removed** 2026-04-25 after being built
- Share copy: **rotating bank**, edgy/catchy/funny tone, deterministic per pair
- Out-of-Bangalore inputs: **friendly "Bangalore only — launching soon" panel**
- Battle modes: **two-way only** for the sprint
- Air-quality: **IDW smoothing across 3 nearest CPCB stations within 15 km**, BLR-median fallback for under-monitored pincodes
- Rent: **IDW smoothing across 3 nearest locality-confident pincodes within 8 km**, with `rent_match_level: "locality_inferred"`. Fallback to BLR city median for pincodes with no locality neighbour in range
- Walkability dropped from compare specifically (the 7th canonical dim is hidden here; still computed by the engine)

## Out of scope (this feature)

- OG image / `/api/og/compare` — not built yet; deferred to nice-to-have
- Saved comparisons / accounts (ties to sign-up infra)
- Cross-city comparisons (POC = Bangalore only)
- 3-way and N-way battles
- Leaderboards ("most-battled BLR area this week") — interesting later
- Editable / weighted dimensions (lives in Story 2 — Proximity)
- Curated rivalries strip on landing — search bars + default pair handle this
