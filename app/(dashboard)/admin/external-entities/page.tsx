'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { ExternalEntityManager } from '@/components/domain/tasks/external-entity-manager';

export default function ExternalEntitiesPage() {
  const t = useTranslations('tasks.entities');
  const canManage = useCapability('task.manage_external_entities');
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={canManage ? (
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <Plus className="size-4" /> {t('create_entity')}
          </Button>
        ) : undefined}
      />
      <ExternalEntityManager openCreate={openCreate} onOpenCreateChange={setOpenCreate} />
    </main>
  );
}
