/**
 * Verdict generator for pincode battles. Pure logic — no React, no Convex —
 * so the same output can drive the /compare UI and the /api/og/compare image.
 *
 * Design goal: decisive, trash-talk-friendly. Always name a winner (no
 * "both are lovely"), always cite a concrete tradeoff the loser is paying
 * for, always end with one line on who the winner is "for".
 */

export type AreaLite = {
  pincode: { pincode: string; name: string; district: string; state: string };
  airQuality?: { aqi?: number | null } | null;
  safety?: { crime_rate_per_lakh?: number | null } | null;
  infrastructure?: { cafe_count?: number | null; restaurant_count?: number | null } | null;
  transit?: { nearest_metro_km?: number | null } | null;
  property?: { city_rent_median_2bhk?: number | null } | null;
  scores?: {
    air_quality_score?: number;
    safety_score?: number;
    infrastructure_score?: number;
    transit_score?: number;
    cleanliness_score?: number;
    property_score?: number;
    overall_score?: number;
    tier?: string;
    archetype_name?: string;
  } | null;
  archetype?: { name?: string; tagline?: string } | null;
};

export type DimKey = "safety" | "air" | "lifestyle" | "transit" | "cleanliness" | "amenities";

export type Verdict = {
  winner: AreaLite;
  loser: AreaLite;
  overallDelta: number;            // rounded absolute overall_score delta
  dimWins: { winner: number; loser: number; total: number }; // e.g. 4/6
  headline: string;                // "Indiranagar wins by 23 points."
  trashTalk: string;               // "But you'll pay ₹18k more in rent."
  audience: string;                // "Young Professionals"
  audienceLine: string;            // "Best for Young Professionals"
  dimDeltas: { key: DimKey; label: string; a: number; b: number; winner: "a" | "b" | "tie" }[];
  tie: boolean;                    // true if overallDelta < 4 AND no dim wins by >6
};

// ── helpers ────────────────────────────────────────────────────────────────

const round = (n: number) => Math.round(n);
const clamp01to100 = (n: number) => Math.max(0, Math.min(100, n));

function scoresOf(area: AreaLite) {
  const s = area.scores ?? {};
  return {
    air: clamp01to100(s.air_quality_score ?? 50),
    safety: clamp01to100(s.safety_score ?? 50),
    infra: clamp01to100(s.infrastructure_score ?? 50),
    transit: clamp01to100(s.transit_score ?? 50),
    cleanliness: clamp01to100(s.cleanliness_score ?? 50),
    property: clamp01to100(s.property_score ?? 50),
    overall: clamp01to100(s.overall_score ?? 50),
  };
}

// ── trash-talk clause picker ───────────────────────────────────────────────
// Returns the loser's most concrete, specific advantage. Preference order:
//   1. Rent — they're cheaper (₹Xk/month delta)
//   2. Air — loser has notably cleaner air (AQI delta)
//   3. Safety — loser has lower crime
//   4. Transit — loser is significantly closer to metro
//   5. Cafes — loser has more cafes (fun one for the group chat)
//   6. Fallback: loser wins on {dim} by {delta} points

function pickTrashTalk(winner: AreaLite, loser: AreaLite): string {
  const wScores = scoresOf(winner);
  const lScores = scoresOf(loser);
  const wRent = winner.property?.city_rent_median_2bhk ?? null;
  const lRent = loser.property?.city_rent_median_2bhk ?? null;
  const wAqi = winner.airQuality?.aqi ?? null;
  const lAqi = loser.airQuality?.aqi ?? null;
  const wCrime = winner.safety?.crime_rate_per_lakh ?? null;
  const lCrime = loser.safety?.crime_rate_per_lakh ?? null;
  const wMetro = winner.transit?.nearest_metro_km ?? null;
  const lMetro = loser.transit?.nearest_metro_km ?? null;
  const wCafes = winner.infrastructure?.cafe_count ?? null;
  const lCafes = loser.infrastructure?.cafe_count ?? null;
  const loserName = loser.pincode.name;

  // 1. Rent — loser is meaningfully cheaper (>₹3k/mo)
  if (wRent && lRent && wRent - lRent > 3000) {
    const diff = Math.round((wRent - lRent) / 1000);
    return `But ${loserName} costs ₹${diff}k less in rent.`;
  }
  if (wRent && lRent && lRent - wRent > 3000) {
    // loser is actually *more* expensive — flip it as a roast on the winner
    const diff = Math.round((lRent - wRent) / 1000);
    return `And you'll pay ₹${diff}k less in rent for the privilege.`;
  }

  // 2. Air — loser has cleaner air (AQI is lower-is-better)
  if (wAqi != null && lAqi != null && wAqi - lAqi > 25) {
    return `But you'll breathe AQI ${wAqi} there, vs ${lAqi} in ${loserName}.`;
  }

  // 3. Safety — loser has lower crime rate
  if (wCrime != null && lCrime != null && wCrime - lCrime > 300) {
    const diff = Math.round(wCrime - lCrime);
    return `But crime runs ${diff.toLocaleString()}/lakh higher — ${loserName} is quieter.`;
  }

  // 4. Transit — loser is closer to metro by >1.5km
  if (wMetro != null && lMetro != null && wMetro - lMetro > 1.5) {
    const wKm = wMetro.toFixed(1);
    const lKm = lMetro.toFixed(1);
    return `But the nearest metro is ${wKm}km away — ${loserName} sits at ${lKm}km.`;
  }

  // 5. Cafes — the group-chat flex (loser has meaningfully more)
  if (wCafes != null && lCafes != null && lCafes - wCafes >= 8) {
    return `But ${loserName} has ${lCafes} cafés to ${wCafes}. You decide if that matters.`;
  }

  // 6. Fallback — loser's widest-delta dimension win
  const loserDims: [string, number, number][] = [
    ["safety",       lScores.safety,       wScores.safety],
    ["air",          lScores.air,          wScores.air],
    ["cleanliness",  lScores.cleanliness,  wScores.cleanliness],
    ["transit",      lScores.transit,      wScores.transit],
    ["amenities",    lScores.infra,        wScores.infra],
  ];
  const best = loserDims
    .map(([label, l, w]) => ({ label, delta: l - w }))
    .filter((d) => d.delta > 0)
    .sort((x, y) => y.delta - x.delta)[0];
  if (best && best.delta > 6) {
    return `But ${loserName} edges it on ${best.label} by ${Math.round(best.delta)} points.`;
  }

  // Nothing to roast with — keep it honest
  return `${loserName} holds its own on most other dimensions, but not enough.`;
}

