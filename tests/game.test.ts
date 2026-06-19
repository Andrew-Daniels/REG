import { describe, it, expect } from 'vitest';
import {
  createGame,
  submitGuess,
  allGuessed,
  revealRound,
  nextRound,
  standings,
  type GameConfig,
} from '../src/core/game';
import type { Listing } from '../src/core/listing';

function listing(id: string, price: number): Listing {
  return {
    id, price, status: 'closed', city: 'Austin', state: 'TX', lat: 30, lng: -97,
    photos: ['a.jpg'], beds: 3, baths: 2, sqft: 1500, yearBuilt: 2000,
    daysOnMarket: 10, lotSizeSqft: 5000, propertyType: 'Single Family',
    listDate: '2026-05-01', soldDate: '2026-05-15',
  };
}

const config: GameConfig = {
  difficulty: 'medium',
  sharedFields: ['beds', 'baths'],
  roundCount: 2,
  timerSeconds: 30,
};

const players = [
  { id: 'p1', name: 'Ann' },
  { id: 'p2', name: 'Bob' },
];

const listings = [listing('a', 500_000), listing('b', 300_000), listing('c', 700_000)];

describe('createGame', () => {
  it('prepares exactly roundCount rounds', () => {
    const g = createGame({ config, players, listings });
    expect(g.rounds).toHaveLength(2);
    expect(g.currentRound).toBe(0);
    expect(g.phase).toBe('guessing');
  });

  it('initializes every player at zero strokes with no powerups', () => {
    const g = createGame({ config, players, listings });
    expect(g.players.every((p) => p.strokes === 0 && p.powerups === 0)).toBe(true);
  });

  it('throws when there are not enough listings', () => {
    expect(() => createGame({ config, players, listings: [listing('a', 1)] })).toThrow();
  });
});

describe('guessing and reveal', () => {
  it('tracks who has guessed', () => {
    let g = createGame({ config, players, listings });
    expect(allGuessed(g)).toBe(false);
    g = submitGuess(g, 'p1', 505_000);
    expect(allGuessed(g)).toBe(false);
    g = submitGuess(g, 'p2', 400_000);
    expect(allGuessed(g)).toBe(true);
  });

  it('a later guess from the same player overwrites the earlier one', () => {
    let g = createGame({ config, players, listings });
    g = submitGuess(g, 'p1', 100_000);
    g = submitGuess(g, 'p1', 505_000);
    const guesses = g.rounds[0].guesses.filter((x) => x.playerId === 'p1');
    expect(guesses).toHaveLength(1);
    expect(guesses[0].guess).toBe(505_000);
  });

  it('scores the round, updates strokes, and moves to reveal', () => {
    let g = createGame({ config, players, listings });
    g = submitGuess(g, 'p1', 505_000); // ~1% -> ace -3
    g = submitGuess(g, 'p2', 250_000); // 50% off -> double bogey +2
    g = revealRound(g);
    expect(g.phase).toBe('reveal');
    expect(g.players.find((p) => p.id === 'p1')!.strokes).toBe(-3);
    expect(g.players.find((p) => p.id === 'p2')!.strokes).toBe(2);
  });

  it('awards a powerup to players who score bogey or worse', () => {
    let g = createGame({ config, players, listings });
    g = submitGuess(g, 'p1', 505_000); // ace -> no powerup
    g = submitGuess(g, 'p2', 250_000); // double bogey -> powerup
    g = revealRound(g);
    expect(g.players.find((p) => p.id === 'p1')!.powerups).toBe(0);
    expect(g.players.find((p) => p.id === 'p2')!.powerups).toBe(1);
  });
});

describe('round progression', () => {
  it('advances to the next round and resets to guessing', () => {
    let g = createGame({ config, players, listings });
    g = submitGuess(g, 'p1', 505_000);
    g = submitGuess(g, 'p2', 505_000);
    g = revealRound(g);
    g = nextRound(g);
    expect(g.currentRound).toBe(1);
    expect(g.phase).toBe('guessing');
  });

  it('marks the game complete after the last round', () => {
    let g = createGame({ config, players, listings });
    for (let r = 0; r < config.roundCount; r++) {
      g = submitGuess(g, 'p1', 505_000);
      g = submitGuess(g, 'p2', 505_000);
      g = revealRound(g);
      g = nextRound(g);
    }
    expect(g.phase).toBe('complete');
  });
});

describe('standings', () => {
  it('ranks players by total strokes ascending', () => {
    let g = createGame({ config, players, listings });
    g = submitGuess(g, 'p1', 505_000); // ace
    g = submitGuess(g, 'p2', 250_000); // double bogey
    g = revealRound(g);
    const s = standings(g);
    expect(s[0].id).toBe('p1');
    expect(s[0].rank).toBe(1);
  });
});
