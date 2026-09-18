import { useState } from 'react';
import { Check, Heart, Plus } from 'lucide-react';

import { Garment } from '@/components/Garment';
import { usePhotos } from '@/lib/photos';
import type { Colorway, Product } from '@/data/catalog';
import { cn, formatPrice } from '@/lib/utils';

/** Fulfillment truth, surfaced on the card instead of buried at checkout. */
export function ShipBadge({ product, className }: { product: Product; className?: string }) {
  // Never assert a shipping promise BSN did not make.
  if (product.fulfillment === 'unknown') return null;
  const stock = product.fulfillment === 'stock';
  return (
    <span
      className={cn(
        'type-label inline-flex items-center gap-1.5 text-[0.625rem] whitespace-nowrap',
        stock ? 'text-demon-300' : 'text-steel-400',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', stock ? 'bg-demon-400' : 'bg-steel-500')} />
      {stock ? 'Ships 2–5 days' : 'Made to order · 5–12 days'}
    </span>
  );
}

/**
 * Real BSN photography when we have it, the drawn flat when we don't — and
 * automatically the flat if the image 404s or the CDN refuses the hotlink,
 * so the rail never shows a broken-image box.
 */
export function ProductImage({
  product,
  colorway,
  fit = 'contain',
}: {
  product: Product;
  colorway: Colorway;
  fit?: 'cover' | 'contain';
}) {
  const photo = usePhotos();
  const src = photo(product.id, product.image);

  /*
   * The drawn flat is a LAYER, not a fallback branch. A blocked image does not
   * reliably fire an error event — a content policy can refuse it silently —
   * so branching on onError leaves an empty tile. Painting the flat underneath
   * and letting a real photo cover it means the shelf is never blank, whatever
   * happens to the network or the policy.
   */
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 p-[7%]">
        <Garment type={product.type} colorway={colorway} />
      </div>
      {src && (
        <img
          src={src}
          /* Decorative: the product name is rendered as text beside it. An alt
             string here would paint itself over the flat with a broken-image
             icon the moment the photo is refused. */
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          className={cn(
            'absolute inset-0 h-full w-full',
            fit === 'cover' ? 'object-cover' : 'object-contain',
          )}
        />
      )}
    </div>
  );
}

export function ProductCard({
  product,
  onAdd,
  onOpen,
  className,
}: {
  product: Product;
  onAdd?: (p: Product) => void;
  onOpen?: (p: Product) => void;
  className?: string;
}) {
  const [colorIndex, setColorIndex] = useState(0);
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const colorway = product.colorways[colorIndex];

  const add = () => {
    setAdded(true);
    onAdd?.(product);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className={cn('group flex w-full flex-col', className)}>
      <div className="relative overflow-hidden rounded-card bg-ink-900 ring-1 ring-chalk-100/8">
        {product.badge && (
          <span className="type-label absolute top-3 left-3 z-10 rounded-full bg-chalk-50 px-2.5 py-1 text-[0.5625rem] text-ink-950">
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wished}
          className="absolute top-2 right-2 z-10 grid size-11 cursor-pointer place-items-center rounded-full text-chalk-200 transition-colors hover:bg-chalk-100/10"
        >
          <Heart className={cn('size-4 transition-all', wished && 'scale-110 fill-demon-500 text-demon-500')} />
        </button>

        <button
          type="button"
          onClick={() => onOpen?.(product)}
          aria-label={`View ${product.name}`}
          className="block w-full cursor-pointer"
        >
          <div className="aspect-4/5 transition-transform duration-500 ease-out group-hover:scale-[1.04]">
            <ProductImage product={product} colorway={colorway} fit="contain" />
          </div>
        </button>

        {/* Quick add — 44px target, visible on touch (never hover-only) */}
        <button
          type="button"
          onClick={add}
          aria-label={`Add ${product.name} to bag`}
          className={cn(
            'absolute right-2 bottom-2 grid size-11 cursor-pointer place-items-center rounded-full transition-all duration-300 active:scale-90',
            added ? 'bg-demon-500 text-white' : 'bg-chalk-50 text-ink-950',
          )}
        >
          {added ? <Check className="size-4" /> : <Plus className="size-4" />}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-condensed line-clamp-2 min-w-0 text-[0.9375rem] leading-tight font-600 tracking-wide text-chalk-100 uppercase">
            <button
              type="button"
              onClick={() => onOpen?.(product)}
              className="-my-1 cursor-pointer py-1 text-left uppercase hover:text-chalk-50"
            >
              {product.name}
            </button>
          </h3>
          {product.priceCents != null && (
            <p className="shrink-0 text-sm font-600 text-chalk-50">{formatPrice(product.priceCents)}</p>
          )}
        </div>
        {product.brand && <p className="type-eyebrow text-steel-400">{product.brand}</p>}

        {product.colorsKnown && (
        <div className="mt-1 flex items-center gap-2" role="group" aria-label="Choose a color">
          {product.colorways.map((c, i) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setColorIndex(i)}
              aria-label={c.name}
              aria-pressed={i === colorIndex}
              className={cn(
                'size-7 cursor-pointer rounded-full border transition-transform',
                i === colorIndex
                  ? 'scale-110 border-chalk-50'
                  : 'border-chalk-100/25 hover:border-chalk-100/60',
              )}
              style={{ background: c.body }}
            />
          ))}
        </div>
        )}

        <ShipBadge product={product} className="mt-1" />
      </div>
    </article>
  );
}
