import type { Listing } from '../core/listing';

/**
 * Bundled seed dataset. This keeps the game 100% free to operate and fully
 * playable offline / in CI, and gives the TDD suite deterministic data.
 * A live free-tier API adapter can replace this provider when a key is set.
 *
 * Photos are free, hot-linkable Unsplash images of homes (cycled across the set).
 */
const PHOTO_POOL: string[] = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00',
  'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83',
];

function photosFor(seed: number): string[] {
  const a = PHOTO_POOL[seed % PHOTO_POOL.length];
  const b = PHOTO_POOL[(seed + 5) % PHOTO_POOL.length];
  const sized = (u: string) => `${u}?auto=format&fit=crop&w=1200&q=70`;
  return [sized(a), sized(b)];
}

interface SeedSpec {
  city: string;
  state: string;
  lat: number;
  lng: number;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  type: string;
}

// Real US cities with approximate coordinates and plausible recent prices.
const SPECS: SeedSpec[] = [
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431, price: 624000, beds: 3, baths: 2, sqft: 1850, yearBuilt: 1998, type: 'Single Family' },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988, price: 312000, beds: 3, baths: 2, sqft: 1620, yearBuilt: 1975, type: 'Single Family' },
  { city: 'Boise', state: 'ID', lat: 43.615, lng: -116.2023, price: 489000, beds: 4, baths: 3, sqft: 2200, yearBuilt: 2012, type: 'Single Family' },
  { city: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572, price: 415000, beds: 3, baths: 2, sqft: 1700, yearBuilt: 2005, type: 'Single Family' },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903, price: 587000, beds: 3, baths: 2, sqft: 1600, yearBuilt: 1955, type: 'Bungalow' },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816, price: 532000, beds: 4, baths: 3, sqft: 2400, yearBuilt: 2018, type: 'Townhouse' },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074, price: 445000, beds: 4, baths: 2, sqft: 2050, yearBuilt: 2001, type: 'Single Family' },
  { city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784, price: 612000, beds: 3, baths: 2, sqft: 1750, yearBuilt: 1948, type: 'Craftsman' },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431, price: 398000, beds: 4, baths: 3, sqft: 2300, yearBuilt: 2009, type: 'Single Family' },
  { city: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.265, price: 356000, beds: 3, baths: 2, sqft: 1900, yearBuilt: 1962, type: 'Single Family' },
  { city: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944, price: 549000, beds: 3, baths: 2, sqft: 1550, yearBuilt: 1988, type: 'Single Family' },
  { city: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.891, price: 528000, beds: 4, baths: 2, sqft: 2100, yearBuilt: 1995, type: 'Single Family' },
  { city: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382, price: 442000, beds: 4, baths: 3, sqft: 2500, yearBuilt: 2015, type: 'Single Family' },
  { city: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581, price: 268000, beds: 3, baths: 2, sqft: 1500, yearBuilt: 1979, type: 'Single Family' },
  { city: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786, price: 289000, beds: 3, baths: 2, sqft: 1680, yearBuilt: 1968, type: 'Single Family' },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321, price: 825000, beds: 3, baths: 2, sqft: 1700, yearBuilt: 1942, type: 'Craftsman' },
  { city: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388, price: 467000, beds: 4, baths: 3, sqft: 2600, yearBuilt: 2007, type: 'Single Family' },
  { city: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398, price: 421000, beds: 4, baths: 3, sqft: 2150, yearBuilt: 2004, type: 'Single Family' },
  { city: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959, price: 247000, beds: 3, baths: 2, sqft: 1640, yearBuilt: 1936, type: 'Rowhouse' },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936, price: 334000, beds: 4, baths: 2, sqft: 2050, yearBuilt: 2003, type: 'Single Family' },
  { city: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.436, price: 379000, beds: 3, baths: 2, sqft: 1820, yearBuilt: 1952, type: 'Single Family' },
  { city: 'Madison', state: 'WI', lat: 43.0731, lng: -89.4012, price: 398000, beds: 3, baths: 2, sqft: 1760, yearBuilt: 1984, type: 'Single Family' },
  { city: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504, price: 312000, beds: 3, baths: 2, sqft: 1700, yearBuilt: 1991, type: 'Pueblo' },
  { city: 'Providence', state: 'RI', lat: 41.824, lng: -71.4128, price: 442000, beds: 3, baths: 2, sqft: 1680, yearBuilt: 1925, type: 'Colonial' },
];

function isoDaysAgo(days: number): string {
  const d = new Date('2026-06-19');
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const SEED_LISTINGS: Listing[] = SPECS.map((s, i) => {
  // Spread statuses: ~70% closed (recent sales), some active, some pending.
  const status = i % 7 === 0 ? 'pending' : i % 3 === 0 ? 'active' : 'closed';
  const dom = 5 + ((i * 7) % 60);
  const soldAgo = 3 + ((i * 5) % 30); // closed within the last month-ish
  const listedAgo = status === 'closed' ? soldAgo + dom : (i * 4) % 40;
  return {
    id: `seed-${i + 1}`,
    price: s.price,
    status,
    city: s.city,
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    photos: photosFor(i),
    beds: s.beds,
    baths: s.baths,
    sqft: s.sqft,
    yearBuilt: s.yearBuilt,
    daysOnMarket: dom,
    lotSizeSqft: 4000 + ((i * 311) % 6000),
    propertyType: s.type,
    listDate: isoDaysAgo(listedAgo),
    soldDate: status === 'closed' ? isoDaysAgo(soldAgo) : undefined,
  };
});
