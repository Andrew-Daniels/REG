import { describe, it, expect } from 'vitest';
import {
  INFO_FIELDS,
  PRESET_INFO,
  visibleFields,
  formatField,
  type Listing,
} from '../src/core/listing';

const sample: Listing = {
  id: 'l1',
  price: 625_000,
  status: 'closed',
  city: 'Austin',
  state: 'TX',
  lat: 30.27,
  lng: -97.74,
  photos: ['a.jpg', 'b.jpg'],
  beds: 3,
  baths: 2,
  sqft: 1850,
  yearBuilt: 1998,
  daysOnMarket: 21,
  lotSizeSqft: 6500,
  propertyType: 'Single Family',
  listDate: '2026-05-01',
  soldDate: '2026-05-22',
};

describe('info field presets', () => {
  it('hard reveals the fewest extra fields, easy the most', () => {
    expect(PRESET_INFO.hard.length).toBeLessThan(PRESET_INFO.medium.length);
    expect(PRESET_INFO.medium.length).toBeLessThan(PRESET_INFO.easy.length);
  });

  it('every preset field is a known info field', () => {
    for (const preset of Object.values(PRESET_INFO)) {
      for (const f of preset) {
        expect(INFO_FIELDS.map((i) => i.key)).toContain(f);
      }
    }
  });
});

describe('visibleFields', () => {
  it('shows the configured shared fields', () => {
    const v = visibleFields(['beds', 'baths'], []);
    expect(v).toEqual(['beds', 'baths']);
  });

  it('adds fields unlocked by powerups without duplicating', () => {
    const v = visibleFields(['beds'], ['beds', 'yearBuilt']);
    expect(v).toContain('beds');
    expect(v).toContain('yearBuilt');
    expect(v.filter((f) => f === 'beds')).toHaveLength(1);
  });

  it('keeps a stable canonical ordering', () => {
    const v = visibleFields(['sqft', 'beds'], ['yearBuilt']);
    const order = INFO_FIELDS.map((i) => i.key);
    const indices = v.map((f) => order.indexOf(f));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});

describe('formatField', () => {
  it('formats sqft with units', () => {
    expect(formatField(sample, 'sqft')).toBe('1,850 sqft');
  });
  it('formats beds and baths', () => {
    expect(formatField(sample, 'beds')).toBe('3 bd');
    expect(formatField(sample, 'baths')).toBe('2 ba');
  });
  it('formats year built', () => {
    expect(formatField(sample, 'yearBuilt')).toBe('Built 1998');
  });
  it('formats days on market', () => {
    expect(formatField(sample, 'daysOnMarket')).toBe('21 days on market');
  });
});
