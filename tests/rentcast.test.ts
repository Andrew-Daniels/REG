import { describe, it, expect, vi } from 'vitest';
import { RentCastProvider, mapRentCastListing } from '../src/data/rentcastProvider';

const sample = {
  id: 'rc-1',
  formattedAddress: '123 Main St, Austin, TX 78701',
  city: 'Austin',
  state: 'TX',
  latitude: 30.27,
  longitude: -97.74,
  price: 625000,
  propertyType: 'Single Family',
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1850,
  yearBuilt: 1998,
  daysOnMarket: 21,
  lotSize: 6500,
  status: 'Active',
  listedDate: '2026-05-01T00:00:00Z',
};

describe('mapRentCastListing', () => {
  it('maps a RentCast record into our Listing model', () => {
    const l = mapRentCastListing(sample);
    expect(l.id).toBe('rc-1');
    expect(l.price).toBe(625000);
    expect(l.city).toBe('Austin');
    expect(l.state).toBe('TX');
    expect(l.status).toBe('active');
    expect(l.beds).toBe(3);
    expect(l.sqft).toBe(1850);
    expect(l.photos.length).toBeGreaterThan(0); // always has at least a fallback
    expect(l.listDate).toBe('2026-05-01');
  });

  it('normalizes status values', () => {
    expect(mapRentCastListing({ ...sample, status: 'Closed' }).status).toBe('closed');
    expect(mapRentCastListing({ ...sample, status: 'Pending' }).status).toBe('pending');
  });
});

describe('RentCastProvider', () => {
  it('calls the API with the key and maps results', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [sample],
    })) as unknown as typeof fetch;

    const provider = new RentCastProvider('TEST_KEY', fetchMock);
    const listings = await provider.fetchListings({ statuses: ['active'] });

    expect(listings).toHaveLength(1);
    expect(listings[0].city).toBe('Austin');
    const [url, init] = (fetchMock as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toContain('api.rentcast.io');
    expect((init.headers as Record<string, string>)['X-Api-Key']).toBe('TEST_KEY');
  });

  it('applies the shared status/recency filter to API results', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [
        { ...sample, id: 'a', status: 'Active' },
        { ...sample, id: 'c', status: 'Closed' },
      ],
    })) as unknown as typeof fetch;
    const provider = new RentCastProvider('K', fetchMock);
    const onlyClosed = await provider.fetchListings({ statuses: ['closed'] });
    expect(onlyClosed.map((l) => l.id)).toEqual(['c']);
  });
});
