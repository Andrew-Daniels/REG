import { useEffect, useMemo, useState } from 'react';
import type { LobbyClient } from '../net/useLobby';
import type { PublicLobby } from '../net/protocol';
import { visibleFields, formatField, INFO_FIELDS } from '../core/listing';
import { rankPlayers } from '../core/scoring';
import { PhotoCarousel } from './PhotoCarousel';
import { PriceMap } from './PriceMap';
import { Standings } from './Standings';
import { Confetti } from './Confetti';
import { MuteButton } from './MuteButton';
import { money, moneyShort, tierClass } from './format';
import { sound } from '../audio/engine';

const SLIDER_MIN = 50_000;
const SLIDER_MAX = 3_000_000;

function liveStandings(lobby: PublicLobby) {
  const g = lobby.game;
  if (!g) return [];
  return rankPlayers(g.players.map((p) => ({ id: p.id, name: p.name, strokes: p.strokes })));
}

/** The shared big-screen / waiting-room + the per-phone controller. */
export function LiveParty({ client, onExit }: { client: LobbyClient; onExit: () => void }) {
  const { lobby, you } = client;

  if (!lobby) {
    return (
      <div className="screen">
        <div className="brand"><h1>Connecting…</h1></div>
        {client.error && <div className="card center" style={{ color: '#a8321f' }}>{client.error}</div>}
        <button className="btn btn-soft" onClick={onExit}>Back</button>
      </div>
    );
  }

  const isHost = you === lobby.hostId;

  if (lobby.phase === 'lobby') {
    return <WaitingRoom lobby={lobby} isHost={isHost} onStart={client.start} onExit={onExit} />;
  }

  return isHost ? (
    <HostStage lobby={lobby} onNext={client.next} onExit={onExit} />
  ) : (
    <PlayerController lobby={lobby} you={you!} onGuess={client.guess} onExit={onExit} />
  );
}

function WaitingRoom({
  lobby, isHost, onStart, onExit,
}: { lobby: PublicLobby; isHost: boolean; onStart: () => void; onExit: () => void }) {
  const prevCount = useMemo(() => ({ n: 0 }), []);
  useEffect(() => {
    if (lobby.members.length > prevCount.n) sound.playerJoined();
    prevCount.n = lobby.members.length;
  }, [lobby.members.length, prevCount]);

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="iconbtn" onClick={onExit}>✕</button>
        <strong>Lobby</strong>
        <div className="spacer" />
        <MuteButton />
      </div>
      <div className="card center">
        <div className="muted">Join at this screen's URL — enter code</div>
        <div className="code">{lobby.code}</div>
      </div>
      <div className="card">
        <div className="muted" style={{ marginBottom: 8 }}>
          Players ({lobby.members.length}/20)
        </div>
        <div className="row wrap">
          {lobby.members.map((m) => (
            <span className="chip on" key={m.id}>{m.name}</span>
          ))}
          {lobby.members.length === 0 && <span className="muted">Waiting for players…</span>}
        </div>
      </div>
      {isHost ? (
        <button className="btn btn-primary" disabled={lobby.members.length === 0} onClick={onStart}>
          Start game ⛳
        </button>
      ) : (
        <div className="card center muted">You're in! Waiting for the host to start…</div>
      )}
    </div>
  );
}

function currentListing(lobby: PublicLobby) {
  const g = lobby.game!;
  return g.rounds[g.currentRound].listing;
}

