import type { Listing } from '../core/listing';
import type { ListingFilter, ListingProvider } from './provider';
import { SeedProvider } from './seedProvider';
import { RentCastProvider } from './rentcastProvider';
import { RealtyApiProvider } from './realtyApiProvider';

export * from './provider';
export { SeedProvider } from './seedProvider';
export { RentCastProvider } from './rentcastProvider';
export { RealtyApiProvider } from './realtyApiProvider';

function env(name: string): string | undefined {
  const fromNode = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  const viteEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string> }).env
      : undefined;
  return fromNode || viteEnv?.[name] || viteEnv?.[`VITE_${name}`];
}

/**
 * Server-side data source. Prefers the configured live API (RealtyAPI, then
 * RentCast) and otherwise the bundled seed dataset, so the game always runs.
 * Keys live in the server environment — never in the browser bundle.
 */
export function chooseProvider(): ListingProvider {
  const realty = env('REALTYAPI_KEY');
  if (realty) return new RealtyApiProvider(realty);
  const rentcast = env('RENTCAST_KEY');
  if (rentcast) return new RentCastProvider(rentcast);
  return new SeedProvider();
}

/** Base origin for the listings proxy (the lobby server). */
export function apiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, host } = window.location;
  const dev = typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV;
  return dev ? `${protocol}//${hostname}:8787` : `${protocol}//${host}`;
}

/**
 * Browser-side provider: fetches real listings through the server's
 * `/api/listings` proxy (so the API key stays server-side) and transparently
 * falls back to the bundled seed dataset when the proxy is unavailable
 * (e.g. a static deploy with no server).
 */
export class HttpProvider implements ListingProvider {
  readonly name = 'http';
  private readonly fallback = new SeedProvider();

  constructor(private readonly base: string = apiBaseUrl()) {}

  async fetchListings(filter: ListingFilter): Promise<Listing[]> {
    try {
      const url = new URL(`${this.base}/api/listings`);
      url.searchParams.set('statuses', filter.statuses.join(','));
      if (filter.recencyDays != null) url.searchParams.set('recencyDays', String(filter.recencyDays));
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`proxy ${res.status}`);
      const data = (await res.json()) as Listing[];
      if (Array.isArray(data) && data.length > 0) return data;
      throw new Error('empty');
    } catch {
      return this.fallback.fetchListings(filter);
    }
  }
}

/** Provider for the browser. */
export function clientProvider(): ListingProvider {
  return new HttpProvider();
}
