import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { ExecutiveDrillDownList } from '@/components/domain/analytics/executive-drill-down-list';

interface Props {
  params: Promise<{ metric: string }>;
}

export default async function ExecutiveDrillDownPage({ params }: Props) {
  const { metric } = await params;
  const t = await getTranslations('analytics.executive');
  const metricKey = `drill_down_title_${metric}`;
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t(metricKey)} description={t('drill_down_description')} />
      <ExecutiveDrillDownList metric={metric} />
    </main>
  );
}
