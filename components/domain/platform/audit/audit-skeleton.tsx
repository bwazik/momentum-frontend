import { Skeleton } from '@/components/ui/skeleton';

export function AuditSkeleton() { return <div className="space-y-2">{Array.from({ length: 7 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>; }
