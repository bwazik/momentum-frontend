import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { AgingReport } from '@/components/domain/analytics/aging-report';

export default async function AgingReportPage() {
  const t = await getTranslations('analytics.aging');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('title')} description={t('description')} />
      <AgingReport />
    </main>
  );
}
