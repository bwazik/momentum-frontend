'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/domain/auth/login-form';
import { AuthPageShell } from '@/components/domain/auth/auth-page-shell';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useBrandName } from '@/lib/api/hooks/use-brand-name';

export default function LoginPage() {
  const router = useRouter();
  const { data: user, isFetched } = useCurrentUser();
  const redirected = useRef(false);
  const appName = useBrandName();

  useEffect(() => {
    if (isFetched && user && !redirected.current) {
      redirected.current = true;
      router.push('/');
    }
  }, [isFetched, user, router]);

  return (
    <AuthPageShell appName={appName}>
      <LoginForm />
    </AuthPageShell>
  );
}

