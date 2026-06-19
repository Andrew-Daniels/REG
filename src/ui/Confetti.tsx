import { useMemo } from 'react';

const COLORS = ['#f4b400', '#e63946', '#1aa356', '#2a9df4', '#ff7b00', '#ffffff'];

/** Lightweight CSS confetti burst for celebrations. */
export function Confetti({ count = 60 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.6 + Math.random() * 1.4,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
      })),
    [count],
  );
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <i
          key={i}
          style={{
            left: `${b.left}%`,
            background: b.color,
            transform: `rotate(${b.rot}deg)`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
