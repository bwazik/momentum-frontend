'use client';

import { useEffect } from 'react';
import { useBrandColorStore, getBrandColorHex } from '@/lib/stores/use-brand-color-store';

export function BrandColorProvider() {
  const color = useBrandColorStore((s) => s.color);

  useEffect(() => {
    const hex = getBrandColorHex(color);
    document.documentElement.style.setProperty('--color-primary', hex);
    document.documentElement.style.setProperty('--primary', hex);
  }, [color]);

  return null;
}
