import { useMemo, useState } from 'react';
import {
  type AsyncMatch,
  whoseTurn,
  currentTurnRound,
  applyTurn,
  isComplete,
  buildTurnLink,
} from '../core/asyncGame';
import { pickDaily } from '../core/daily';
import { scoreGuess, buildTiers, rankPlayers } from '../core/scoring';
import { SEED_LISTINGS } from '../data/seedListings';
import { PhotoCarousel } from './PhotoCarousel';
import { PriceMap } from './PriceMap';
import { ShareCard } from './ShareCard';
import { Standings } from './Standings';
import { money, moneyShort } from './format';
import { sound } from '../audio/engine';

const SLIDER_MIN = 50_000;
const SLIDER_MAX = 3_000_000;

function listingsFor(match: AsyncMatch) {
  return pickDaily(SEED_LISTINGS, match.seed, match.rounds);
}

export function AsyncTurnScreen({ match, onExit }: { match: AsyncMatch; onExit: () => void }) {
  const [m, setM] = useState(match);
  const [guess, setGuess] = useState(400_000);
  const [submitted, setSubmitted] = useState(false);
  const listings = useMemo(() => listingsFor(m), [m.seed, m.rounds]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  if (isComplete(m)) {
    const tiers = buildTiers('medium');
    const ranked = rankPlayers(
      m.players.map((p, pi) => ({
        id: p.id,
        name: p.name,
        strokes: m.guesses[pi].reduce<number>(
          (s, g, ri) => s + (g != null ? scoreGuess(g, listings[ri].price, tiers).strokes : 0),
          0,
        ),
      })),
    );
    return (
      <div className="screen">
        <div className="brand"><h1>🏁 Match Complete</h1></div>
        <Standings ranked={ranked} />
        <button className="btn btn-primary" onClick={onExit}>Home</button>
      </div>
    );
  }

  const turnPlayerId = whoseTurn(m)!;
  const turnPlayer = m.players.find((p) => p.id === turnPlayerId)!;
  const round = currentTurnRound(m);
  const listing = listings[round];

  if (submitted) {
    const link = buildTurnLink(baseUrl, m);
    const nextId = whoseTurn(m);
    const nextName = nextId ? m.players.find((p) => p.id === nextId)!.name : null;
    return (
      <div className="screen">
        <div className="brand"><h1>✅ Turn locked in</h1></div>
        <div className="card center">
          {nextName ? (
            <p>Send this link back to the group — it's <strong>{nextName}'s</strong> turn next.</p>
          ) : (
            <p>That was the last turn — send the link to reveal the final scores!</p>
          )}
        </div>
        <ShareCard text={`🏡⛳ Price Is Fairway — your turn!\n${link}`} />
        <button className="btn btn-soft" onClick={onExit}>Done</button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="iconbtn" onClick={onExit}>✕</button>
        <strong>Hole {round + 1}/{m.rounds}</strong>
      </div>
      <div className="card center">
        <span className="chip on">📱 {turnPlayer.name}, it's your turn</span>
      </div>
      <PhotoCarousel photos={listing.photos} location={`${listing.city}, ${listing.state}`} />
      <PriceMap lat={listing.lat} lng={listing.lng} />
      <div className="card">
        <div className="pricetag">{money(guess)}</div>
        <input
          className="text" style={{ width: '100%' }} type="range"
          min={SLIDER_MIN} max={SLIDER_MAX} step={5000}
          value={guess} onChange={(e) => setGuess(Number(e.target.value))}
        />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">{moneyShort(SLIDER_MIN)}</span>
          <span className="muted">{moneyShort(SLIDER_MAX)}+</span>
        </div>
        <button
          className="btn btn-primary" style={{ marginTop: 12 }}
          onClick={() => { sound.click(); setM(applyTurn(m, turnPlayerId, guess)); setSubmitted(true); }}
        >
          Lock in {money(guess)}
        </button>
      </div>
    </div>
  );
}
