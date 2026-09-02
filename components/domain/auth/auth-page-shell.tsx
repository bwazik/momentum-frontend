import { AppBrand } from '@/components/shared/app-brand';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { ModeToggle } from '@/components/theme-toggle';

interface AuthPageShellProps {
  appName?: string;
  children: React.ReactNode;
}

export function AuthPageShell({ appName = 'Momentum', children }: AuthPageShellProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <AppBrand appName={appName} />
        {children}
        <div className="flex items-center justify-center gap-2">
          <LocaleToggle />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
