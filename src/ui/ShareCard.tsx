import { useState } from 'react';
import { sound } from '../audio/engine';

export function ShareCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    sound.click();
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      /* fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div>
      <div className="share-card">{text}</div>
      <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={share}>
        {copied ? 'Copied! ✅' : 'Share my score 📤'}
      </button>
    </div>
  );
}
