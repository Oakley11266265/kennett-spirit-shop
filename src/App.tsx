import { useCallback, useState } from 'react';

import { BagBar, DraftNotice, Footer, Nav } from '@/components/Chrome';
import { LockerRail } from '@/components/LockerRail';
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

  const handleUnlock = useCallback((v: boolean) => setUnlocked(v), []);
  const addToBag = useCallback((p: Product) => setBag((b) => [...b, p]), []);

  const total = formatPrice(bag.reduce((sum, p) => sum + p.priceCents, 0));

  return (
    <>
      <a
        href="#shop"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-chalk-50 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-ink-950"
      >
        Skip intro and go to the shop
      </a>

      <div id="top" />
      <Nav visible={unlocked} bagCount={bag.length} />

      <main>
        <ScrollGate onUnlock={handleUnlock} />
        <DropRail onAdd={addToBag} />
        <LockerRail />
        <GameDayFits onAdd={addToBag} />
        <ShopByMoment />
        <ChooseYourK />
        <BrandRail />
        <SeenAtKennett />
      </main>

      <Footer />
      <BagBar count={bag.length} total={total} />
      <DraftNotice />
    </>
  );
}
