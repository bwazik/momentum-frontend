import { getTranslations } from 'next-intl/server';
import { TaskDetail } from '@/components/domain/tasks/task-detail';
import { TaskTopBarActions } from '@/components/domain/tasks/task-top-bar-actions';
import { PageHeader } from '@/components/shared/page-header';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const t = await getTranslations('tasks.detail');

  return (
    <main className="flex flex-col gap-4 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={<TaskTopBarActions publicId={publicId} />}
      />
      <TaskDetail publicId={publicId} />
    </main>
  );
}
