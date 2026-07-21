'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { useUserMonitoringScopes, useRevokeMonitoringScope } from '@/lib/api/hooks/use-admin-access';
import { localizeName } from '@/lib/utils/localize';
import { formatAdminScopeType } from '@/lib/utils/admin-utils';
import { Plus } from 'lucide-react';
import { GrantMonitoringScopeDialog } from './grant-monitoring-scope-dialog';

interface MonitoringScopesPanelProps {
  userPublicId: string;
}

export function MonitoringScopesPanel({ userPublicId }: MonitoringScopesPanelProps) {
  const t = useTranslations('admin.users.detail.access.monitoring');
  const locale = useLocale();
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: scopes, isLoading } = useUserMonitoringScopes(userPublicId);
  const revokeScope = useRevokeMonitoringScope();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <Button size="sm" onClick={() => setGrantOpen(true)}>
          <Plus className="size-4" />
          {t('add')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : !scopes || scopes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="space-y-2">
            {scopes.map((s) => {
              const deptName = s.scope_department
                ? localizeName(locale, s.scope_department.name_ar, '')
                : '';
              const sAny = s as unknown as { blueprint_category?: { name_ar: string } | null; granted_by?: { name_ar: string; name_en: string } | null; granted_at?: string | null; granted_at_hijri?: string | null; revoked_at_hijri?: string | null };
              const catName = sAny.blueprint_category?.name_ar ?? null;
              return (
                <div key={s.public_id} className={`flex items-center justify-between text-sm py-2 border-b last:border-b-0 ${s.revoked_at ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col gap-0.5">
                    <div>
                      <span className="font-medium">{deptName || t('tenant_wide')}</span>
                      <span className="text-muted-foreground ms-2">
                        {formatAdminScopeType(locale, Number(s.scope_type))}
                      </span>
                    </div>
                    {catName && (
                      <span className="text-xs text-muted-foreground">
                        {t('category')}: {catName}
                      </span>
                    )}
                    {sAny.granted_by && (
                      <span className="text-xs text-muted-foreground">
                        {t('granted_by')}: {localizeName(locale, sAny.granted_by.name_ar, sAny.granted_by.name_en)}
                      </span>
                    )}
                    {sAny.granted_at && (
                      <span className="text-xs text-muted-foreground">
                        {t('granted_at')}: <DualDateDisplay gregorian={sAny.granted_at} hijri={sAny.granted_at_hijri} variant="inline" />
                      </span>
                    )}
                    {s.revoked_at && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {t('revoked_at')}: <DualDateDisplay gregorian={s.revoked_at} hijri={sAny.revoked_at_hijri} variant="inline" />
                      </span>
                    )}
                  </div>
                  {!s.revoked_at ? (
                    <Button variant="outline" size="sm" className="border-destructive/30 text-destructive" onClick={() => setRevokeId(s.public_id)}>
                      {t('revoke')}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('revoked')}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <GrantMonitoringScopeDialog
        userPublicId={userPublicId}
        open={grantOpen}
        onOpenChange={setGrantOpen}
      />
      <ConfirmDeleteDialog
        open={!!revokeId}
        onOpenChange={() => setRevokeId(null)}
        title={t('revoke_confirm_title')}
        description={t('revoke_confirm_desc')}
        confirmLabel={t('revoke')}
        onConfirm={() => {
          if (revokeId) revokeScope.mutate({ grantPublicId: revokeId, userPublicId });
          setRevokeId(null);
        }}
        isPending={revokeScope.isPending}
      />
    </Card>
  );
}
