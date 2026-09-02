import { Skeleton } from '@/components/ui/skeleton';

export function ImpersonationSessionsSkeleton() { return <div className="space-y-2">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>; }
