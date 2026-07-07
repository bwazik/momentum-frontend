'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/domain/auth/login-form';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { ModeToggle } from '@/components/theme-toggle';
import { AppBrand } from '@/components/shared/app-brand';
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <AppBrand appName={appName} />
        <LoginForm />
        <div className="flex items-center justify-center gap-2">
          <LocaleToggle />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
