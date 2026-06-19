export function money(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

/** Compact money for sliders/labels, e.g. $625K, $1.2M. */
export function moneyShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

import type { ScoreTierName } from '../core/scoring';

export function tierClass(tier: ScoreTierName): string {
  if (tier === 'ace' || tier === 'eagle' || tier === 'birdie') return 'tier-good';
  if (tier === 'par' || tier === 'bogey') return 'tier-mid';
  return 'tier-bad';
}
