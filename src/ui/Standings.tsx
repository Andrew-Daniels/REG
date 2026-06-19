import type { RankedPlayer } from '../core/scoring';
import { formatToPar } from '../core/daily';

export function Standings({ ranked }: { ranked: RankedPlayer[] }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="standings">
      {ranked.map((p) => (
        <div className={`standing ${p.rank === 1 ? 'leader' : ''}`} key={p.id}>
          <span className="rank">{medals[p.rank - 1] ?? p.rank}</span>
          <span className="name">{p.name}</span>
          <span className="score">{formatToPar(p.strokes)}</span>
        </div>
      ))}
    </div>
  );
}
