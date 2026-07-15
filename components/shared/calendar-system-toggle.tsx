'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarSystemToggleProps {
  value: 'gregorian' | 'hijri';
  onChange: (value: 'gregorian' | 'hijri') => void;
  className?: string;
}

export function CalendarSystemToggle({ value, onChange, className }: CalendarSystemToggleProps) {
  const t = useTranslations('localization');
  const options: Array<{ key: 'gregorian' | 'hijri'; label: string }> = [
    { key: 'hijri', label: t('hijri') },
    { key: 'gregorian', label: t('gregorian') },
  ];

  return (
    <div
      role="group"
      aria-label={t('calendar_system_label')}
      className={cn('flex rounded-lg border p-1', className)}
    >
      {options.map((opt) => (
        <Button
          key={opt.key}
          type="button"
          variant={value === opt.key ? 'default' : 'ghost'}
          size="sm"
          aria-pressed={value === opt.key}
          onClick={() => onChange(opt.key)}
          className="flex-1 transition-colors duration-150"
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
