import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { TaskCreationForm } from '@/components/domain/tasks/task-creation-form';
import { TaskEditActions } from '@/components/domain/tasks/task-edit-actions';
import { EditPageTitle } from '@/components/domain/tasks/edit-page-title';

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const t = await getTranslations('tasks.new');

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={<EditPageTitle />}
        description={t('description')}
        actions={<TaskEditActions publicId={publicId} />}
      />
      <TaskCreationForm mode="edit" publicId={publicId} />
    </div>
  );
}
