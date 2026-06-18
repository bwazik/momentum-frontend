'use client';

import { useEffect } from 'react';
import { useBrandColorStore, getBrandColorHex } from '@/lib/stores/use-brand-color-store';

// First-paint brand color is handled by a blocking <script> in layout.tsx.
// This effect handles in-session color changes from the user menu dropdown.
export function BrandColorProvider() {
  const color = useBrandColorStore((s) => s.color);

  useEffect(() => {
    const hex = getBrandColorHex(color);
    document.documentElement.style.setProperty('--color-primary', hex);
    document.documentElement.style.setProperty('--primary', hex);
  }, [color]);

  return null;
}
