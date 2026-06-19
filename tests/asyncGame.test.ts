import { describe, it, expect } from 'vitest';
import {
  newMatch,
  whoseTurn,
  currentTurnRound,
  applyTurn,
  isComplete,
  encodeMatch,
  decodeMatch,
  buildTurnLink,
} from '../src/core/asyncGame';

const players = [
  { id: 'p1', name: 'Ann' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Cy' },
];

describe('turn order (round-robin: all play round n before anyone plays n+1)', () => {
  it('starts with the first player on round 0', () => {
    const m = newMatch({ seed: '2026-06-19', rounds: 3, players });
    expect(currentTurnRound(m)).toBe(0);
    expect(whoseTurn(m)).toBe('p1');
  });

  it('cycles through all players on round 0 before advancing to round 1', () => {
    let m = newMatch({ seed: '2026-06-19', rounds: 3, players });
    m = applyTurn(m, 'p1', 100);
    expect(whoseTurn(m)).toBe('p2');
    m = applyTurn(m, 'p2', 200);
    expect(whoseTurn(m)).toBe('p3');
    expect(currentTurnRound(m)).toBe(0);
    m = applyTurn(m, 'p3', 300);
    // everyone has played round 0, now back to p1 for round 1
    expect(currentTurnRound(m)).toBe(1);
    expect(whoseTurn(m)).toBe('p1');
  });

  it('rejects a turn from a player when it is not their turn', () => {
    const m = newMatch({ seed: '2026-06-19', rounds: 3, players });
    expect(() => applyTurn(m, 'p2', 200)).toThrow();
  });

  it('records the guess for the acting player', () => {
    let m = newMatch({ seed: '2026-06-19', rounds: 3, players });
    m = applyTurn(m, 'p1', 425_000);
    expect(m.guesses[0][0]).toBe(425_000);
  });
});

describe('completion', () => {
  it('is complete once every player has played every round', () => {
    let m = newMatch({ seed: '2026-06-19', rounds: 2, players });
    for (let r = 0; r < 2; r++) {
      for (const p of players) m = applyTurn(m, p.id, 100 + r);
    }
    expect(isComplete(m)).toBe(true);
    expect(whoseTurn(m)).toBeNull();
  });
});

describe('link encoding round-trips', () => {
  it('encodes and decodes a match losslessly', () => {
    let m = newMatch({ seed: '2026-06-19', rounds: 2, players });
    m = applyTurn(m, 'p1', 425_000);
    const decoded = decodeMatch(encodeMatch(m));
    expect(decoded).toEqual(m);
  });

  it('produces a url-safe token with no padding', () => {
    const m = newMatch({ seed: '2026-06-19', rounds: 2, players });
    const token = encodeMatch(m);
    expect(token).not.toMatch(/[+/=]/);
  });

  it('builds a turn link with the match token in the hash', () => {
    const m = newMatch({ seed: '2026-06-19', rounds: 2, players });
    const link = buildTurnLink('https://fairway.example', m);
    expect(link).toContain('#m=');
    expect(decodeMatch(link.split('#m=')[1])).toEqual(m);
  });
});
