/** Daily challenge: deterministic house selection + Wordle-style share card. */

import type { Listing } from './listing';
import type { GuessResult } from './scoring';

/** Hash a date string (YYYY-MM-DD) into a 32-bit seed. */
export function dailySeed(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small fast deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministically pick `count` listings for a given date (no repeats). */
export function pickDaily(listings: Listing[], date: string, count = 10): Listing[] {
  const rng = mulberry32(dailySeed(date));
  const pool = [...listings];
  // Fisher-Yates with the seeded RNG.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Format strokes relative to par the way golf scoreboards do. */
export function formatToPar(strokes: number): string {
  if (strokes === 0) return 'E';
  return strokes > 0 ? `+${strokes}` : `${strokes}`;
}

export interface ShareCardArgs {
  date: string;
  results: GuessResult[];
}

/** Build a spoiler-free, copy-pasteable share card (Wordle-style). */
export function buildShareCard({ date, results }: ShareCardArgs): string {
  const total = results.reduce((s, r) => s + r.strokes, 0);
  const grid = results.map((r) => r.tier.emoji).join('');
  return [
    `🏡⛳ Price Is Fairway — ${date}`,
    `${formatToPar(total)} through ${results.length} holes`,
    grid,
    'play: price-is-fairway',
  ].join('\n');
}
