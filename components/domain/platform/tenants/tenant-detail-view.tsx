'use client';

import { useState } from 'react';
import { ArrowLeft, Database, Play, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from '@/components/shared/active-badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { usePlatformTenant, useReactivateTenant, useRunTenantMigrations, useSuspendTenant } from '@/lib/api/hooks/use-platform';
import { localizeName } from '@/lib/utils/platform-utils';
import { ImpersonateUserDialog } from '../impersonation/impersonate-user-dialog';
import { TenantDetailSkeleton } from './tenant-detail-skeleton';

export function TenantDetailView({ publicId }: { publicId: string }) {
  const t = useTranslations('platform.tenants'); const c = useTranslations('platform.common'); const locale = useLocale(); const router = useRouter();
  const query = usePlatformTenant(publicId); const tenant = query.data; const suspend = useSuspendTenant(publicId); const reactivate = useReactivateTenant(publicId); const migrations = useRunTenantMigrations(publicId); const [confirm, setConfirm] = useState(false); const [impersonate, setImpersonate] = useState(false);
  if (query.isLoading) return <TenantDetailSkeleton />;
  if (query.isError || !tenant) return <ErrorState onRetry={() => query.refetch()} />;
  const settings = JSON.stringify(tenant.settings, null, 2);
  return <div className="space-y-4"><Button variant="ghost" onClick={() => router.push('/')}><ArrowLeft className="rtl:rotate-180" />{t('open')}</Button><PageHeader title={localizeName(locale, tenant.name_ar, tenant.name_en)} description={tenant.slug} actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setImpersonate(true)}><UserRound />{t('impersonate')}</Button><Button variant="outline" onClick={() => migrations.mutate(undefined)} disabled={migrations.isPending}><Play />{t('run_migrations')}</Button>{tenant.is_active ? <Button variant="destructive" onClick={() => setConfirm(true)}>{c('suspend')}</Button> : <Button onClick={() => reactivate.mutate(undefined)} disabled={reactivate.isPending}>{c('reactivate')}</Button>}</div>} /><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>{t('profile')}</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-muted-foreground">{t('name')}</p><p>{localizeName(locale, tenant.name_ar, tenant.name_en)}</p></div><div><p className="text-muted-foreground">{t('status')}</p><ActiveBadge isActive={tenant.is_active} activeLabel={c('active')} inactiveLabel={c('inactive')} /></div><div><p className="text-muted-foreground">{t('domain')}</p><p dir="ltr">{tenant.domain ?? '-'}</p></div><div><p className="text-muted-foreground">{t('timezone')}</p><p dir="ltr">{tenant.timezone ?? '-'}</p></div><div><p className="text-muted-foreground">{t('created_at')}</p><DualDateDisplay gregorian={tenant.created_at} /></div></CardContent></Card><Card><CardHeader><CardTitle><Database className="me-2 inline size-4" />{t('database')}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p dir="ltr">{tenant.database_name ?? t('not_available')}</p><pre dir="ltr" className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">{settings}</pre></CardContent></Card></div><ConfirmDeleteDialog open={confirm} onOpenChange={setConfirm} title={t('confirm_suspend_title')} description={t('confirm_suspend_description')} confirmLabel={c('suspend')} onConfirm={() => suspend.mutate(undefined, { onSuccess: () => setConfirm(false) })} isPending={suspend.isPending} /><ImpersonateUserDialog tenantPublicId={publicId} open={impersonate} onOpenChange={setImpersonate} /></div>;
}
