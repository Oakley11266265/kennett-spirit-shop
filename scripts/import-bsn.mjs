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

/* ---------------------------------------------------------------------------
   BSN's product tiles glue UI chrome, the brand and the product name into one
   string: "Design It Quick Add NikeMen's Club Pullover Fleece Hoodie", and
   swatch counts ride along as "+5 More +11". These strip it back apart.
------------------------------------------------------------------------- */

// Chrome can appear anywhere, not just at the start: BSN renders
// "Youth Design It Quick Add NikeYouth Club Pullover Fleece Hoodie".
const CHROME = /(?:Design It|Quick Add|Shop Now|Customize|\+\d+(?:\s*More)?)/gi;

/* Longest first so "Under Armour" wins over "Under", and "Port Authority"
   over "Port & Company". Sourced from the store's own /brands/ pages. */
const BRANDS = [
  'Augusta Sportswear', 'Under Armour', 'The North Face', 'Next Level Apparel', 'Brooks Brothers',
  'Outdoor Research', 'Mercer+Mettle', 'Stanley/Stella', 'Port Authority',
  'Port & Company', 'Rabbit Skins', 'Tommy Bahama', 'TravisMathew', 'BSN SPORTS',
  'New Balance', 'CornerStone', 'Next Level', 'Sport-Tek', 'Richardson',
  'Lululemon', 'MV Sport', 'Champion', 'Cotopaxi', 'Carhartt', 'District',
  'New Era', 'Adidas', 'Gildan', 'Jerzees', 'Nike', 'OGIO', 'UA',
];

function splitBrand(raw) {
  const cleaned = raw.replace(CHROME, ' ').replace(/\s+/g, ' ').trim();
  // Find the brand wherever it sits, then keep everything after it. The tail
  // already restates the audience, so "Youth NikeYouth Club Hoodie" resolves
  // to Nike + "Youth Club Hoodie" without special-casing the leading word.
  let best = null;
  for (const brand of BRANDS) {
    const at = cleaned.toLowerCase().indexOf(brand.toLowerCase());
    if (at === -1) continue;
    if (!best || at < best.at || (at === best.at && brand.length > best.brand.length)) {
      best = { brand, at };
    }
  }
  if (!best) return { brand: null, name: cleaned };
  const rest = cleaned.slice(best.at + best.brand.length).trim();
  return { brand: best.brand, name: rest || cleaned };
}

/** Garment silhouette, used for the drawn flats and for outfit building. */
const GARMENT_RULES = [
  [/\bhoodies?\b|\bhooded\b/i, 'hoodie'],
  [/\bbeanies?\b|\bknit cap\b|\bpom\b/i, 'beanie'],
  [/\b(backpacks?|duffels?|totes?|cinch|bags?|crossbody|lunch)\b|\b(?:rec|sling|book)\s?packs?\b/i, 'bag'],
  [/\b(caps?|hats?|truckers?|snapback|visor|bucket)\b|\b\d-panel\b|\bflatbill\b|\bgramps\b/i, 'cap'],
  [/\bpolos?\b/i, 'polo'],
  // 1/4-Zip, 1/2 Zip, Half Zip and Mid-Layer all read as outerwear here
  [/(?:\b(?:quarter|half)|1\/[24])[\s-]?zip|full[\s-]?zip|\b(jackets?|windbreakers?|vests?|coats?|soft ?shell|anorak|parka|mid[\s-]?layer|warm[\s-]?up|cardigans?|bombers?|ponchos?)\b/i, 'jacket'],
  [/\b(leggings?|joggers?|sweatpants?|pants?|trousers?|chinos?|tights?|capris?)\b/i, 'pant'],
  [/\b(shorts?|skirts?|skort)\b(?!\s*sleeve)/i, 'short'],
  [/\b(long[\s-]?sleeve|ls tee)\b/i, 'longsleeve'],
  [/\bshort[\s-]?sleeve\b/i, 'tee'],
  [/\b(crews?|crewneck|sweatshirts?|sweaters?|fleece|pullovers?)\b/i, 'crew'],
  [/\b(tees?|t[\s-]?shirts?|shirts?|jerseys?|tanks?|tops?|raglans?|racerback|sleeveless|v[\s-]?neck|camisole)\b/i, 'tee'],
  [/\b(decals?|stickers?|tumblers?|bottles?|mugs?|socks?|towels?|blankets?|magnets?|signs?)\b/i, 'accessory'],
];
const inferType = (name) => {
  for (const [re, type] of GARMENT_RULES) if (re.test(name)) return type;
  warnings.push(`No garment type matched "${name}" — filed as accessory.`);
  return 'accessory';
};

