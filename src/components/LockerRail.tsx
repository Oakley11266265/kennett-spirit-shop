import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Garment } from '@/components/Garment';
import { ShipBadge } from '@/components/ProductCard';
import { lockerCategories, products, type Product } from '@/data/catalog';
import { cn, formatPrice } from '@/lib/utils';

/**
 * THE LOCKER
 * -----------------------------------------------------------------------
 * Two locker doors swing open on scroll to reveal a hanging rail.
 * The rail is a NATIVE horizontal scroll container with snap points — not a
 * custom drag implementation. Native scroll gives real momentum physics,
 * keyboard access, screen-reader order and trackpad support for free, and it
 * cannot drop frames the way a JS-driven transform rail does on a Chromebook.
 */
export function LockerRail() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const [category, setCategory] = useState<string>('all');
  const [centeredId, setCenteredId] = useState<string | null>(null);

  const visible: Product[] =
    category === 'all' ? products : products.filter((p) => p.categories.includes(category));

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 25%'],
  });
  // Hooks must stay unconditional — computed here, consumed in JSX below.
  const leftDoorX = useTransform(scrollYProgress, [0, 1], ['0%', '-112%']);
  const rightDoorX = useTransform(scrollYProgress, [0, 1], ['0%', '112%']);
  const doorFade = useTransform(scrollYProgress, [0.55, 1], [1, 0]);
  const railRise = useTransform(scrollYProgress, [0.25, 1], [40, 0]);

  /* Track which garment sits at the centre of the rail. */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      let bestId = '';
      let bestDistance = Number.POSITIVE_INFINITY;
      const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-pid]'));
      for (const el of cards) {
        const centre = el.offsetLeft + el.offsetWidth / 2;
        const distance = Math.abs(centre - mid);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = el.dataset.pid ?? '';
        }
      }
      if (bestId) setCenteredId(bestId);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    rail.addEventListener('scroll', onScroll, { passive: true });
    measure();
    return () => {
      rail.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [visible.length]);

  return (
    <section
      ref={sectionRef}
      id="locker"
      className="grain relative overflow-hidden bg-ink-950 py-20 sm:py-28"
    >
      {/* corridor light */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(90% 60% at 50% 0%, rgba(27,74,198,0.28), transparent 60%), radial-gradient(70% 50% at 50% 100%, rgba(0,24,84,0.6), transparent 70%)',
        }}
      />

      <header className="relative z-10 mx-auto mb-10 max-w-6xl px-5">
        <p className="type-eyebrow text-demon-300">Open the locker</p>
        <h2 className="type-section mt-3 text-[clamp(2.5rem,9vw,5.5rem)] text-chalk-50">
          Find your fit.
        </h2>
        <p className="mt-3 max-w-md text-[0.9375rem] text-steel-400">
          Everything on the rail is official Kennett gear. Swipe the rack.
        </p>
      </header>

      {/* Category chips */}
      <div className="relative z-10 mb-8">
        <div className="rail-scroll flex gap-2 px-5 pb-1">
          {lockerCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              aria-pressed={category === c.id}
              className={cn(
                'type-label min-h-11 shrink-0 cursor-pointer rounded-full border px-4 text-[0.6875rem] transition-colors',
                category === c.id
                  ? 'border-chalk-50 bg-chalk-50 text-ink-950'
                  : 'border-chalk-100/20 text-chalk-200 hover:border-chalk-100/50',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* ---- Locker doors ---- */}
        {!reduce && (
          <motion.div
            style={{ opacity: doorFade }}
            className="pointer-events-none absolute inset-0 z-30 flex"
            aria-hidden="true"
          >
            <motion.div
              style={{ x: leftDoorX }}
              className="relative h-full w-1/2 border-r border-ink-950 bg-gradient-to-r from-demon-950 via-demon-850 to-demon-800"
            >
              <LockerFace side="left" />
            </motion.div>
            <motion.div
              style={{ x: rightDoorX }}
              className="relative h-full w-1/2 border-l border-ink-950 bg-gradient-to-l from-demon-950 via-demon-850 to-demon-800"
            >
              <LockerFace side="right" />
            </motion.div>
          </motion.div>
        )}

        {/* ---- The rail ---- */}
        <motion.div style={{ y: reduce ? 0 : railRise }} className="relative">
          {/* hanging bar */}
          <div className="pointer-events-none absolute top-6 right-0 left-0 z-0 h-1.5 bg-gradient-to-b from-steel-400 to-steel-600 shadow-rail" />

          <div ref={railRef} className="rail-scroll rail-mask flex gap-4 px-[50vw] pt-2 pb-6 sm:gap-6">
            {visible.map((p) => {
              const active = centeredId === p.id;
              return (
                <div
                  key={p.id}
                  data-pid={p.id}
                  className="snap-item relative w-[62vw] max-w-[280px] shrink-0 sm:w-[38vw] md:w-[300px]"
                >
                  {/* hanger */}
                  <div className="relative z-10 mx-auto h-10 w-10">
                    <svg viewBox="0 0 40 40" className="h-full w-full text-steel-400" aria-hidden="true">
                      <path
                        d="M20 6a4 4 0 0 0-4 4c0 2 1.5 3.2 3 3.8V17L6 27c-1.5 1-1 3 1 3h26c2 0 2.5-2 1-3L21 17v-3.2c1.5-.6 3-1.8 3-3.8a4 4 0 0 0-4-4z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  <div
                    className={cn(
                      'relative -mt-4 transition-all duration-500 ease-out',
                      active ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.9] opacity-55',
                    )}
                  >
                    <div className="aspect-4/5">
                      <Garment type={p.type} colorway={p.colorways[0]} />
                    </div>

                    {/* Details appear for the centred garment only — the rail stays calm */}
                    <div
                      className={cn(
                        'mt-1 text-center transition-all duration-400',
                        active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
                      )}
                    >
                      <h3 className="font-condensed text-base font-600 tracking-wide text-chalk-50 uppercase">
                        {p.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-chalk-200">
                        {formatPrice(p.priceCents)} <span className="text-steel-500">· {p.brand}</span>
                      </p>
                      <div className="mt-2 flex items-center justify-center gap-1.5">
                        {p.colorways.map((c) => (
                          <span
                            key={c.name}
                            className="size-3.5 rounded-full ring-1 ring-chalk-100/30"
                            style={{ background: c.body }}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex justify-center">
                        <ShipBadge product={p} />
                      </div>
                      <button
                        type="button"
                        className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-chalk-50 px-5 text-xs font-bold tracking-[0.15em] text-ink-950 uppercase transition-transform active:scale-95"
                      >
                        View product <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Locker door face: vents, latch, number plate. */
function LockerFace({ side }: { side: 'left' | 'right' }) {
  return (
    <div className="relative h-full w-full">
      <div className={cn('absolute inset-y-0 w-px bg-chalk-100/10', side === 'left' ? 'right-2' : 'left-2')} />
      <div className="absolute top-10 left-1/2 flex -translate-x-1/2 flex-col gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-1 w-16 rounded-full bg-ink-950/50" />
        ))}
      </div>
      <div
        className={cn(
          'absolute top-1/2 h-14 w-2.5 -translate-y-1/2 rounded-full bg-steel-400/70',
          side === 'left' ? 'right-4' : 'left-4',
        )}
      />
      <p className="type-label absolute bottom-10 left-1/2 -translate-x-1/2 text-xs text-chalk-100/40">
        {side === 'left' ? 'KHS' : '1921'}
      </p>
    </div>
  );
}
