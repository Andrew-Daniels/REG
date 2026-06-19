import type { Listing, ListingStatus } from '../core/listing';

export interface ListingFilter {
  /** Which listing statuses to include. */
  statuses: ListingStatus[];
  /**
   * Optional recency window in days. When set, closed listings must have sold
   * within the window and active/pending listings must have been listed within
   * it. Omit to allow listings from the "very very past".
   */
  recencyDays?: number;
  /** Reference "now"; defaults to the current time. Injectable for testing. */
  now?: Date;
}

/** A pluggable source of listings (seed dataset, free API adapter, etc.). */
export interface ListingProvider {
  readonly name: string;
  fetchListings(filter: ListingFilter): Promise<Listing[]>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The date that matters for recency, given a listing's status. */
function recencyDate(listing: Listing): string {
  return listing.status === 'closed'
    ? (listing.soldDate ?? listing.listDate)
    : listing.listDate;
}

/** Pure filtering shared by every provider. */
export function filterListings(listings: Listing[], filter: ListingFilter): Listing[] {
  const now = (filter.now ?? new Date()).getTime();
  const statuses = new Set(filter.statuses);
  return listings.filter((l) => {
    if (!statuses.has(l.status)) return false;
    if (filter.recencyDays != null) {
      const ageDays = (now - new Date(recencyDate(l)).getTime()) / DAY_MS;
      if (ageDays > filter.recencyDays) return false;
    }
    return true;
  });
}
