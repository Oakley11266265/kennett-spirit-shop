import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, Info, X } from 'lucide-react';

import { ProductImage, ShipBadge } from '@/components/ProductCard';
import type { Product } from '@/data/catalog';
import { cn, formatPrice } from '@/lib/utils';

const SIZES = ['YS', 'YM', 'YL', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const YOUTH = new Set(['YS', 'YM', 'YL']);

/**
 * PRODUCT SHEET + BSN HANDOFF
 * -----------------------------------------------------------------------
 * The custom storefront owns discovery: browsing, styling, wanting. BSN owns
 * the transaction: real inventory, real sizes, decoration, tax, fulfillment.
 * Rebuilding checkout here would mean duplicating their stock truth and
 * taking on payment liability for a school — so the sheet is explicit that
 * the last step happens on BSN, and hands off with the product deep-linked.
 */
export function ProductSheet({
  product,
  onClose,
  onAdd,
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (p: Product) => void;
}) {
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!product) return;
    setColorIndex(0);
    setSize(null);
    setAdded(false);
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      // keep focus inside the sheet while it is open
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [product, onClose]);

  const colorway = product?.colorways[colorIndex];
  const needsSize = product?.type !== 'cap';
  const canAdd = !needsSize || !!size;

  return (
    <AnimatePresence>
      {product && colorway && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            className="relative max-h-[92svh] w-full overflow-y-auto rounded-t-2xl bg-ink-900 pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-chalk-100/10 sm:max-w-lg sm:rounded-2xl"
          >
            {/* grab handle */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-ink-900/95 px-4 py-3 backdrop-blur">
              <div
                aria-hidden="true"
                className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-chalk-100/25 sm:hidden"
              />
              <p className="type-eyebrow mt-1 text-steel-400">{product.brand ?? 'Kennett'}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-11 cursor-pointer place-items-center rounded-full text-chalk-200 transition-colors hover:bg-chalk-100/10"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-4">
              <div className="mx-auto aspect-4/5 w-full max-w-64 overflow-hidden rounded-card bg-ink-900">
                <ProductImage product={product} colorway={colorway} fit="contain" />
              </div>

              <div className="mt-5 flex items-start justify-between gap-4">
                <h2 className="font-condensed text-2xl leading-tight font-700 tracking-wide text-chalk-50 uppercase">
                  {product.name}
                </h2>
                {product.priceCents != null && (
                  <p className="shrink-0 text-lg font-700 text-chalk-50">
                    {formatPrice(product.priceCents)}
                  </p>
                )}
              </div>

              <ShipBadge product={product} className="mt-2" />

              {/* colour */}
              {product.colorsKnown && (
              <div className="mt-6">
                <p className="type-label mb-2.5 text-[0.6875rem] text-steel-400">
                  Color · <span className="text-chalk-100">{colorway.name}</span>
                </p>
                <div className="flex flex-wrap gap-2.5" role="group" aria-label="Choose a color">
                  {product.colorways.map((c, i) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColorIndex(i)}
                      aria-label={c.name}
                      aria-pressed={i === colorIndex}
                      className={cn(
                        'size-11 cursor-pointer rounded-full border-2 transition-transform',
                        i === colorIndex
                          ? 'scale-105 border-chalk-50'
                          : 'border-chalk-100/20 hover:border-chalk-100/60',
                      )}
                      style={{ background: c.body }}
                    />
                  ))}
                </div>
              </div>
              )}

              {/* size */}
              {needsSize && (
                <div className="mt-6">
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <p className="type-label text-[0.6875rem] text-steel-400">Size</p>
                    <button
                      type="button"
                      className="text-xs text-demon-300 underline-offset-2 hover:underline"
                    >
                      Size guide
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2" role="group" aria-label="Choose a size">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        aria-pressed={size === s}
                        className={cn(
                          'min-h-11 cursor-pointer rounded-card border text-sm font-600 transition-colors',
                          size === s
                            ? 'border-chalk-50 bg-chalk-50 text-ink-950'
                            : 'border-chalk-100/20 text-chalk-200 hover:border-chalk-100/60',
                          YOUTH.has(s) && 'text-[0.8125rem]',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-steel-500">
                    Sizes shown are the standard run. Real sizes, colours and stock are confirmed on
                    the BSN product page.
                  </p>
                </div>
              )}

              {/* actions */}
              <div className="mt-7 space-y-2.5">
                <button
                  type="button"
                  disabled={!canAdd}
                  onClick={() => {
                    onAdd(product);
                    setAdded(true);
                    window.setTimeout(() => setAdded(false), 1600);
                  }}
                  className={cn(
                    'flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-bold tracking-[0.15em] uppercase transition-all active:scale-[0.98]',
                    canAdd
                      ? 'bg-chalk-50 text-ink-950'
                      : 'cursor-not-allowed bg-chalk-100/15 text-steel-500',
                  )}
                >
                  {added ? (
                    <>
                      <Check className="size-4" /> Added to bag
                    </>
                  ) : canAdd ? (
                    'Add to bag'
                  ) : (
                    'Select a size'
                  )}
                </button>

                <a
                  href={product.bsnUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-chalk-100/25 text-xs font-bold tracking-[0.15em] text-chalk-100 uppercase transition-colors hover:border-chalk-50',
                    !product.bsnUrl && 'pointer-events-none opacity-40',
                  )}
                >
                  Buy on BSN <ArrowUpRight className="size-4" />
                </a>
              </div>

              <p className="mt-4 flex gap-2 text-xs leading-relaxed text-steel-500">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Orders are fulfilled by BSN Sports, the school's official spirit wear partner.
                Payment and shipping happen on their checkout.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
