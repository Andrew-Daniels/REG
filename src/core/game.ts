/** Pure game-session state machine: rounds, guesses, scoring, powerups, standings. */

import type { Listing, InfoFieldKey } from './listing';
import {
  buildTiers,
  scoreGuess,
  rankPlayers,
  type Difficulty,
  type GuessResult,
  type RankedPlayer,
} from './scoring';

export interface GameConfig {
  difficulty: Difficulty;
  sharedFields: InfoFieldKey[];
  roundCount: number;
  timerSeconds: number;
}

export interface RoundGuess {
  playerId: string;
  guess: number;
  result?: GuessResult;
}

export interface GameRound {
  listing: Listing;
  guesses: RoundGuess[];
  scored: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  strokes: number;
  /** Unspent powerup tokens earned by losing rounds. */
  powerups: number;
}

export type GamePhase = 'guessing' | 'reveal' | 'complete';

export interface GameState {
  config: GameConfig;
  players: PlayerState[];
  rounds: GameRound[];
  currentRound: number;
  phase: GamePhase;
}

export interface CreateGameArgs {
  config: GameConfig;
  players: { id: string; name: string }[];
  listings: Listing[];
}

/** Build a fresh game. Throws if there aren't enough listings for the rounds. */
export function createGame({ config, players, listings }: CreateGameArgs): GameState {
  if (listings.length < config.roundCount) {
    throw new Error(
      `Need at least ${config.roundCount} listings, got ${listings.length}`,
    );
  }
  const rounds: GameRound[] = listings
    .slice(0, config.roundCount)
    .map((listing) => ({ listing, guesses: [], scored: false }));
  return {
    config,
    players: players.map((p) => ({ id: p.id, name: p.name, strokes: 0, powerups: 0 })),
    rounds,
    currentRound: 0,
    phase: 'guessing',
  };
}

function currentRoundOf(state: GameState): GameRound {
  return state.rounds[state.currentRound];
}

/** Record (or overwrite) a player's guess for the current round. */
export function submitGuess(state: GameState, playerId: string, guess: number): GameState {
  if (state.phase !== 'guessing') return state;
  const round = currentRoundOf(state);
  const guesses = round.guesses.filter((g) => g.playerId !== playerId);
  guesses.push({ playerId, guess });
  const rounds = state.rounds.map((r, i) =>
    i === state.currentRound ? { ...r, guesses } : r,
  );
  return { ...state, rounds };
}

/** True once every player has a guess recorded for the current round. */
export function allGuessed(state: GameState): boolean {
  const round = currentRoundOf(state);
  return state.players.every((p) => round.guesses.some((g) => g.playerId === p.id));
}

/** Score the current round: assign results, update strokes, award powerups. */
export function revealRound(state: GameState): GameState {
  if (state.phase !== 'guessing') return state;
  const round = currentRoundOf(state);
  const tiers = buildTiers(state.config.difficulty);
  const actual = round.listing.price;

  const scoredGuesses: RoundGuess[] = round.guesses.map((g) => ({
    ...g,
    result: scoreGuess(g.guess, actual, tiers),
  }));

  const players = state.players.map((p) => {
    const g = scoredGuesses.find((x) => x.playerId === p.id);
    if (!g?.result) return p;
    const lost = g.result.strokes > 0; // bogey or worse
    return {
      ...p,
      strokes: p.strokes + g.result.strokes,
      powerups: p.powerups + (lost ? 1 : 0),
    };
  });

  const rounds = state.rounds.map((r, i) =>
    i === state.currentRound ? { ...r, guesses: scoredGuesses, scored: true } : r,
  );
  return { ...state, players, rounds, phase: 'reveal' };
}

/** Advance to the next round, or finish the game. */
export function nextRound(state: GameState): GameState {
  if (state.phase !== 'reveal') return state;
  const next = state.currentRound + 1;
  if (next >= state.rounds.length) {
    return { ...state, phase: 'complete' };
  }
  return { ...state, currentRound: next, phase: 'guessing' };
}

/** Current standings, ranked by total strokes (golf: lowest first). */
export function standings(state: GameState): RankedPlayer[] {
  return rankPlayers(
    state.players.map((p) => ({ id: p.id, name: p.name, strokes: p.strokes })),
  );
}
