/* ============================================================================
   CATALOG — types, colour mapping and curation
   ----------------------------------------------------------------------------
   Product records live in ./products.generated.ts, which the BSN importer
   overwrites. Nothing in this file needs to change when real data lands:
   curation (moments, rails, fits) is expressed as RULES that resolve against
   whatever catalog is present, so Game Day Fits keeps working with real SKUs.
   ========================================================================== */

import { CATALOG_SOURCE, CATALOG_STORE_URL, generatedProducts } from './products.generated';

export { CATALOG_SOURCE, CATALOG_STORE_URL };
export const CATALOG_IS_PLACEHOLDER = CATALOG_SOURCE === 'placeholder';

export type GarmentType =
  | 'hoodie'
  | 'tee'
  | 'crew'
  | 'jacket'
  | 'cap'
  | 'longsleeve'
  | 'short'
  | 'polo'
  | 'pant'
  | 'beanie'
  | 'bag'
  | 'accessory';

/** Fulfillment is only asserted when BSN actually stated it. */
export type Fulfillment = 'stock' | 'made-to-order' | 'unknown';

export type Colorway = { name: string; body: string; mark: string };

/** The shape the importer writes. */
export type RawProduct = {
  id: string;
  name: string;
  brand?: string | null;
  priceCents: number | null;
  type: GarmentType;
  colorNames?: string[];
  categories: string[];
  fulfillment: Fulfillment;
  badge?: string;
  /** Real BSN product photography, when imported. */
  image?: string | null;
  /** Deep link to the BSN product page — where checkout actually happens. */
  bsnUrl?: string | null;
};

export type Product = Omit<RawProduct, 'colorNames'> & {
  colorways: Colorway[];
  /** False when BSN gave us no colours and we're only using palette defaults
      to draw a flat — the UI must not imply those colourways exist. */
  colorsKnown: boolean;
};

/* ---------- colour vocabulary ----------
   BSN lists colours as words. This maps those words onto the Kennett palette
   so a flat can be drawn; real photography overrides it when present. */
const COLOR_MAP: Record<string, Colorway> = {
  royal: { name: 'Royal', body: '#1b4ac6', mark: '#ffffff' },
  blue: { name: 'Blue', body: '#1b4ac6', mark: '#ffffff' },
  navy: { name: 'Navy', body: '#001854', mark: '#ffffff' },
  white: { name: 'White', body: '#f2f5fa', mark: '#001854' },
  heather: { name: 'Heather', body: '#b8c1d1', mark: '#001854' },
  grey: { name: 'Grey', body: '#b8c1d1', mark: '#001854' },
  gray: { name: 'Gray', body: '#b8c1d1', mark: '#001854' },
  charcoal: { name: 'Charcoal', body: '#333d52', mark: '#ffffff' },
  black: { name: 'Black', body: '#10131c', mark: '#ffffff' },
  silver: { name: 'Silver', body: '#d4dae4', mark: '#001854' },
  pink: { name: 'Pink', body: '#e8a0c0', mark: '#001854' },
  red: { name: 'Red', body: '#c62828', mark: '#ffffff' },
  green: { name: 'Green', body: '#2e7d52', mark: '#ffffff' },
  gold: { name: 'Gold', body: '#d4a437', mark: '#001854' },
};

const DEFAULT_COLORWAYS: Colorway[] = [COLOR_MAP.royal, COLOR_MAP.navy, COLOR_MAP.white];

const toColorway = (name: string): Colorway => {
  const key = Object.keys(COLOR_MAP).find((k) => name.toLowerCase().includes(k));
  return key ? { ...COLOR_MAP[key], name } : { name, body: '#5a6478', mark: '#ffffff' };
};

export const products: Product[] = generatedProducts.map(({ colorNames, ...p }) => ({
  ...p,
  colorways: colorNames?.length ? colorNames.map(toColorway) : DEFAULT_COLORWAYS,
  colorsKnown: Boolean(colorNames?.length),
}));

export const getProduct = (id: string) => products.find((p) => p.id === id);

/* ---------- rails and filters ---------- */
export const lockerCategories = [
  { id: 'all', label: 'All' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'tees', label: 'Tees' },
  { id: 'outerwear', label: 'Jackets' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'hats', label: 'Hats' },
  { id: 'women', label: 'Women' },
  { id: 'kids', label: 'Kids' },
  { id: 'accessories', label: 'Accessories' },
] as const;

export const moments = [
  { id: 'new-drop', label: 'New Drop', note: 'Just landed' },
  { id: 'best-sellers', label: 'Best Sellers', note: 'Most worn' },
  { id: 'under-35', label: 'Under $35', note: 'Easy yes' },
  { id: 'premium', label: 'Premium', note: 'The good stuff' },
  { id: 'hoodies', label: 'Hoodies', note: 'Cold bleachers' },
  { id: 'athletic', label: 'Athletic', note: 'Train in it' },
  { id: 'kids', label: 'Kids', note: 'Little Demons' },
  { id: 'accessories', label: 'Accessories', note: 'Bags & more' },
];

/* ---------- Game Day Fits, as rules rather than fixed SKUs ----------
   A fit asks for a shape of outfit; it resolves against whatever is in the
   catalog. Real imported products slot straight in. */
export type FitRule = {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  /** garment types to fill, in display order */
  wants: GarmentType[];
  /** bias toward products tagged with these categories */
  prefer?: string[];
};

export const fits: FitRule[] = [
  {
    id: 'friday-night-lights',
    name: 'Friday Night Lights',
    tagline: 'Cold bleachers. Loud section.',
    accent: '#1b4ac6',
    wants: ['hoodie', 'cap', 'pant'],
    prefer: ['game-day', 'best-sellers'],
  },
  {
    id: 'student-section',
    name: 'Student Section',
    tagline: 'Front row, full voice.',
    accent: '#2f62e0',
    wants: ['longsleeve', 'cap', 'short'],
    prefer: ['game-day', 'under-35'],
  },
  {
    id: 'cold-game',
    name: 'Cold Game',
    tagline: 'November on the sideline.',
    accent: '#001854',
    wants: ['jacket', 'crew', 'beanie'],
    prefer: ['game-day', 'premium'],
  },
  {
    id: 'everyday-demon',
    name: 'Everyday Demon',
    tagline: 'Hallways, not headlines.',
    accent: '#0d3a9e',
    wants: ['tee', 'hoodie', 'bag'],
    prefer: ['everyday'],
  },
];

/** Resolve a fit against the live catalog, skipping types that do not exist. */
export function resolveFit(fit: FitRule): Product[] {
  const used = new Set<string>();
  const picked: Product[] = [];
  for (const want of fit.wants) {
    const candidates = products.filter((p) => p.type === want && !used.has(p.id));
    if (!candidates.length) continue;
    const preferred =
      candidates.find((p) => fit.prefer?.some((c) => p.categories.includes(c))) ?? candidates[0];
    used.add(preferred.id);
    picked.push(preferred);
  }
  return picked;
}

/* Brands, ordered by how much of the catalog each one actually carries. */
export const brands = Object.entries(
  products.reduce<Record<string, number>>((acc, p) => {
    if (p.brand) acc[p.brand] = (acc[p.brand] ?? 0) + 1;
    return acc;
  }, {}),
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([name]) => name.toUpperCase());

export const marks = [
  { id: 'block-k', label: 'Block K' },
  { id: 'demon-head', label: 'Demon Head' },
  { id: 'wordmark', label: 'Kennett Script' },
  { id: 'class-year', label: 'Class of 2026' },
] as const;
