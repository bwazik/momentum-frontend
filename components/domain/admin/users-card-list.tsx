'use client';

import type { components } from '@/lib/generated/api-types';
import { UsersMobileCard } from './users-mobile-card';

type UserResource = components['schemas']['UserResource'];

interface UsersCardListProps {
  users: UserResource[];
  onSelect: (publicId: string) => void;
}

export function UsersCardList({ users, onSelect }: UsersCardListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {users.map((user) => (
        <UsersMobileCard key={user.public_id} user={user} onSelect={onSelect} />
      ))}
    </div>
  );
}
