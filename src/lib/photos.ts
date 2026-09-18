import { useEffect, useState } from 'react';

/**
 * EMBEDDED PRODUCT PHOTOS
 * -----------------------------------------------------------------------
 * BSN serves product photography from cache.bsnsports.com. That works on a
 * normally deployed site, but not inside a sandboxed preview, whose content
 * policy blocks every external image — and it leaves the storefront dependent
 * on their CDN keeping the same URLs.
 *
 * So photos can also be bundled: scripts/extract-bsn-images.js captures each
 * product's render, shrinks it, and writes a map of BSN product id → data URL.
 * Dropped in at public/products/images.json it is served from our own origin,
 * which no policy blocks and no CDN change breaks.
 *
 * Absent, everything falls back to the live BSN URL, then to the drawn flat.
 */

let cache: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;
const listeners = new Set<(m: Record<string, string>) => void>();

function load(): Promise<Record<string, string>> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;

  inflight = fetch(`${import.meta.env.BASE_URL}products/images.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const map: Record<string, string> = data?.images ?? data ?? {};
      cache = map;
      listeners.forEach((fn) => fn(map));
      return map;
    })
    .catch(() => {
      // No bundle present: not an error, just means we use the live URLs.
      cache = {};
      return cache;
    });

  return inflight;
}

/** Strips the importer's `bsn-` prefix back to BSN's own product id. */
const bsnId = (productId: string) => productId.replace(/^bsn-/, '');

export function usePhotos() {
  const [map, setMap] = useState<Record<string, string>>(cache ?? {});

  useEffect(() => {
    let live = true;
    listeners.add(setMap);
    load().then((m) => {
      if (live) setMap(m);
    });
    return () => {
      live = false;
      listeners.delete(setMap);
    };
  }, []);

  return (productId: string, fallback?: string | null) => map[bsnId(productId)] ?? fallback ?? null;
}
