'use client';

import { useTranslations } from 'next-intl';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';
import { Field, FieldLabel } from '@/components/ui/field';

interface Props {
  canClassifyConfidential: boolean;
}

const CLASSIFICATION_OPTIONS = [
  { value: '1', labelKey: 'classification_public' },
  { value: '2', labelKey: 'classification_internal' },
  { value: '3', labelKey: 'classification_confidential' },
] as const;

export function ClassificationSelect({ canClassifyConfidential }: Props) {
  const t = useTranslations('tasks.new');
  const classificationLevel = useTaskFormStore((s) => s.classificationLevel);
  const set = useTaskFormStore((s) => s.set);

  return (
    <Field>
      <FieldLabel>{t('classification')}</FieldLabel>
      <RtlSelect
        value={String(classificationLevel)}
        onValueChange={(v) => set('classificationLevel', Number(v) as 1 | 2 | 3)}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('classification')} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            {CLASSIFICATION_OPTIONS.map((opt) => {
              const isConfidential = opt.value === '3';
              const disabled = isConfidential && !canClassifyConfidential;
              const item = (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={disabled}
                  aria-disabled={disabled ? 'true' : undefined}
                >
                  {t(opt.labelKey)}
                </SelectItem>
              );
              if (disabled) {
                return (
                  <TooltipProvider key={opt.value}>
                    <Tooltip>
                      <TooltipTrigger asChild className="w-full">
                        {item}
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('classification_confidential_lock')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }
              return item;
            })}
          </SelectGroup>
        </SelectContent>
      </RtlSelect>
    </Field>
  );
}
