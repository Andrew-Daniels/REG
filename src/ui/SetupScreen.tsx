import { useState } from 'react';
import type { Difficulty } from '../core/scoring';
import type { InfoFieldKey, ListingStatus } from '../core/listing';
import { INFO_FIELDS } from '../core/listing';
import { presetSettings, type GameSettings } from '../state/settings';
import { sound } from '../audio/engine';
import type { Mode } from './HomeScreen';

interface Props {
  mode: Mode;
  onStart: (s: GameSettings) => void;
  onBack: () => void;
}

const STATUSES: { key: ListingStatus; label: string }[] = [
  { key: 'closed', label: 'Sold' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
];

export function SetupScreen({ mode, onStart, onBack }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [s, setS] = useState<GameSettings>(() => presetSettings('medium'));

  const applyPreset = (d: Difficulty) => {
    sound.click();
    setDifficulty(d);
    setS((cur) => ({ ...presetSettings(d), players: cur.players, roundCount: cur.roundCount }));
  };

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const setPlayer = (i: number, name: string) =>
    setS((c) => ({ ...c, players: c.players.map((p, k) => (k === i ? name : p)) }));
  const addPlayer = () =>
    setS((c) => (c.players.length >= 20 ? c : { ...c, players: [...c.players, `Player ${c.players.length + 1}`] }));
  const removePlayer = (i: number) =>
    setS((c) => ({ ...c, players: c.players.filter((_, k) => k !== i) }));

  const isParty = mode === 'party';
  const title = isParty ? '👥 Party Setup' : '🎯 Quick Play Setup';

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="iconbtn" onClick={onBack}>←</button>
        <strong>{title}</strong>
      </div>

      <div className="card">
        <div className="muted" style={{ marginBottom: 6 }}>Difficulty preset</div>
        <div className="seg">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button key={d} className={d === difficulty ? 'on' : ''} onClick={() => applyPreset(d)}>
              {d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          {difficulty === 'easy' && 'Lots of details shared, generous scoring.'}
          {difficulty === 'medium' && 'Beds/baths/sqft shared, standard scoring.'}
          {difficulty === 'hard' && 'Barely any details, tight scoring. Good luck.'}
        </p>
      </div>

      <div className="card">
        <div className="muted" style={{ marginBottom: 8 }}>Info shared before guessing</div>
        <div className="row wrap">
          {INFO_FIELDS.map((f) => (
            <span
              key={f.key}
              className={`chip toggle ${s.sharedFields.includes(f.key) ? 'on' : ''}`}
              onClick={() => { sound.click(); setS((c) => ({ ...c, sharedFields: toggle<InfoFieldKey>(c.sharedFields, f.key) })); }}
            >
              {f.label}
            </span>
          ))}
        </div>
        <div className="muted" style={{ margin: '12px 0 8px' }}>Listings to include</div>
        <div className="row wrap">
          {STATUSES.map((st) => (
            <span
              key={st.key}
              className={`chip toggle ${s.statuses.includes(st.key) ? 'on' : ''}`}
              onClick={() => { sound.click(); setS((c) => ({ ...c, statuses: toggle<ListingStatus>(c.statuses, st.key) })); }}
            >
              {st.label}
            </span>
          ))}
        </div>
        <label className="row" style={{ marginTop: 12, gap: 8 }}>
          <input
            type="checkbox"
            checked={s.recencyDays != null}
            onChange={(e) => setS((c) => ({ ...c, recencyDays: e.target.checked ? 35 : undefined }))}
          />
          <span>Only recent (last ~month). Uncheck to include the very distant past.</span>
        </label>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">Holes</span>
          <div className="seg" style={{ maxWidth: 220 }}>
            {[3, 5, 9].map((n) => (
              <button key={n} className={s.roundCount === n ? 'on' : ''} onClick={() => setS((c) => ({ ...c, roundCount: n }))}>{n}</button>
            ))}
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
          <span className="muted">Timer (sec)</span>
          <div className="seg" style={{ maxWidth: 220 }}>
            {[15, 30, 60].map((n) => (
              <button key={n} className={s.timerSeconds === n ? 'on' : ''} onClick={() => setS((c) => ({ ...c, timerSeconds: n }))}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      {isParty && (
        <div className="card">
          <div className="muted" style={{ marginBottom: 8 }}>Players ({s.players.length}/20) — pass the phone each turn</div>
          {s.players.map((p, i) => (
            <div className="row" key={i} style={{ marginBottom: 8 }}>
              <input className="text" style={{ flex: 1 }} value={p} onChange={(e) => setPlayer(i, e.target.value)} />
              {s.players.length > 1 && <button className="iconbtn" onClick={() => removePlayer(i)}>✕</button>}
            </div>
          ))}
          {s.players.length < 20 && <button className="btn btn-soft" onClick={addPlayer}>+ Add player</button>}
        </div>
      )}

      <button
        className="btn btn-primary"
        disabled={s.statuses.length === 0}
        onClick={() => { sound.click(); onStart(s); }}
      >
        Tee off ⛳
      </button>
    </div>
  );
}
