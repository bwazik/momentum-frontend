'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryManager } from './category-manager';
import { StageTypeManager } from './stage-type-manager';
import { SlaPolicyManager } from './sla-policy-manager';
import { useCapability } from '@/lib/api/hooks/use-capabilities';

export function BlueprintCatalog() {
  const t = useTranslations('blueprints.catalog');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canManage = useCapability('blueprint.manage');
  const tab = searchParams.get('tab') ?? 'categories';

  const [openCategory, setOpenCategory] = useState(false);
  const [openStageType, setOpenStageType] = useState(false);
  const [openSlaPolicy, setOpenSlaPolicy] = useState(false);

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={
          canManage ? (
            <Button size="sm" onClick={() => {
              if (tab === 'categories') setOpenCategory(true);
              else if (tab === 'stage-types') setOpenStageType(true);
              else if (tab === 'sla-policies') setOpenSlaPolicy(true);
            }}>
              <Plus className="size-4" /> {t('create')}
            </Button>
          ) : undefined
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn('w-full justify-start', locale === 'ar' && 'flex-row-reverse')}>
          <TabsTrigger value="categories">{t('categories')}</TabsTrigger>
          <TabsTrigger value="stage-types">{t('stage_types')}</TabsTrigger>
          <TabsTrigger value="sla-policies">{t('sla_policies')}</TabsTrigger>
        </TabsList>
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <TabsContent value="categories">
            <CategoryManager openCreate={openCategory} onOpenCreateChange={setOpenCategory} />
          </TabsContent>
          <TabsContent value="stage-types">
            <StageTypeManager openCreate={openStageType} onOpenCreateChange={setOpenStageType} />
          </TabsContent>
          <TabsContent value="sla-policies">
            <SlaPolicyManager openCreate={openSlaPolicy} onOpenCreateChange={setOpenSlaPolicy} />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
