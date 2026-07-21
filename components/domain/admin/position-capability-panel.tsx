'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { usePositions } from '@/lib/api/hooks/use-organization';
import { usePositionCapabilities, useRevokePositionCapability } from '@/lib/api/hooks/use-admin-access';
import { localizeName } from '@/lib/utils/localize';
import { formatAdminScopeType } from '@/lib/utils/admin-utils';
import { Plus } from 'lucide-react';
import { GrantCapabilityDialog } from './grant-capability-dialog';

export function PositionCapabilityPanel() {
  const t = useTranslations('admin.access.position');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const selectedPositionId = sp.get('selectedPositionId') ?? '';
  const { data: positionsPage } = usePositions({ is_active: true });
  const { data: grants, isLoading } = usePositionCapabilities(selectedPositionId || null);
  const revokeGrant = useRevokePositionCapability();

  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const allPositions = positionsPage?.pages.flatMap((p) => p.data) ?? [];

  function setSelectedPosition(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== 'all') params.set('selectedPositionId', value);
    else params.delete('selectedPositionId');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RtlSelect value={selectedPositionId} onValueChange={setSelectedPosition}>
          <SelectTrigger className="w-full"><SelectValue placeholder={t('position_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            {allPositions.filter((p) => String(p.is_active) !== 'false').map((p) => (
              <SelectItem key={p.public_id} value={p.public_id}>
                {localizeName(locale, p.title_ar, p.title_en)}
              </SelectItem>
            ))}
          </SelectContent>
        </RtlSelect>

        {selectedPositionId && (
          <>
            <Button className="w-full" size="sm" onClick={() => setGrantOpen(true)}>
              <Plus className="size-4" />
              {t('add_grant')}
            </Button>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t('loading')}</p>
            ) : !grants || grants.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('no_grants')}</p>
            ) : (
              <div className="space-y-2">
                {grants.map((g) => (
                  <div key={g.public_id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium">{g.capability?.name_ar ?? g.capability?.key}</span>
                      <span className="text-muted-foreground ms-2">
                        {formatAdminScopeType(locale, Number(g.scope_type))}
                      </span>
                    </div>
                    {!g.revoked_at && (
                      <Button variant="outline" size="sm" className="border-destructive/30 text-destructive" onClick={() => setRevokeId(g.public_id)}>
                        {t('revoke')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
      <GrantCapabilityDialog
        positionPublicId={selectedPositionId}
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
          if (revokeId) revokeGrant.mutate({ grantPublicId: revokeId, positionPublicId: selectedPositionId });
          setRevokeId(null);
        }}
        isPending={revokeGrant.isPending}
      />
    </Card>
  );
}
