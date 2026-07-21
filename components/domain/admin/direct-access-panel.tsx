'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { useUserDirectGrants, useRevokeUserCapability } from '@/lib/api/hooks/use-admin-access';
import { formatAdminScopeType } from '@/lib/utils/admin-utils';
import { localizeName } from '@/lib/utils/localize';
import { Plus } from 'lucide-react';
import { GrantDirectCapabilityDialog } from './grant-direct-capability-dialog';

interface DirectAccessPanelProps {
  userPublicId: string;
}

export function DirectAccessPanel({ userPublicId }: DirectAccessPanelProps) {
  const t = useTranslations('admin.users.detail.access.direct');
  const locale = useLocale();
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: grants, isLoading } = useUserDirectGrants(userPublicId);
  const revokeGrant = useRevokeUserCapability();

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
            {grants.map((g) => (
              <div key={g.public_id} className={`flex items-center justify-between text-sm py-2 border-b last:border-b-0 ${g.revoked_at ? 'opacity-60' : ''}`}>
                <div className="flex flex-col gap-0.5">
                  <div>
                    <span className="font-medium">{g.capability ? localizeName(locale, (g.capability as unknown as { name_ar: string; name_en: string }).name_ar, (g.capability as unknown as { name_ar: string; name_en: string }).name_en) : g.public_id}</span>
                    <span className="text-muted-foreground ms-2">
                      {formatAdminScopeType(locale, Number(g.scope_type))}
                    </span>
                  </div>
                  {g.reason && (
                    <span className="text-xs text-muted-foreground">
                      {t('reason')}: {g.reason}
                    </span>
                  )}
                  {g.granted_by && typeof g.granted_by === 'object' && (
                    <span className="text-xs text-muted-foreground">
                      {t('granted_by')}: {localizeName(locale, (g.granted_by as { name_ar: string; name_en: string }).name_ar, (g.granted_by as { name_ar: string; name_en: string }).name_en)}
                    </span>
                  )}
                  {g.granted_at && (
                    <span className="text-xs text-muted-foreground">
                      {t('granted_at')}: <DualDateDisplay gregorian={g.granted_at} hijri={(g as { granted_at_hijri?: string | null }).granted_at_hijri} variant="inline" />
                    </span>
                  )}
                  {g.revoked_at && (
                    <span className="text-xs text-muted-foreground">
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
            ))}
          </div>
        )}
      </CardContent>
      <GrantDirectCapabilityDialog
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
