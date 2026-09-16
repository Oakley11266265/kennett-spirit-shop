#!/usr/bin/env node
/* ============================================================================
   BSN → KENNETT CATALOG IMPORTER

   Usage:
     node scripts/import-bsn.mjs kennett-catalog.json      # from the extractor
     node scripts/import-bsn.mjs ./saved-pages/            # folder of saved .html
     node scripts/import-bsn.mjs products.csv              # name,price,brand,image,url

   Writes src/data/products.generated.ts and prints a report of anything that
   needs a human eye. It never invents a value: missing prices stay null,
   unknown fulfillment stays 'unknown', and nothing is guessed into existence.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const MIRROR = args.includes('--mirror');
const argPath = args.find((a) => !a.startsWith('--'));
if (!argPath) {
  console.error('Usage: node scripts/import-bsn.mjs <catalog.json | folder-of-html | products.csv>');
  process.exit(1);
}

const OUT_FILE = 'src/data/products.generated.ts';
const warnings = [];

/* ------------------------------- helpers -------------------------------- */

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const money = (v) => {
  if (v == null || v === '') return null;
  const m = String(v).replace(/[, ]/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  return m ? Math.round(parseFloat(m[1]) * 100) : null;
};

/** Map a product name onto one of the garment silhouettes we can draw. */
/* Order matters. "Short Sleeve Tee" must reach the tee rule, never the
   shorts rule, so sleeve wording is resolved before any bottoms match. */
const GARMENT_RULES = [
  [/\b(hoodie|hooded|pullover hood|sweatshirt hood)\b/i, 'hoodie'],
  [/\b(quarter.?zip|1\/4 zip|full.?zip|jacket|windbreaker|vest|warm.?up)\b/i, 'jacket'],
  [/\b(long.?sleeve|ls tee)\b/i, 'longsleeve'],
  [/\bshort.?sleeve\b/i, 'tee'],
  [/\b(crew|crewneck|sweatshirt|fleece|pullover)\b/i, 'crew'],
  [/\b(hat|cap|beanie|visor|snapback|trucker)\b/i, 'cap'],
  [/\b(shorts?|jogger|pants?|legging|sweatpant)\b(?!\s*sleeve)/i, 'short'],
  [/\b(tee|t.?shirt|shirt|jersey|tank|polo)\b/i, 'tee'],
];
const inferType = (name) => {
  for (const [re, type] of GARMENT_RULES) if (re.test(name)) return type;
  warnings.push(`Could not tell what kind of garment "${name}" is — defaulted to tee.`);
  return 'tee';
};

const KNOWN_BRANDS = [
  'Nike', 'Under Armour', 'Adidas', 'Champion', 'New Era', 'Gildan', 'Badger', 'Holloway',
  'Augusta', 'Russell', 'Columbia', 'Cutter & Buck', 'Sport-Tek', 'Next Level', 'Comfort Colors',
  'Jerzees', 'Port Authority', 'Richardson', 'Nine Line', 'Ouray', 'MV Sport', 'League',
];
const inferBrand = (name, given) => {
  if (given) return String(given).trim();
  const hit = KNOWN_BRANDS.find((b) => new RegExp(`\\b${b.replace(/[&]/g, '.')}\\b`, 'i').test(name));
  return hit ?? null;
};

/** Colour words BSN puts in product names or colour lists. */
const COLOR_WORDS = [
  'royal', 'navy', 'white', 'black', 'charcoal', 'heather', 'grey', 'gray', 'silver',
  'blue', 'red', 'pink', 'green', 'gold', 'maroon', 'purple', 'orange',
];
const inferColors = (p) => {
  if (Array.isArray(p.colors) && p.colors.length) return p.colors.map(String);
  const found = COLOR_WORDS.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(p.name));
  return found.length ? found.map((c) => c[0].toUpperCase() + c.slice(1)) : [];
};

/** Categories drive the rails and the moment grid. */
const categorize = (name, type, priceCents, sourceCategory) => {
  const cats = new Set();
  const n = name.toLowerCase();
  const src = (sourceCategory || '').toLowerCase();

  if (type === 'hoodie' || type === 'crew') cats.add('hoodies');
  if (type === 'tee' || type === 'longsleeve') cats.add('tees');
  if (type === 'cap') cats.add('hats');
  if (type === 'short' || type === 'jacket') cats.add('athletic');

  if (/youth|kid|toddler|infant|girls|boys/.test(n) || /kid|youth/.test(src)) cats.add('kids');
  if (/women|ladies|womens/.test(n) || /women/.test(src)) cats.add('women');
  if (/alumni|est\.?\s*19/.test(n)) cats.add('alumni');
  if (/performance|dri.?fit|training|practice|athletic/.test(n)) cats.add('athletic');
  if (/game ?day|fan|spirit/.test(n)) cats.add('game-day');

  if (priceCents != null && priceCents < 3500) cats.add('under-35');
  if (priceCents != null && priceCents >= 6500) cats.add('premium');

  cats.add('everyday');
  return Array.from(cats);
};

