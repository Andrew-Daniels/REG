import { describe, it, expect } from 'vitest';
import { filterListings, type ListingFilter } from '../src/data/provider';
import { SeedProvider } from '../src/data/seedProvider';
import type { Listing } from '../src/core/listing';

function make(partial: Partial<Listing> & { id: string }): Listing {
  return {
    price: 500_000,
    status: 'closed',
    city: 'Austin',
    state: 'TX',
    lat: 30,
    lng: -97,
    photos: ['a.jpg'],
    beds: 3,
    baths: 2,
    sqft: 1500,
    yearBuilt: 2000,
    daysOnMarket: 10,
    lotSizeSqft: 5000,
    propertyType: 'Single Family',
    listDate: '2026-05-01',
    soldDate: '2026-05-15',
    ...partial,
  };
}

const now = new Date('2026-06-19');

describe('filterListings', () => {
  it('keeps only listings whose status is selected', () => {
    const listings = [
      make({ id: 'a', status: 'active' }),
      make({ id: 'c', status: 'closed' }),
      make({ id: 'p', status: 'pending' }),
    ];
    const filter: ListingFilter = { statuses: ['closed'], now };
    expect(filterListings(listings, filter).map((l) => l.id)).toEqual(['c']);
  });

  it('limits closed listings to the recency window by sold date', () => {
    const listings = [
      make({ id: 'recent', status: 'closed', soldDate: '2026-06-01' }),
      make({ id: 'old', status: 'closed', soldDate: '2020-01-01' }),
    ];
    const filter: ListingFilter = { statuses: ['closed'], recencyDays: 35, now };
    expect(filterListings(listings, filter).map((l) => l.id)).toEqual(['recent']);
  });

  it('includes very old listings when no recency window is set', () => {
    const listings = [
      make({ id: 'recent', status: 'closed', soldDate: '2026-06-01' }),
      make({ id: 'old', status: 'closed', soldDate: '2010-01-01' }),
    ];
    const filter: ListingFilter = { statuses: ['closed'], now };
    expect(filterListings(listings, filter).map((l) => l.id).sort()).toEqual(['old', 'recent']);
  });

  it('uses list date for active listings recency', () => {
    const listings = [
      make({ id: 'fresh', status: 'active', soldDate: undefined, listDate: '2026-06-10' }),
      make({ id: 'stale', status: 'active', soldDate: undefined, listDate: '2025-01-01' }),
    ];
    const filter: ListingFilter = { statuses: ['active'], recencyDays: 35, now };
    expect(filterListings(listings, filter).map((l) => l.id)).toEqual(['fresh']);
  });
});

describe('SeedProvider', () => {
  it('ships a usable bundled dataset', async () => {
    const p = new SeedProvider();
    const all = await p.fetchListings({ statuses: ['active', 'pending', 'closed'], now });
    expect(all.length).toBeGreaterThanOrEqual(20);
    for (const l of all) {
      expect(l.photos.length).toBeGreaterThan(0);
      expect(l.price).toBeGreaterThan(0);
      expect(l.city).toBeTruthy();
      expect(l.state).toBeTruthy();
    }
  });

  it('respects the status filter', async () => {
    const p = new SeedProvider();
    const closed = await p.fetchListings({ statuses: ['closed'], now });
    expect(closed.every((l) => l.status === 'closed')).toBe(true);
  });
});
