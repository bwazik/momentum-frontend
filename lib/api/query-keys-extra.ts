export const extraQueryKeys = {
  search: {
    all: ['search'] as const,
    recent: () => [...extraQueryKeys.search.all, 'recent'] as const,
    list: (params: Record<string, unknown>) => [...extraQueryKeys.search.all, 'list', params] as const,
  },
} as const;
