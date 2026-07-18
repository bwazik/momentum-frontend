export const extraQueryKeys = {
  search: {
    all: ['search'] as const,
    recent: () => [...extraQueryKeys.search.all, 'recent'] as const,
    list: (params: Record<string, unknown>) => [...extraQueryKeys.search.all, 'list', params] as const,
  },
  iam: {
    governanceParticipants: (filters?: Record<string, unknown>) =>
      ['iam', 'governance-participants', filters] as const,
  },
} as const;
