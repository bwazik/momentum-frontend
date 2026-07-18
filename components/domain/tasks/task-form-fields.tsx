'use client';

import { useTranslations } from 'next-intl';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoAlert } from '@/components/shared/info-alert';
import { Info } from 'lucide-react';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { BilingualDescriptionFields } from '@/components/shared/bilingual-description-fields';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';
import { useTaskPriorities } from '@/lib/api/hooks/use-task-board';
import { BlueprintCombobox } from './blueprint-combobox';
import { PrioritySelect } from './priority-select';
import { ClassificationSelect } from './classification-select';
import { DueDateField } from './due-date-field';
import { ManualAssignmentBlock } from './manual-assignment-block';

export interface ManualItem {
  kind: 'stage' | 'sub';
  public_id: string;
  name_ar: string;
  name_en: string;
}

interface Props {
  mode: 'create' | 'edit';
  manualItems: ManualItem[];
  canClassifyConfidential: boolean;
  dueDateCalendarSystem?: 'gregorian' | 'hijri';
  onDueDateCalendarSystemChange?: (value: 'gregorian' | 'hijri') => void;
}

export function TaskFormFields({ mode, manualItems, canClassifyConfidential, dueDateCalendarSystem = 'gregorian', onDueDateCalendarSystemChange }: Props) {
  const t = useTranslations('tasks.new');
  const titleAr = useTaskFormStore((s) => s.title_ar);
  const titleEn = useTaskFormStore((s) => s.title_en);
  const descAr = useTaskFormStore((s) => s.description_ar);
  const descEn = useTaskFormStore((s) => s.description_en);
  const classificationLevel = useTaskFormStore((s) => s.classificationLevel);
  const storeSet = useTaskFormStore((s) => s.set);
  const onFieldChange = (key: string, value: string) => (storeSet as (k: string, v: string) => void)(key, value);
  const { data: prioritiesData, isLoading: prioritiesLoading } = useTaskPriorities();

  const priorities = prioritiesData ?? [];

  return (
    <FieldGroup>
      <div className="space-y-6">
        <Field>
          <FieldLabel>{t('select_blueprint')}</FieldLabel>
          <BlueprintCombobox disabled={mode === 'edit'} />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BilingualNameFields
            form={{ title_ar: titleAr, title_en: titleEn }}
            onFieldChange={onFieldChange}
            t={t}
            nameArKey="title_ar"
            nameEnKey="title_en"
            placeholderArKey="title_ar"
            placeholderEnKey="title_en"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BilingualDescriptionFields
            form={{ description_ar: descAr, description_en: descEn }}
            onFieldChange={onFieldChange}
            t={t}
            descriptionArKey="description_ar"
            descriptionEnKey="description_en"
            placeholderArKey="description_ar"
            placeholderEnKey="description_en"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {prioritiesLoading ? (
            <>
              <Field><FieldLabel>{t('priority')}</FieldLabel><Skeleton className="h-10 w-full" /></Field>
              <Field><FieldLabel>{t('classification')}</FieldLabel><Skeleton className="h-10 w-full" /></Field>
              <Field><FieldLabel>{t('due_date')}</FieldLabel><Skeleton className="h-10 w-full" /></Field>
            </>
          ) : (
            <>
              <PrioritySelect priorities={priorities} />
              <ClassificationSelect canClassifyConfidential={canClassifyConfidential} />
              <DueDateField
                calendarSystem={dueDateCalendarSystem}
                onCalendarSystemChange={onDueDateCalendarSystemChange ?? (() => {})}
              />
            </>
          )}
        </div>

        {classificationLevel === 3 && (
          <InfoAlert
            icon={<Info className="size-4" aria-hidden="true" />}
            description={t('confidential_explainer')}
          />
        )}

        {manualItems.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-sm font-medium">{t('manual_helper')}</p>
              {manualItems.map((item) => (
                <ManualAssignmentBlock key={`${item.kind}:${item.public_id}`} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </FieldGroup>
  );
}
