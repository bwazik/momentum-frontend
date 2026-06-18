import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('placeholder');
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">{t('dashboard')}</p>
    </div>
  );
}
