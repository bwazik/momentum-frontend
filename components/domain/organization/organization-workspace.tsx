'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useDepartmentTree, useAuthorityGrades } from '@/lib/api/hooks/use-organization';
import { OrganizationOverview } from './organization-overview';
import { DepartmentsPanel } from './departments-panel';
import { PositionsPanel } from './positions-panel';
import { AuthorityGradesPanel } from './authority-grades-panel';
import { WorkingCalendarsPanel } from './working-calendars-panel';
import { flattenTree } from './organization-utils';
import { DepartmentFormDialog } from './department-form-dialog';
import { PositionFormDialog } from './position-form-dialog';
import { AuthorityGradeFormDialog } from './authority-grade-form-dialog';
import { WorkingCalendarFormDialog } from './working-calendar-form-dialog';

const TABS = ['overview', 'departments', 'positions', 'grades', 'calendars'] as const;
type Tab = (typeof TABS)[number];

interface OrganizationWorkspaceProps {
  title: string;
  description: string;
}

export function OrganizationWorkspace({ title, description }: OrganizationWorkspaceProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get('tab') ?? 'overview';
  const tab: Tab = (TABS as readonly string[]).includes(raw) ? (raw as Tab) : 'overview';

  const canManage = useCapability('organization.manage');
  const tree = useDepartmentTree();
  const grades = useAuthorityGrades();

  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const [createPosOpen, setCreatePosOpen] = useState(false);
  const [createGradeOpen, setCreateGradeOpen] = useState(false);
  const [createCalOpen, setCreateCalOpen] = useState(false);

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleAdd() {
    switch (tab) {
      case 'departments': setCreateDeptOpen(true); break;
      case 'positions': setCreatePosOpen(true); break;
      case 'grades': setCreateGradeOpen(true); break;
      case 'calendars': setCreateCalOpen(true); break;
    }
  }

  const addLabels: Record<string, string | undefined> = {
    overview: undefined,
    departments: t('departments.add'),
    positions: t('actions.add_position'),
    grades: t('grades.add'),
    calendars: t('actions.add_calendar'),
  };

  return (
    <main className="flex flex-col gap-4 p-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          canManage && tab !== 'overview' ? (
            <Button size="sm" onClick={handleAdd}>
              <Plus className="size-4" /> {addLabels[tab]}
            </Button>
          ) : undefined
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn('w-full justify-start', locale === 'ar' && 'flex-row-reverse')}>
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="departments">{t('tabs.departments')}</TabsTrigger>
          <TabsTrigger value="positions">{t('tabs.positions')}</TabsTrigger>
          <TabsTrigger value="grades">{t('tabs.grades')}</TabsTrigger>
          <TabsTrigger value="calendars">{t('tabs.calendars')}</TabsTrigger>
        </TabsList>
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <TabsContent value="overview"><OrganizationOverview /></TabsContent>
          <TabsContent value="departments"><DepartmentsPanel /></TabsContent>
          <TabsContent value="positions"><PositionsPanel /></TabsContent>
          <TabsContent value="grades"><AuthorityGradesPanel /></TabsContent>
          <TabsContent value="calendars"><WorkingCalendarsPanel /></TabsContent>
        </div>
      </Tabs>

      {canManage && (
        <>
          <DepartmentFormDialog open={createDeptOpen} onOpenChange={setCreateDeptOpen} tree={tree.data ?? []} />
          <PositionFormDialog open={createPosOpen} onOpenChange={setCreatePosOpen} departments={flattenTree(tree.data ?? [])} grades={grades.data ?? []} positions={[]} />
          <AuthorityGradeFormDialog open={createGradeOpen} onOpenChange={setCreateGradeOpen} />
          <WorkingCalendarFormDialog open={createCalOpen} onOpenChange={setCreateCalOpen} />
        </>
      )}
    </main>
  );
}
