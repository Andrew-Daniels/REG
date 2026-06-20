import { describe, it, expect } from 'vitest';
import {
  makeCode,
  createLobby,
  addMember,
  removeMember,
  startGame,
  lobbyGuess,
  type Lobby,
} from '../server/lobby';
import { presetSettings } from '../src/state/settings';
import type { Listing } from '../src/core/listing';

function listing(id: string, price: number): Listing {
  return {
    id, price, status: 'closed', city: 'Austin', state: 'TX', lat: 30, lng: -97,
    photos: ['a.jpg'], beds: 3, baths: 2, sqft: 1500, yearBuilt: 2000,
    daysOnMarket: 10, lotSizeSqft: 5000, propertyType: 'Single Family',
    listDate: '2026-05-01', soldDate: '2026-05-15',
  };
}
const listings = [listing('a', 500_000), listing('b', 300_000), listing('c', 700_000)];

describe('makeCode', () => {
  it('produces an uppercase code of the requested length', () => {
    const code = makeCode(4, () => 0.5);
    expect(code).toHaveLength(4);
    expect(code).toBe(code.toUpperCase());
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });
  it('avoids ambiguous characters (no O/0/I/1)', () => {
    for (let i = 0; i < 50; i++) {
      const c = makeCode(6, Math.random);
      expect(c).not.toMatch(/[O0I1]/);
    }
  });
});

describe('lobby membership', () => {
  function fresh(): Lobby {
    return createLobby('ABCD', 'host', presetSettings('medium'));
  }

  it('starts in the lobby phase with no members', () => {
    const l = fresh();
    expect(l.phase).toBe('lobby');
    expect(l.members).toHaveLength(0);
  });

  it('adds members up to a max of 20', () => {
    let l = fresh();
    for (let i = 0; i < 20; i++) l = addMember(l, `p${i}`, `Player ${i}`);
    expect(l.members).toHaveLength(20);
    expect(() => addMember(l, 'p20', 'Overflow')).toThrow(/full/i);
  });

  it('is idempotent for a re-joining member id (reconnect)', () => {
    let l = fresh();
    l = addMember(l, 'p1', 'Ann');
    l = addMember(l, 'p1', 'Ann');
    expect(l.members).toHaveLength(1);
  });

  it('removes members', () => {
    let l = fresh();
    l = addMember(l, 'p1', 'Ann');
    l = removeMember(l, 'p1');
    expect(l.members).toHaveLength(0);
  });
});

describe('lobby gameplay', () => {
  it('starts a game from the lobby members', () => {
    let l = createLobby('ABCD', 'host', { ...presetSettings('medium'), roundCount: 2 });
    l = addMember(l, 'p1', 'Ann');
    l = addMember(l, 'p2', 'Bob');
    l = startGame(l, listings);
    expect(l.phase).toBe('playing');
    expect(l.game).not.toBeNull();
    expect(l.game!.players).toHaveLength(2);
  });

  it('requires at least one member to start', () => {
    const l = createLobby('ABCD', 'host', presetSettings('medium'));
    expect(() => startGame(l, listings)).toThrow();
  });

  it('records guesses and auto-reveals when everyone has guessed', () => {
    let l = createLobby('ABCD', 'host', { ...presetSettings('medium'), roundCount: 2 });
    l = addMember(l, 'p1', 'Ann');
    l = addMember(l, 'p2', 'Bob');
    l = startGame(l, listings);
    l = lobbyGuess(l, 'p1', 505_000);
    expect(l.game!.phase).toBe('guessing');
    l = lobbyGuess(l, 'p2', 480_000);
    expect(l.game!.phase).toBe('reveal');
  });
});
