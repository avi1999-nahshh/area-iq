# Story 1 — Status

> ↩ [Main rollup](../STATUS.md) · [Main scope](../README.md) · [This feature's scope](./scope.md)

Last updated: 2026-04-25.

## Production state

| Variant | URL | State |
|---|---|---|
| Live | `https://area-iq-one.vercel.app/compare?a=560034&b=400050` | Live with verdict engine + slate-amber Civic Brief design |
| Lab preview | — | Not started |

## Components shipped

- `app/compare/verdict.ts` — pure verdict computation: decisive headline picker, trash-talk clause picker, audience tag derivation, dim-delta computation, tie detection
- `app/compare/head-to-head.tsx` — UI (client component)
- `app/compare/mini-map.tsx` — Leaflet preview per side
- `app/compare/page.tsx` — server wrapper, fetches both pincodes from Convex

## Sample verdicts in prod (sanity check)

| Pair | Headline | Trash-talk |
|---|---|---|
| Koramangala vs Raipur (492001) | wins by 29 points. It's not close. | But crime runs 873/lakh higher — Koramangala is quieter. |
| Koramangala vs Indiranagar (560038) | wins by 22 points. It's not close. | And you'll pay ₹3k less in rent for the privilege. |
| Bandra West vs Sansad Marg | takes it on air — 20 points clear. | But Sansad Marg costs ₹62k less in rent. |
| Koramangala vs HSR (560095) | dead heat. | Pick the one your in-laws already live in. |

## Known gaps

- Visual design diverges from `/insights-lab` (still slate/amber, Stitch-direction migration pending)
- Pincode-only inputs (no name search yet) — primary friction
- Mumbai/Delhi pincodes accepted (POC scope is Bangalore only)
- No OG image route
- Mobile responsive needs audit
- Default empty state shows Mumbai (out-of-scope for POC)

## Next milestones

1. Wire name-search inputs at top of page using shared `<AreaSearch basePath="/compare">` from `app/insights/area-search.tsx`
2. Migrate UI to lab design system (mirror `/insights-lab/[pincode]` palette + typography)
3. Add real Leaflet maps with CARTO Dark Matter (drop or restyle `MiniMap`)
4. Add scope guard: if pincode is not in `iq_v2_blr.json`, render a friendly fallback
5. Update default empty state to two BLR pincodes
6. Build OG image route `/api/og/compare?a=&b=`

## Recent updates

- 2026-04-25 — Trash-talk verdict engine shipped to prod (`app/compare/verdict.ts` + `head-to-head.tsx` rewrite)
- 2026-04-25 — Verdict honesty fix: air dimension excluded from brag claims when absolute AQI > 100, regardless of percentile
- 2026-04-25 — Civic Brief palette migration on `/compare` (since superseded by Stitch lab direction)
