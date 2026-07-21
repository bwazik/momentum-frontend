'use client';

import type { AuditEvent } from '@/lib/utils/audit-utils';
import { AuditEventCard } from './audit-event-card';

interface AuditEventCardListProps {
  events: AuditEvent[];
}

export function AuditEventCardList({ events }: AuditEventCardListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {events.map((event) => (
        <AuditEventCard key={event.public_id} event={event} />
      ))}
    </div>
  );
}
