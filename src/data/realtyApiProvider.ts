import type { Listing, ListingStatus } from '../core/listing';
import { filterListings, type ListingFilter, type ListingProvider } from './provider';

/**
 * Live-data adapter for RealtyAPI (https://www.realtyapi.io) — Zillow-backed
 * for-sale / sold listings with photos. Implements the same ListingProvider
 * interface as the bundled SeedProvider.
 *
 * Auth is the `x-realtyapi-key` header. The key must stay server-side, so this
 * provider runs on the server; the browser reaches it through the `/api/listings`
 * proxy (see server/index.ts) rather than holding the key itself.
 *
 * Field names are mapped defensively because the upstream Zillow shape varies.
 */

const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=70';

// A spread of populous metros so a game has plenty of variety out of the box.
export const DEFAULT_LOCATIONS = [
  'Austin, TX',
  'Columbus, OH',
  'Denver, CO',
  'Tampa, FL',
  'Charlotte, NC',
  'Phoenix, AZ',
];

/** Map a requested status to RealtyAPI's `listing_status` query value. */
const STATUS_QUERY: Record<ListingStatus, string> = {
  active: 'For Sale',
  pending: 'For Sale', // pendings come back inside For Sale results with statusType=PENDING
  closed: 'Recently Sold',
};

export interface RealtyApiOptions {
  locations?: string[];
  doFetch?: typeof fetch;
  /** Override for tests; defaults to the Zillow portal host. */
  host?: string;
  /** Max listings to keep per request (keeps API usage modest). */
  limit?: number;
}

/** Parse "$625,000" / "1,200,000" / number into a plain number. */
export function parsePrice(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeStatus(s?: string): ListingStatus {
  const v = (s ?? '').toLowerCase();
  if (v.includes('sold')) return 'closed';
  if (v.includes('pending') || v.includes('contract') || v.includes('contingent')) return 'pending';
  return 'active';
}

function pick<T>(...vals: (T | undefined | null)[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null) return v as T;
  return undefined;
}

type Rec = Record<string, any>;

function extractPhotos(r: Rec): string[] {
  const out: string[] = [];
  const carousel = r.carouselPhotos ?? r.photos ?? r.images;
  if (Array.isArray(carousel)) {
    for (const p of carousel) {
      const url = typeof p === 'string' ? p : (p?.url ?? p?.src ?? p?.href);
      if (url) out.push(url);
    }
  }
  if (out.length === 0 && r.imgSrc) out.push(r.imgSrc);
  return out.length ? out.slice(0, 4) : [FALLBACK_PHOTO];
}

/** Map a RealtyAPI/Zillow search record into our Listing model. */
export function mapRealtyListing(r: Rec): Listing {
  const home = r.hdpData?.homeInfo ?? {};
  const status = normalizeStatus(pick(r.statusType, r.homeStatus, r.status, home.homeStatus));
  const listDate = String(pick(r.listingDateTime, r.datePosted, r.listDate, '') ?? '').slice(0, 10);
  const soldDate = String(pick(r.dateSold, r.soldDate, '') ?? '').slice(0, 10);
  const typeRaw = pick<string>(r.homeType, r.propertyType, home.homeType) ?? 'Home';
  return {
    id: String(pick(r.zpid, r.id, r.property_id, `${r.addressCity}-${r.unformattedPrice}-${r.area}`)),
    price: parsePrice(pick(r.unformattedPrice, r.price, r.list_price, home.price)),
    status,
    city: String(pick(r.addressCity, r.address?.city, r.city, '') ?? 'Unknown'),
    state: String(pick(r.addressState, r.address?.state, r.state, '') ?? ''),
    lat: Number(pick(r.latLong?.latitude, r.latitude, r.lat, home.latitude) ?? 0),
    lng: Number(pick(r.latLong?.longitude, r.longitude, r.lng, r.lon, home.longitude) ?? 0),
    photos: extractPhotos(r),
    beds: Number(pick(r.beds, r.bedrooms, home.bedrooms) ?? 0),
    baths: Number(pick(r.baths, r.bathrooms, home.bathrooms) ?? 0),
    sqft: Number(pick(r.area, r.livingArea, r.squareFootage, home.livingArea) ?? 0),
    yearBuilt: Number(pick(r.yearBuilt, home.yearBuilt) ?? 0),
    daysOnMarket: Number(pick(r.daysOnZillow, r.daysOnMarket, home.daysOnZillow) ?? 0),
    lotSizeSqft: Number(pick(r.lotAreaValue, r.lotSize, home.lotAreaValue) ?? 0),
    propertyType: titleCase(typeRaw),
    listDate: listDate || '1970-01-01',
    soldDate: status === 'closed' ? soldDate || undefined : undefined,
  };
}

function extractResults(data: any): Rec[] {
  const candidates = [
    data?.searchResults,
    data?.results,
    data?.props,
    data?.listings,
    data?.data,
    data?.cat1?.searchResults?.listResults,
    Array.isArray(data) ? data : undefined,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c as Rec[];
  return [];
}

export class RealtyApiProvider implements ListingProvider {
  readonly name = 'realtyapi';
  private readonly locations: string[];
  private readonly doFetch: typeof fetch;
  private readonly host: string;
  private readonly limit: number;

  constructor(private readonly apiKey: string, opts: RealtyApiOptions = {}) {
    this.locations = opts.locations ?? DEFAULT_LOCATIONS;
    this.doFetch = opts.doFetch ?? fetch;
    this.host = opts.host ?? 'https://zillow.realtyapi.io';
    this.limit = opts.limit ?? 60;
  }

  private async query(location: string, listingStatus: string): Promise<Rec[]> {
    const url = new URL(`${this.host}/search/bylocation`);
    url.searchParams.set('location', location);
    url.searchParams.set('listing_status', listingStatus);
    url.searchParams.set('home_type', 'Houses');
    const res = await this.doFetch(url.toString(), {
      headers: { 'x-realtyapi-key': this.apiKey, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`RealtyAPI error ${res.status}`);
    return extractResults(await res.json());
  }

  async fetchListings(filter: ListingFilter): Promise<Listing[]> {
    // Which upstream queries cover the requested statuses (deduped).
    const queries = new Set(filter.statuses.map((s) => STATUS_QUERY[s]));
    const byId = new Map<string, Listing>();

    for (const location of this.locations) {
      for (const ls of queries) {
        try {
          const records = await this.query(location, ls);
          for (const r of records) {
            const listing = mapRealtyListing(r);
            if (listing.price > 0 && !byId.has(listing.id)) byId.set(listing.id, listing);
          }
        } catch {
          // Skip a failing location/status combo rather than failing the whole game.
        }
      }
    }

    return filterListings([...byId.values()], filter).slice(0, this.limit);
  }
}
