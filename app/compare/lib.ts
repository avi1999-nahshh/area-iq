/**
 * Slug ↔ pincode resolution for /compare URLs.
 *
 * Canonical URL: /compare/{slug-a}-vs-{slug-b}
 *   e.g. /compare/indiranagar-vs-koramangala
 *        /compare/whitefield-epip-vs-koramangala
 *
 * SLUG_OVERRIDES wins; otherwise we slugify the BLR_ALIASES entry. Both data
 * sources are static modules so this file is safe to import from client
 * components (no `fs`, no Convex).
 *
 * Disambiguator suffixes ("epip", "mahadevapura") are baked into the
 * override map — the autocomplete pincode determines the slug
 * automatically; the user never picks the suffix manually.
 */
import { BLR_ALIASES } from "@/app/insights/blr-aliases";

const SLUG_OVERRIDES: Record<string, string> = {
  "560034": "koramangala",
  "560038": "indiranagar",
  "560037": "marathahalli",
  "560048": "whitefield-mahadevapura",
  "560066": "whitefield-epip",
  "560067": "whitefield",
  "560076": "btm-layout",
  "560078": "jp-nagar",
  "560050": "banashankari",
  "560085": "banashankari-2-3-stage",
  "560092": "yelahanka",
  "560100": "electronic-city",
  "560102": "hsr-layout",
  "560103": "bellandur",
  "560043": "hrbr-layout",
  "560011": "jayanagar",
  "560016": "kr-puram",
  "560075": "new-thippasandra",
  "560077": "kothanur",
  "560090": "chikkabanavara",
  "560095": "koramangala-6th-block",
  "560001": "bangalore-gpo",
};

export const DEFAULT_PAIR = { a: "560038", b: "560034" } as const; // Indiranagar vs Koramangala

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const pincodeToSlugMap = new Map<string, string>();
const slugToPincodeMap = new Map<string, string>();

// Seed from explicit overrides first so they always win.
for (const [pincode, slug] of Object.entries(SLUG_OVERRIDES)) {
  pincodeToSlugMap.set(pincode, slug);
  slugToPincodeMap.set(slug, pincode);
}
// Fill in the rest from BLR_ALIASES.
for (const [pincode, alias] of Object.entries(BLR_ALIASES)) {
  if (pincodeToSlugMap.has(pincode)) continue;
  const slug = slugify(alias);
  if (!slug) continue;
  pincodeToSlugMap.set(pincode, slug);
  if (!slugToPincodeMap.has(slug)) {
    slugToPincodeMap.set(slug, pincode);
  }
}

export function pincodeToSlug(pincode: string): string {
  return pincodeToSlugMap.get(pincode) ?? pincode;
}

export function slugToPincode(slug: string): string | null {
  return slugToPincodeMap.get(slug) ?? null;
}

export function pairSlug(pincodeA: string, pincodeB: string): string {
  return `${pincodeToSlug(pincodeA)}-vs-${pincodeToSlug(pincodeB)}`;
}

/**
 * Parse "whitefield-epip-vs-koramangala" → two pincodes. Greedy from the
 * right so multi-word slugs ("whitefield-epip") don't get split mid-name.
 */
export function parsePairSlug(pair: string): { a: string; b: string } | null {
  const parts = pair.split("-vs-");
  if (parts.length < 2) return null;
  for (let i = parts.length - 1; i >= 1; i--) {
    const leftSlug = parts.slice(0, i).join("-vs-");
    const rightSlug = parts.slice(i).join("-vs-");
    const a = slugToPincodeMap.get(leftSlug);
    const b = slugToPincodeMap.get(rightSlug);
    if (a && b) return { a, b };
  }
  return null;
}

export function defaultPairSlug(): string {
  return pairSlug(DEFAULT_PAIR.a, DEFAULT_PAIR.b);
}