function HostStage({ lobby, onNext, onExit }: { lobby: PublicLobby; onNext: () => void; onExit: () => void }) {
  const g = lobby.game!;
  const listing = currentListing(lobby);
  const round = g.rounds[g.currentRound];
  const guessedCount = round.guesses.length;
  const reveal = g.phase === 'reveal';
  const complete = g.phase === 'complete';
  const shown = visibleFields(lobby.settings.sharedFields, []);

  useEffect(() => {
    if (reveal) {
      const best = round.guesses.map((x) => x.result!).filter(Boolean).sort((a, b) => a.strokes - b.strokes)[0];
      if (best) sound.celebrate(best.tier.name);
    }
  }, [reveal, g.currentRound]);

  if (complete) {
    return (
      <div className="screen">
        <Confetti />
        <div className="brand"><h1>🏁 Final Scorecard</h1></div>
        <Standings ranked={liveStandings(lobby)} />
        <button className="btn btn-primary" onClick={onExit}>End game</button>
      </div>
    );
  }

  const best = reveal
    ? round.guesses.map((x) => x.result!).filter(Boolean).sort((a, b) => a.strokes - b.strokes)[0]
    : null;

  return (
    <div className="screen">
      {best && best.strokes < 0 && <Confetti />}
      <div className="top-bar">
        <strong>Hole {g.currentRound + 1}/{g.rounds.length}</strong>
        <div className="spacer" />
        <span className="chip">Code {lobby.code}</span>
        <MuteButton />
      </div>
      <PhotoCarousel photos={listing.photos} location={`${listing.city}, ${listing.state}`} />
      <PriceMap lat={listing.lat} lng={listing.lng} />
      {shown.length > 0 && (
        <div className="row wrap">
          {shown.map((k) => <span className="chip" key={k}>{formatField(listing, k)}</span>)}
        </div>
      )}
      {reveal ? (
        <>
          <div className="card center">
            <div className="muted">Actual price</div>
            <div className="pricetag">{money(listing.price)}</div>
          </div>
          {best && (
            <div className={`result-banner ${tierClass(best.tier.name)}`}>
              <div className="emoji">{best.tier.emoji}</div>
              <div className="label">{best.tier.label}</div>
            </div>
          )}
          <Standings ranked={liveStandings(lobby)} />
          <button className="btn btn-primary" onClick={onNext}>
            {g.currentRound >= g.rounds.length - 1 ? 'Final scorecard 🏁' : 'Next hole ⛳'}
          </button>
        </>
      ) : (
        <div className="card center">
          <div className="pricetag">{guessedCount}/{lobby.members.length}</div>
          <div className="muted">players have locked in their guess…</div>
        </div>
      )}
    </div>
  );
}

function PlayerController({
  lobby, you, onGuess, onExit,
}: { lobby: PublicLobby; you: string; onGuess: (g: number) => void; onExit: () => void }) {
  const g = lobby.game!;
  const listing = currentListing(lobby);
  const round = g.rounds[g.currentRound];
  const me = g.players.find((p) => p.id === you);
  const iGuessed = round.guesses.some((x) => x.playerId === you);
  const [guess, setGuess] = useState(400_000);
  const [revealed, setRevealed] = useState<string[]>([]);

  useEffect(() => { setRevealed([]); }, [g.currentRound]);

  if (g.phase === 'complete') {
    return (
      <div className="screen">
        <div className="brand"><h1>🏁 Thanks for playing!</h1></div>
        <Standings ranked={liveStandings(lobby)} />
        <button className="btn btn-primary" onClick={onExit}>Leave</button>
      </div>
    );
  }

  if (g.phase === 'reveal') {
    const mine = round.guesses.find((x) => x.playerId === you)?.result;
    return (
      <div className="screen">
        {mine && mine.strokes < 0 && <Confetti />}
        <div className="brand"><h1>Hole {g.currentRound + 1}</h1></div>
        {mine ? (
          <div className={`result-banner ${tierClass(mine.tier.name)}`}>
            <div className="emoji">{mine.tier.emoji}</div>
            <div className="label">{mine.tier.label}</div>
            <div>{money(mine.guess)}</div>
          </div>
        ) : (
          <div className="card center muted">No guess recorded</div>
        )}
        <Standings ranked={liveStandings(lobby)} />
        <div className="card center muted">Look at the big screen for the reveal! 📺</div>
      </div>
    );
  }

  // guessing
  const shown = visibleFields(lobby.settings.sharedFields, revealed as never[]);
  const hidden = INFO_FIELDS.filter((f) => !shown.includes(f.key));
  const powerups = me?.powerups ?? 0;

  if (iGuessed) {
    return (
      <div className="screen">
        <div className="brand"><h1>✅ Locked in!</h1></div>
        <div className="card center muted">Waiting for the other players… watch the big screen 📺</div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="iconbtn" onClick={onExit}>✕</button>
        <strong>Hole {g.currentRound + 1}/{g.rounds.length}</strong>
      </div>
      <PhotoCarousel photos={listing.photos} location={`${listing.city}, ${listing.state}`} />
      {shown.length > 0 && (
        <div className="row wrap">
          {shown.map((k) => <span className="chip" key={k}>{formatField(listing, k)}</span>)}
        </div>
      )}
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
        {powerups > revealed.length && hidden.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 6 }}>💪 Spend a powerup to reveal:</div>
            <div className="row wrap">
              {hidden.map((f) => (
                <button key={f.key} className="chip toggle"
                  onClick={() => { sound.click(); setRevealed((r) => [...r, f.key]); }}>
                  🔓 {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { sound.click(); onGuess(guess); }}>
          Lock in {money(guess)}
        </button>
      </div>
    </div>
  );
}
