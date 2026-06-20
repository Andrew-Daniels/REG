/**
 * Pure lobby state + transitions for the live phone-party mode.
 * Transport-agnostic so it can be unit tested and driven by the WS server.
 */

import {
  createGame,
  submitGuess,
  allGuessed,
  revealRound,
  nextRound,
  type GameState,
} from '../src/core/game';
import type { Listing } from '../src/core/listing';
import type { GameSettings } from '../src/state/settings';

export type LobbyPhase = 'lobby' | 'playing';

export interface LobbyMember {
  id: string;
  name: string;
}

export interface Lobby {
  code: string;
  hostId: string;
  settings: GameSettings;
  members: LobbyMember[];
  phase: LobbyPhase;
  game: GameState | null;
}

const MAX_PLAYERS = 20;
// Excludes ambiguous characters (O/0/I/1) for easy phone entry.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeCode(len = 4, rand: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return out;
}

export function createLobby(code: string, hostId: string, settings: GameSettings): Lobby {
  return { code, hostId, settings, members: [], phase: 'lobby', game: null };
}

export function addMember(lobby: Lobby, id: string, name: string): Lobby {
  if (lobby.members.some((m) => m.id === id)) {
    // Reconnect / rename — keep latest name.
    return { ...lobby, members: lobby.members.map((m) => (m.id === id ? { ...m, name } : m)) };
  }
  if (lobby.members.length >= MAX_PLAYERS) {
    throw new Error('Lobby is full (20 players max)');
  }
  return { ...lobby, members: [...lobby.members, { id, name }] };
}

export function removeMember(lobby: Lobby, id: string): Lobby {
  return { ...lobby, members: lobby.members.filter((m) => m.id !== id) };
}

export function startGame(lobby: Lobby, listings: Listing[]): Lobby {
  if (lobby.members.length === 0) throw new Error('Need at least one player to start');
  const roundCount = Math.min(lobby.settings.roundCount, listings.length);
  const game = createGame({
    config: {
      difficulty: lobby.settings.difficulty,
      sharedFields: lobby.settings.sharedFields,
      roundCount,
      timerSeconds: lobby.settings.timerSeconds,
    },
    players: lobby.members.map((m) => ({ id: m.id, name: m.name })),
    listings,
  });
  return { ...lobby, phase: 'playing', game };
}

export function lobbyGuess(lobby: Lobby, playerId: string, guess: number): Lobby {
  if (!lobby.game) return lobby;
  let game = submitGuess(lobby.game, playerId, guess);
  if (allGuessed(game)) game = revealRound(game);
  return { ...lobby, game };
}

export function lobbyNext(lobby: Lobby): Lobby {
  if (!lobby.game) return lobby;
  return { ...lobby, game: nextRound(lobby.game) };
}
