# AreaIQ — Production Status

> Rollup. For per-feature detail follow the links. For scope-level decisions see [README.md](./README.md).

Last updated: 2026-04-26.

## At a glance

| Story | Live in prod? | Live URL | Lab preview | Detail |
|---|---|---|---|---|
| 1 — Compare | partial | https://area-iq-one.vercel.app/compare | — | [01-compare/status.md](./01-compare/status.md) |
| 2 — Proximity | no | n/a (404) | Stitch design only | [02-proximity/status.md](./02-proximity/status.md) |
| 3 — Report card | yes | https://area-iq-one.vercel.app/insights · /{pincode} | merged into /insights | [03-report-card/status.md](./03-report-card/status.md) |

## Convex

| Deployment | URL | State |
|---|---|---|
| dev | https://calculating-sturgeon-828.convex.cloud | Active. Used by Vercel prod via `NEXT_PUBLIC_CONVEX_URL`. Last reseeded 2026-04-25. |
| prod | https://posh-lyrebird-724.convex.cloud | Exists, unseeded, no traffic. |

## Vercel

| Project | URL | State |
|---|---|---|
| area-iq | https://area-iq-one.vercel.app | Live, latest deploy 2026-04-25 |

## Recent rollouts

- 2026-04-26 — `/insights-lab` design merged into live `/insights`. The lab tree is deleted; `/insights` and `/insights/{pincode}` now carry the locked Stitch direction with the flippable card, real CARTO Dark Matter map, 4-card bento, custom 404, alias-aware search, rank-#1 emphasis, and the full a11y pass. `/area/{pincode}` Civic Brief is still live alongside it.
- 2026-04-26 — `/insights-lab` Stitch-direction preview built local-only first; merged same day after sign-off.
- 2026-04-25 — Trash-talk verdict engine (Story 1) shipped to `/compare` in prod with decisive headlines.
- 2026-04-25 — Civic Brief direction (Story 3 v1) shipped to `/area/[pincode]` in prod, replaced first-pass editorial layout.
- 2026-04-25 — Trivia narrative misalignment fixed: 1077 of 1079 narratives recovered. Pipeline patched to prevent regression. Convex dev reseeded.
- 2026-04-25 — `NEXT_PUBLIC_CONVEX_URL` set on Vercel prod (was empty); `/area/[pincode]` now resolves correctly in prod.
- 2026-04-25 — `PincodeSearch` removed from landing page per "keep area separate" decision.

## How to update this file

When something changes prod state for any of the three stories:

1. Update the **At a glance** table row for that story.
2. Add a one-line entry to **Recent rollouts** with the date.
3. Update the *Last updated* date at the top.
4. Update the corresponding `0X-{story}/status.md` with the deeper detail.
