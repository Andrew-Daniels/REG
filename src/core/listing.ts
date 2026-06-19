/** Listing model and the configurable "what info is shared" system. */

export type ListingStatus = 'active' | 'pending' | 'closed';

export interface Listing {
  id: string;
  /** The price players are guessing (list price for active, sold price for closed). */
  price: number;
  status: ListingStatus;
  city: string;
  state: string;
  lat: number;
  lng: number;
  photos: string[];
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  daysOnMarket: number;
  lotSizeSqft: number;
  propertyType: string;
  /** ISO date the listing went on market. */
  listDate: string;
  /** ISO date it sold/closed, when applicable. */
  soldDate?: string;
}

/** Fields that hosts may choose to share, and powerups may reveal. */
export type InfoFieldKey =
  | 'beds'
  | 'baths'
  | 'sqft'
  | 'propertyType'
  | 'yearBuilt'
  | 'daysOnMarket'
  | 'lotSizeSqft';

export interface InfoFieldDef {
  key: InfoFieldKey;
  label: string;
}

/** Canonical ordering of info fields (used for stable display). */
export const INFO_FIELDS: InfoFieldDef[] = [
  { key: 'beds', label: 'Bedrooms' },
  { key: 'baths', label: 'Bathrooms' },
  { key: 'sqft', label: 'Square Feet' },
  { key: 'propertyType', label: 'Property Type' },
  { key: 'yearBuilt', label: 'Year Built' },
  { key: 'daysOnMarket', label: 'Days on Market' },
  { key: 'lotSizeSqft', label: 'Lot Size' },
];

const ORDER = INFO_FIELDS.map((f) => f.key);

/** Preset bundles of shared info for the easy/medium/hard quick-start modes. */
export const PRESET_INFO: Record<'easy' | 'medium' | 'hard', InfoFieldKey[]> = {
  easy: ['beds', 'baths', 'sqft', 'propertyType', 'yearBuilt'],
  medium: ['beds', 'baths', 'sqft'],
  hard: ['beds'],
};

/**
 * Fields visible this round: the host-configured shared fields plus any
 * unlocked by powerups, de-duplicated and returned in canonical order.
 */
export function visibleFields(
  shared: InfoFieldKey[],
  unlockedByPowerups: InfoFieldKey[],
): InfoFieldKey[] {
  const set = new Set<InfoFieldKey>([...shared, ...unlockedByPowerups]);
  return ORDER.filter((k) => set.has(k));
}

const fmtNum = (n: number) => n.toLocaleString('en-US');

/** Format a single info field for display. */
export function formatField(listing: Listing, key: InfoFieldKey): string {
  switch (key) {
    case 'beds':
      return `${listing.beds} bd`;
    case 'baths':
      return `${listing.baths} ba`;
    case 'sqft':
      return `${fmtNum(listing.sqft)} sqft`;
    case 'propertyType':
      return listing.propertyType;
    case 'yearBuilt':
      return `Built ${listing.yearBuilt}`;
    case 'daysOnMarket':
      return `${listing.daysOnMarket} days on market`;
    case 'lotSizeSqft':
      return `${fmtNum(listing.lotSizeSqft)} sqft lot`;
  }
}