/* ------------------------------- parsers -------------------------------- */

function fromExtractorJson(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const list = Array.isArray(raw) ? raw : raw.products;
  if (!Array.isArray(list)) throw new Error('No "products" array found in that JSON file.');
  return { rows: list, storeUrl: raw.store ?? null };
}

function fromCsv(file) {
  const text = fs.readFileSync(file, 'utf8').trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());
  const rows = lines.map((line) => {
    // handles quoted fields containing commas
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) =>
      c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim(),
    );
    const row = {};
    headers.forEach((h, i) => (row[h] = cells?.[i] ?? ''));
    return {
      name: row.name || row.product || row.title,
      priceCents: money(row.price ?? row.pricecents),
      brand: row.brand || null,
      image: row.image || row.imageurl || null,
      url: row.url || row.link || null,
      category: row.category || null,
      colors: row.colors ? row.colors.split(/[;|]/).map((s) => s.trim()) : null,
    };
  });
  return { rows, storeUrl: null };
}

/** Very small HTML scrape for saved pages — same price-anchored card logic
    as the browser extractor, minus a DOM library. */
function fromHtmlFolder(dir) {
  const files = fs.statSync(dir).isDirectory()
    ? fs.readdirSync(dir).filter((f) => /\.html?$/i.test(f)).map((f) => path.join(dir, f))
    : [dir];
  const rows = [];

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');

    // 1) JSON-LD blocks are the most reliable thing in a saved page
    const ldMatches = html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );
    for (const m of ldMatches) {
      let data;
      try {
        data = JSON.parse(m[1]);
      } catch {
        continue;
      }
      const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(walk);
        const t = node['@type'];
        if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
          const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          rows.push({
            name: node.name,
            priceCents: money(offer?.price ?? offer?.lowPrice),
            brand: typeof node.brand === 'object' ? node.brand?.name : node.brand,
            image: Array.isArray(node.image) ? node.image[0] : node.image,
            url: node.url,
            category: path.basename(file, path.extname(file)),
          });
        }
        Object.values(node).forEach(walk);
      };
      walk(data);
    }

    // 2) fall back to <img alt="..."> paired with a nearby price
    if (!rows.length) {
      const chunks = html.split(/<(?:li|article|div)\b/i);
      for (const chunk of chunks) {
        const alt = chunk.match(/<img[^>]+alt=["']([^"']{4,120})["']/i);
        const src = chunk.match(/<img[^>]+src=["']([^"']+)["']/i);
        const price = chunk.match(/\$\s?(\d{1,4}(?:\.\d{2})?)/);
        const href = chunk.match(/href=["']([^"']+)["']/i);
        if (alt && price) {
          rows.push({
            name: alt[1],
            priceCents: money(price[1]),
            image: src?.[1] ?? null,
            url: href?.[1] ?? null,
            category: path.basename(file, path.extname(file)),
          });
        }
      }
    }
  }
  return { rows, storeUrl: null };
}

/* -------------------------------- main ---------------------------------- */

const stat = fs.statSync(argPath);
let parsed;
if (stat.isDirectory()) parsed = fromHtmlFolder(argPath);
else if (/\.json$/i.test(argPath)) parsed = fromExtractorJson(argPath);
else if (/\.csv$/i.test(argPath)) parsed = fromCsv(argPath);
else parsed = fromHtmlFolder(argPath);

const { rows, storeUrl } = parsed;

/* de-duplicate, normalise, and keep only rows that at least have a name */
const byKey = new Map();
for (const r of rows) {
  if (!r?.name) continue;
  const name = String(r.name).trim().replace(/\s+/g, ' ');
  if (name.length < 3) continue;
  if (/^(shop|view|home|cart|search|sign in|menu)$/i.test(name)) continue;

  const key = slug(name);
  const priceCents = r.priceCents ?? money(r.priceText ?? r.price);
  const existing = byKey.get(key);
  if (existing) {
    if (!existing.image && r.image) existing.image = r.image;
    if (existing.priceCents == null && priceCents != null) existing.priceCents = priceCents;
    if (!existing.bsnUrl && r.url) existing.bsnUrl = r.url;
    continue;
  }

  const type = inferType(name);
  byKey.set(key, {
    id: key,
    name,
    brand: inferBrand(name, r.brand),
    priceCents,
    type,
    colorNames: inferColors({ ...r, name }),
    categories: categorize(name, type, priceCents, r.category),
    // BSN does not publish a machine-readable ship time on listing pages.
    fulfillment: 'unknown',
    image: r.image ?? null,
    bsnUrl: r.url ?? null,
  });
}

