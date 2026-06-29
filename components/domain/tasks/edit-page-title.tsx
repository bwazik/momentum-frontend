'use client';

import { useTranslations } from 'next-intl';
import { useTaskDisplayStore } from '@/lib/stores/use-task-display-store';

export function EditPageTitle() {
  const t = useTranslations('tasks.new');
  const displayId = useTaskDisplayStore((s) => s.displayId);

  return <>{t('edit_title_draft', { id: displayId || '...' })}</>;
}
