import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { ExecutiveDashboardFilters } from '@/components/domain/analytics/executive-dashboard-filters';
import { ExecutiveDashboard } from '@/components/domain/analytics/executive-dashboard';

export default async function DashboardPage() {
  const t = await getTranslations('analytics.executive');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<ExecutiveDashboardFilters />}
      />
      <ExecutiveDashboard />
    </main>
  );
}
