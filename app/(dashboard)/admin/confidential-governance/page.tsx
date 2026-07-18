'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { GovernanceParticipantsManager } from '@/components/domain/admin/governance-participants-manager';

export default function ConfidentialGovernancePage() {
  const t = useTranslations('confidential.governance');
  const canManage = useCapability('iam.manage_capabilities');
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={canManage ? (
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <Plus className="size-4" /> {t('add_rule')}
          </Button>
        ) : undefined}
      />
      <GovernanceParticipantsManager openCreate={openCreate} onOpenCreateChange={setOpenCreate} />
    </main>
  );
}
