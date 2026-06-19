import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createGame,
  submitGuess,
  revealRound,
  nextRound,
  standings,
  type GameState,
} from '../core/game';
import type { Listing, InfoFieldKey } from '../core/listing';
import { sound } from '../audio/engine';
import type { GameSettings } from './settings';

export interface Controller {
  state: GameState;
  /** Index of the player currently entering a guess (pass-and-play). */
  activePlayerIndex: number;
  timeLeft: number;
  /** Fields the active player has unlocked with powerups this round. */
  unlockedFields: InfoFieldKey[];
  submit(guess: number): void;
  spendPowerup(field: InfoFieldKey): boolean;
  advance(): void;
  standings: ReturnType<typeof standings>;
}

export function useGameController(
  settings: GameSettings,
  listings: Listing[],
): Controller {
  const [state, setState] = useState<GameState>(() =>
    createGame({
      config: {
        difficulty: settings.difficulty,
        sharedFields: settings.sharedFields,
        roundCount: Math.min(settings.roundCount, listings.length),
        timerSeconds: settings.timerSeconds,
      },
      players: settings.players.map((name, i) => ({ id: `p${i + 1}`, name })),
      listings,
    }),
  );
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timerSeconds);
  const [unlocked, setUnlocked] = useState<Record<string, InfoFieldKey[]>>({});

  const activeId = state.players[activePlayerIndex]?.id ?? '';
  const unlockedFields = unlocked[`${state.currentRound}:${activeId}`] ?? [];

  // Per-guesser countdown timer with audio ticks.
  useEffect(() => {
    if (state.phase !== 'guessing') return;
    setTimeLeft(settings.timerSeconds);
    const t = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          return 0;
        }
        sound.tick(v <= 6);
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [state.phase, state.currentRound, activePlayerIndex, settings.timerSeconds]);

  const submit = useCallback(
    (guess: number) => {
      sound.click();
      setState((s) => {
        const next = submitGuess(s, s.players[activePlayerIndex].id, guess);
        const isLast = activePlayerIndex >= s.players.length - 1;
        if (isLast) {
          const revealed = revealRound(next);
          // Celebrate the best result of the round.
          const best = revealed.rounds[revealed.currentRound].guesses
            .map((g) => g.result!)
            .sort((a, b) => a.strokes - b.strokes)[0];
          if (best) setTimeout(() => sound.celebrate(best.tier.name), 200);
          return revealed;
        }
        return next;
      });
      setActivePlayerIndex((i) =>
        i >= state.players.length - 1 ? i : i + 1,
      );
    },
    [activePlayerIndex, state.players.length],
  );

  const spendPowerup = useCallback(
    (field: InfoFieldKey): boolean => {
      let ok = false;
      setState((s) => {
        const p = s.players[activePlayerIndex];
        if (!p || p.powerups <= 0) return s;
        ok = true;
        const players = s.players.map((pl, i) =>
          i === activePlayerIndex ? { ...pl, powerups: pl.powerups - 1 } : pl,
        );
        return { ...s, players };
      });
      if (ok) {
        const key = `${state.currentRound}:${activeId}`;
        setUnlocked((u) => ({ ...u, [key]: [...(u[key] ?? []), field] }));
      }
      return ok;
    },
    [activePlayerIndex, activeId, state.currentRound],
  );

  const advance = useCallback(() => {
    sound.click();
    setActivePlayerIndex(0);
    setState((s) => nextRound(s));
  }, []);

  return {
    state,
    activePlayerIndex,
    timeLeft,
    unlockedFields,
    submit,
    spendPowerup,
    advance,
    standings: useMemo(() => standings(state), [state]),
  };
}

/** Local best-score leaderboard persisted in localStorage. */
const LB_KEY = 'fairway.leaderboard';
export interface LbEntry { name: string; strokes: number; date: string; }

export function loadLeaderboard(): LbEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(entry: LbEntry): LbEntry[] {
  const all = [...loadLeaderboard(), entry]
    .sort((a, b) => a.strokes - b.strokes)
    .slice(0, 25);
  localStorage.setItem(LB_KEY, JSON.stringify(all));
  return all;
}

/** Keep a stable ref to the latest controller (avoids stale closures in effects). */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
