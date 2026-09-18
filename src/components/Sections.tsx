import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

import { Garment, type MarkStyle } from '@/components/Garment';
import { ProductCard } from '@/components/ProductCard';
import { brands, fits, marks, moments, products, resolveFit, type Product } from '@/data/catalog';
import { cn, formatPrice } from '@/lib/utils';

/* Shared reveal — one motion idea reused everywhere, so the page feels authored. */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  className?: string;
}) {
  return (
    <motion.header {...reveal} className={cn('shell mb-8 flex items-end justify-between gap-6', className)}>
      <div>
        <p className="type-eyebrow text-demon-300">{eyebrow}</p>
        <h2 className="type-section mt-2.5 text-[clamp(2rem,7.5vw,4rem)] text-chalk-50">{title}</h2>
      </div>
      {action && (
        <button
          type="button"
          className="type-label hidden min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-chalk-100/25 px-4 text-[0.6875rem] text-chalk-100 transition-colors hover:border-chalk-50 hover:bg-chalk-50 hover:text-ink-950 sm:inline-flex"
        >
          {action} <ArrowRight className="size-3.5" />
        </button>
      )}
    </motion.header>
  );
}

/* ========================= GAME DAY FITS ========================= */
export function GameDayFits({ onAdd }: { onAdd: (p: Product) => void }) {
  return (
    <section id="fits" className="relative bg-ink-900 py-20 sm:py-24">
      <SectionHeading eyebrow="Curated looks" title="Game day fits." action="View all" />
      <p className="shell mb-8 max-w-lg text-[0.9375rem] text-steel-400">
        Every moment has a different uniform. Tap a look, take the whole thing.
      </p>

      <div className="rail-scroll rail-pad flex gap-4 pb-4">
        {fits.map((fit) => {
          const items = resolveFit(fit);
          const total = items.reduce((sum, i) => sum + (i.priceCents ?? 0), 0);
          if (!items.length) return null;
          return (
            <motion.article
              {...reveal}
              key={fit.id}
              className="snap-item w-[80vw] max-w-[360px] shrink-0 overflow-hidden rounded-card bg-ink-800 ring-1 ring-chalk-100/8"
            >
              <div
                className="relative flex h-56 items-end gap-1 overflow-hidden p-4"
                style={{
                  background: `linear-gradient(160deg, ${fit.accent}, #05091a 85%)`,
                }}
              >
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="h-full flex-1"
                    style={{ transform: `translateY(${i % 2 === 0 ? 0 : 10}px)` }}
                  >
                    <Garment type={item.type} colorway={item.colorways[0]} />
                  </div>
                ))}
              </div>

              <div className="p-4">
                <h3 className="font-condensed text-xl font-700 tracking-wide text-chalk-50 uppercase">
                  {fit.name}
                </h3>
                <p className="mt-1 text-sm text-steel-400">{fit.tagline}</p>

                <ul className="mt-3 space-y-1">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between text-[0.8125rem] text-chalk-200">
                      <span className="truncate pr-3">{item.name}</span>
                      <span className="shrink-0 text-steel-400">
                        {item.priceCents != null ? formatPrice(item.priceCents) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => items.forEach(onAdd)}
                  className="mt-4 flex min-h-12 w-full cursor-pointer items-center justify-between rounded-full bg-chalk-50 px-5 text-ink-950 transition-transform active:scale-[0.98]"
                >
                  <span className="text-xs font-bold tracking-[0.15em] uppercase">Shop the fit</span>
                  <span className="text-sm font-600">{formatPrice(total)}</span>
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

/* ========================= SHOP BY MOMENT ========================= */
export function ShopByMoment() {
  return (
    <section id="moments" className="bg-ink-950 py-20 sm:py-24">
      <SectionHeading eyebrow="Shop by moment" title="What are you dressing for?" />
      <div className="shell grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
        {moments.map((m, i) => (
          <motion.button
            {...reveal}
            transition={{ ...reveal.transition, delay: i * 0.04 }}
            key={m.id}
            type="button"
            className="group relative flex min-h-24 cursor-pointer flex-col justify-end overflow-hidden rounded-card bg-ink-800 p-4 text-left ring-1 ring-chalk-100/8 transition-colors hover:bg-demon-800"
          >
            <span
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: 'linear-gradient(150deg, #1b4ac6, transparent 70%)' }}
            />
            <ArrowUpRight className="absolute top-3 right-3 size-4 text-steel-500 transition-all duration-300 group-hover:text-chalk-50" />
            <span className="relative font-condensed text-lg leading-none font-600 tracking-wide text-chalk-50 uppercase">
              {m.label}
            </span>
            <span className="relative mt-1 text-xs text-steel-400 group-hover:text-chalk-200">{m.note}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

/* ========================= NEW DROP RAIL ========================= */
export function DropRail({
  onAdd,
  onOpen,
}: {
  onAdd: (p: Product) => void;
  onOpen: (p: Product) => void;
}) {
  return (
    <section id="shop" className="scroll-mt-16 bg-ink-950 py-20 sm:py-24">
      <SectionHeading eyebrow="Just landed" title="The drop." action="Shop all" />
      <div className="rail-scroll rail-pad flex gap-4 pb-4 sm:gap-6">
        {products.slice(0, 8).map((p) => (
          <div key={p.id} className="snap-item w-[62vw] max-w-[260px] shrink-0 sm:w-[40vw] md:w-[260px]">
            <ProductCard product={p} onAdd={onAdd} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ========================= CHOOSE YOUR K ========================= */
export function ChooseYourK() {
  const [index, setIndex] = useState(0);
  const mark = marks[index];

  const step = (dir: number) => setIndex((i) => (i + dir + marks.length) % marks.length);

  return (
    <section id="choose" className="relative overflow-hidden bg-ink-900 py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 40%, rgba(27,74,198,0.22), transparent 70%)' }}
      />
      <SectionHeading eyebrow="Same school, different style" title="Choose your K." className="relative" />

      <div className="shell relative max-w-lg">
        <div className="relative mx-auto aspect-4/5 w-full max-w-sm">
          <Garment type="hoodie" colorway={{ name: 'White', body: '#f2f5fa', mark: '#001854' }} mark={mark.id as MarkStyle} />
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous design"
            className="grid size-11 cursor-pointer place-items-center rounded-full border border-chalk-100/25 text-chalk-100 transition-colors hover:bg-chalk-100/10"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="font-condensed min-w-40 text-center text-lg font-600 tracking-widest text-chalk-50 uppercase">
            {mark.label}
          </p>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next design"
            className="grid size-11 cursor-pointer place-items-center rounded-full border border-chalk-100/25 text-chalk-100 transition-colors hover:bg-chalk-100/10"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Kennett designs">
          {marks.map((m, i) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={m.label}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2.5 cursor-pointer rounded-full transition-all',
                i === index ? 'w-8 bg-demon-500' : 'w-2.5 bg-chalk-100/25 hover:bg-chalk-100/50',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================= BRANDS ========================= */
export function BrandRail() {
  if (!brands.length) return null;
  return (
    <section id="brands" className="border-y border-chalk-100/8 bg-ink-950 py-14">
      <p className="type-eyebrow shell mb-6 text-steel-500">Premium brands. Same pride.</p>
      <div className="rail-scroll rail-pad flex items-center gap-10 sm:gap-16">
        {brands.map((b) => (
          <button
            key={b}
            type="button"
            className="type-label shrink-0 cursor-pointer text-xl whitespace-nowrap text-steel-500 transition-colors duration-300 hover:text-chalk-50 sm:text-2xl"
          >
            {b}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ========================= SEEN AT KENNETT ========================= */
export function SeenAtKennett() {
  /* Real frames from the Kennett entrance film rather than empty placeholders.
     No stock photography and no generated students: until the school supplies
     its own images, the honest filler is the school itself. */
  const BASE = import.meta.env.BASE_URL;
  const tiles = [
    { label: 'The steps', frame: 'f006', span: 'col-span-2 row-span-2' },
    { label: 'Under the columns', frame: 'f034', span: '' },
    { label: 'The doors', frame: 'f060', span: '' },
    { label: 'Blue Demons', frame: 'f082', span: '' },
    { label: 'Inside', frame: 'f088', span: '' },
  ];

  return (
    <section id="seen" className="bg-ink-900 py-20 sm:py-24">
      <SectionHeading eyebrow="Real students. Real moments." title="Seen at Kennett." />
      <div className="shell grid auto-rows-[110px] grid-cols-3 gap-2 sm:auto-rows-[180px] sm:gap-3">
        {tiles.map((t, i) => (
          <motion.figure
            {...reveal}
            transition={{ ...reveal.transition, delay: i * 0.05 }}
            key={t.label}
            className={cn(
              'group relative overflow-hidden rounded-card bg-ink-950 ring-1 ring-chalk-100/8',
              t.span,
            )}
          >
            <img
              src={`${BASE}hero/frames/w860/${t.frame}.webp`}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent" />
            <figcaption className="type-label absolute bottom-2 left-3 text-[0.625rem] text-chalk-100">
              {t.label}
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <div className="shell mt-6">
        <button
          type="button"
          className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-chalk-100/25 px-6 text-xs font-bold tracking-[0.15em] text-chalk-100 uppercase transition-colors hover:border-chalk-50 hover:bg-chalk-50 hover:text-ink-950"
        >
          Tag us #WearKennett <ArrowUpRight className="size-4" />
        </button>
      </div>
    </section>
  );
}
