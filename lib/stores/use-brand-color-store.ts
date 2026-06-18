'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BrandColor = 'amber' | 'blue' | 'emerald' | 'rose' | 'slate';

export const brandColorHex: Record<BrandColor, string> = {
  amber: '#9A3B00',
  blue: '#1d4ed8',
  emerald: '#059669',
  rose: '#be123c',
  slate: '#475569',
};

interface BrandColorState {
  color: BrandColor;
  setColor: (color: BrandColor) => void;
}

export const useBrandColorStore = create<BrandColorState>()(
  persist(
    (set) => ({
      color: 'amber',
      setColor: (color: BrandColor) => set({ color }),
    }),
    { name: 'brand-color' },
  ),
);

export function getBrandColorHex(color: BrandColor): string {
  return brandColorHex[color];
}
