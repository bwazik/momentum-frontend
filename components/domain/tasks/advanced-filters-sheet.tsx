'use client';

import { useLocale, useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RtlSelect } from '@/components/shared/rtl-select';
import { useTaskPriorities } from '@/lib/api/hooks/use-task-board';
import { useBlueprintCategories, useStageTypes } from '@/lib/api/hooks/use-task-board';
import { useDepartmentsInfinite } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';
import type { TaskBoardUrlFilters } from '@/components/domain/tasks/task-board-types';

interface AdvancedFiltersSheetProps {
  t: ReturnType<typeof useTranslations>;
  filters: TaskBoardUrlFilters;
  onParam: (key: string, value?: string | null) => void;
  hideFields?: ('stageType' | 'assignee')[];
}

export function AdvancedFiltersSheet({ t, filters, onParam, hideFields }: AdvancedFiltersSheetProps) {
  const locale = useLocale();
  const side = locale === 'ar' ? 'left' : 'right';
  const { data: departmentsData } = useDepartmentsInfinite();
  const { data: stageTypes } = useStageTypes();
  const { data: priorities } = useTaskPriorities();
  const { data: categories } = useBlueprintCategories();

  const departments = departmentsData?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="size-4" />
          {t('advanced')}
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('advanced')}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
        <Field>
          <FieldLabel>{t('department')}</FieldLabel>
          <RtlSelect value={filters.departmentId ?? ''} onValueChange={(v) => onParam('departmentId', v === 'all' ? null : v || null)}>
            <SelectTrigger><SelectValue placeholder={t('department')} /></SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value="all">{t('department')}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.public_id} value={d.public_id}>{localizeName(locale, d.name_ar, d.name_en)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </RtlSelect>
        </Field>

        {!hideFields?.includes('stageType') && (
        <Field>
          <FieldLabel>{t('stage_type')}</FieldLabel>
          <RtlSelect value={filters.stageTypeId ?? ''} onValueChange={(v) => onParam('stageTypeId', v === 'all' ? null : v || null)}>
            <SelectTrigger><SelectValue placeholder={t('stage_type')} /></SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value="all">{t('stage_type')}</SelectItem>
                {(stageTypes ?? []).map((st) => (
                  <SelectItem key={st.public_id} value={st.public_id}>{localizeName(locale, st.name_ar, st.name_en)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </RtlSelect>
        </Field>
        )}

        <Field>
          <FieldLabel>{t('priority')}</FieldLabel>
          <RtlSelect value={filters.priorityId?.[0] ?? ''} onValueChange={(v) => onParam('priorityId', v === 'all' ? null : v || null)}>
            <SelectTrigger><SelectValue placeholder={t('priority')} /></SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value="all">{t('priority')}</SelectItem>
                {(priorities ?? []).map((p) => (
                  <SelectItem key={p.public_id} value={p.public_id}>{localizeName(locale, p.name_ar, p.name_en)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </RtlSelect>
        </Field>

        <Field>
          <FieldLabel>{t('blueprint_category')}</FieldLabel>
          <RtlSelect value={filters.blueprintCategoryId ?? ''} onValueChange={(v) => onParam('blueprintCategoryId', v === 'all' ? null : v || null)}>
            <SelectTrigger><SelectValue placeholder={t('blueprint_category')} /></SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value="all">{t('blueprint_category')}</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.public_id} value={c.public_id}>{localizeName(locale, c.name_ar, c.name_en)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </RtlSelect>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>{t('date_from')}</FieldLabel>
            <input
              type="date"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={filters.dateFrom ?? ''}
              onChange={(e) => onParam('dateFrom', e.target.value || null)}
            />
          </Field>
          <Field>
            <FieldLabel>{t('date_to')}</FieldLabel>
            <input
              type="date"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={filters.dateTo ?? ''}
              onChange={(e) => onParam('dateTo', e.target.value || null)}
            />
          </Field>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
