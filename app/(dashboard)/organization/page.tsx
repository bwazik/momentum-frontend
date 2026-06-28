import { getTranslations } from 'next-intl/server';
import { OrganizationWorkspace } from '@/components/domain/organization/organization-workspace';

export default async function OrganizationPage() {
  const t = await getTranslations('organization');
  return (
    <OrganizationWorkspace title={t('page_title')} description={t('page_description')} />
  );
}
