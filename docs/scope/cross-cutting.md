# Cross-cutting concerns

Things that don't belong inside a single feature but touch every page. Two of them right now: **Share hooks** and **Analytics**. New cross-cutting concerns get a section here, not their own folder.

> ↩ Back to [main scoping](./README.md) · See [STATUS rollup](./STATUS.md)

---

## A. Share hooks

### Goal

Make every AreaIQ artifact (a single-pincode report, a head-to-head verdict) share-worthy on mobile in two taps. The product's core asset is the screenshot — the share rail has to do better than just route someone back to a URL.

### Components

#### A.1 OG image generation

When a URL gets pasted into WhatsApp / X / iMessage / LinkedIn / Slack, the unfurl preview is the first impression. Today we have nothing — the link unfurls as a plain `area-iq-one.vercel.app` card with no image.

Build two routes using `next/og`:

| Route | Renders | Used by |
|---|---|---|
| `/api/og/insights?pc={pincode}` | 1200×630. Brag chip + area name + big mono score + tiny pincode-territory map (re-uses the SVG from `app/insights/[pincode]/flippable-card.tsx`'s old territory-map version) + AreaIQ wordmark + URL. Slate-900 background, amber accents. | Wired into `generateMetadata().openGraph.images` and `twitter.images` on `/insights/[pincode]` |
| `/api/og/compare?a={a}&b={b}` | 1200×630. Verdict headline + both names side-by-side + score delta + audience tag + AreaIQ wordmark + URL. | Wired into `/compare` metadata |

Edge runtime (`export const runtime = "edge"`). Static fonts via `@vercel/og` font-fetch helpers. No Convex calls — read from `data/processed/iq_v2_blr.json` at edge or pass scores as encoded query params (lighter, fewer fetches).

#### A.2 Share UI

A new `<ShareButton>` client component, lives at `app/_components/share-button.tsx` (or co-located per surface).

**Behavior**:
- On mobile (Web Share API supported): `navigator.share({ title, text, url })` → opens the native share sheet. One tap.
- On desktop: dropdown menu with WhatsApp / X / LinkedIn / Copy link (and a "Copy as image" later, depends on OG endpoint).

**Targets** (all shipped via deeplink, no SDKs):
| Target | URL pattern |
|---|---|
| WhatsApp | `https://wa.me/?text=${encoded(text + " " + url)}` |
| X | `https://x.com/intent/post?text=${encoded(text)}&url=${encoded(url)}` |
| LinkedIn | `https://www.linkedin.com/sharing/share-offsite/?url=${encoded(url)}` |
| Copy link | `navigator.clipboard.writeText(url)` |

#### A.3 Share copy

Pre-generated text per surface, in a `app/_lib/share-copy.ts` helper.

**Insights** (one-pincode):
> {Name} scored {overall}/100 on AreaIQ — {brag_label}. {url}
>
> Example: *"Indiranagar scored 73/100 on AreaIQ — Top 5% Cleanest Air. https://area-iq-one.vercel.app/insights/560038"*

**Compare** (two-pincode):
> {Winner} edges {Loser} on AreaIQ. {trash_talk_clause} {url}
>
> Example: *"Indiranagar edges Koramangala on AreaIQ. And you'll pay ₹3k less in rent. https://area-iq-one.vercel.app/compare?a=560038&b=560034"*

#### A.4 Placement

| Surface | Share button? | Notes |
|---|---|---|
| `/` landing | No | Don't share the landing |
| `/insights` listing | No | List of areas; no single artifact |
| `/insights/[pincode]` | **Yes** — primary | Top of page next to the FlippableCard, plus a smaller one at the bottom of the deep dive |
| `/compare?a=&b=` | **Yes** — primary | On the verdict card |
| `/proximity` | TBD when shipped | Maybe a "share this shortlist" later |
| `/methodology` | No | Documentation; no artifact |
| `/insights/[pincode]/not-found` | No | Error state |

### Phasing

1. **OG image route for `/insights/[pincode]`** — biggest unfurl-hit win
2. **`<ShareButton>` on the Insights page** — using the same OG URL
3. **OG image route for `/compare`** — once Compare is migrated to the new design system (Story 1)
4. **`<ShareButton>` on Compare verdict**
5. **Share-as-image on desktop** (deferred — `html2canvas` or `domtoimage`; only if the OG image isn't enough)

### Acceptance — must-have

- [ ] `/api/og/insights` ships and returns 1200×630 PNG/PNG-equivalent
- [ ] `/api/og/insights` is wired into `generateMetadata` so `og:image` and `twitter:image` resolve
- [ ] `<ShareButton>` uses Web Share API on mobile with graceful desktop fallback
- [ ] WhatsApp / X / LinkedIn / Copy fallback work and don't depend on third-party SDKs
- [ ] Share copy is one place (`_lib/share-copy.ts`) and reused across surfaces
- [ ] All share clicks fire an analytics event (see Section B)

### Acceptance — nice-to-have

- [ ] OG image variants per brag-label tier (#1 / Top 5% / Top 10–25%) for visual variety
- [ ] `share-as-image` button that downloads a high-res PNG of the in-page card
- [ ] Pre-warmed OG images (Vercel cached) for the Top 50 most-viewed pincodes

### Open questions

- **OG image style**: mirror the in-page FlippableCard 1:1, or design a tighter horizontal frame purpose-built for chat unfurl? (Stitch designed neither; we own this.)
- **Share copy variants**: one canonical line per surface, or rotate from a small bank? Banks improve novelty; one-line is easier to test.
- **Pre-warm cache**: matters or premature?

---

## B. Analytics

### Goal

Track meaningful actions across the funnel — landing → feature → search → pincode → share — without cookies, consent banners, or PII.

### Provider

**Plausible** is already wired in `app/layout.tsx` (`data-domain="area-iq-one.vercel.app"`). **Vercel Analytics** is also wired and captures Web Vitals + page views automatically.

Custom events go through Plausible's `window.plausible(name, { props })` API.

### Conventions

- Event names: Title Case verb-phrases, two words max where possible (e.g., `Feature Click`, `Pincode Viewed`, `Share Clicked`). Plausible's own page-view events come for free; we add conversion-flavoured events on top.
- Props: `snake_case`. Pincode values are 6-digit strings, not redacted (not PII).
- One helper at `app/_lib/track.ts`:
  ```ts
  export function track(event: string, props?: Record<string, string | number | boolean>) {
    if (typeof window === "undefined") return;
    window.plausible?.(event, props ? { props } : undefined);
  }
  ```
  Plus a TypeScript declaration extending `Window` so `window.plausible` is typed.

### Events

| Event | Surface | Props | Why |
|---|---|---|---|
| `Feature Click` | `/` landing | `target: insights\|compare\|proximity\|methodology` | Top-of-funnel routing — which feature gets the most curiosity? |
| `Search Submitted` | landing search, top-nav search | `surface`, `query_length`, `result_count` | Search funnel: do users find what they typed? |
| `Search Suggested` | Any AreaSearch | `pincode`, `surface` | Which pincode-suggestions get clicked vs typed-and-Enter? |
| `Pincode Viewed` | `/insights/[pincode]` | `pincode`, `referrer: search\|topfive\|direct\|breadcrumb` | The conversion moment — pincode shown |
| `Card Flipped` | FlippableCard | `pincode`, `direction: front-to-back\|back-to-front` | Engagement signal on the share card |
| `Methodology Anchor Viewed` | `/methodology` | `anchor: scope\|dimensions\|honesty\|hidden\|sources\|limitations` | Which sections actually get read? IntersectionObserver-fired |
| `Compare Submitted` | `/compare` | `a`, `b`, `swap_count` | Conversion — both sides chosen, verdict requested |
| `Share Clicked` | Insights or Compare | `surface: insights\|compare`, `target: native\|whatsapp\|x\|linkedin\|copy`, `pincode` | The actual viral signal |
| `404 Hit` | `not-found.tsx` | `attempted_pincode` | Which out-of-scope pincodes are people trying? Drives expansion priority |
| `Outbound Link` | Any external link | `url` | Methodology references, source links |

### Privacy

- Plausible: no cookies, no localStorage, no fingerprint. EU/UK consent-banner-free.
- Pincodes are not PII — they're public administrative codes, not addresses.
- Vercel Analytics: anonymous, GDPR-friendly. No additional consent needed.
- Don't log: search queries beyond the length (no raw text), user IPs, full URLs with query strings other than `pincode`/`a`/`b`.

### Implementation phasing

Each phase is a separate commit so we can roll back any one if Plausible's free tier (10k events/month) is the bottleneck.

| Phase | Events | Estimated noise |
|---|---|---|
| 1 | `Feature Click`, `Pincode Viewed`, `Search Submitted`, `Search Suggested` | High — top of funnel |
| 2 | `Card Flipped`, `Compare Submitted`, `404 Hit` | Medium |
| 3 | `Share Clicked`, `Methodology Anchor Viewed`, `Outbound Link` | Lower — depends on Share hooks shipping |

### Acceptance — must-have

- [ ] `app/_lib/track.ts` helper with a typed `window.plausible` declaration
- [ ] Phase 1 events wired (4 events)
- [ ] Each event documented in the table above before it ships
- [ ] No events fire on `localhost` (Plausible auto-skips; verify in dev log)
- [ ] No events log raw search text (only `query_length`)

### Acceptance — nice-to-have

- [ ] Plausible Goals configured for `Pincode Viewed` and `Share Clicked` so they show up as conversions in the dashboard
- [ ] Funnel report: landing → feature → pincode-viewed → share-clicked
- [ ] Weekly digest in Slack / email

### Open questions

- Plausible Goals are set in the Plausible UI, not in code — who owns that configuration?
- Should we add PostHog later for session replay? Current bias: no, until we have a specific question replay would answer.
- Does Vercel Analytics' Speed Insights bring enough value to keep on a free tier with the current traffic? Probably yes.

---

## How items here move into features

When a cross-cutting item starts shipping inside a specific feature (e.g. ShareButton on `/insights/[pincode]`), copy the **acceptance checkbox** into that feature's `scope.md` under "must-have" and check it off there. Don't track the same item in two places — this doc captures the cross-cutting *intent* and conventions; per-feature docs track per-feature *delivery*.
