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
  const analytics = useTranslations('analytics');

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

  const metricDrillDown = pathname.match(/^\/analytics\/executive\/drill-down\/([^/]+)$/);
  if (metricDrillDown) {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('analytics'), href: '/analytics' },
      { label: analytics(`executive.drill_down_title_${metricDrillDown[1]}`) },
    ];
  }

  const bottleneckDrillDown = pathname.match(/^\/analytics\/executive\/bottlenecks\/([^/]+)\/drill-down$/);
  if (bottleneckDrillDown) {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('analytics'), href: '/analytics' },
      { label: analytics('executive.bottleneck_drill_down_title') },
    ];
  }

  if (pathname === '/') {
    return [
      { label: nav('dashboard') },
    ];
  }

  if (pathname === '/analytics') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('analytics') },
    ];
  }

  if (pathname.startsWith('/analytics/')) {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('analytics'), href: '/analytics' },
      { label: analytics('aging.title') },
    ];
  }

  if (pathname === '/follow-up') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('follow_up') },
    ];
  }

  if (pathname === '/admin/external-entities') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('external_entities') },
    ];
  }

  return null;
}
