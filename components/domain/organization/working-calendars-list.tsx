'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Clock, Globe, Pencil, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrgActionMenu } from './org-action-menu';
import { localizeName, asBool, workingDaysLabel } from './organization-utils';
import { cn } from '@/lib/utils';
import type { components } from '@/lib/generated/api-types';

type WorkingCalendarResource = components['schemas']['WorkingCalendarResource'];

interface WorkingCalendarsListProps {
  calendars: WorkingCalendarResource[];
  selectedPublicId?: string;
  onSelect: (cal: WorkingCalendarResource) => void;
  onEdit: (cal: WorkingCalendarResource) => void;
  onMakeDefault: (cal: WorkingCalendarResource) => void;
  onDelete: (cal: WorkingCalendarResource) => void;
  canManage: boolean;
}

export function WorkingCalendarsList({
  calendars,
  selectedPublicId,
  onSelect,
  onEdit,
  onMakeDefault,
  onDelete,
  canManage,
}: WorkingCalendarsListProps) {
  const t = useTranslations('organization');
  const locale = useLocale();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {calendars.map((cal) => {
        const isDefault = asBool(cal.is_default);
        const isSelected = cal.public_id === selectedPublicId;

        return (
          <div
            key={cal.public_id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(cal)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(cal); }}
            className={cn(
              'flex flex-col gap-3 rounded-xl border p-4 transition-colors cursor-pointer hover:bg-accent/50',
              isSelected && 'border-primary bg-accent/50',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{localizeName(cal, locale)}</h3>
                  {isDefault && (
                    <Badge variant="default" className="text-xs">
                      {t('dialogs.is_default')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {workingDaysLabel(cal.working_days, t)}
                </p>
              </div>
              {canManage && (
                <OrgActionMenu
                  actions={[
                    {
                      label: t('actions.edit'),
                      icon: <Pencil className="size-4" />,
                      onClick: () => onEdit(cal),
                    },
                    {
                      label: t('actions.make_default'),
                      icon: <Star className="size-4" />,
                      onClick: () => onMakeDefault(cal),
                      disabled: isDefault,
                    },
                    {
                      label: t('actions.delete'),
                      icon: <Trash2 className="size-4" />,
                      onClick: () => onDelete(cal),
                      disabled: isDefault,
                      destructive: true,
                    },
                  ]}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                <span>{cal.working_hours_start} — {cal.working_hours_end}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="size-3.5" />
                <span>{cal.timezone}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
