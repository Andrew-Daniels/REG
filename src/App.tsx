import { useEffect, useMemo, useState } from 'react';
import { HomeScreen, type Mode } from './ui/HomeScreen';
import { SetupScreen } from './ui/SetupScreen';
import { GameScreen } from './ui/GameScreen';
import { TextSetupScreen } from './ui/TextSetupScreen';
import { AsyncTurnScreen } from './ui/AsyncTurnScreen';
import { JoinScreen } from './ui/JoinScreen';
import { LiveContainer, type LiveIntent } from './ui/LiveContainer';
import { clientProvider } from './data';
import { pickDaily } from './core/daily';
import { decodeMatch, type AsyncMatch } from './core/asyncGame';
import { presetSettings, type GameSettings } from './state/settings';
import { saveLeaderboardEntry } from './state/useGameController';
import { SEED_LISTINGS } from './data/seedListings';
import type { Listing } from './core/listing';
import type { GameState } from './core/game';

type Route =
  | { name: 'home' }
  | { name: 'setup'; mode: Mode }
  | { name: 'game'; settings: GameSettings; listings: Listing[]; dailyDate?: string }
  | { name: 'text-setup' }
  | { name: 'async'; match: AsyncMatch }
  | { name: 'join' }
  | { name: 'live'; intent: LiveIntent };

const provider = clientProvider();

function readMatchFromHash(): AsyncMatch | null {
  if (typeof window === 'undefined') return null;
  const m = /#m=(.+)$/.exec(window.location.hash);
  if (!m) return null;
  try {
    return decodeMatch(m[1]);
  } catch {
    return null;
  }
}

export default function App() {
  const initialMatch = useMemo(readMatchFromHash, []);
  const [route, setRoute] = useState<Route>(
    initialMatch ? { name: 'async', match: initialMatch } : { name: 'home' },
  );

  const home = () => {
    if (window.location.hash) window.location.hash = '';
    setRoute({ name: 'home' });
  };

  // Respond to links opened mid-session.
  useEffect(() => {
    const onHash = () => {
      const m = readMatchFromHash();
      if (m) setRoute({ name: 'async', match: m });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const startGame = async (mode: Mode, settings: GameSettings) => {
    const listings = await provider.fetchListings({
      statuses: settings.statuses,
      recencyDays: settings.recencyDays,
    });
    const usable = listings.length >= settings.roundCount ? listings : SEED_LISTINGS;
    setRoute({ name: 'game', settings, listings: shuffle(usable), dailyDate: undefined });
    void mode;
  };

  const startDaily = () => {
    const date = new Date().toISOString().slice(0, 10);
    const listings = pickDaily(SEED_LISTINGS, date, 10);
    const settings: GameSettings = { ...presetSettings('medium'), roundCount: 10, players: ['You'] };
    setRoute({ name: 'game', settings, listings, dailyDate: date });
  };

  const onComplete = (state: GameState) => {
    const winner = [...state.players].sort((a, b) => a.strokes - b.strokes)[0];
    if (winner) {
      saveLeaderboardEntry({
        name: winner.name,
        strokes: winner.strokes,
        date: new Date().toISOString().slice(0, 10),
      });
    }
  };

  switch (route.name) {
    case 'home':
      return (
        <HomeScreen
          onPick={(mode) => {
            if (mode === 'daily') return startDaily();
            if (mode === 'text') return setRoute({ name: 'text-setup' });
            if (mode === 'join') return setRoute({ name: 'join' });
            setRoute({ name: 'setup', mode });
          }}
        />
      );
    case 'setup':
      return (
        <SetupScreen
          mode={route.mode}
          onBack={home}
          onStart={(s) =>
            route.mode === 'host'
              ? setRoute({ name: 'live', intent: { type: 'host', settings: s } })
              : startGame(route.mode, s)
          }
        />
      );
    case 'game':
      return (
        <GameScreen
          settings={route.settings}
          listings={route.listings}
          dailyDate={route.dailyDate}
          onExit={home}
          onComplete={onComplete}
        />
      );
    case 'text-setup':
      return (
        <TextSetupScreen onBack={home} onCreated={(match) => setRoute({ name: 'async', match })} />
      );
    case 'async':
      return <AsyncTurnScreen match={route.match} onExit={home} />;
    case 'join':
      return (
        <JoinScreen
          onBack={home}
          onJoin={(code, name) => setRoute({ name: 'live', intent: { type: 'join', code, name } })}
        />
      );
    case 'live':
      return <LiveContainer intent={route.intent} onExit={home} />;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
