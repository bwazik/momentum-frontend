'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Field, FieldLabel } from '@/components/ui/field';
import { useCurrentUser, useMarkOutOfOffice, useMarkBackInOffice } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { UserSearchCombobox } from '@/components/domain/tasks/user-search-combobox';
import { SettingsSkeleton } from './settings-skeleton';
import { ErrorState } from '@/components/shared/error-state';

export function AvailabilityCard() {
  const t = useTranslations('settings.availability');
  const { data: user, isLoading, isError, refetch } = useCurrentUser();
  const canManageUsers = useCapability('iam.manage_users');
  const markOoo = useMarkOutOfOffice();
  const markBack = useMarkBackInOffice();
  const [delegateId, setDelegateId] = useState<string>('');

  if (isLoading) return <SettingsSkeleton />;
  if (isError || !user) return <ErrorState message={t('error')} onRetry={() => refetch()} />;

  const currentUser = user;
  const isOut = currentUser.is_out_of_office;

  function handleToggle(checked: boolean) {
    if (checked) {
      markOoo.mutate({
        publicId: currentUser.public_id,
        delegateUserId: canManageUsers ? (delegateId || null) : null,
      });
    } else {
      markBack.mutate(currentUser.public_id);
      setDelegateId('');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{t('status_label')}</span>
            <span className={isOut ? 'text-amber-600' : 'text-emerald-600'}>
              {isOut ? t('status_out_of_office') : t('status_in_office')}
            </span>
          </div>
          <Switch
            checked={isOut}
            onCheckedChange={handleToggle}
            disabled={markOoo.isPending || markBack.isPending}
            aria-label={t('toggle_aria')}
          />
        </div>
        {isOut && (
          <Button
            variant="outline"
            onClick={() => handleToggle(false)}
            disabled={markBack.isPending}
          >
            {markBack.isPending ? t('returning') : t('back_in_office')}
          </Button>
        )}
        {!isOut && canManageUsers && (
          <Field>
            <FieldLabel>{t('delegate_label')}</FieldLabel>
            <UserSearchCombobox
              value={delegateId}
              onChange={setDelegateId}
              placeholder={t('delegate_placeholder')}
            />
            <p className="mt-1 text-xs text-amber-600">{t('delegate_warning')}</p>
          </Field>
        )}
      </CardContent>
    </Card>
  );
}
