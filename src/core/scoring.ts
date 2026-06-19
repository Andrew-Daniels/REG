/**
 * Golf-style scoring for house-price guesses.
 *
 * A guess is scored by its absolute percent error from the real price.
 * Like golf, lower strokes are better: an "ace" (hole-in-one) is the best
 * possible result and out-of-bounds is the worst.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ScoreTierName =
  | 'ace'
  | 'eagle'
  | 'birdie'
  | 'par'
  | 'bogey'
  | 'double_bogey'
  | 'triple_bogey'
  | 'out_of_bounds';

export interface ScoreTier {
  name: ScoreTierName;
  /** Human-friendly label shown to players. */
  label: string;
  /** Inclusive upper bound of absolute percent error (0.1 === 10%). */
  maxError: number;
  /** Strokes relative to par; negative is better. */
  strokes: number;
  /** Emoji used in celebrations / share cards. */
  emoji: string;
}

/** Medium-difficulty tier table (also the default). Ordered best -> worst. */
export const DEFAULT_TIERS: ScoreTier[] = [
  { name: 'ace', label: 'Hole in One!', maxError: 0.02, strokes: -3, emoji: '🏆' },
  { name: 'eagle', label: 'Eagle', maxError: 0.05, strokes: -2, emoji: '🦅' },
  { name: 'birdie', label: 'Birdie', maxError: 0.1, strokes: -1, emoji: '🐦' },
  { name: 'par', label: 'Par', maxError: 0.2, strokes: 0, emoji: '🟢' },
  { name: 'bogey', label: 'Bogey', maxError: 0.35, strokes: 1, emoji: '😬' },
  { name: 'double_bogey', label: 'Double Bogey', maxError: 0.5, strokes: 2, emoji: '😵' },
  { name: 'triple_bogey', label: 'Triple Bogey', maxError: 0.75, strokes: 3, emoji: '💀' },
  { name: 'out_of_bounds', label: 'Out of Bounds', maxError: Infinity, strokes: 4, emoji: '🌲' },
];

/** Multiplier applied to every tier's error threshold. <1 tightens, >1 loosens. */
const DIFFICULTY_SCALE: Record<Difficulty, number> = {
  easy: 1.5,
  medium: 1,
  hard: 0.6,
};

/** Absolute percent error between a guess and the actual price (0.1 === 10%). */
export function percentError(guess: number, actual: number): number {
  if (actual <= 0) return Infinity;
  return Math.abs(guess - actual) / actual;
}

/** Build a tier table scaled for the given difficulty. */
export function buildTiers(difficulty: Difficulty): ScoreTier[] {
  const scale = DIFFICULTY_SCALE[difficulty];
  if (scale === 1) return DEFAULT_TIERS.map((t) => ({ ...t }));
  return DEFAULT_TIERS.map((t) => ({
    ...t,
    maxError: t.maxError === Infinity ? Infinity : t.maxError * scale,
  }));
}

export interface GuessResult {
  tier: ScoreTier;
  percentError: number;
  strokes: number;
  guess: number;
  actual: number;
}

/** Score a single guess against the actual price. */
export function scoreGuess(
  guess: number,
  actual: number,
  tiers: ScoreTier[] = DEFAULT_TIERS,
): GuessResult {
  const err = percentError(guess, actual);
  const tier = tiers.find((t) => err <= t.maxError) ?? tiers[tiers.length - 1];
  return { tier, percentError: err, strokes: tier.strokes, guess, actual };
}

/** Sum of strokes across rounds. */
export function totalStrokes(strokes: number[]): number {
  return strokes.reduce((sum, s) => sum + s, 0);
}

export interface PlayerScore {
  id: string;
  name: string;
  strokes: number;
}

export interface RankedPlayer extends PlayerScore {
  rank: number;
}

/** Rank players ascending by strokes (golf). Ties share a rank ("1224"). */
export function rankPlayers(players: PlayerScore[]): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => a.strokes - b.strokes);
  let lastStrokes: number | null = null;
  let lastRank = 0;
  return sorted.map((p, i) => {
    const rank = lastStrokes !== null && p.strokes === lastStrokes ? lastRank : i + 1;
    lastStrokes = p.strokes;
    lastRank = rank;
    return { ...p, rank };
  });
}
