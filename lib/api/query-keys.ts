export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (publicId: string) => [...queryKeys.tasks.details(), publicId] as const,
    priorities: () => [...queryKeys.tasks.all, 'priorities'] as const,
  },
  taskBoard: {
    all: ['task-board'] as const,
    lists: () => [...queryKeys.taskBoard.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.taskBoard.lists(), filters] as const,
  },
  organization: {
    all: ['organization'] as const,
    departments: (filters?: Record<string, unknown>) =>
      [...queryKeys.organization.all, 'departments', filters] as const,
  },
  blueprints: {
    all: ['blueprints'] as const,
    lists: () => [...queryKeys.blueprints.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.blueprints.lists(), filters] as const,
    detail: (publicId: string) => [...queryKeys.blueprints.all, 'detail', publicId] as const,
    categories: () => [...queryKeys.blueprints.all, 'categories'] as const,
    stageTypes: () => [...queryKeys.blueprints.all, 'stage-types'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
    capabilities: (userPublicId: string) => ['auth', 'capabilities', userPublicId] as const,
  },
  tenant: {
    info: ['tenant', 'info'] as const,
  },
} as const;
