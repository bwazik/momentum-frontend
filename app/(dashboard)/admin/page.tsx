import { getTranslations } from 'next-intl/server';
import { AdminWorkspace } from '@/components/domain/admin/admin-workspace';

export default async function AdminPage() {
  const t = await getTranslations('admin');
  return (
    <AdminWorkspace title={t('title')} description={t('description')} />
  );
}
