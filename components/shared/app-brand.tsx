import Link from 'next/link';
import { Zap } from 'lucide-react';

interface AppBrandProps {
  appName: string;
}

export function AppBrand({ appName }: AppBrandProps) {
  return (
    <Link href="/" className="flex items-center gap-2 self-center font-medium">
      <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Zap className="size-4" />
      </div>
      {appName}
    </Link>
  );
}
