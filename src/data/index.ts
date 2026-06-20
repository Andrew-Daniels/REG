import type { ListingProvider } from './provider';
import { SeedProvider } from './seedProvider';
import { RentCastProvider } from './rentcastProvider';

export * from './provider';
export { SeedProvider } from './seedProvider';
export { RentCastProvider } from './rentcastProvider';

/**
 * Choose a data source. Uses the free-tier RentCast API when a key is present
 * (VITE_RENTCAST_KEY in the client build, RENTCAST_KEY on the server), and
 * otherwise the bundled seed dataset — so the game is always free to operate.
 */
export function chooseProvider(): ListingProvider {
  const viteKey =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string> }).env?.VITE_RENTCAST_KEY
      : undefined;
  const nodeKey =
    typeof process !== 'undefined' ? process.env?.RENTCAST_KEY : undefined;
  const key = viteKey || nodeKey;
  return key ? new RentCastProvider(key) : new SeedProvider();
}
