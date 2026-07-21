'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserDirectGrants } from '@/lib/api/hooks/use-admin-access';

interface EffectiveCapabilitiesListProps {
  userPublicId: string;
}

export function EffectiveCapabilitiesList({ userPublicId }: EffectiveCapabilitiesListProps) {
  const t = useTranslations('admin.users.detail.access');
  const { data: grants, isLoading } = useUserDirectGrants(userPublicId);

  if (isLoading) return <div className="text-sm text-muted-foreground">{t('loading')}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('effective_capabilities')}</CardTitle>
      </CardHeader>
      <CardContent>
        {!grants || grants.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('no_effective')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {grants.map((g) => (
              <span key={g.capability?.key ?? g.public_id} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {g.capability?.key ?? g.public_id}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
