'use client';

import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/domain/auth/login-form';
import { AuthPageShell } from '@/components/domain/auth/auth-page-shell';

export default function PlatformLoginPage() {
  const t = useTranslations('platform');

  return (
    <AuthPageShell appName={t('brand_name')}>
      <LoginForm variant="platform" redirectTo="/platform" />
    </AuthPageShell>
  );
}


