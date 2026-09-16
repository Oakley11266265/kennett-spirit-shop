import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Maps a value from one range to another, clamped. Used for scroll-staged reveals. */
export const mapRange = (v: number, inMin: number, inMax: number, outMin = 0, outMax = 1) =>
  clamp((v - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;

export const formatPrice = (cents: number) =>
  `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
