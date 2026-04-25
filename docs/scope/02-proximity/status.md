# Story 2 — Status

> ↩ [Main rollup](../STATUS.md) · [Main scope](../README.md) · [This feature's scope](./scope.md)

Last updated: 2026-04-25.

## Production state

| Variant | URL | State |
|---|---|---|
| Live | n/a | 404; nav tab labelled **"Soon"** |
| Lab preview | n/a | Not started in code. Stitch design exists. |

## Stitch reference

Local design files at:

```
/Users/avinashdubey/Downloads/stitch_area_iq_intelligence_platform/commute_based_search/
├── code.html        — Tailwind reference for the layout
└── screen.png       — visual reference
```

Key fields surfaced in the design:
- Work Location (address input)
- Max Commute Time slider (35 mins shown)
- Preferred Transport toggle (Transit / Drive / Walk)
- Prioritize chips (Safety / Social Life / Affordability / Parks)
- Map with isochrone overlay + Salesforce Tower marker
- Top Matches list — Hayes Valley (BEST MATCH IQ Score 94), Mission District (88), Nob Hill (85)

## Components shipped

- None. Tab is gated as "Soon" in `app/insights-lab/lab-nav.tsx` and `app/insights/top-nav.tsx`.

## Known blockers

- Geocoding provider not chosen
- Commute estimation strategy not chosen (straight-line vs isochrone)
- No data-quality blockers — the IQ v2 dimension engine has everything needed for ranking. This is purely a build-out task.

## Next milestones

1. Choose + integrate geocoding API (recommend Nominatim for v1)
2. Build form UI to Stitch fidelity using the lab design system (Inter, JetBrains Mono numerals, white cards, amber accents, grain overlay)
3. Build commute-window filter (start with straight-line + mode coefficient)
4. Build re-rank with weight-toggle chips
5. Render Top Matches list with rank badge / score / commute / brag label
6. Hook each match's CTA to `/insights/[pincode]`
7. Hook up "Save this search" → email capture (gated; ties to Claim flow)

## Recent updates

- (none — story not started)
