/**
 * Share-copy templates per surface. Keep one canonical line per share so
 * we can iterate voice in one place.
 *
 * The text is what shows in WhatsApp / X / clipboard. Receivers can click
 * the URL to land on the artifact; the OG image carries the visual.
 */

const PROD_BASE = "https://area-iq-one.vercel.app";

/** Strip the trailing "(Bangalore)" tag — same convention as the H1. */
function clean(name: string): string {
  return name.replace(/\s*\(Bangalore\)\s*$/i, "");
}

export function insightsShareText(args: {
  name: string;
  pincode: string;
  overall: number;
  bragLabel: string;
}): { text: string; url: string; title: string } {
  const name = clean(args.name);
  const url = `${PROD_BASE}/insights/${args.pincode}`;
  return {
    title: `${name}: ${args.bragLabel}`,
    text: `${name} scored ${Math.round(args.overall)}/100 on AreaIQ — ${args.bragLabel}.`,
    url,
  };
}

export function compareShareText(args: {
  winner: string;
  loser: string;
  trashTalk: string;
  pincodeA: string;
  pincodeB: string;
}): { text: string; url: string; title: string } {
  const winner = clean(args.winner);
  const loser = clean(args.loser);
  const url = `${PROD_BASE}/compare?a=${args.pincodeA}&b=${args.pincodeB}`;
  return {
    title: `${winner} vs ${loser} — AreaIQ verdict`,
    text: `${winner} edges ${loser} on AreaIQ. ${args.trashTalk}`,
    url,
  };
}

export function proximityShareText(args: {
  officeLabel?: string;
  maxMinutes: number;
  mode: string;
  query?: string;
}): { text: string; url: string; title: string } {
  const params = new URLSearchParams();
  if (args.query) params.set("q", args.query);
  params.set("t", String(args.maxMinutes));
  params.set("mode", args.mode);
  const url = `${PROD_BASE}/proximity?${params.toString()}`;
  const where = args.officeLabel ? ` near ${args.officeLabel}` : "";
  return {
    title: "AreaIQ — find your Bangalore neighbourhood",
    text: `Where to live in Bangalore${where} within ${args.maxMinutes} minutes by ${args.mode}, ranked.`,
    url,
  };
}
