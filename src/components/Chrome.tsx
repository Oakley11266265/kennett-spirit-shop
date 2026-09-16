import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';

import { CATALOG_IS_PLACEHOLDER } from '@/data/catalog';
import { cn } from '@/lib/utils';

const links = [
  { href: '#shop', label: 'Shop' },
  { href: '#fits', label: 'Game Day' },
  { href: '#locker', label: 'The Locker' },
  { href: '#brands', label: 'Brands' },
  { href: '#seen', label: 'Seen at KHS' },
];

/** Appears only once the gate has been cleared, so the film is never boxed in. */
export function Nav({ visible, bagCount }: { visible: boolean; bagCount: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  return (
    <motion.header
      initial={false}
      animate={{ y: visible ? 0 : -90, opacity: visible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      className="fixed inset-x-0 top-0 z-40 border-b border-chalk-100/8 bg-ink-950/85 backdrop-blur-lg"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      aria-hidden={!visible}
    >
      <nav className="shell flex h-16 items-center justify-between gap-3">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-sm bg-demon-600 font-display text-lg text-white">
            K
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block font-condensed text-sm font-700 tracking-[0.2em] text-chalk-50 uppercase">
              Kennett
            </span>
            <span className="block font-condensed text-[0.625rem] tracking-[0.2em] text-steel-400 uppercase">
              Spirit Shop
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="type-label text-[0.6875rem] text-chalk-200 transition-colors hover:text-chalk-50"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Search the shop"
            className="grid size-11 cursor-pointer place-items-center rounded-full text-chalk-100 transition-colors hover:bg-chalk-100/10"
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            aria-label={`Bag, ${bagCount} item${bagCount === 1 ? '' : 's'}`}
            className="relative grid size-11 cursor-pointer place-items-center rounded-full text-chalk-100 transition-colors hover:bg-chalk-100/10"
          >
            <ShoppingBag className="size-5" />
            <AnimatePresence>
              {bagCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1.5 right-1 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-demon-500 px-1 text-[0.625rem] font-bold text-white"
                >
                  {bagCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid size-11 cursor-pointer place-items-center rounded-full text-chalk-100 transition-colors hover:bg-chalk-100/10 md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="overflow-hidden border-t border-chalk-100/8 md:hidden"
          >
            <div className="flex flex-col p-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="type-label rounded px-3 py-3.5 text-xs text-chalk-200 transition-colors hover:bg-chalk-100/10 hover:text-chalk-50"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/** Sticky bag bar — thumb-reachable, appears as soon as something is added. */
export function BagBar({ count, total }: { count: number; total: string }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <button
            type="button"
            className="flex min-h-14 w-full cursor-pointer items-center justify-between rounded-full bg-chalk-50 px-6 text-ink-950 shadow-lift"
          >
            <span className="text-xs font-bold tracking-[0.15em] uppercase">
              Checkout · {count} item{count === 1 ? '' : 's'}
            </span>
            <span className="text-sm font-700">{total}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Honest labelling: this draft is not running Kennett's real catalog yet. */
export function DraftNotice() {
  const [open, setOpen] = useState(true);
  if (!CATALOG_IS_PLACEHOLDER || !open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 hidden justify-center p-3 md:flex">
      <div className="flex items-center gap-3 rounded-full border border-demon-500/40 bg-ink-900/95 py-2 pr-2 pl-4 text-xs text-chalk-200 backdrop-blur">
        <span className="size-2 shrink-0 rounded-full bg-demon-400" />
        <span>
          <strong className="font-600 text-chalk-50">Design draft.</strong> Product names, prices and
          brands are placeholders — the real BSN catalog has not been imported.
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss notice"
          className="grid size-8 cursor-pointer place-items-center rounded-full text-steel-400 hover:bg-chalk-100/10 hover:text-chalk-50"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-chalk-100/8 bg-ink-950 pt-16 pb-10">
      <div className="shell">
        <p className="type-hero text-[clamp(2.5rem,12vw,7rem)] text-chalk-50/10">Wear Kennett.</p>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { h: 'Shop', items: ['New Drop', 'Hoodies', 'Tees', 'Game Day', 'Hats'] },
            { h: 'Teams', items: ['Football', 'Basketball', 'Soccer', 'Track', 'All Teams'] },
            { h: 'Help', items: ['Sizing', 'Shipping', 'Returns', 'Bulk Orders', 'Contact'] },
            { h: 'Kennett', items: ['KHS Website', 'Athletics', 'Demon Press', 'KTV', 'Alumni'] },
          ].map((col) => (
            <div key={col.h}>
              <h3 className="type-label mb-3 text-[0.6875rem] text-chalk-50">{col.h}</h3>
              <ul className="space-y-2">
                {col.items.map((i) => (
                  <li key={i}>
                    <a href="#top" className="text-sm text-steel-400 transition-colors hover:text-chalk-100">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={cn('mt-12 flex flex-col gap-3 border-t border-chalk-100/8 pt-6 text-xs text-steel-500')}>
          <p>
            Official spirit shop of Kennett High School · Kennett Square, Pennsylvania · Fulfilled by
            BSN Sports
          </p>
          <p>Design draft — not an official Kennett Consolidated School District website.</p>
        </div>
      </div>
    </footer>
  );
}
