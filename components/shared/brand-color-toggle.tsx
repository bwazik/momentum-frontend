'use client';

import { Palette } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBrandColorStore, type BrandColor, brandColorHex } from '@/lib/stores/use-brand-color-store';

const colors: BrandColor[] = ['amber', 'blue', 'emerald', 'rose', 'slate'];

export function BrandColorToggle() {
  const { color, setColor } = useBrandColorStore();
  const locale = useLocale();
  const t = useTranslations('colors');

  return (
    <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer" aria-label={t('amber')}>
          <Palette data-slot="icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {colors.map((c) => (
          <DropdownMenuItem key={c} onClick={() => setColor(c)} className="gap-3 cursor-pointer">
            <span
              className="size-4 rounded-full border"
              style={{ backgroundColor: brandColorHex[c] }}
            />
            <span>{t(c)}</span>
            {color === c && <span className="ms-auto text-xs text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
