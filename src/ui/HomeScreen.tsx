import { sound } from '../audio/engine';
import { MuteButton } from './MuteButton';

export type Mode = 'solo' | 'party' | 'daily' | 'text' | 'host' | 'join';

export function HomeScreen({ onPick }: { onPick: (m: Mode) => void }) {
  const go = (m: Mode) => {
    sound.click();
    sound.startTheme(); // first user gesture unlocks audio
    setTimeout(() => sound.stopTheme(), 50); // just unlock; theme plays in-game
    onPick(m);
  };
  return (
    <div className="screen">
      <div className="top-bar">
        <div className="spacer" />
        <MuteButton />
      </div>
      <div className="brand">
        <h1>🏡⛳ Price Is Fairway</h1>
        <p>Guess the home price. Score like golf. Lowest wins.</p>
      </div>
      <div className="menu">
        <button className="btn btn-primary" onClick={() => go('host')}>📺 Big Screen Party</button>
        <button className="btn btn-ghost" onClick={() => go('join')}>📱 Join a Lobby</button>
        <button className="btn btn-gold" onClick={() => go('daily')}>📅 Daily Challenge</button>
        <button className="btn btn-soft" onClick={() => go('party')}>👥 Pass &amp; Play</button>
        <button className="btn btn-soft" onClick={() => go('solo')}>🎯 Solo / Quick Play</button>
        <button className="btn btn-soft" onClick={() => go('text')}>💬 Play by Text</button>
      </div>
      <div className="card muted center">
        Free to play • Real listings • Maps & photos<br />
        Hole-in-one 🏆 to Out-of-bounds 🌲
      </div>
    </div>
  );
}
