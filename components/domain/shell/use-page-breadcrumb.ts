import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTaskDisplayStore } from '@/lib/stores/use-task-display-store';
import { useBlueprintBuilderStore } from '@/lib/stores/use-blueprint-builder-store';

export interface Crumb {
  label: string;
  href?: string;
}

export function usePageBreadcrumb(): Crumb[] | null {
  const pathname = usePathname();
  const nav = useTranslations('nav');

  const displayId = useTaskDisplayStore((s) => s.displayId);
  const blueprintName = useBlueprintBuilderStore((s) => s.blueprintName);

  const taskWorkflow = pathname.match(/^\/tasks\/([^/]+)\/workflow$/);
  if (taskWorkflow) {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('tasks'), href: '/tasks' },
      { label: displayId || '...', href: `/tasks/${taskWorkflow[1]}` },
      { label: nav('label_workflow') },
    ];
  }

  const taskDetail = pathname.match(/^\/tasks\/(.+)$/);
  if (taskDetail) {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('tasks'), href: '/tasks' },
      { label: displayId || '...' },
    ];
  }

  if (pathname === '/tasks') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('tasks') },
    ];
  }

  const blueprintDetail = pathname.match(/^\/blueprints\/([^/]+)$/);
  if (blueprintDetail && blueprintDetail[1] !== 'catalog') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('blueprints'), href: '/blueprints' },
      { label: blueprintName || '...' },
    ];
  }

  if (pathname === '/blueprints/catalog') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('blueprints'), href: '/blueprints' },
      { label: nav('blueprint_catalog') },
    ];
  }

  if (pathname === '/blueprints') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('blueprints') },
    ];
  }

  if (pathname === '/analytics') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('analytics') },
    ];
  }

  if (pathname === '/follow-up') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('follow_up') },
    ];
  }

  return null;
}
