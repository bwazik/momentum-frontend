import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { TaskBoard } from '@/components/domain/tasks/task-board';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function TasksPage() {
  const t = await getTranslations('tasks.board');
  const tn = await getTranslations('tasks.new');

  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="size-4" data-icon="inline-start" />
              {tn('create_task')}
            </Link>
          </Button>
        }
      />
      <TaskBoard />
    </main>
  );
}
