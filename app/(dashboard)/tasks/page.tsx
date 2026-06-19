import { getTranslations } from 'next-intl/server';
import { TaskBoard } from '@/components/domain/tasks/task-board';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default async function TasksPage() {
  const t = await getTranslations('tasks.board');
  const nav = await getTranslations('nav');

  return (
    <main className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{nav('dashboard')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <TaskBoard />
    </main>
  );
}
