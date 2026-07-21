'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { useUserAuditGrants, useRevokeAuditGrant } from '@/lib/api/hooks/use-admin-access';
import { localizeName } from '@/lib/utils/localize';
import { Plus } from 'lucide-react';
import { GrantAuditScopeDialog } from './grant-audit-scope-dialog';

interface AuditGrantsPanelProps {
  userPublicId: string;
}

export function AuditGrantsPanel({ userPublicId }: AuditGrantsPanelProps) {
  const t = useTranslations('admin.users.detail.access.audit');
  const locale = useLocale();
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: grants, isLoading } = useUserAuditGrants(userPublicId);
  const revokeGrant = useRevokeAuditGrant();

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
        ) : !grants || grants.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="space-y-2">
            {grants.map((g) => {
              const deptName = g.department
                ? localizeName(locale, g.department.name_ar, '')
                : t('all_departments');
              return (
                <div key={g.public_id} className={`flex items-center justify-between text-sm py-2 border-b last:border-b-0 ${g.revoked_at ? 'opacity-60' : ''}`}>
                  <div>
                    <span className="font-medium">{deptName}</span>
                    <span className="text-muted-foreground ms-2 inline-flex items-center gap-1">
                      <DualDateDisplay gregorian={g.date_range_start} variant="inline" />
                      <span>—</span>
                      <DualDateDisplay gregorian={g.date_range_end} variant="inline" />
                    </span>
                    {g.revoked_at && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        {t('revoked_at')}: <DualDateDisplay gregorian={g.revoked_at} hijri={(g as { revoked_at_hijri?: string | null }).revoked_at_hijri} variant="inline" />
                      </span>
                    )}
                  </div>
                  {!g.revoked_at ? (
                    <Button variant="outline" size="sm" className="border-destructive/30 text-destructive" onClick={() => setRevokeId(g.public_id)}>
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
      <GrantAuditScopeDialog
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
          if (revokeId) revokeGrant.mutate({ grantPublicId: revokeId, userPublicId });
          setRevokeId(null);
        }}
        isPending={revokeGrant.isPending}
      />
    </Card>
  );
}
