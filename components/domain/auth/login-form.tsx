'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useLogin } from '@/lib/api/hooks/use-auth';
import { usePlatformLogin } from '@/lib/api/hooks/use-platform';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface LoginFormProps extends React.ComponentProps<'div'> {
  variant?: 'tenant' | 'platform';
  redirectTo?: string;
  title?: string;
  showForgotPassword?: boolean;
  showSignUp?: boolean;
  showTerms?: boolean;
}

export function LoginForm({
  className,
  variant = 'tenant',
  redirectTo = '/',
  title,
  showForgotPassword = variant === 'tenant',
  showSignUp = variant === 'tenant',
  showTerms = variant === 'tenant',
  ...props
}: LoginFormProps) {
  const router = useRouter();
  const t = useTranslations('auth.login');
  const tenantLogin = useLogin();
  const platformLogin = usePlatformLogin();
  const isPlatform = variant === 'platform';
  const activeLogin = isPlatform ? platformLogin : tenantLogin;

  const loginSchema = z.object({
    email: z.string().email(t('email_invalid')),
    password: z.string().min(1, t('password_required')),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  function onSubmit(values: LoginFormValues) {
    if (isPlatform) {
      platformLogin.mutate(values, {
        onSuccess: () => {
          router.push(redirectTo);
        },
      });
    } else {
      tenantLogin.mutate(values, {
        onSuccess: () => {
          toast.success(t('success'));
          router.push(redirectTo);
        },
        onError: () => {
          toast.error(t('error'));
        },
      });
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{title ?? t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">{t('email')}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder={t('email_placeholder')}
                  {...form.register('email')}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
                  {showForgotPassword && (
                    <button
                      type="button"
                      onClick={() => toast.info(t('forgot_password_toast'))}
                      className="ms-auto text-sm underline-offset-4 hover:underline cursor-pointer"
                    >
                      {t('forgot_password')}
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  placeholder={t('password_placeholder')}
                  {...form.register('password')}
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={activeLogin.isPending}>
                  {activeLogin.isPending && <Spinner data-icon="inline-start" />}
                  {activeLogin.isPending ? t('submitting') : t('submit')}
                </Button>
                {showSignUp && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t('no_account')}{' '}
                    <button
                      type="button"
                      onClick={() => toast.info(t('forgot_password_toast'))}
                      className="underline-offset-4 hover:underline cursor-pointer"
                    >
                      {t('sign_up')}
                    </button>
                  </p>
                )}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      {showTerms && (
        <FieldDescription className="px-6 text-center">
          {t('terms_prefix')}{' '}
          <span className="underline underline-offset-4">{t('terms')}</span>
          {' '}{t('terms_and')}{' '}
          <span className="underline underline-offset-4">{t('privacy')}</span>
        </FieldDescription>
      )}
    </div>
  );
}
