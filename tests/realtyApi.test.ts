import { describe, it, expect, vi } from 'vitest';
import { RealtyApiProvider, mapRealtyListing, parsePrice } from '../src/data/realtyApiProvider';

// A representative Zillow-style search result as surfaced by RealtyAPI.
const zResult = {
  zpid: '12345',
  price: '$625,000',
  unformattedPrice: 625000,
  addressCity: 'Austin',
  addressState: 'TX',
  addressZipcode: '78701',
  beds: 3,
  baths: 2,
  area: 1850,
  latLong: { latitude: 30.27, longitude: -97.74 },
  statusType: 'FOR_SALE',
  daysOnZillow: 21,
  imgSrc: 'https://photos.zillowstatic.com/main.jpg',
  carouselPhotos: [{ url: 'https://photos.zillowstatic.com/1.jpg' }, { url: 'https://photos.zillowstatic.com/2.jpg' }],
  hdpData: { homeInfo: { yearBuilt: 1998, lotAreaValue: 6500, homeType: 'SINGLE_FAMILY' } },
};

describe('parsePrice', () => {
  it('parses formatted price strings', () => {
    expect(parsePrice('$625,000')).toBe(625000);
    expect(parsePrice('1,200,000')).toBe(1200000);
  });
  it('passes through numbers', () => {
    expect(parsePrice(450000)).toBe(450000);
  });
});

describe('mapRealtyListing', () => {
  it('maps a Zillow-style record into our Listing model', () => {
    const l = mapRealtyListing(zResult);
    expect(l.id).toBe('12345');
    expect(l.price).toBe(625000);
    expect(l.city).toBe('Austin');
    expect(l.state).toBe('TX');
    expect(l.lat).toBeCloseTo(30.27);
    expect(l.lng).toBeCloseTo(-97.74);
    expect(l.beds).toBe(3);
    expect(l.baths).toBe(2);
    expect(l.sqft).toBe(1850);
    expect(l.yearBuilt).toBe(1998);
    expect(l.daysOnMarket).toBe(21);
    expect(l.lotSizeSqft).toBe(6500);
    expect(l.propertyType).toBe('Single Family');
    expect(l.status).toBe('active');
    expect(l.photos.length).toBeGreaterThanOrEqual(2);
    expect(l.photos[0]).toContain('zillowstatic');
  });

  it('normalizes status variants', () => {
    expect(mapRealtyListing({ ...zResult, statusType: 'RECENTLY_SOLD' }).status).toBe('closed');
    expect(mapRealtyListing({ ...zResult, statusType: 'PENDING' }).status).toBe('pending');
    expect(mapRealtyListing({ ...zResult, statusType: 'UNDER_CONTRACT' }).status).toBe('pending');
  });

  it('falls back to imgSrc when there are no carousel photos', () => {
    const { carouselPhotos, ...noCarousel } = zResult;
    void carouselPhotos;
    expect(mapRealtyListing(noCarousel).photos[0]).toBe('https://photos.zillowstatic.com/main.jpg');
  });

  it('always yields at least one photo', () => {
    const bare = { zpid: '9', unformattedPrice: 1, addressCity: 'X', addressState: 'Y' };
    expect(mapRealtyListing(bare).photos.length).toBeGreaterThan(0);
  });
});

describe('RealtyApiProvider', () => {
  function mockFetch(results: unknown[]) {
    return vi.fn(async () => ({
      ok: true,
      json: async () => ({ totalResultCount: results.length, searchResults: results }),
    })) as unknown as typeof fetch;
  }

  it('sends the api key header and the configured host', async () => {
    const f = mockFetch([zResult]);
    const p = new RealtyApiProvider('KEY123', { doFetch: f, locations: ['Austin, TX'] });
    const listings = await p.fetchListings({ statuses: ['active'] });
    expect(listings).toHaveLength(1);
    const [url, init] = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toContain('zillow.realtyapi.io');
    expect((init.headers as Record<string, string>)['x-realtyapi-key']).toBe('KEY123');
  });

  it('queries each configured location and de-duplicates by id', async () => {
    const f = mockFetch([zResult]); // same result returned for every location
    const p = new RealtyApiProvider('K', { doFetch: f, locations: ['Austin, TX', 'Denver, CO'] });
    const listings = await p.fetchListings({ statuses: ['active'] });
    expect((f as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(2);
    expect(listings).toHaveLength(1); // deduped by zpid
  });

  it('applies the shared status filter to mapped results', async () => {
    const f = mockFetch([
      { ...zResult, zpid: 'a', statusType: 'FOR_SALE' },
      { ...zResult, zpid: 'c', statusType: 'RECENTLY_SOLD' },
    ]);
    const p = new RealtyApiProvider('K', { doFetch: f, locations: ['Austin, TX'] });
    const closed = await p.fetchListings({ statuses: ['closed'] });
    expect(closed.map((l) => l.id)).toEqual(['c']);
  });
});
