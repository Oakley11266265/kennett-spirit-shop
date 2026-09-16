/* ============================================================================
   GENERATED PRODUCT DATA — DO NOT EDIT BY HAND
   ----------------------------------------------------------------------------
   Overwritten by:  node scripts/import-bsn.mjs <kennett-catalog.json>

   Right now this file holds PLACEHOLDER products, because the live BSN
   Sideline store is unreachable from the build environment. `CATALOG_SOURCE`
   tells the UI whether it is showing real merchandise, and the draft banner
   keys off it.
   ========================================================================== */

import type { RawProduct } from './catalog';

export const CATALOG_SOURCE: 'placeholder' | 'bsn-import' = 'placeholder';
export const CATALOG_IMPORTED_AT: string | null = null;
export const CATALOG_STORE_URL: string | null = null;

export const generatedProducts: RawProduct[] = [
  {
    id: 'p-classic-hoodie',
    name: 'Classic Arch Hoodie',
    brand: 'Champion',
    priceCents: 5500,
    type: 'hoodie',
    colorNames: ['Heather', 'Navy', 'Royal', 'Black'],
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
    colorNames: ['White', 'Navy', 'Royal'],
    categories: ['tees', 'everyday', 'under-35'],
    fulfillment: 'stock',
  },
  {
    id: 'p-sideline-jacket',
    name: 'Sideline Quarter-Zip',
    brand: 'Under Armour',
    priceCents: 7500,
    type: 'jacket',
    colorNames: ['Navy', 'Black', 'Royal'],
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
    colorNames: ['Royal', 'White', 'Navy'],
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
    colorNames: ['Navy', 'Royal', 'White', 'Charcoal'],
    categories: ['hats', 'everyday', 'under-35'],
    fulfillment: 'stock',
  },
  {
    id: 'p-heavyweight-crew',
    name: 'Heavyweight Demons Crew',
    brand: 'Champion',
    priceCents: 4800,
    type: 'crew',
    colorNames: ['Charcoal', 'Heather', 'Navy'],
    categories: ['hoodies', 'everyday', 'best-sellers'],
    fulfillment: 'made-to-order',
  },
  {
    id: 'p-performance-short',
    name: 'Training Short',
    brand: 'Adidas',
    priceCents: 3500,
    type: 'short',
    colorNames: ['Black', 'Navy', 'Royal'],
    categories: ['athletic', 'everyday'],
    fulfillment: 'stock',
  },
  {
    id: 'p-alumni-crew',
    name: 'Alumni Crew',
    brand: 'Champion',
    priceCents: 5200,
    type: 'crew',
    colorNames: ['Navy', 'Heather', 'White'],
    categories: ['alumni', 'premium'],
    fulfillment: 'made-to-order',
  },
  {
    id: 'p-tech-hoodie',
    name: 'Tech Fleece Hoodie',
    brand: 'Nike',
    priceCents: 8500,
    type: 'hoodie',
    colorNames: ['Black', 'Navy', 'Charcoal'],
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
    colorNames: ['Royal', 'White', 'Navy'],
    categories: ['kids', 'under-35', 'everyday'],
    fulfillment: 'stock',
  },
];
