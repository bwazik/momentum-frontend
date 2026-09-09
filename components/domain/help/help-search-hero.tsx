'use client';

import { useTranslations } from 'next-intl';
import { Search, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpSearchHeroProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

export function HelpSearchHero({ value, onChange, onClear }: HelpSearchHeroProps) {
  const t = useTranslations('help_center.hero');

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 text-white shadow-md"
      data-testid="help-search-hero"
    >
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
          <BookOpen className="size-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t('headline')}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {t('subheadline')}
        </p>
        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded-xl border border-white/20 bg-white/10 py-3.5 pe-10 ps-12 text-sm text-white placeholder:text-slate-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label={t('search_placeholder')}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="absolute end-2 top-1/2 size-7 -translate-y-1/2 text-slate-400 hover:text-white hover:bg-white/10"
              aria-label={t('clear_search')}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
