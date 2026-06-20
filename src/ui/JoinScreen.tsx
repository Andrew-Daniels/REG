import { useState } from 'react';
import { sound } from '../audio/engine';

interface Props {
  onJoin: (code: string, name: string) => void;
  onBack: () => void;
  prefillCode?: string;
}

export function JoinScreen({ onJoin, onBack, prefillCode }: Props) {
  const [code, setCode] = useState(prefillCode ?? '');
  const [name, setName] = useState('');

  const ready = code.trim().length >= 3 && name.trim().length >= 1;

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="iconbtn" onClick={onBack}>←</button>
        <strong>📱 Join a Lobby</strong>
      </div>
      <div className="card">
        <label className="field">
          Lobby code
          <input
            className="text"
            style={{ textTransform: 'uppercase', letterSpacing: 6, fontWeight: 800, textAlign: 'center' }}
            value={code}
            maxLength={5}
            placeholder="ABCD"
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          />
        </label>
        <label className="field" style={{ marginTop: 12 }}>
          Your name
          <input className="text" value={name} placeholder="Your name" onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <button
        className="btn btn-primary"
        disabled={!ready}
        onClick={() => { sound.click(); sound.startTheme(); setTimeout(() => sound.stopTheme(), 30); onJoin(code.trim(), name.trim()); }}
      >
        Join game 🎮
      </button>
    </div>
  );
}
