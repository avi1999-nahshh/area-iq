/**
 * Plausible custom-event helper.
 *
 * The Plausible script tag is mounted with `defer` in `app/layout.tsx`, so
 * `window.plausible` may not be defined yet on initial paint. Calls before
 * the script loads are silently dropped — fine because user-triggered events
 * (clicks, flips, share) happen well after first render, and page-view
 * tracking is auto-handled by Plausible itself.
 *
 * Conventions:
 *  - Event names: Title Case verb-phrases ("Pincode Viewed", "Share Clicked").
 *  - Props: snake_case primitive values (string | number | boolean).
 *  - No PII. Pincodes are public administrative codes, not addresses.
 *  - No raw search text — log `query_length` instead.
 *
 * See `docs/scope/cross-cutting.md § B` for the full event taxonomy.
 */

type Primitive = string | number | boolean;

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, Primitive>; callback?: () => void },
    ) => void;
  }
}

export function track(event: string, props?: Record<string, Primitive>): void {
  if (typeof window === "undefined") return;
  try {
    if (props) {
      window.plausible?.(event, { props });
    } else {
      window.plausible?.(event);
    }
  } catch {
    // Plausible failures must never break the app.
  }
}

export {};
