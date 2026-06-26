import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { FollowUpCenter } from '@/components/domain/follow-up/follow-up-center';

export default async function FollowUpPage() {
  const t = await getTranslations('followUp');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('title')} description={t('description')} />
      <FollowUpCenter />
    </main>
  );
}
