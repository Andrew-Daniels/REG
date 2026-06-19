/**
 * Async "play-by-link" match for text-message / group-chat play.
 *
 * The whole match state lives in a URL-safe token, so no server is needed:
 * you take your turn, then re-send the link. Turn order is round-robin —
 * everyone plays round n before anyone plays round n+1.
 */

export interface AsyncPlayer {
  id: string;
  name: string;
}

export interface AsyncMatch {
  v: 1;
  /** Seed used to deterministically pick the listings (e.g. a date). */
  seed: string;
  rounds: number;
  players: AsyncPlayer[];
  /** guesses[playerIndex][roundIndex] = price, or null if not yet played. */
  guesses: (number | null)[][];
}

export interface NewMatchArgs {
  seed: string;
  rounds: number;
  players: AsyncPlayer[];
}

export function newMatch({ seed, rounds, players }: NewMatchArgs): AsyncMatch {
  return {
    v: 1,
    seed,
    rounds,
    players,
    guesses: players.map(() => Array.from({ length: rounds }, () => null)),
  };
}

/** How many rounds a player has completed (consecutive from the start). */
function roundsPlayed(match: AsyncMatch, playerIndex: number): number {
  return match.guesses[playerIndex].filter((g) => g !== null).length;
}

/** The round currently being played (the minimum completed across players). */
export function currentTurnRound(match: AsyncMatch): number {
  return Math.min(...match.players.map((_, i) => roundsPlayed(match, i)));
}

export function isComplete(match: AsyncMatch): boolean {
  return match.players.every((_, i) => roundsPlayed(match, i) >= match.rounds);
}

/** The id of the player whose turn it is, or null if the match is complete. */
export function whoseTurn(match: AsyncMatch): string | null {
  if (isComplete(match)) return null;
  const round = currentTurnRound(match);
  const idx = match.players.findIndex((_, i) => roundsPlayed(match, i) === round);
  return idx === -1 ? null : match.players[idx].id;
}

/** Apply a player's guess. Throws if it isn't that player's turn. */
export function applyTurn(match: AsyncMatch, playerId: string, guess: number): AsyncMatch {
  if (whoseTurn(match) !== playerId) {
    throw new Error(`It is not ${playerId}'s turn`);
  }
  const idx = match.players.findIndex((p) => p.id === playerId);
  const round = roundsPlayed(match, idx);
  const guesses = match.guesses.map((row, i) =>
    i === idx ? row.map((g, r) => (r === round ? guess : g)) : row,
  );
  return { ...match, guesses };
}

// --- URL-safe encoding (base64url, no padding) ---

function toBase64Url(json: string): string {
  const b64 =
    typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token: string): string {
  const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof atob === 'function') {
    return decodeURIComponent(escape(atob(b64)));
  }
  return Buffer.from(b64, 'base64').toString('utf-8');
}

export function encodeMatch(match: AsyncMatch): string {
  return toBase64Url(JSON.stringify(match));
}

export function decodeMatch(token: string): AsyncMatch {
  return JSON.parse(fromBase64Url(token)) as AsyncMatch;
}

/** Build a shareable link that drops the player straight into their turn. */
export function buildTurnLink(baseUrl: string, match: AsyncMatch): string {
  return `${baseUrl.replace(/\/$/, '')}/#m=${encodeMatch(match)}`;
}
