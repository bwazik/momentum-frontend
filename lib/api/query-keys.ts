export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (publicId: string) => [...queryKeys.tasks.details(), publicId] as const,
  },
  blueprints: {
    all: ['blueprints'] as const,
    lists: () => [...queryKeys.blueprints.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.blueprints.lists(), filters] as const,
    detail: (publicId: string) => [...queryKeys.blueprints.all, 'detail', publicId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filter?: string) => [...queryKeys.notifications.all, 'list', filter] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
    capabilities: ['auth', 'capabilities'] as const,
  },
} as const;
