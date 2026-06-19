import { describe, it, expect } from 'vitest';
import {
  percentError,
  scoreGuess,
  buildTiers,
  DEFAULT_TIERS,
  totalStrokes,
  rankPlayers,
} from '../src/core/scoring';

describe('percentError', () => {
  it('is 0 for a perfect guess', () => {
    expect(percentError(500_000, 500_000)).toBe(0);
  });

  it('is symmetric in magnitude (absolute)', () => {
    expect(percentError(450_000, 500_000)).toBeCloseTo(0.1, 5);
    expect(percentError(550_000, 500_000)).toBeCloseTo(0.1, 5);
  });

  it('handles guesses far above actual', () => {
    expect(percentError(1_000_000, 500_000)).toBeCloseTo(1.0, 5);
  });
});

describe('scoreGuess with default tiers (golf: lower strokes is better)', () => {
  it('awards an ace (hole-in-one) for a near-exact guess', () => {
    const r = scoreGuess(501_000, 500_000);
    expect(r.tier.name).toBe('ace');
    expect(r.strokes).toBe(-3);
  });

  it('awards a birdie for ~8% off', () => {
    const r = scoreGuess(540_000, 500_000);
    expect(r.tier.name).toBe('birdie');
    expect(r.strokes).toBe(-1);
  });

  it('awards par for ~15% off', () => {
    const r = scoreGuess(575_000, 500_000);
    expect(r.tier.name).toBe('par');
    expect(r.strokes).toBe(0);
  });

  it('awards a double bogey for ~45% off', () => {
    const r = scoreGuess(725_000, 500_000);
    expect(r.tier.name).toBe('double_bogey');
    expect(r.strokes).toBe(2);
  });

  it('awards out of bounds for a wild guess', () => {
    const r = scoreGuess(2_000_000, 500_000);
    expect(r.tier.name).toBe('out_of_bounds');
    expect(r.strokes).toBe(4);
  });

  it('reports the percent error on the result', () => {
    const r = scoreGuess(450_000, 500_000);
    expect(r.percentError).toBeCloseTo(0.1, 5);
    expect(r.guess).toBe(450_000);
    expect(r.actual).toBe(500_000);
  });
});

describe('buildTiers difficulty scaling', () => {
  it('hard mode is tighter than easy mode for the same guess', () => {
    const easy = scoreGuess(560_000, 500_000, buildTiers('easy'));
    const hard = scoreGuess(560_000, 500_000, buildTiers('hard'));
    // 12% off: easy should be more generous (fewer/equal strokes) than hard
    expect(easy.strokes).toBeLessThanOrEqual(hard.strokes);
  });

  it('default tiers equal medium difficulty', () => {
    expect(buildTiers('medium')).toEqual(DEFAULT_TIERS);
  });
});

describe('totalStrokes and ranking', () => {
  it('sums strokes across rounds', () => {
    expect(totalStrokes([-3, 0, 2, -1])).toBe(-2);
  });

  it('ranks players ascending by strokes (golf), lowest first', () => {
    const ranked = rankPlayers([
      { id: 'a', name: 'Ann', strokes: 3 },
      { id: 'b', name: 'Bob', strokes: -2 },
      { id: 'c', name: 'Cy', strokes: 0 },
    ]);
    expect(ranked.map((p) => p.id)).toEqual(['b', 'c', 'a']);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[2].rank).toBe(3);
  });

  it('assigns tied players the same rank', () => {
    const ranked = rankPlayers([
      { id: 'a', name: 'Ann', strokes: 1 },
      { id: 'b', name: 'Bob', strokes: 1 },
      { id: 'c', name: 'Cy', strokes: 5 },
    ]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(1);
    expect(ranked[2].rank).toBe(3);
  });
});