/** BSN publishes a real category path per tile, e.g. mens/hoodies-sweatshirts/crewnecks.
    That beats guessing from the product name, so it drives the rails. */
function categorize(name, type, priceCents, path) {
  const cats = new Set();
  const seg = String(path || '').toLowerCase().split('/');
  const n = name.toLowerCase();

  if (seg[0] === 'mens') cats.add('mens');
  if (seg[0] === 'womens') cats.add('women');
  if (seg[0] === 'kids') cats.add('kids');
  if (seg[0] === 'hats') cats.add('hats');
  if (seg[0] === 'accessories') cats.add('accessories');
  if (seg[0] === 'new-trending') {
    cats.add('new-drop');
    if (seg[1] === 'best-sellers') cats.add('best-sellers');
  }

  const joined = seg.join('/');
  if (/hoodies-sweatshirts/.test(joined)) cats.add('hoodies');
  if (/t-shirts/.test(joined)) cats.add('tees');
  if (/jackets-vests/.test(joined)) cats.add('outerwear');
  if (/shorts|compression|athletic|training|pants-leggings/.test(joined)) cats.add('athletic');
  if (/polos/.test(joined)) cats.add('polos');
  if (/bags|accessories/.test(joined)) cats.add('accessories');

  // type is the fallback when the path is a brand page or the bare root
  if (!cats.size || seg[0] === 'brands' || seg[0] === 'main') {
    if (type === 'hoodie' || type === 'crew') cats.add('hoodies');
    if (type === 'tee' || type === 'longsleeve') cats.add('tees');
    if (type === 'cap' || type === 'beanie') cats.add('hats');
    if (type === 'bag' || type === 'accessory') cats.add('accessories');
    if (type === 'short' || type === 'pant') cats.add('athletic');
  }

  if (/youth|toddler|infant|boys|girls/.test(n)) cats.add('kids');
  if (/alumni|est\.?\s*19/.test(n)) cats.add('alumni');

  if (priceCents != null && priceCents < 3500) cats.add('under-35');
  if (priceCents != null && priceCents >= 7500) cats.add('premium');

  cats.add('everyday');
  return Array.from(cats);
}

const COLOR_WORDS = [
  'royal', 'navy', 'white', 'black', 'charcoal', 'heather', 'grey', 'gray', 'silver',
  'blue', 'red', 'pink', 'green', 'gold', 'maroon', 'purple', 'orange',
];
const inferColors = (p) => {
  if (Array.isArray(p.colors) && p.colors.length) return p.colors.map(String);
  const found = COLOR_WORDS.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(p.name));
  return found.length ? found.map((c) => c[0].toUpperCase() + c.slice(1)) : [];
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

/* De-duplicate on BSN's own product id — the same shirt appears on several
   category pages, and name matching would merge genuinely different SKUs. */
const byKey = new Map();
for (const r of rows) {
  if (!r?.name) continue;

  const { brand, name } = splitBrand(String(r.name).replace(/\s+/g, ' '));
  if (!name || name.length < 3) continue;
  if (/^(shop|view|home|cart|search|sign in|menu|youth)$/i.test(name)) continue;

  const bsnId = /\/product\/view\/(\d+)/.exec(r.url || '')?.[1];
  const key = bsnId ?? slug(name);
  const priceCents = r.priceCents ?? money(r.priceText ?? r.price);

  const existing = byKey.get(key);
  if (existing) {
    if (!existing.image && r.image) existing.image = r.image;
    if (existing.priceCents == null && priceCents != null) existing.priceCents = priceCents;
    // a product listed under several pages earns all of those facets
    for (const c of categorize(name, existing.type, priceCents, r.category)) {
      if (!existing.categories.includes(c)) existing.categories.push(c);
    }
    continue;
  }

  const type = inferType(name);
  byKey.set(key, {
    id: bsnId ? `bsn-${bsnId}` : slug(name),
    name,
    brand: brand ?? (r.brand ? String(r.brand).trim() : null),
    priceCents,
    type,
    colorNames: inferColors({ ...r, name }),
    categories: categorize(name, type, priceCents, r.category),
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
