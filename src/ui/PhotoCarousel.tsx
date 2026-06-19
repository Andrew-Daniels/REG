import { useEffect, useState } from 'react';

interface Props {
  photos: string[];
  location: string;
}

/** Swipeable / tappable photo viewer with a location badge and graceful fallback. */
export function PhotoCarousel({ photos, location }: Props) {
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState(false);
  const safe = photos.length ? photos : [''];
  const cur = safe[i % safe.length];
  const next = () => setI((v) => (v + 1) % safe.length);

  // Reset error state when the source changes.
  useEffect(() => setFailed(false), [cur]);

  return (
    <div className="photo-wrap" onClick={next}>
      {cur && !failed ? (
        <img
          className="photo"
          src={cur}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="photo photo-fallback" role="img" aria-label="house photo unavailable">
          <span className="house-emoji">🏠</span>
        </div>
      )}
      <div className="locchip">📍 {location}</div>
      {safe.length > 1 && (
        <div className="photo-dots">
          {safe.map((_, k) => (
            <span key={k} className={k === i % safe.length ? 'on' : ''} />
          ))}
        </div>
      )}
    </div>
  );
}
