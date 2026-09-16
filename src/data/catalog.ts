/* ============================================================================
   CATALOG — DATA CONTRACT
   ----------------------------------------------------------------------------
   !! IMPORTANT !!
   Everything below is PLACEHOLDER structure, not Kennett's real BSN catalog.
   The live BSN Sideline store could not be reached from the build environment
   (blocked by network egress policy), so no real product names, prices, SKUs
   or photography have been imported yet.

   This file is the single swap point. Replace `products` with the scraped
   BSN feed and the entire storefront renders real merchandise — no component
   changes required. Shapes are modeled on what BSN Sideline actually exposes.
   ========================================================================== */

export const CATALOG_IS_PLACEHOLDER = true;

export type GarmentType = 'hoodie' | 'tee' | 'crew' | 'jacket' | 'cap' | 'longsleeve' | 'short';

export type Colorway = {
  name: string;
  /** garment body color */
  body: string;
  /** printed/embroidered mark color */
  mark: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  priceCents: number;
  type: GarmentType;
  colorways: Colorway[];
  categories: string[];
  /** BSN fulfillment reality: stocked items ship fast, decorated items are made to order */
  fulfillment: 'stock' | 'made-to-order';
  badge?: string;
  /** Real product photography drops in here from the BSN feed. */
  image?: string;
  /** Deep link into the BSN product page for checkout handoff. */
  bsnUrl?: string;
};

const ROYAL: Colorway = { name: 'Royal', body: '#1b4ac6', mark: '#ffffff' };
const NAVY: Colorway = { name: 'Navy', body: '#001854', mark: '#ffffff' };
const WHITE: Colorway = { name: 'White', body: '#f2f5fa', mark: '#001854' };
const HEATHER: Colorway = { name: 'Heather', body: '#b8c1d1', mark: '#001854' };
const CHARCOAL: Colorway = { name: 'Charcoal', body: '#333d52', mark: '#ffffff' };
const BLACK: Colorway = { name: 'Black', body: '#10131c', mark: '#ffffff' };

export const products: Product[] = [
  {
    id: 'p-classic-hoodie',
    name: 'Classic Arch Hoodie',
    brand: 'Champion',
    priceCents: 5500,
    type: 'hoodie',
    colorways: [HEATHER, NAVY, ROYAL, BLACK],
    categories: ['hoodies', 'everyday', 'best-sellers'],
    fulfillment: 'made-to-order',
    badge: 'BEST SELLER',
  },
  {
    id: 'p-demon-tee',
    name: 'Blue Demon Mark Tee',
    brand: 'Nike',
    priceCents: 3000,
    type: 'tee',
    colorways: [WHITE, NAVY, ROYAL],
    categories: ['tees', 'everyday', 'under-35'],
    fulfillment: 'stock',
  },
  {
    id: 'p-sideline-jacket',
    name: 'Sideline Quarter-Zip',
    brand: 'Under Armour',
    priceCents: 7500,
    type: 'jacket',
    colorways: [NAVY, BLACK, ROYAL],
    categories: ['game-day', 'athletic', 'premium'],
    fulfillment: 'made-to-order',
    badge: 'PREMIUM',
  },
  {
    id: 'p-student-section-tee',
    name: 'Student Section Long Sleeve',
    brand: 'Gildan',
    priceCents: 3200,
    type: 'longsleeve',
    colorways: [ROYAL, WHITE, NAVY],
    categories: ['game-day', 'tees', 'under-35'],
    fulfillment: 'stock',
    badge: 'NEW DROP',
  },
  {
    id: 'p-structured-cap',
    name: 'Structured K Cap',
    brand: 'Nike',
    priceCents: 2800,
    type: 'cap',
    colorways: [NAVY, ROYAL, WHITE, CHARCOAL],
    categories: ['hats', 'everyday', 'under-35'],
    fulfillment: 'stock',
  },
  {
    id: 'p-heavyweight-crew',
    name: 'Heavyweight Demons Crew',
    brand: 'Champion',
    priceCents: 4800,
    type: 'crew',
    colorways: [CHARCOAL, HEATHER, NAVY],
    categories: ['hoodies', 'everyday', 'best-sellers'],
    fulfillment: 'made-to-order',
  },
  {
    id: 'p-performance-short',
    name: 'Training Short',
    brand: 'Adidas',
    priceCents: 3500,
    type: 'short',
    colorways: [BLACK, NAVY, ROYAL],
    categories: ['athletic', 'everyday'],
    fulfillment: 'stock',
  },
  {
    id: 'p-alumni-crew',
    name: 'Alumni Est. 1921 Crew',
    brand: 'Champion',
    priceCents: 5200,
    type: 'crew',
    colorways: [NAVY, HEATHER, WHITE],
    categories: ['alumni', 'premium'],
    fulfillment: 'made-to-order',
  },
  {
    id: 'p-tech-hoodie',
    name: 'Tech Fleece Hoodie',
    brand: 'Nike',
    priceCents: 8500,
    type: 'hoodie',
    colorways: [BLACK, NAVY, CHARCOAL],
    categories: ['premium', 'athletic', 'hoodies'],
    fulfillment: 'made-to-order',
    badge: 'PREMIUM',
  },
  {
    id: 'p-youth-tee',
    name: 'Youth Demons Tee',
    brand: 'Gildan',
    priceCents: 2200,
    type: 'tee',
    colorways: [ROYAL, WHITE, NAVY],
    categories: ['kids', 'under-35', 'everyday'],
    fulfillment: 'stock',
  },
];