const products = Array.from(byKey.values());

if (!products.length) {
  console.error('\n✖ No products could be read from that file.');
  console.error('  If you saved HTML, the page may load products with JavaScript —');
  console.error('  use scripts/extract-bsn.js in the browser console instead.\n');
  process.exit(1);
}

/* --------------------- optionally mirror the photography ----------------
   Hotlinking BSN's CDN works, but it breaks the day they change a path and
   leaves us at the mercy of their referer rules. --mirror pulls the images
   into public/products/ so the storefront owns its own assets. Run it from a
   network that can actually reach the CDN. */
if (MIRROR) {
  const dir = 'public/products';
  fs.mkdirSync(dir, { recursive: true });
  let ok = 0;
  let failed = 0;
  for (const p of products) {
    if (!p.image) continue;
    const ext = (p.image.match(/\.(jpe?g|png|webp|avif)/i)?.[1] ?? 'jpg').toLowerCase();
    const file = `${p.id}.${ext}`;
    try {
      const res = await fetch(p.image);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(path.join(dir, file), Buffer.from(await res.arrayBuffer()));
      p.image = `products/${file}`;
      ok += 1;
    } catch (e) {
      failed += 1;
      warnings.push(`Could not download the photo for "${p.name}" (${e.message}) — kept the BSN URL.`);
    }
  }
  console.log(`\n  Mirrored ${ok} images into ${dir}${failed ? `, ${failed} failed` : ''}`);
}

/* ------------------------------- report --------------------------------- */
const noPrice = products.filter((p) => p.priceCents == null);
const noImage = products.filter((p) => !p.image);
const noBrand = products.filter((p) => !p.brand);

const body = products
  .map(
    (p) => `  {
    id: ${JSON.stringify(p.id)},
    name: ${JSON.stringify(p.name)},
    brand: ${JSON.stringify(p.brand)},
    priceCents: ${p.priceCents ?? 'null'},
    type: ${JSON.stringify(p.type)},
    colorNames: ${JSON.stringify(p.colorNames)},
    categories: ${JSON.stringify(p.categories)},
    fulfillment: ${JSON.stringify(p.fulfillment)},
    image: ${JSON.stringify(p.image)},
    bsnUrl: ${JSON.stringify(p.bsnUrl)},
  },`,
  )
  .join('\n');

const file = `/* ============================================================================
   GENERATED PRODUCT DATA — DO NOT EDIT BY HAND
   Imported from the live BSN Sideline store by scripts/import-bsn.mjs
   Source: ${storeUrl ?? argPath}
   Imported: ${new Date().toISOString()}
   Products: ${products.length}
   ========================================================================== */

import type { RawProduct } from './catalog';

export const CATALOG_SOURCE: 'placeholder' | 'bsn-import' = 'bsn-import';
export const CATALOG_IMPORTED_AT: string | null = ${JSON.stringify(new Date().toISOString())};
export const CATALOG_STORE_URL: string | null = ${JSON.stringify(storeUrl)};

export const generatedProducts: RawProduct[] = [
${body}
];
`;

fs.writeFileSync(OUT_FILE, file);

console.log(`\n✔ Imported ${products.length} products → ${OUT_FILE}\n`);
console.log('  By garment type:');
const counts = {};
products.forEach((p) => (counts[p.type] = (counts[p.type] ?? 0) + 1));
Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([t, c]) => console.log(`    ${String(t).padEnd(12)} ${c}`));

console.log('\n  Needs a human eye:');
console.log(`    ${noPrice.length} without a price`);
console.log(`    ${noImage.length} without an image`);
console.log(`    ${noBrand.length} without a brand`);
console.log(`    ${products.length} with unknown ship time (BSN does not publish it in the listing)`);

if (warnings.length) {
  console.log('\n  Notes:');
  [...new Set(warnings)].slice(0, 12).forEach((w) => console.log(`    • ${w}`));
  if (warnings.length > 12) console.log(`    • …and ${warnings.length - 12} more`);
}

console.log('\n  Next:  npm run build\n');
