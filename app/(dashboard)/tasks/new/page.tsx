import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { TaskCreationForm } from '@/components/domain/tasks/task-creation-form';
import { TaskCancelButton } from '@/components/domain/tasks/task-cancel-button';

export default async function TaskNewPage() {
  const t = await getTranslations('tasks.new');

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<TaskCancelButton href="/tasks" />}
      />
      <TaskCreationForm mode="create" />
    </div>
  );
}
