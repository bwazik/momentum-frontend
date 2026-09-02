'use client';

import { LoginForm, type LoginFormProps } from '@/components/domain/auth/login-form';

export function PlatformLoginForm(props: Omit<LoginFormProps, 'variant'>) {
  return <LoginForm variant="platform" {...props} />;
}

