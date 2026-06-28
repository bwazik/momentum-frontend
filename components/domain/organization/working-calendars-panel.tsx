'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';
import { localizeName } from './organization-utils';
import { useWorkingCalendars, useDeleteWorkingCalendar, useUpdateWorkingCalendar } from '@/lib/api/hooks/use-organization';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { ApiRequestError } from '@/lib/api/client';
import { WorkingCalendarsList } from './working-calendars-list';
import { WorkingCalendarFormDialog } from './working-calendar-form-dialog';
import { PublicHolidaysSubView } from './public-holidays-sub-view';
import { OrgSkeleton } from './org-skeleton';
import { PermissionDenied } from './permission-denied';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import type { components } from '@/lib/generated/api-types';

type WorkingCalendarResource = components['schemas']['WorkingCalendarResource'];

export function WorkingCalendarsPanel() {
  const t = useTranslations('organization');
  const locale = useLocale();
  const canManage = useCapability('organization.manage');
  const calendars = useWorkingCalendars();

  const [editCal, setEditCal] = useState<WorkingCalendarResource | null>(null);
  const [makeDefaultCal, setMakeDefaultCal] = useState<WorkingCalendarResource | null>(null);
  const [deleteCal, setDeleteCal] = useState<WorkingCalendarResource | null>(null);
  const [selectedCal, setSelectedCal] = useState<WorkingCalendarResource | null>(null);

  const deleteMutation = useDeleteWorkingCalendar();
  const makeDefaultMutation = useUpdateWorkingCalendar(makeDefaultCal?.public_id ?? '');

  if (calendars.isLoading) {
    return <OrgSkeleton variant="calendars" />;
  }

  if (calendars.isError) {
    const err = calendars.error;
    if (err instanceof ApiRequestError && err.status === 403) {
      return <PermissionDenied />;
    }
    return <ErrorState message={calendars.error?.message} onRetry={() => calendars.refetch()} />;
  }

  const data = calendars.data ?? [];

  if (data.length === 0 && !calendars.isFetching) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icon={CalendarDays}
          title={t('empty.no_calendars')}
          description={t('empty.no_calendars_desc')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <WorkingCalendarsList
        calendars={data}
        selectedPublicId={selectedCal?.public_id}
        onSelect={(cal) => setSelectedCal((prev) => prev?.public_id === cal.public_id ? null : cal)}
        onEdit={(cal) => setEditCal(cal)}
        onMakeDefault={(cal) => setMakeDefaultCal(cal)}
        onDelete={(cal) => setDeleteCal(cal)}
        canManage={canManage}
      />

      {selectedCal && (
        <PublicHolidaysSubView calendar={selectedCal} canManage={canManage} />
      )}

      {editCal && canManage && (
        <WorkingCalendarFormDialog
          key={editCal.public_id}
          open
          onOpenChange={(open: boolean) => { if (!open) setEditCal(null); }}
          calendar={editCal}
        />
      )}

      {makeDefaultCal && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setMakeDefaultCal(null); }}
          title={t('dialogs.make_default_title')}
          description={t('dialogs.make_default_desc')}
          onConfirm={() => {
            makeDefaultMutation.mutate(
              { is_default: true },
              { onSuccess: () => setMakeDefaultCal(null) },
            );
          }}
          confirmLabel={t('dialogs.confirm')}
          cancelLabel={t('actions.cancel')}
        />
      )}

      {deleteCal && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setDeleteCal(null); }}
          title={t('actions.delete')}
          description={t('dialogs.confirm_delete_desc', { name: localizeName(deleteCal, locale) })}
          onConfirm={() => {
            deleteMutation.mutate(deleteCal.public_id);
            setDeleteCal(null);
            if (selectedCal?.public_id === deleteCal.public_id) setSelectedCal(null);
          }}
          confirmLabel={t('actions.delete')}
          cancelLabel={t('actions.cancel')}
        />
      )}
    </div>
  );
}
