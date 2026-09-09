import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../query-keys';
import type { CursorPage } from '../types';
import type {
  HelpArticleCategory,
  HelpArticle,
  HelpArticleDetail,
  HelpArticleSearchResult,
  HelpArticleDocument,
  HelpArticleFilters,
  HelpArticleSearchFilters,
  StoreHelpArticleRequest,
  UpdateHelpArticleRequest,
  StoreHelpCategoryRequest,
  UpdateHelpCategoryRequest,
  ReorderHelpCategoriesRequest,
} from '../types/help-center-types';

/** Fetch all active categories (manage users see inactive as well) */
export function useHelpCategories() {
  return useQuery({
    queryKey: queryKeys.helpCenter.categories(),
    queryFn: () => apiClient.get<HelpArticleCategory[]>('/v1/help-center/categories'),
    staleTime: 300_000,
  });
}

/** Fetch cursor-paginated help articles */
export function useHelpArticlesInfinite(filters: HelpArticleFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.helpCenter.articleList(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<HelpArticle>>('/v1/help-center/articles', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });
}

/** Fetch single article detail with body */
export function useHelpArticle(publicId: string) {
  return useQuery({
    queryKey: queryKeys.helpCenter.detail(publicId),
    queryFn: () => apiClient.get<HelpArticleDetail>(`/v1/help-center/articles/${publicId}`),
    enabled: !!publicId,
  });
}

/** Full-text search with cursor pagination */
export function useHelpArticleSearch(filters: HelpArticleSearchFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.helpCenter.search(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<HelpArticleSearchResult>>('/v1/help-center/search', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    enabled: filters.q.trim().length >= 2,
  });
}

/** Article attachments hook */
export function useHelpArticleDocuments(articlePublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.helpCenter.documents(articlePublicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<HelpArticleDocument>>(`/v1/help-center/articles/${articlePublicId}/documents`, {
        params: { cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    enabled: !!articlePublicId,
  });
}

/** Mutations */
export function useCreateHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StoreHelpArticleRequest) =>
      apiClient.post<HelpArticleDetail>('/v1/help-center/articles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() });
    },
  });
}

export function useUpdateHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: UpdateHelpArticleRequest }) =>
      apiClient.put<HelpArticleDetail>(`/v1/help-center/articles/${publicId}`, data),
    onSuccess: (updated, { publicId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.setQueryData(queryKeys.helpCenter.detail(publicId), updated);
    },
  });
}

export function usePublishHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<HelpArticleDetail>(`/v1/help-center/articles/${publicId}/publish`),
    onSuccess: (_, publicId) => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() });
    },
  });
}

export function useUnpublishHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<HelpArticleDetail>(`/v1/help-center/articles/${publicId}/unpublish`),
    onSuccess: (_, publicId) => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() });
    },
  });
}

export function useDeleteHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/help-center/articles/${publicId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() });
    },
  });
}

export function useCreateHelpCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StoreHelpCategoryRequest) =>
      apiClient.post<HelpArticleCategory>('/v1/help-center/categories', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() }),
  });
}

export function useUpdateHelpCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: UpdateHelpCategoryRequest }) =>
      apiClient.put<HelpArticleCategory>(`/v1/help-center/categories/${publicId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() }),
  });
}

export function useReorderHelpCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderHelpCategoriesRequest['categories']) =>
      apiClient.put('/v1/help-center/categories/reorder', { categories: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() }),
  });
}

export function useDeleteHelpCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/help-center/categories/${publicId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() }),
  });
}

export function useUploadHelpArticleDocument(articlePublicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post(`/v1/help-center/articles/${articlePublicId}/documents`, formData),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.documents(articlePublicId) }),
  });
}

export function useDeleteHelpArticleDocument(articlePublicId: string) {
  const qc = useQueryClient();
  return useMutation({
    // MOCK: Pending backend implementation of DELETE /v1/help-center/articles/{article}/documents/{document}
    mutationFn: (documentPublicId: string) =>
      apiClient.delete(`/v1/help-center/articles/${articlePublicId}/documents/${documentPublicId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.documents(articlePublicId) }),
  });
}

