'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/domain/auth/login-form';
import { AuthPageShell } from '@/components/domain/auth/auth-page-shell';
import { usePlatformAuth } from '@/lib/api/hooks/use-platform';

export default function PlatformLoginPage() {
  const router = useRouter();
  const t = useTranslations('platform');
  const { data: admin, isFetched } = usePlatformAuth();
  const redirected = useRef(false);

  useEffect(() => {
    if (isFetched && admin && !redirected.current) {
      redirected.current = true;
      router.push('/platform');
    }
  }, [isFetched, admin, router]);

  return (
    <AuthPageShell appName={t('brand_name')}>
      <LoginForm variant="platform" redirectTo="/platform" />
    </AuthPageShell>
  );
}


