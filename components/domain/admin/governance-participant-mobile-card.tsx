'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Ban } from 'lucide-react';
import { ActiveBadge } from '@/components/shared/active-badge';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

type GovernanceResource = components['schemas']['ConfidentialGovernanceParticipantResource'];

interface Props {
  item: GovernanceResource;
  canManage: boolean;
  onEdit: () => void;
  onRevoke: () => void;
}

export function GovernanceParticipantMobileCard({ item, canManage, onEdit, onRevoke }: Props) {
  const locale = useLocale();
  const t = useTranslations('confidential.governance');

  const isRevoked = !!item.revoked_at;
  const positionName = localizeName(locale, item.position.title_ar, item.position.title_en);
  const scopeTarget = item.scope_department
    ? localizeName(locale, item.scope_department.name_ar, item.scope_department.name_en)
    : t('scope_tenant_label');

  return (
    <Card className={isRevoked ? 'opacity-75' : ''}>
      <CardContent className="flex items-start justify-between gap-4 pt-4">
        <div className="space-y-1">
          <p className="font-medium">{positionName}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">{t(`scope_${item.scope_type}` as 'scope_tenant')}</Badge>
            <ActiveBadge isActive={!isRevoked} activeLabel={t('active')} inactiveLabel={t('revoked_status')} />
          </div>
          <p className="text-sm text-muted-foreground">{scopeTarget}</p>
        </div>
        {canManage && !isRevoked && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label={t('edit')}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRevoke} className="text-destructive" aria-label={t('revoke')}>
              <Ban className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
