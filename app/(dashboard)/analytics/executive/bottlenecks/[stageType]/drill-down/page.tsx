import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { ExecutiveBottleneckDrillDownList } from '@/components/domain/analytics/executive-bottleneck-drill-down-list';

interface Props {
  params: Promise<{ stageType: string }>;
}

export default async function ExecutiveBottleneckDrillDownPage({ params }: Props) {
  const { stageType } = await params;
  const t = await getTranslations('analytics.executive');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('bottleneck_drill_down_title')} description={t('drill_down_description')} />
      <ExecutiveBottleneckDrillDownList stageType={stageType} />
    </main>
  );
}
