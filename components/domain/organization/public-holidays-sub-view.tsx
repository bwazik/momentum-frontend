'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { usePublicHolidays, useDeletePublicHoliday } from '@/lib/api/hooks/use-organization';
import { localizeName, asBool, formatDualDate } from './organization-utils';
import { PublicHolidayFormDialog } from './public-holiday-form-dialog';
import { OrgSkeleton } from './org-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { components } from '@/lib/generated/api-types';

type WorkingCalendarResource = components['schemas']['WorkingCalendarResource'];
type PublicHolidayResource = components['schemas']['PublicHolidayResource'];

interface PublicHolidaysSubViewProps {
  calendar: WorkingCalendarResource;
  canManage: boolean;
}

export function PublicHolidaysSubView({ calendar, canManage }: PublicHolidaysSubViewProps) {
  const t = useTranslations('organization');
  const locale = useLocale();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const yearParam = searchParams.get('year');
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const [createOpen, setCreateOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState<PublicHolidayResource | null>(null);
  const [deleteHoliday, setDeleteHoliday] = useState<PublicHolidayResource | null>(null);

  const holidays = usePublicHolidays(calendar.public_id, { year });
  const deleteMutation = useDeletePublicHoliday(calendar.public_id);

  if (holidays.isLoading) {
    return <OrgSkeleton variant="calendars" />;
  }

  if (holidays.isError) {
    return <ErrorState message={holidays.error?.message} onRetry={() => holidays.refetch()} />;
  }

  const data = holidays.data ?? [];

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{localizeName(calendar, locale)}</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={year}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('year', e.target.value);
              router.replace(`${pathname}?${params.toString()}`);
            }}
            className="h-8 w-24 text-xs"
            min={2020}
            max={2100}
            aria-label={t('dialogs.year')}
          />
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              {t('actions.add_holiday')}
            </Button>
          )}
        </div>
      </div>

      {data.length === 0 && !holidays.isFetching ? (
        <EmptyState
          icon={CalendarDays}
          title={t('empty.no_holidays')}
          description={t('empty.no_holidays_desc')}
          className="py-6"
        />
      ) : (
        <RtlTable>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('dialogs.name')}</TableHead>
              <TableHead className="text-start">{t('dialogs.date')}</TableHead>
              <TableHead className="text-start">{t('dialogs.is_recurring')}</TableHead>
              {canManage && <TableHead className="w-10 text-end" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((holiday) => (
              <TableRow key={holiday.public_id}>
                <TableCell className="text-start font-medium">{localizeName(holiday, locale)}</TableCell>
                <TableCell className="text-start text-muted-foreground">
                  {formatDualDate(holiday.holiday_date, locale)}
                </TableCell>
                <TableCell className="text-start">
                  {asBool(holiday.is_recurring) && (
                    <Badge variant="secondary">{t('dialogs.is_recurring')}</Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-end">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditHoliday(holiday)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteHoliday(holiday)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </RtlTable>
      )}

      {canManage && (
        <PublicHolidayFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          calendarPublicId={calendar.public_id}
        />
      )}

      {editHoliday && canManage && (
        <PublicHolidayFormDialog
          key={editHoliday.public_id}
          open
          onOpenChange={(open: boolean) => { if (!open) setEditHoliday(null); }}
          calendarPublicId={calendar.public_id}
          holiday={editHoliday}
        />
      )}

      {deleteHoliday && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setDeleteHoliday(null); }}
          title={t('actions.delete')}
          description={t('actions.delete')}
          onConfirm={() => {
            deleteMutation.mutate(deleteHoliday.public_id);
            setDeleteHoliday(null);
          }}
          confirmLabel={t('actions.delete')}
          cancelLabel={t('actions.cancel')}
        />
      )}
    </div>
  );
}
