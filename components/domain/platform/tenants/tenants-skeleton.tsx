import { Skeleton } from '@/components/ui/skeleton';

export function TenantsSkeleton() { return <div className="space-y-2">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>; }
