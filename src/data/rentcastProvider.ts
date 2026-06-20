import type { Listing, ListingStatus } from '../core/listing';
import { filterListings, type ListingFilter, type ListingProvider } from './provider';

/**
 * Optional live-data adapter for the RentCast API (free tier available at
 * rentcast.io — set a key to use it). Implements the same ListingProvider
 * interface as the bundled SeedProvider, so the rest of the app is unchanged.
 *
 * Note: free real-estate APIs rarely include photos; we fall back to a generic
 * house image when none are provided, so the game still works.
 */

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=70';

interface RentCastRecord {
  id: string;
  formattedAddress?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  daysOnMarket?: number;
  lotSize?: number;
  status?: string;
  listedDate?: string;
  removedDate?: string;
  photos?: string[];
}

function normalizeStatus(s?: string): ListingStatus {
  const v = (s ?? '').toLowerCase();
  if (v.includes('pend')) return 'pending';
  if (v.includes('clos') || v.includes('sold') || v.includes('inactive')) return 'closed';
  return 'active';
}

export function mapRentCastListing(r: RentCastRecord): Listing {
  const status = normalizeStatus(r.status);
  const listDate = (r.listedDate ?? '').slice(0, 10) || '1970-01-01';
  return {
    id: r.id,
    price: r.price ?? 0,
    status,
    city: r.city ?? 'Unknown',
    state: r.state ?? '',
    lat: r.latitude ?? 0,
    lng: r.longitude ?? 0,
    photos: r.photos && r.photos.length ? r.photos : [FALLBACK_PHOTO],
    beds: r.bedrooms ?? 0,
    baths: r.bathrooms ?? 0,
    sqft: r.squareFootage ?? 0,
    yearBuilt: r.yearBuilt ?? 0,
    daysOnMarket: r.daysOnMarket ?? 0,
    lotSizeSqft: r.lotSize ?? 0,
    propertyType: r.propertyType ?? 'Home',
    listDate,
    soldDate: status === 'closed' ? (r.removedDate ?? '').slice(0, 10) || listDate : undefined,
  };
}

export class RentCastProvider implements ListingProvider {
  readonly name = 'rentcast';

  constructor(
    private readonly apiKey: string,
    private readonly doFetch: typeof fetch = fetch,
  ) {}

  async fetchListings(filter: ListingFilter): Promise<Listing[]> {
    const url = new URL('https://api.rentcast.io/v1/listings/sale');
    url.searchParams.set('limit', '50');
    const res = await this.doFetch(url.toString(), {
      headers: { 'X-Api-Key': this.apiKey, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`RentCast error ${res.status}`);
    const data = (await res.json()) as RentCastRecord[];
    const listings = data.filter((r) => r.price && r.price > 0).map(mapRentCastListing);
    return filterListings(listings, filter);
  }
}
