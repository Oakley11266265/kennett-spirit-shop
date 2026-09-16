import { useCallback, useState } from 'react';

import { BagBar, DraftNotice, Footer, Nav } from '@/components/Chrome';
import { LockerRail } from '@/components/LockerRail';
import { ProductSheet } from '@/components/ProductSheet';
import { SearchOverlay } from '@/components/SearchOverlay';
import { ScrollGate } from '@/components/ScrollGate';
import {
  BrandRail,
  ChooseYourK,
  DropRail,
  GameDayFits,
  SeenAtKennett,
  ShopByMoment,
} from '@/components/Sections';
import type { Product } from '@/data/catalog';
import { formatPrice } from '@/lib/utils';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [bag, setBag] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleUnlock = useCallback((v: boolean) => setUnlocked(v), []);
  const addToBag = useCallback((p: Product) => setBag((b) => [...b, p]), []);
  const openProduct = useCallback((p: Product) => setSelected(p), []);
  const closeProduct = useCallback(() => setSelected(null), []);

  const total = formatPrice(bag.reduce((sum, p) => sum + (p.priceCents ?? 0), 0));

  return (
    <>
      <a
        href="#shop"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-chalk-50 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-ink-950"
      >
        Skip intro and go to the shop
      </a>

      <div id="top" />
      <Nav visible={unlocked} bagCount={bag.length} onSearch={() => setSearchOpen(true)} />

      <main>
        <ScrollGate onUnlock={handleUnlock} />
        <DropRail onAdd={addToBag} onOpen={openProduct} />
        <LockerRail onOpen={openProduct} />
        <GameDayFits onAdd={addToBag} />
        <ShopByMoment />
        <ChooseYourK />
        <BrandRail />
        <SeenAtKennett />
      </main>

      <Footer />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenProduct={openProduct}
      />
      <ProductSheet product={selected} onClose={closeProduct} onAdd={addToBag} />
      <BagBar count={bag.length} total={total} />
      <DraftNotice />
    </>
  );
}
