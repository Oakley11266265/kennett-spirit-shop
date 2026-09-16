# Getting the real BSN catalog in

The Kennett Sideline store is blocked from Claude's build environment by the
network egress policy, so the catalog has to come across from a machine that
can actually load the store. There are three ways in, easiest first.

---

## Option 1 — Browser extractor (best: gets prices *and* image URLs)

Takes about a minute. Nothing gets installed, nothing on BSN's site changes.

1. Open the store in Chrome:
   <https://sideline.bsnsports.com/schools/pennsylvania/kennettsquare/kennett-high-school>
2. Press **F12** (Windows) or **Cmd + Option + J** (Mac) to open the console.
3. Open `scripts/extract-bsn.js`, select all, copy.
4. Click into the console. If Chrome warns you, type `allow pasting` and press Enter.
5. Paste the script, press **Enter**, and wait while it walks the category pages.
6. `kennett-catalog.json` lands in your Downloads folder.
7. Send that file back to Claude (upload it, or drop it in Google Drive).

Then, in the project:

```bash
node scripts/import-bsn.mjs kennett-catalog.json
npm run build
```

### If the console prints 0 products

The extractor tries three strategies and prints what each one found. Send the
console output back — the numbers say which strategy needs adjusting, and it
is a small fix.

---

## Option 2 — Save the pages

If the console feels like too much:

1. On each store page (All, Mens, Womens, Kids, Hats), press **Ctrl/Cmd + S**
   and save as **Webpage, Complete**.
2. Put the `.html` files in one folder and send it over.

```bash
node scripts/import-bsn.mjs ./saved-pages/
```

This works when the page ships structured product data. If BSN renders the
catalog purely in JavaScript, a saved file may contain no products — in that
case Option 1 is the reliable route.

---

## Option 3 — A spreadsheet

Any spreadsheet with these columns, exported as CSV:

```csv
name,price,brand,image,url,category,colors
"Nike Club Fleece Hoodie",65.00,Nike,https://…/hoodie.jpg,https://…/p/123,mens,Navy;Royal
```

```bash
node scripts/import-bsn.mjs products.csv
```

---

## What the importer does

- Writes `src/data/products.generated.ts`; nothing else in the app changes.
- Infers the garment silhouette from the product name (hoodie, tee, crew,
  jacket, cap, long sleeve, short) so the flats and rails work immediately.
- Infers categories — kids, women, alumni, athletic, game-day, under-$35,
  premium — which is what drives the moment grid and the locker filters.
- Rebuilds Game Day Fits automatically: fits are defined as *rules*
  ("a hoodie, a cap and a short"), not fixed SKUs, so they populate with
  whatever real products arrive.
- De-duplicates products that appear on several category pages, merging in
  whichever copy has the image or the price.

**It never invents data.** A missing price stays `null` and the card simply
shows no price. Ship time stays `unknown` and the shipping badge hides itself
rather than promising a delivery window BSN never stated. The report printed
at the end lists exactly what came back thin.

### Product photography

Imported images are used straight from BSN's CDN. If one fails to load, the
card silently falls back to the drawn flat instead of showing a broken image.

For production, mirror the photos so the site owns its assets:

```bash
node scripts/import-bsn.mjs kennett-catalog.json --mirror
```

That downloads each photo into `public/products/` and rewrites the paths. It
has to run somewhere that can reach `cdn.bsnsports.com`.

---

## The other way to unblock this

If `sideline.bsnsports.com` is added to the allowed hosts for these Claude
sessions, the import runs end to end with no manual step — scrape, import,
mirror images, rebuild. Worth doing if the catalog is going to be re-synced
every season.
