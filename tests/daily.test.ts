import { describe, it, expect } from 'vitest';
import { pickDaily, buildShareCard, formatToPar } from '../src/core/daily';
import { scoreGuess } from '../src/core/scoring';
import { SEED_LISTINGS } from '../src/data/seedListings';

describe('pickDaily', () => {
  it('returns the requested number of listings', () => {
    expect(pickDaily(SEED_LISTINGS, '2026-06-19', 10)).toHaveLength(10);
  });

  it('is deterministic for the same date', () => {
    const a = pickDaily(SEED_LISTINGS, '2026-06-19', 10).map((l) => l.id);
    const b = pickDaily(SEED_LISTINGS, '2026-06-19', 10).map((l) => l.id);
    expect(a).toEqual(b);
  });

  it('differs across dates', () => {
    const a = pickDaily(SEED_LISTINGS, '2026-06-19', 10).map((l) => l.id);
    const b = pickDaily(SEED_LISTINGS, '2026-06-20', 10).map((l) => l.id);
    expect(a).not.toEqual(b);
  });

  it('never repeats a listing within a day', () => {
    const ids = pickDaily(SEED_LISTINGS, '2026-06-19', 10).map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('formatToPar', () => {
  it('formats even par', () => {
    expect(formatToPar(0)).toBe('E');
  });
  it('formats under par with a minus sign', () => {
    expect(formatToPar(-4)).toBe('-4');
  });
  it('formats over par with a plus sign', () => {
    expect(formatToPar(3)).toBe('+3');
  });
});

describe('buildShareCard', () => {
  it('produces a spoiler-free Wordle-style card', () => {
    const results = [
      scoreGuess(500_000, 500_000), // ace
      scoreGuess(560_000, 500_000), // birdie-ish
      scoreGuess(250_000, 500_000), // double bogey
    ];
    const card = buildShareCard({ date: '2026-06-19', results });
    expect(card).toContain('Price Is Fairway');
    expect(card).toContain('2026-06-19');
    // emoji grid present, but no actual prices leaked
    expect(card).toContain('🏆');
    expect(card).not.toMatch(/\$|500,000/);
    // includes the to-par total
    expect(card).toContain(formatToPar(results.reduce((s, r) => s + r.strokes, 0)));
  });
});
