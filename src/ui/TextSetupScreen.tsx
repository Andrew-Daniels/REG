import { useState } from 'react';
import { newMatch, type AsyncMatch } from '../core/asyncGame';
import { sound } from '../audio/engine';

interface Props {
  onCreated: (m: AsyncMatch) => void;
  onBack: () => void;
}

export function TextSetupScreen({ onCreated, onBack }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [names, setNames] = useState<string[]>(['You', 'Friend']);
  const [rounds, setRounds] = useState(5);

  const setName = (i: number, v: string) => setNames((n) => n.map((x, k) => (k === i ? v : x)));
  const add = () => setNames((n) => (n.length >= 8 ? n : [...n, `Player ${n.length + 1}`]));
  const remove = (i: number) => setNames((n) => n.filter((_, k) => k !== i));

  const create = () => {
    sound.click();
    const players = names.map((name, i) => ({ id: `p${i + 1}`, name: name || `Player ${i + 1}` }));
    onCreated(newMatch({ seed: today, rounds, players }));
  };

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="iconbtn" onClick={onBack}>←</button>
        <strong>💬 Play by Text</strong>
      </div>
      <div className="card muted">
        Create a match, then send the link to your group chat. Everyone plays the
        same hole before anyone moves on — take your turn and re-send the link.
      </div>
      <div className="card">
        <div className="muted" style={{ marginBottom: 8 }}>Players ({names.length}/8)</div>
        {names.map((p, i) => (
          <div className="row" key={i} style={{ marginBottom: 8 }}>
            <input className="text" style={{ flex: 1 }} value={p} onChange={(e) => setName(i, e.target.value)} />
            {names.length > 2 && <button className="iconbtn" onClick={() => remove(i)}>✕</button>}
          </div>
        ))}
        {names.length < 8 && <button className="btn btn-soft" onClick={add}>+ Add player</button>}
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
          <span className="muted">Holes</span>
          <div className="seg" style={{ maxWidth: 220 }}>
            {[3, 5, 9].map((n) => (
              <button key={n} className={rounds === n ? 'on' : ''} onClick={() => setRounds(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <button className="btn btn-primary" onClick={create}>Create match 🎟️</button>
    </div>
  );
}
