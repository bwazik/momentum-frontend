export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (publicId: string) => [...queryKeys.tasks.details(), publicId] as const,
    slaHealth: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'sla-health'] as const,
    timeline: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'timeline'] as const,
    returns: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'returns'] as const,
    priorities: () => [...queryKeys.tasks.all, 'priorities'] as const,
    comments: (publicId: string) =>
      [...queryKeys.tasks.detail(publicId), 'comments'] as const,
    documents: (taskPublicId: string, filters?: { sort?: 'asc' | 'desc' }) =>
      [...queryKeys.tasks.detail(taskPublicId), 'documents', filters] as const,
  },
  documents: {
    all: ['documents'] as const,
    detail: (documentPublicId: string) =>
      [...queryKeys.documents.all, 'detail', documentPublicId] as const,
    versions: (documentPublicId: string) =>
      [...queryKeys.documents.detail(documentPublicId), 'versions'] as const,
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
    departmentTree: () =>
      [...queryKeys.organization.all, 'departments', 'tree'] as const,
    department: (publicId: string) =>
      [...queryKeys.organization.all, 'departments', 'detail', publicId] as const,
    authorityGrades: () =>
      [...queryKeys.organization.all, 'authority-grades'] as const,
    authorityGrade: (publicId: string) =>
      [...queryKeys.organization.all, 'authority-grades', 'detail', publicId] as const,
    positions: (filters?: Record<string, unknown>) =>
      [...queryKeys.organization.all, 'positions', 'list', filters] as const,
    position: (publicId: string) =>
      [...queryKeys.organization.all, 'positions', 'detail', publicId] as const,
    workingCalendars: () =>
      [...queryKeys.organization.all, 'working-calendars'] as const,
    workingCalendar: (publicId: string) =>
      [...queryKeys.organization.all, 'working-calendars', 'detail', publicId] as const,
    holidays: (calendarPublicId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.organization.all, 'working-calendars', calendarPublicId, 'holidays', filters] as const,
  },
  blueprints: {
    all: ['blueprints'] as const,
    lists: () => [...queryKeys.blueprints.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.blueprints.lists(), filters] as const,
    detail: (publicId: string) => [...queryKeys.blueprints.all, 'detail', publicId] as const,
    transitions: (blueprintId: string) =>
      [...queryKeys.blueprints.detail(blueprintId), 'transitions'] as const,
    categories: () => [...queryKeys.blueprints.all, 'categories'] as const,
    stageTypes: () => [...queryKeys.blueprints.all, 'stage-types'] as const,
    slaPolicies: () => [...queryKeys.blueprints.all, 'sla-policies'] as const,
    stages: (blueprintId: string) => [...queryKeys.blueprints.detail(blueprintId), 'stages'] as const,
    subStages: (blueprintId: string, stageId: string) =>
      [...queryKeys.blueprints.stages(blueprintId), stageId, 'sub-stages'] as const,
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
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: { search: string; is_active?: number; per_page?: number }) =>
      [...queryKeys.users.lists(), filters] as const,
  },
  followUp: {
    all: ['follow-up'] as const,
    overdueLists: () => [...queryKeys.followUp.all, 'overdue'] as const,
    overdueList: (filters: Record<string, unknown>) =>
      [...queryKeys.followUp.overdueLists(), filters] as const,
    atRiskLists: () => [...queryKeys.followUp.all, 'at-risk'] as const,
    atRiskList: (filters: Record<string, unknown>) =>
      [...queryKeys.followUp.atRiskLists(), filters] as const,
    bottlenecks: (filters: Record<string, unknown>) =>
      [...queryKeys.followUp.all, 'bottlenecks', filters] as const,
    actionsAll: (filters: Record<string, unknown>) =>
      [...queryKeys.followUp.all, 'actions', 'all', filters] as const,
    actionsTask: (taskPublicId: string) =>
      [...queryKeys.followUp.all, 'actions', 'task', taskPublicId] as const,
  },
  escalations: {
    all: ['escalations'] as const,
    lists: () => [...queryKeys.escalations.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.escalations.lists(), filters] as const,
    detail: (publicId: string) => [...queryKeys.escalations.all, 'detail', publicId] as const,
  },
} as const;
