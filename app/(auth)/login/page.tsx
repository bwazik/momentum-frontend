'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { LoginForm } from '@/components/domain/auth/login-form';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { ModeToggle } from '@/components/theme-toggle';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useBrandName } from '@/lib/utils/use-brand-name';

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
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          {appName}
        </Link>
        <LoginForm />
        <div className="flex items-center justify-center gap-2">
          <LocaleToggle />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