// ── audience tag ───────────────────────────────────────────────────────────
// Keep in sync with the set used on /compare today. Adds "Students" + "Creatives"
// because college pincodes and heritage pincodes both surface in the corpus.

function deriveAudience(area: AreaLite): string {
  const tier = area.scores?.tier ?? "";
  const arch = (area.scores?.archetype_name ?? area.archetype?.name ?? "").toLowerCase();

  if (/hustle|hub|growth|startup|metro|professional|urban elite|engine|buzz|work|tech/.test(arch)) {
    return "Young Professionals";
  }
  if (/community|family|familial|suburb|peaceful|residential|gated|township/.test(arch)) {
    return "Families";
  }
  if (/quiet|breathing|nature|rural|retreat|serene|tranquil|retiree/.test(arch) || tier === "rural") {
    return "Retirees";
  }
  if (/artist|creative|culture|heritage|bohemian|art/.test(arch)) {
    return "Creatives";
  }
  if (/student|university|campus|college/.test(arch)) {
    return "Students";
  }
  return "Balanced Lifestyle";
}

// ── main ───────────────────────────────────────────────────────────────────

export function computeVerdict(a: AreaLite, b: AreaLite): Verdict {
  const sa = scoresOf(a);
  const sb = scoresOf(b);

  const dimDeltas: Verdict["dimDeltas"] = [
    { key: "safety",      label: "Safety",      a: round(sa.safety),      b: round(sb.safety) },
    { key: "air",         label: "Air",         a: round(sa.air),         b: round(sb.air) },
    { key: "amenities",   label: "Amenities",   a: round(sa.infra),       b: round(sb.infra) },
    { key: "transit",     label: "Transit",     a: round(sa.transit),     b: round(sb.transit) },
    { key: "cleanliness", label: "Cleanliness", a: round(sa.cleanliness), b: round(sb.cleanliness) },
    // property here is the "expensiveness score" — higher means more expensive,
    // so for the comparison row we flip sign: lower property_score = more affordable wins.
    // But we don't expose it as a dim here; trash-talk handles rent explicitly.
  ] as Verdict["dimDeltas"];

  // annotate each dim's winner
  let winsA = 0;
  let winsB = 0;
  for (const d of dimDeltas) {
    if (d.a > d.b) {
      d.winner = "a";
      winsA++;
    } else if (d.b > d.a) {
      d.winner = "b";
      winsB++;
    } else {
      d.winner = "tie";
    }
  }
  const totalDims = dimDeltas.length;

  const overallDelta = round(Math.abs(sa.overall - sb.overall));
  const aIsWinner = sa.overall === sb.overall ? winsA >= winsB : sa.overall > sb.overall;
  const winner = aIsWinner ? a : b;
  const loser = aIsWinner ? b : a;
  const winnerWins = aIsWinner ? winsA : winsB;
  const loserWins = aIsWinner ? winsB : winsA;

  const maxDimDelta = Math.max(...dimDeltas.map((d) => Math.abs(d.a - d.b)));
  const tie = overallDelta < 4 && maxDimDelta <= 6;

  // Headline generation
  const winnerName = winner.pincode.name;
  let headline: string;
  if (tie) {
    headline = `${a.pincode.name} vs ${b.pincode.name}: dead heat.`;
  } else if (overallDelta >= 20) {
    headline = `${winnerName} wins by ${overallDelta} points. It's not close.`;
  } else if (overallDelta >= 10) {
    headline = `${winnerName} wins by ${overallDelta} points.`;
  } else if (overallDelta >= 4) {
    headline = `${winnerName} edges it by ${overallDelta} points.`;
  } else {
    // Overall scores within 4 but the tie guard failed — there's a standout
    // dim-level win carrying the verdict. Lead with the dim, not the overall.
    const biggestDim = [...dimDeltas].sort(
      (x, y) => Math.abs(y.a - y.b) - Math.abs(x.a - x.b)
    )[0];
    const biggestDimDelta = Math.abs(biggestDim.a - biggestDim.b);
    headline = `${winnerName} takes it on ${biggestDim.label.toLowerCase()} — ${biggestDimDelta} points clear.`;
  }

  const trashTalk = tie
    ? "Pick the one your in-laws already live in."
    : pickTrashTalk(winner, loser);

  const audience = deriveAudience(winner);
  const audienceLine = tie ? "Best for: honestly, a coin toss." : `Best for ${audience}.`;

  return {
    winner,
    loser,
    overallDelta,
    dimWins: { winner: winnerWins, loser: loserWins, total: totalDims },
    headline,
    trashTalk,
    audience,
    audienceLine,
    dimDeltas,
    tie,
  };
}
