/* Regenerates the hero frame sequence from the source film.
   Usage:  node scripts/grade-frames.mjs         (88 frames, both tiers)
           N=120 node scripts/grade-frames.mjs   (denser scrub)
   Expects hero-source.mp4 beside it and ffmpeg-static + sharp installed.
   Writes graded/w860 and graded/w1300; copy those to public/hero/frames/. */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const FF = './node_modules/ffmpeg-static/ffmpeg';
const SRC = 'hero-source.mp4';
const N = Number(process.env.N ?? 88);
const RAW = 'raw-frames';

/* ---------------------------------------------------------------------------
   Progressive grade.
   The camera walks from open daylight into a dark lobby. A single flat grade
   either blows out the exterior or muddies it; ramping the grade with the
   push-in keeps the brick warm at the steps and lets the light genuinely fall
   away as we cross the threshold — so the last frame already matches the
   storefront's ink-950 ground and the handoff has no seam.
--------------------------------------------------------------------------- */
const ease = (t) => t * t * (3 - 2 * t); // smoothstep

function gradeFor(t) {
  const k = ease(Math.min(1, Math.max(0, (t - 0.15) / 0.85))); // hold, then ramp
  return {
    saturation: 1 - 0.1 * k, // 1.00 → 0.90, keeps the brick warm
    brightness: 1 - 0.09 * k, // 1.00 → 0.91
    contrast: 1 + 0.14 * k, // 1.00 → 1.14
    // Cool cast via per-channel gain. NOT sharp's tint(): that preserves
    // luminance while discarding the original chroma, which greyscales brick.
    cool: 0.05 * k,
  };
}

if (!fs.existsSync(RAW)) {
  fs.mkdirSync(RAW, { recursive: true });
  console.log(`extracting ${N} raw frames…`);
  execFileSync(FF, [
    '-hide_banner', '-loglevel', 'error',
    '-i', SRC,
    '-vf', `fps=${(N / 5.17).toFixed(3)},scale=1600:-2`,
    '-q:v', '2',
    path.join(RAW, 'r%03d.png'),
  ]);
}

const raws = fs.readdirSync(RAW).filter((f) => f.endsWith('.png')).sort();
console.log(`grading ${raws.length} frames`);

const TIERS = [
  { name: 'w860', width: 860, quality: 46 },
  { name: 'w1300', width: 1300, quality: 48 },
];

for (const tier of TIERS) {
  const dir = `graded/${tier.name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  let bytes = 0;
  for (let i = 0; i < raws.length; i++) {
    const t = raws.length === 1 ? 0 : i / (raws.length - 1);
    const g = gradeFor(t);
    // contrast around the midpoint: out = a*in + b, with b chosen so 128 maps to 128
    const gain = [g.contrast * (1 - g.cool), g.contrast, g.contrast * (1 + g.cool * 0.6)];
    const offset = gain.map((a) => 128 * (1 - a));

    const out = path.join(dir, `f${String(i + 1).padStart(3, '0')}.webp`);
    await sharp(path.join(RAW, raws[i]))
      .resize(tier.width, null, { kernel: 'lanczos3' })
      .modulate({ saturation: g.saturation, brightness: g.brightness })
      .linear(gain, offset)
      .sharpen({ sigma: 0.6 })
      .webp({ quality: tier.quality, effort: 5 })
      .toFile(out);
    bytes += fs.statSync(out).size;
  }
  console.log(`  ${tier.name}: ${raws.length} frames, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
}

/* poster = first frame, end card = last frame, both graded to match */
const first = path.join('graded/w1300', 'f001.webp');
const last = path.join('graded/w1300', `f${String(raws.length).padStart(3, '0')}.webp`);
await sharp(first).jpeg({ quality: 72, progressive: true }).toFile('graded/poster.jpg');
await sharp(last).jpeg({ quality: 72, progressive: true }).toFile('graded/endframe.jpg');
console.log('poster + endframe written');
