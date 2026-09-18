import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

import { ProductImage } from '@/components/ProductCard';
import { moments, products, type Product } from '@/data/catalog';
import { cn, formatPrice } from '@/lib/utils';

/**
 * Search is a first-class entry point on a spirit store: most visitors arrive
 * knowing the word for what they want ("hoodie", "hat for my son", "under 35")
 * rather than wanting to browse a hierarchy. Matching runs over name, brand,
 * garment type and category so all three phrasings land.
 */
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');

function score(product: Product, terms: string[]): number {
  const haystack = normalize(
    [product.name, product.brand ?? '', product.type, ...product.categories].join(' '),
  );
  let total = 0;
  for (const term of terms) {
    if (!haystack.includes(term)) return 0; // every term must match somewhere
    // a hit in the name is worth more than a hit in a category tag
    total += normalize(product.name).includes(term) ? 3 : 1;
  }
  return total;
}

const QUICK = ['Hoodie', 'Hat', 'Under $35', 'Game day', 'Kids', 'Nike'];

/** Long result lists stop being useful; refine the query instead. */
const SEARCH_MAX = 40;

export function SearchOverlay({
  open,
  onClose,
  onOpenProduct,
}: {
  open: boolean;
  onClose: () => void;
  onOpenProduct: (p: Product) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    // let the panel mount before stealing focus, or iOS skips the keyboard
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    // "under 35" and "$35" both mean the price filter
    const priceCap = /under\s*\$?(\d+)/.exec(query.toLowerCase())?.[1];
    return products
      .map((p) => {
        let s = score(p, terms.filter((t) => !/^\d+$/.test(t) && t !== 'under'));
        if (priceCap && p.priceCents != null && p.priceCents <= Number(priceCap) * 100) s += 2;
        return { p, s };
      })
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.p);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/90 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the shop"
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="relative mx-auto flex max-h-svh w-full max-w-2xl flex-col bg-ink-900 pt-[env(safe-area-inset-top)] shadow-lift sm:mt-16 sm:rounded-2xl"
          >
            <div className="flex items-center gap-3 border-b border-chalk-100/10 px-4 py-3">
              <Search className="size-5 shrink-0 text-steel-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hoodies, hats, Nike…"
                aria-label="Search products"
                enterKeyHint="search"
                className="min-h-11 w-full bg-transparent text-base text-chalk-50 outline-none placeholder:text-steel-500"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-chalk-200 hover:bg-chalk-100/10"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!query && (
                <>
                  <p className="type-label mb-3 text-[0.6875rem] text-steel-400">Popular</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuery(q)}
                        className="min-h-11 cursor-pointer rounded-full border border-chalk-100/20 px-4 text-sm text-chalk-200 transition-colors hover:border-chalk-50 hover:text-chalk-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <p className="type-label mt-7 mb-3 text-[0.6875rem] text-steel-400">Shop by moment</p>
                  <div className="grid grid-cols-2 gap-2">
                    {moments.slice(0, 6).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setQuery(m.label.replace('$', ''))}
                        className="min-h-12 cursor-pointer rounded-card bg-ink-800 px-3 text-left font-condensed text-sm font-600 tracking-wide text-chalk-100 uppercase transition-colors hover:bg-demon-800"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {query && results.length === 0 && (
                <div className="py-10 text-center">
                  <p className="font-condensed text-lg tracking-wide text-chalk-100 uppercase">
                    Nothing for “{query}”
                  </p>
                  <p className="mt-2 text-sm text-steel-400">
                    Try a garment — hoodie, tee, hat — or a brand name.
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <>
                  <p className="type-label mb-3 text-[0.6875rem] text-steel-400">
                    {results.length} {results.length === 1 ? 'item' : 'items'}
                    {results.length > SEARCH_MAX && ` · showing first ${SEARCH_MAX}`}
                  </p>
                  <ul className="space-y-1.5">
                    {results.slice(0, SEARCH_MAX).map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenProduct(p);
                            onClose();
                          }}
                          className={cn(
                            'flex w-full cursor-pointer items-center gap-3 rounded-card p-2 text-left transition-colors hover:bg-chalk-100/6',
                          )}
                        >
                          <span className="size-16 shrink-0 overflow-hidden rounded bg-ink-800">
                            <ProductImage product={p} colorway={p.colorways[0]} fit="contain" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-condensed text-sm font-600 tracking-wide text-chalk-50 uppercase">
                              {p.name}
                            </span>
                            <span className="block text-xs text-steel-400">
                              {p.brand ?? 'Kennett'}
                            </span>
                          </span>
                          {p.priceCents != null && (
                            <span className="shrink-0 text-sm font-600 text-chalk-100">
                              {formatPrice(p.priceCents)}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
