import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, ChevronsDown, Volume2, X } from 'lucide-react';

import { cn, clamp, mapRange } from '@/lib/utils';

const FRAME_COUNT = 64;
const BASE = import.meta.env.BASE_URL;
const frameUrl = (i: number) => `${BASE}hero/frames/f${String(i + 1).padStart(3, '0')}.webp`;

/**
 * THE GATE
 * -----------------------------------------------------------------------
 * A pinned section whose height is the scroll budget for the intro film.
 * Scrolling scrubs a decoded frame sequence rather than seeking a <video>:
 * seeking stutters badly on iOS, while drawing pre-decoded frames to a
 * canvas is frame-accurate everywhere and degrades gracefully.
 *
 * This is deliberately NOT scroll-jacking. Native scroll is never trapped or
 * hijacked — the user drives, can flick past at any speed, and a persistent
 * SKIP control jumps straight to the shop.
 */
export function ScrollGate({ onUnlock }: { onUnlock: (unlocked: boolean) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(Array(FRAME_COUNT).fill(null));
  const lastDrawn = useRef(-1);
  const rafRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [returning, setReturning] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);

  /* ---------- reduced motion + repeat-visitor detection ---------- */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    try {
      if (localStorage.getItem('khs-seen-intro')) setReturning(true);
      localStorage.setItem('khs-seen-intro', '1');
    } catch {
      /* private mode — not important enough to handle */
    }
    return () => mq.removeEventListener('change', apply);
  }, []);

  /* ---------- progressive frame loading ---------- */
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let done = 0;

    // Load order: first frame (instant paint), last frame (end card), then fill in.
    const order = [0, FRAME_COUNT - 1, ...Array.from({ length: FRAME_COUNT }, (_, i) => i)];
    const queue = [...new Set(order)];
    const CONCURRENCY = 6;

    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          imagesRef.current[i] = img;
          done += 1;
          if (!cancelled) {
            setLoaded(done);
            if (i === 0) {
              setReady(true);
              draw(0);
            }
          }
          resolve();
        };
        img.onerror = () => {
          done += 1;
          if (!cancelled && done > FRAME_COUNT * 0.5 && !imagesRef.current[0]) setFailed(true);
          resolve();
        };
        img.src = frameUrl(i);
      });

    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length && !cancelled) {
        const next = queue.shift();
        if (next === undefined) return;
        await loadOne(next);
      }
    });
    Promise.all(workers);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  /* ---------- canvas drawing (cover-fit, DPR-aware) ---------- */
  const draw = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Walk backwards to the nearest frame that has actually loaded, so scrubbing
    // ahead of the download never shows a blank canvas.
    let i = index;
    while (i >= 0 && !imagesRef.current[i]) i -= 1;
    if (i < 0) return;
    const img = imagesRef.current[i];
    if (!img) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // object-fit: cover, anchored slightly above centre so the doorway
    // (the emotional subject) sits in the upper-middle on tall phones.
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) * 0.42, dw, dh);
    lastDrawn.current = i;
  }, []);

  /* ---------- scroll → progress ---------- */
  useEffect(() => {
    if (reduced) {
      onUnlock(true);
      return;
    }
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollable = el.offsetHeight - window.innerHeight;
        const p = clamp(-rect.top / Math.max(scrollable, 1));
        setProgress(p);
        onUnlock(p > 0.985);
        const frame = Math.min(FRAME_COUNT - 1, Math.round(p * (FRAME_COUNT - 1)));
        if (frame !== lastDrawn.current) draw(frame);
      });
    };
    const onResize = () => {
      lastDrawn.current = -1;
      onScroll();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, onUnlock, reduced]);

  const skip = () => {
    const el = sectionRef.current;
    if (!el) return;
    window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight + 2, behavior: 'smooth' });
  };

  /* ---------- staged overlay opacities ---------- */
  const approachOpacity = 1 - mapRange(progress, 0.0, 0.18);
  const statementIn = mapRange(progress, 0.52, 0.78);
  const ctaIn = mapRange(progress, 0.74, 0.92);
  const vignette = mapRange(progress, 0.3, 1, 0.25, 0.75);

  /* ============================ REDUCED MOTION ============================ */
  if (reduced) {
    return (
      <section className="relative grid min-h-svh place-items-center overflow-hidden bg-ink-950 px-6">
        <img
          src={`${BASE}hero/poster.jpg`}
          alt="The historic Kennett High School entrance, doors open onto the Blue Demon mark"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="relative z-10 text-center">
          <p className="type-eyebrow text-demon-300">Official Blue Demons Spirit Shop</p>
          <h1 className="type-hero mt-4 text-[clamp(3.5rem,18vw,11rem)] text-chalk-50">
            Wear
            <br />
            Kennett.
          </h1>
          <a
            href="#shop"
            className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-demon-600 px-8 text-sm font-semibold tracking-widest text-white uppercase"
          >
            Shop the drop <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    );
  }

  /* ============================== THE GATE =============================== */
  return (
    <section
      ref={sectionRef}
      aria-label="Kennett High School spirit shop introduction"
      className="relative h-[320svh] bg-ink-950 md:h-[360svh]"
    >
      <div className="sticky top-0 grid h-svh w-full place-items-center overflow-hidden">
        {/* fallback poster sits underneath in case frames never arrive */}
        <img
          src={`${BASE}hero/poster.jpg`}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            ready && !failed ? 'opacity-0' : 'opacity-100',
          )}
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{ opacity: ready ? 1 : 0, transition: 'opacity 400ms ease' }}
        />

        {/* Depth + legibility. Strengthens as we push into the building. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 45%, transparent 35%, rgba(5,9,26,${vignette}) 100%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent" />

        {/* ---------------- Approach state ---------------- */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]"
          style={{ opacity: approachOpacity }}
        >
          {/* keep clear of the controls in the top-right */}
          <div className="mx-auto max-w-6xl pr-44">
            <p className="type-eyebrow text-chalk-200/80">Kennett High School</p>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 pb-[max(2rem,env(safe-area-inset-bottom))]"
          style={{ opacity: approachOpacity }}
        >
          <p className="type-label text-xs text-chalk-100">Scroll to enter</p>
          <ChevronsDown className="size-5 animate-bounce text-demon-300" aria-hidden="true" />
          <p className="type-eyebrow mt-1 text-chalk-200/60">Est. 1921</p>
        </div>

        {/* Scrim behind the end card so the type wins over the door mark */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            opacity: statementIn,
            background:
              'radial-gradient(75% 45% at 50% 48%, rgba(5,9,26,0.88) 0%, rgba(5,9,26,0.6) 45%, transparent 75%)',
          }}
        />

        {/* ---------------- The statement ---------------- */}
        <div className="pointer-events-none relative z-20 px-6 text-center">
          <h1
            className="type-hero text-[clamp(3.25rem,17vw,11rem)] text-chalk-50"
            style={{
              opacity: statementIn,
              transform: `translateY(${(1 - statementIn) * 28}px) scale(${0.94 + statementIn * 0.06})`,
              textShadow: '0 10px 60px rgba(0,15,54,0.8)',
            }}
          >
            Wear
            <br />
            Kennett.
          </h1>

          <div
            style={{
              opacity: ctaIn,
              transform: `translateY(${(1 - ctaIn) * 16}px)`,
            }}
            className="pointer-events-auto mt-7 flex flex-col items-center gap-4"
          >
            <p className="type-eyebrow text-demon-200">Official Blue Demons Spirit Shop</p>
            <a
              href="#shop"
              className="group inline-flex min-h-[3.25rem] items-center gap-3 rounded-full bg-chalk-50 px-8 text-sm font-bold tracking-[0.15em] text-ink-950 uppercase transition-transform duration-200 active:scale-95"
            >
              Shop the drop
              <span className="grid size-6 place-items-center rounded-full bg-demon-600 text-white transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="size-3.5" />
              </span>
            </a>
          </div>
        </div>

        {/* ---------------- Controls ---------------- */}
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundOpen(true)}
            className="grid size-11 cursor-pointer place-items-center rounded-full border border-chalk-100/25 bg-ink-950/50 text-chalk-100 backdrop-blur transition-colors hover:bg-ink-950/80"
            aria-label="Play the intro film with sound"
          >
            <Volume2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={skip}
            className={cn(
              'min-h-11 cursor-pointer rounded-full border px-4 text-xs font-semibold tracking-[0.15em] uppercase backdrop-blur transition-colors',
              returning
                ? 'border-chalk-50/70 bg-chalk-50/90 text-ink-950'
                : 'border-chalk-100/25 bg-ink-950/50 text-chalk-100 hover:bg-ink-950/80',
            )}
          >
            Skip intro
          </button>
        </div>

        {/* Loading progress — a thin line, never a blocking spinner */}
        <div
          className="absolute inset-x-0 bottom-0 z-30 h-0.5 bg-demon-600 transition-opacity duration-500"
          style={{
            transform: `scaleX(${loaded / FRAME_COUNT})`,
            transformOrigin: 'left',
            opacity: loaded < FRAME_COUNT ? 0.9 : 0,
          }}
        />
      </div>

      {/* ---------------- Sound-on lightbox ---------------- */}
      {soundOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/95 p-4 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-label="Kennett intro film"
        >
          <button
            type="button"
            onClick={() => setSoundOpen(false)}
            className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 grid size-11 cursor-pointer place-items-center rounded-full border border-chalk-100/25 text-chalk-100"
            aria-label="Close film"
          >
            <X className="size-5" />
          </button>
          <video
            src={`${BASE}hero/hero-720.mp4`}
            className="max-h-[80svh] w-full max-w-4xl rounded"
            controls
            autoPlay
            playsInline
          />
        </div>
      )}
    </section>
  );
}
