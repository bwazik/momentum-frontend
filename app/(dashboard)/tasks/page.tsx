import { getTranslations } from 'next-intl/server';
import { TaskBoard } from '@/components/domain/tasks/task-board';
import { PageHeader } from '@/components/shared/page-header';

export default async function TasksPage() {
  const t = await getTranslations('tasks.board');

  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('title')} description={t('description')} />
      <TaskBoard />
    </main>
  );
}
