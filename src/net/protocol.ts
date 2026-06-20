/** Shared WebSocket message protocol for the live phone-lobby mode. */

import type { GameState } from '../core/game';
import type { GameSettings } from '../state/settings';

export interface PublicLobby {
  code: string;
  hostId: string;
  settings: GameSettings;
  members: { id: string; name: string }[];
  phase: 'lobby' | 'playing';
  /** Sanitized game state (current listing price hidden until reveal). */
  game: GameState | null;
}

export type ClientMsg =
  | { t: 'host'; settings: GameSettings; name: string }
  | { t: 'join'; code: string; name: string; rejoinId?: string }
  | { t: 'start' }
  | { t: 'guess'; guess: number }
  | { t: 'next' };

export type ServerMsg =
  | { t: 'hosted'; code: string; you: string; lobby: PublicLobby }
  | { t: 'joined'; you: string; lobby: PublicLobby }
  | { t: 'state'; lobby: PublicLobby }
  | { t: 'error'; message: string };

export const WS_PORT = 8787;
