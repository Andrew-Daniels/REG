import { useState } from 'react';
import { sound } from '../audio/engine';

export function MuteButton() {
  const [muted, setMuted] = useState(sound.isMuted());
  return (
    <button
      className="iconbtn"
      aria-label={muted ? 'unmute' : 'mute'}
      onClick={() => {
        const m = !muted;
        sound.setMuted(m);
        setMuted(m);
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
