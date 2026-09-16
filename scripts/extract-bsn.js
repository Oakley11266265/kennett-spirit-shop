/* ============================================================================
   KENNETT SPIRIT SHOP — BSN CATALOG EXTRACTOR
   ----------------------------------------------------------------------------
   HOW TO RUN (takes about a minute, nothing is installed):

   1. Open the store in Chrome:
      https://sideline.bsnsports.com/schools/pennsylvania/kennettsquare/kennett-high-school
   2. Press F12 (or Cmd+Option+J on a Mac) to open the console.
   3. Chrome may ask you to type  allow pasting  before it lets you paste.
   4. Paste this entire file, press Enter, and wait.
   5. A file called kennett-catalog.json downloads automatically.

   It only reads pages you can already see, in your own logged-out browser.
   It changes nothing on BSN's site and buys nothing.
   ========================================================================== */

(async () => {
  const OUT = { store: location.href, scrapedAt: new Date().toISOString(), strategies: [], products: [] };
  const seen = new Map();
  const log = (...a) => console.log('%c[kennett]', 'color:#1b4ac6;font-weight:bold', ...a);

  const abs = (u) => {
    try {
      return new URL(u, location.origin).href;
    } catch {
      return null;
    }
  };
  const money = (v) => {
    if (v == null) return null;
    const m = String(v).replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
    return m ? Math.round(parseFloat(m[1]) * 100) : null;
  };

  const push = (p, source) => {
    if (!p || !p.name) return;
    const key = (p.url || '') + '|' + p.name.trim().toLowerCase();
    if (seen.has(key)) {
      // merge in anything the earlier pass missed
      const prev = seen.get(key);
      for (const k of Object.keys(p)) if (!prev[k] && p[k]) prev[k] = p[k];
      return;
    }
    const rec = {
      name: String(p.name).trim().replace(/\s+/g, ' '),
      priceCents: p.priceCents ?? null,
      priceText: p.priceText ?? null,
      brand: p.brand ?? null,
      image: p.image ? abs(p.image) : null,
      url: p.url ? abs(p.url) : null,
      category: p.category ?? null,
      colors: p.colors ?? null,
      sku: p.sku ?? null,
      source,
    };
    seen.set(key, rec);
    OUT.products.push(rec);
  };

  /* ---------- strategy 1: structured data embedded in the page ---------- */
  function fromJsonLd(doc, category) {
    let found = 0;
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      let data;
      try {
        data = JSON.parse(s.textContent);
      } catch {
        return;
      }
      const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(walk);
        const t = node['@type'];
        if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) {
          const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          push(
            {
              name: node.name,
              priceCents: money(offer?.price ?? offer?.lowPrice),
              priceText: offer?.price ? String(offer.price) : null,
              brand: typeof node.brand === 'object' ? node.brand?.name : node.brand,
              image: Array.isArray(node.image) ? node.image[0] : node.image,
              url: node.url || node.offers?.url,
              sku: node.sku || node.mpn,
              category,
            },
            'json-ld',
          );
          found += 1;
        }
        Object.values(node).forEach(walk);
      };
      walk(data);
    });
    return found;
  }

  /* ---------- strategy 2: framework state blobs ---------- */
  function fromStateBlobs(doc, category) {
    let found = 0;
    const blobs = [];
    const nextData = doc.getElementById('__NEXT_DATA__');
    if (nextData) blobs.push(nextData.textContent);
    doc.querySelectorAll('script:not([src])').forEach((s) => {
      const t = s.textContent || '';
      if (/__INITIAL_STATE__|__NUXT__|__APOLLO_STATE__|window\.__PRELOADED/.test(t)) {
        const m = t.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
        if (m) blobs.push(m[1]);
      }
    });

    for (const raw of blobs) {
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        continue;
      }
      const walk = (node, depth) => {
        if (!node || typeof node !== 'object' || depth > 12) return;
        if (Array.isArray(node)) return node.forEach((n) => walk(n, depth + 1));
        const keys = Object.keys(node);
        const nameKey = keys.find((k) => /^(name|title|productName|displayName)$/i.test(k));
        const priceKey = keys.find((k) => /price/i.test(k) && typeof node[k] !== 'object');
        const imgKey = keys.find((k) => /(image|imageUrl|thumbnail|imageSrc|media)/i.test(k));
        if (nameKey && priceKey && typeof node[nameKey] === 'string') {
          push(
            {
              name: node[nameKey],
              priceCents: money(node[priceKey]),
              priceText: String(node[priceKey]),
              brand: node.brand || node.brandName || node.vendor || null,
              image: typeof node[imgKey] === 'string' ? node[imgKey] : null,
              url: node.url || node.productUrl || node.slug || null,
              sku: node.sku || node.id || null,
              colors: Array.isArray(node.colors) ? node.colors : null,
              category,
            },
            'state-blob',
          );
          found += 1;
        }
        keys.forEach((k) => walk(node[k], depth + 1));
      };
      walk(data, 0);
    }
    return found;
  }

  /* ---------- strategy 3: DOM cards, found by price pattern ---------- */
  function fromDom(doc, category) {
    const priceRe = /\$\s?\d{1,4}(?:\.\d{2})?/;
    const nodes = Array.from(doc.querySelectorAll('a[href], article, li, div'));
    // A product card is the smallest element that holds a price, an image and a link.
    const cards = nodes.filter((el) => {
      if (el.querySelector('a[href]') === null && el.tagName !== 'A') return false;
      if (!el.querySelector('img')) return false;
      const txt = el.textContent || '';
      if (!priceRe.test(txt)) return false;
      if (txt.length > 400) return false;
      // reject if a child also qualifies (keep the innermost card)
      return !Array.from(el.children).some(
        (c) => c.querySelector('img') && priceRe.test(c.textContent || ''),
      );
    });

    let found = 0;
    cards.forEach((el) => {
      const img = el.querySelector('img');
      const link = el.tagName === 'A' ? el : el.querySelector('a[href]');
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const priceMatch = text.match(priceRe);
      // the product name is usually the alt text, the link title, or the text before the price
      let name =
        img?.getAttribute('alt')?.trim() ||
        link?.getAttribute('title')?.trim() ||
        (priceMatch ? text.slice(0, text.indexOf(priceMatch[0])).trim() : text);
      name = name.replace(/^(new|sale|best seller)\s+/i, '').slice(0, 120);
      if (!name || name.length < 3) return;

      push(
        {
          name,
          priceCents: money(priceMatch?.[0]),
          priceText: priceMatch?.[0] || null,
          image:
            img?.getAttribute('src') ||
            img?.getAttribute('data-src') ||
            img?.getAttribute('srcset')?.split(' ')[0] ||
            null,
          url: link?.getAttribute('href') || null,
          category,
        },
        'dom',
      );
      found += 1;
    });
    return found;
  }

  function harvest(doc, category) {
    const a = fromJsonLd(doc, category);
    const b = fromStateBlobs(doc, category);
    const c = fromDom(doc, category);
    OUT.strategies.push({ category, jsonLd: a, stateBlob: b, dom: c });
    log(`  ${category}: json-ld ${a}, state ${b}, dom ${c} — running total ${OUT.products.length}`);
  }

  /* ---------- discover the category pages ---------- */
  log('reading the page you are on…');
  harvest(document, 'current-page');

  const storeRoot = location.href.split('/shop')[0].replace(/\/$/, '');
  const catLinks = new Set();
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (/\/shop\//i.test(href) && !/\?|cart|checkout|account/i.test(href)) {
      catLinks.add(abs(href));
    }
  });
  // common Sideline sections, in case the nav is rendered behind a menu
  ['mens', 'womens', 'kids', 'hats', 'accessories', 'new', 'sale', 'all'].forEach((c) =>
    catLinks.add(`${storeRoot}/shop/${c}`),
  );

  log(`following ${catLinks.size} category pages…`);
  const parser = new DOMParser();
  for (const url of catLinks) {
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) {
        log(`  skip ${url} (${res.status})`);
        continue;
      }
      const html = await res.text();
      const doc = parser.parseFromString(html, 'text/html');
      harvest(doc, url.split('/shop/')[1] || 'root');
      await new Promise((r) => setTimeout(r, 400)); // be polite to their server
    } catch (e) {
      log(`  failed ${url}: ${e.message}`);
    }
  }

  /* ---------- deliver ---------- */
  OUT.count = OUT.products.length;
  const withPrice = OUT.products.filter((p) => p.priceCents).length;
  const withImage = OUT.products.filter((p) => p.image).length;
  log(`DONE — ${OUT.count} products (${withPrice} with prices, ${withImage} with images)`);
  console.table(OUT.products.slice(0, 15));

  const blob = new Blob([JSON.stringify(OUT, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kennett-catalog.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  log('kennett-catalog.json saved to your Downloads folder. Send that file back to Claude.');

  window.KENNETT_CATALOG = OUT;
})();
