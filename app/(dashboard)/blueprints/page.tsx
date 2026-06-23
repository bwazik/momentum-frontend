import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { BlueprintLibrary } from '@/components/domain/blueprints/blueprint-library';
import { CreateBlueprintDialog } from '@/components/domain/blueprints/create-blueprint-dialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default async function BlueprintsPage() {
  const t = await getTranslations('blueprints.library');
  return (
    <main className="flex flex-col gap-4 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/blueprints/catalog"><Settings className="size-4" /> {t('manage_catalog')}</Link>
            </Button>
            <CreateBlueprintDialog />
          </>
        }
      />
      <BlueprintLibrary />
    </main>
  );
}
