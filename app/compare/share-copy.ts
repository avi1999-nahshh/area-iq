/**
 * Edgy share-copy bank. The verdict engine picks ONE line per comparison,
 * deterministically by `hash(pair_slug)` so the same pair always gets the
 * same line (re-shareable, repeatable in screenshots) but different pairs
 * get different vibes.
 *
 * Categories are keyed by (winnerDimWide, deltaBand) so the line still
 * sounds like it knows what it's talking about. Lines should be:
 *   - one sentence, max ~14 words
 *   - paste-able into a group chat without context
 *   - never punching down at a real demographic
 *   - use {winner} / {loser} / {delta} / {dim} placeholders
 */

export type CopyContext = {
  winner: string;     // "Indiranagar"
  loser: string;      // "Koramangala"
  delta: number;      // 12
  dim?: string;       // "air"  (lowercase)
  rentDeltaK?: number; // positive = winner is more expensive
  aqiDelta?: number;   // positive = winner has worse air
};

type LineFn = (c: CopyContext) => string;

const BLOWOUT: LineFn[] = [
  ({ winner, loser, delta }) => `${winner} doesn't even let ${loser} cook. ${delta} points clear.`,
  ({ winner, loser }) => `${loser} fans, look away. ${winner} is on a different graph.`,
  ({ winner, loser }) => `${winner} ${delta_emoji()} ${loser}. Not a debate, a verdict.`,
  ({ winner, loser, delta }) => `${winner} wins by ${delta}. ${loser} sent flowers.`,
  ({ winner, loser }) => `If ${loser} were a stock, ${winner} just shorted it.`,
  ({ winner, loser }) => `${loser} brought a bicycle to a metro race against ${winner}.`,
  ({ winner, loser, delta }) => `${winner} +${delta}. ${loser}, your group chat is muted.`,
  ({ winner, loser }) => `${winner} is the answer. ${loser} is the question your friends shouldn't have asked.`,
];

const COMFORTABLE: LineFn[] = [
  ({ winner, loser, delta }) => `${winner} edges ${loser} by ${delta}. Tape attached.`,
  ({ winner, loser }) => `${winner} did the homework. ${loser} watched the lecture.`,
  ({ winner, loser, delta }) => `${winner} +${delta} ${loser}. Group chat, fight nicely.`,
  ({ winner, loser }) => `${winner} > ${loser}. The math doesn't care about your feelings.`,
  ({ winner, loser }) => `${winner} clears ${loser} on points. Both still get a samosa.`,
  ({ winner, loser, delta }) => `${winner} by ${delta}. ${loser}, sit down — respectfully.`,
];

const TIGHT: LineFn[] = [
  ({ winner, loser, delta }) => `${winner} squeaks past ${loser} by ${delta}. Photo finish.`,
  ({ winner, loser }) => `${winner} wins on a tiebreak. ${loser}, demand a recount.`,
  ({ winner, loser }) => `${winner} barely. ${loser} stays in the chat.`,
  ({ winner, loser }) => `${winner} > ${loser} by a hair. Don't move.`,
  ({ winner, loser }) => `${winner} edges ${loser}. Coin toss with extra steps.`,
  ({ winner, loser }) => `${winner} wins by a chai's width over ${loser}.`,
];

const TIE: LineFn[] = [
  ({ winner, loser }) => `${winner} vs ${loser}: dead heat. Pick the one your in-laws live in.`,
  ({ winner, loser }) => `${winner} ≈ ${loser}. The map shrugged.`,
  () => `It's a tie. Toss the coin. Blame the coin.`,
  ({ winner, loser }) => `${winner} or ${loser}: same difference. Pick by traffic.`,
  ({ winner, loser }) => `${winner} = ${loser}. Both will disappoint you equally.`,
];

const RENT_HEAVY: LineFn[] = [
  ({ winner, loser, rentDeltaK }) =>
    rentDeltaK && rentDeltaK > 0
      ? `${winner} wins, but you'll bleed ₹${rentDeltaK}k more rent than ${loser}.`
      : `${winner} wins AND saves you ₹${Math.abs(rentDeltaK ?? 0)}k. Hello?`,
  ({ winner, loser, rentDeltaK }) =>
    rentDeltaK && rentDeltaK > 0
      ? `${winner} > ${loser}. Your bank account begs to differ.`
      : `${winner} is cheaper AND better than ${loser}. Suspicious. Move anyway.`,
  ({ winner, loser, rentDeltaK }) =>
    rentDeltaK && rentDeltaK > 0
      ? `${winner} wins. ${loser} costs ₹${Math.abs(rentDeltaK)}k less. Pick your therapy.`
      : `${winner}: better AND ₹${Math.abs(rentDeltaK ?? 0)}k cheaper than ${loser}. Bags packed?`,
];

const AIR_HEAVY: LineFn[] = [
  ({ winner, loser, aqiDelta }) =>
    aqiDelta && aqiDelta < 0
      ? `${winner} breathes easier than ${loser} by ${Math.abs(aqiDelta)} AQI. Lungs say thanks.`
      : `${winner} wins, but the AQI is ${aqiDelta} worse than ${loser}. Buy a mask.`,
  ({ winner, loser }) => `${winner} is the new ${loser}. Plus oxygen.`,
  ({ winner, loser, aqiDelta }) =>
    aqiDelta && aqiDelta < 0
      ? `${winner} > ${loser}. ${Math.abs(aqiDelta)} AQI cleaner. Your lungs already moved.`
      : `${winner} wins on paper. The air says talk to ${loser}.`,
];

function delta_emoji(): string {
  return ">>>";
}

/**
 * Deterministic 32-bit string hash (DJB2-ish). Same input → same output.
 */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickShareLine(pairSlug: string, ctx: CopyContext): string {
  let bank: LineFn[];

  if (ctx.delta < 4) {
    bank = TIE;
  } else if (
    ctx.rentDeltaK != null &&
    Math.abs(ctx.rentDeltaK) >= 5
  ) {
    bank = RENT_HEAVY;
  } else if (ctx.aqiDelta != null && Math.abs(ctx.aqiDelta) >= 30) {
    bank = AIR_HEAVY;
  } else if (ctx.delta >= 20) {
    bank = BLOWOUT;
  } else if (ctx.delta >= 10) {
    bank = COMFORTABLE;
  } else {
    bank = TIGHT;
  }

  const idx = hashStr(pairSlug) % bank.length;
  return bank[idx](ctx);
}
