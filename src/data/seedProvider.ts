import type { Listing } from '../core/listing';
import { filterListings, type ListingFilter, type ListingProvider } from './provider';
import { SEED_LISTINGS } from './seedListings';

/**
 * Default provider: serves the bundled seed dataset. Free to operate, works
 * offline, and deterministic for tests. Swap in a live API adapter (same
 * interface) when a free-tier key is configured.
 */
export class SeedProvider implements ListingProvider {
  readonly name = 'seed';

  constructor(private readonly listings: Listing[] = SEED_LISTINGS) {}

  async fetchListings(filter: ListingFilter): Promise<Listing[]> {
    return filterListings(this.listings, filter);
  }
}