/** Locker-rail categories. Order matters: most-shopped first. */
export const lockerCategories = [
  { id: 'all', label: 'All' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'tees', label: 'Tees' },
  { id: 'game-day', label: 'Game Day' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'hats', label: 'Hats' },
  { id: 'kids', label: 'Kids' },
] as const;

export type Fit = {
  id: string;
  name: string;
  tagline: string;
  itemIds: string[];
  accent: string;
};

/** Curated outfits — the single biggest lever on average order value. */
export const fits: Fit[] = [
  {
    id: 'friday-night-lights',
    name: 'Friday Night Lights',
    tagline: 'Cold bleachers. Loud section.',
    itemIds: ['p-classic-hoodie', 'p-structured-cap', 'p-performance-short'],
    accent: '#1b4ac6',
  },
  {
    id: 'student-section',
    name: 'Student Section',
    tagline: 'Front row, full voice.',
    itemIds: ['p-student-section-tee', 'p-structured-cap'],
    accent: '#2f62e0',
  },
  {
    id: 'cold-game',
    name: 'Cold Game',
    tagline: 'November on the sideline.',
    itemIds: ['p-sideline-jacket', 'p-heavyweight-crew', 'p-structured-cap'],
    accent: '#001854',
  },
  {
    id: 'everyday-demon',
    name: 'Everyday Demon',
    tagline: 'Hallways, not headlines.',
    itemIds: ['p-demon-tee', 'p-tech-hoodie'],
    accent: '#0d3a9e',
  },
];

/** "Shop by moment" — how students and parents actually think about buying. */
export const moments = [
  { id: 'game-day', label: 'Game Day', note: 'Wear it Friday' },
  { id: 'new-drop', label: 'New Drop', note: 'Just landed' },
  { id: 'best-sellers', label: 'Best Sellers', note: 'Most worn' },
  { id: 'under-35', label: 'Under $35', note: 'Easy yes' },
  { id: 'premium', label: 'Premium', note: 'The good stuff' },
  { id: 'athletic', label: 'Athletic', note: 'Train in it' },
  { id: 'kids', label: 'Kids', note: 'Little Demons' },
  { id: 'alumni', label: 'Alumni', note: 'Once a Demon' },
];

/** Brands BSN's Sideline platform carries. Wordmarks are rendered as type. */
export const brands = ['NIKE', 'UNDER ARMOUR', 'ADIDAS', 'CHAMPION', 'NEW ERA', 'GILDAN'];

/** The "Choose Your K" mark variations. */
export const marks = [
  { id: 'block-k', label: 'Block K' },
  { id: 'demon-head', label: 'Demon Head' },
  { id: 'wordmark', label: 'Kennett Script' },
  { id: 'class-year', label: 'Class of 2026' },
] as const;

export const getProduct = (id: string) => products.find((p) => p.id === id);
