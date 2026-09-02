'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Play, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from '@/components/shared/active-badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import {
  usePlatformTenant,
  useReactivateTenant,
  useRunTenantMigrations,
  useSuspendTenant,
} from '@/lib/api/hooks/use-platform';
import { localizeName } from '@/lib/utils/platform-utils';
import { usePlatformTenantDisplayStore } from '@/lib/stores/use-platform-tenant-store';
import { ImpersonateUserDialog } from '../impersonation/impersonate-user-dialog';
import { TenantDetailSkeleton } from './tenant-detail-skeleton';

export function TenantDetailView({ publicId }: { publicId: string }) {
  const t = useTranslations('platform.tenants');
  const c = useTranslations('platform.common');
  const locale = useLocale();

  const query = usePlatformTenant(publicId);
  const tenant = query.data;
  const suspend = useSuspendTenant(publicId);
  const reactivate = useReactivateTenant(publicId);
  const migrations = useRunTenantMigrations(publicId);

  const [confirm, setConfirm] = useState(false);
  const [impersonate, setImpersonate] = useState(false);

  const setTenantName = usePlatformTenantDisplayStore((s) => s.setTenantName);

  useEffect(() => {
    if (tenant) {
      setTenantName(localizeName(locale, tenant.name_ar, tenant.name_en) || tenant.slug);
    }
    return () => setTenantName('');
  }, [tenant, locale, setTenantName]);

  if (query.isLoading) return <TenantDetailSkeleton />;
  if (query.isError || !tenant) return <ErrorState onRetry={() => query.refetch()} />;

  const settings = JSON.stringify(tenant.settings, null, 2);

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title={localizeName(locale, tenant.name_ar, tenant.name_en)}
        description={t('detail_description')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/?tab=tenants">
                <ArrowLeft data-icon="inline-start" className="size-4 rtl:rotate-180" />
                {t('back_to_tenants')}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImpersonate(true)}>
              <UserRound className="size-4" />
              {t('impersonate')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => migrations.mutate(undefined)}
              disabled={migrations.isPending}
            >
              <Play className="size-4" />
              {t('run_migrations')}
            </Button>
            {tenant.is_active ? (
              <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>
                {c('suspend')}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => reactivate.mutate(undefined)}
                disabled={reactivate.isPending}
              >
                {c('reactivate')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('name')}</p>
              <p className="font-medium">{localizeName(locale, tenant.name_ar, tenant.name_en)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('slug')}</p>
              <p className="font-mono text-sm">{tenant.slug}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('status')}</p>
              <ActiveBadge
                isActive={tenant.is_active}
                activeLabel={c('active')}
                inactiveLabel={c('inactive')}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('domain')}</p>
              <p className="font-mono text-sm">
                {tenant.domain ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('timezone')}</p>
              <p className="font-mono text-sm">
                {tenant.timezone ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('created_at')}</p>
              <DualDateDisplay gregorian={tenant.created_at} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-4" />
              {t('database')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('database')}</p>
              <p className="font-mono text-sm">
                {tenant.database_name ?? t('not_available')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('settings')}</p>
              <pre
                dir="ltr"
                className="max-h-48 overflow-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground text-start"
              >
                {settings}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t('confirm_suspend_title')}
        description={t('confirm_suspend_description')}
        confirmLabel={c('suspend')}
        onConfirm={() =>
          suspend.mutate(undefined, { onSuccess: () => setConfirm(false) })
        }
        isPending={suspend.isPending}
      />

      <ImpersonateUserDialog
        tenantPublicId={publicId}
        open={impersonate}
        onOpenChange={setImpersonate}
      />
    </div>
  );
}
