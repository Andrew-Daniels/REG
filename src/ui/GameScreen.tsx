import { useEffect, useState } from 'react';
import type { Listing, InfoFieldKey } from '../core/listing';
import { INFO_FIELDS, formatField, visibleFields } from '../core/listing';
import type { GameSettings } from '../state/settings';
import { useGameController } from '../state/useGameController';
import { PhotoCarousel } from './PhotoCarousel';
import { PriceMap } from './PriceMap';
import { Confetti } from './Confetti';
import { money, moneyShort, tierClass } from './format';
import { MuteButton } from './MuteButton';
import { Standings } from './Standings';
import { ShareCard } from './ShareCard';
import { buildShareCard, formatToPar } from '../core/daily';
import type { GameState } from '../core/game';
import { sound } from '../audio/engine';

interface Props {
  settings: GameSettings;
  listings: Listing[];
  onExit: () => void;
  onComplete?: (state: GameState) => void;
  /** When set, the completion screen shows a Wordle-style share card. */
  dailyDate?: string;
}

const SLIDER_MIN = 50_000;
const SLIDER_MAX = 3_000_000;

function GuessSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="pricetag">{money(value)}</div>
      <input
        className="text"
        style={{ width: '100%' }}
        type="range"
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={5000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="your price guess"
      />
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">{moneyShort(SLIDER_MIN)}</span>
        <span className="muted">{moneyShort(SLIDER_MAX)}+</span>
      </div>
    </div>
  );
}

export function GameScreen({ settings, listings, onExit, onComplete, dailyDate }: Props) {
  const ctrl = useGameController(settings, listings);
  const { state } = ctrl;
  const [guess, setGuess] = useState(400_000);

  useEffect(() => {
    if (state.phase === 'complete') onComplete?.(state);
  }, [state.phase]);

  if (state.phase === 'complete') {
    const p0Results = state.rounds
      .map((r) => r.guesses.find((g) => g.playerId === state.players[0].id)?.result)
      .filter((r): r is NonNullable<typeof r> => !!r);
    const card = dailyDate ? buildShareCard({ date: dailyDate, results: p0Results }) : '';
    return (
      <div className="screen">
        <div className="brand"><h1>🏁 Final Scorecard</h1></div>
        {dailyDate ? (
          <>
            <div className="card center">
              <div className="muted">Today's daily — {state.players[0].name}</div>
              <div className="pricetag">{formatToPar(state.players[0].strokes)}</div>
            </div>
            <ShareCard text={card} />
          </>
        ) : (
          <Standings ranked={ctrl.standings} />
        )}
        <button className="btn btn-primary" onClick={onExit}>Back to clubhouse</button>
      </div>
    );
  }

  const round = state.rounds[state.currentRound];
  const listing = round.listing;
  const activePlayer = state.players[ctrl.activePlayerIndex];

  if (state.phase === 'reveal') {
    const results = round.guesses
      .map((g) => ({ player: state.players.find((p) => p.id === g.playerId)!, r: g.result! }))
      .sort((a, b) => a.r.strokes - b.r.strokes);
    const best = results[0]?.r;
    const isLast = state.currentRound >= state.rounds.length - 1;
    return (
      <div className="screen">
        {best && best.strokes < 0 && <Confetti />}
        <div className="top-bar">
          <strong>Hole {state.currentRound + 1}/{state.rounds.length}</strong>
          <div className="spacer" />
          <MuteButton />
        </div>
        <div className="card center">
          <div className="muted">Actual price in {listing.city}, {listing.state}</div>
          <div className="pricetag">{money(listing.price)}</div>
        </div>
        {best && (
          <div className={`result-banner ${tierClass(best.tier.name)}`}>
            <div className="emoji">{best.tier.emoji}</div>
            <div className="label">{best.tier.label}</div>
          </div>
        )}
        <div className="standings">
          {results.map(({ player, r }) => (
            <div className="standing" key={player.id}>
              <span className="rank">{r.tier.emoji}</span>
              <span className="name">{player.name}</span>
              <span className="muted">{money(r.guess)}</span>
              <span className="score">{r.strokes > 0 ? `+${r.strokes}` : r.strokes}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={ctrl.advance}>
          {isLast ? 'See final scorecard 🏁' : 'Next hole ⛳'}
        </button>
      </div>
    );
  }

  // --- guessing phase ---
  const shown = visibleFields(settings.sharedFields, ctrl.unlockedFields);
  const hidden = INFO_FIELDS.filter((f) => !shown.includes(f.key));
  const urgent = ctrl.timeLeft <= 6;

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="iconbtn" onClick={onExit}>✕</button>
        <strong>Hole {state.currentRound + 1}/{state.rounds.length}</strong>
        <div className="spacer" />
        <span className={`timer ${urgent ? 'urgent' : ''}`}>0:{String(ctrl.timeLeft).padStart(2, '0')}</span>
        <MuteButton />
      </div>

      <PhotoCarousel photos={listing.photos} location={`${listing.city}, ${listing.state}`} />
      <PriceMap lat={listing.lat} lng={listing.lng} />

      {shown.length > 0 && (
        <div className="row wrap">
          {shown.map((k) => (
            <span className="chip" key={k}>{formatField(listing, k)}</span>
          ))}
        </div>
      )}

      <div className="card">
        {state.players.length > 1 && (
          <div className="center" style={{ marginBottom: 8 }}>
            <span className="chip on">📱 {activePlayer.name}'s guess</span>
          </div>
        )}
        <GuessSlider value={guess} onChange={setGuess} />

        {activePlayer.powerups > 0 && hidden.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              💪 {activePlayer.powerups} powerup{activePlayer.powerups > 1 ? 's' : ''} — reveal a detail:
            </div>
            <div className="row wrap">
              {hidden.map((f) => (
                <button
                  key={f.key}
                  className="chip toggle"
                  onClick={() => { sound.click(); ctrl.spendPowerup(f.key as InfoFieldKey); }}
                >
                  🔓 {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => ctrl.submit(guess)}>
          Lock in {money(guess)}
        </button>
      </div>
    </div>
  );
}
