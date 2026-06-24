import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { WorkflowVisualization } from '@/components/domain/tasks/workflow-visualization';

export default async function TaskWorkflowPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const t = await getTranslations('tasks.workflow');

  return (
    <main className="flex flex-col gap-4 overflow-x-hidden p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tasks/${publicId}`}>
              <ArrowLeft data-icon="inline-start" className="size-4 rtl:rotate-180" />
              {t('back_to_details')}
            </Link>
          </Button>
        }
      />
      <WorkflowVisualization publicId={publicId} />
    </main>
  );
}
