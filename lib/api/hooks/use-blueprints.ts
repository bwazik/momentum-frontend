'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { components } from '@/lib/generated/api-types';
import type { CursorPage } from '@/lib/api/types';

type BlueprintResource = components['schemas']['BlueprintResource'];
type BlueprintCategoryResource = components['schemas']['BlueprintCategoryResource'];
type StageTypeResource = components['schemas']['StageTypeResource'];
type SlaPolicyResource = components['schemas']['SlaPolicyResource'];
type BlueprintStageResource = components['schemas']['BlueprintStageResource'];
type BlueprintSubStageResource = components['schemas']['BlueprintSubStageResource'];
type BlueprintTransitionResource = components['schemas']['BlueprintTransitionResource'];
type StoreBlueprintRequest = components['schemas']['StoreBlueprintRequest'];
type UpdateBlueprintRequest = components['schemas']['UpdateBlueprintRequest'];
type StoreBlueprintStageRequest = components['schemas']['StoreBlueprintStageRequest'];
type StoreBlueprintSubStageRequest = components['schemas']['StoreBlueprintSubStageRequest'];
type StoreBlueprintTransitionRequest = components['schemas']['StoreBlueprintTransitionRequest'];

// --- Catalog reference data ---

export function useBlueprintCategories() {
  return useQuery({
    queryKey: queryKeys.blueprints.categories(),
    queryFn: () => apiClient.get<BlueprintCategoryResource[]>('/v1/blueprints/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlueprintStageTypes() {
  return useQuery({
    queryKey: queryKeys.blueprints.stageTypes(),
    queryFn: () => apiClient.get<StageTypeResource[]>('/v1/blueprints/stage-types'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlueprintSlaPolicies() {
  return useQuery({
    queryKey: queryKeys.blueprints.slaPolicies(),
    queryFn: () => apiClient.get<SlaPolicyResource[]>('/v1/blueprints/sla-policies'),
    staleTime: 5 * 60 * 1000,
  });
}

// --- Blueprint library ---

export interface BlueprintListFilters {
  search?: string;
  category_id?: string;
  scope?: number;
  is_active?: boolean;
  per_page?: number;
}

export function useBlueprintsInfinite(filters: BlueprintListFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.blueprints.list(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BlueprintResource>>('/v1/blueprints', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 30 * 1000,
  });
}

// --- Blueprint detail ---

export function useBlueprint(publicId: string) {
  return useQuery({
    queryKey: queryKeys.blueprints.detail(publicId),
    queryFn: () => apiClient.get<BlueprintResource>(`/v1/blueprints/${publicId}`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

// --- Blueprint mutations ---

function useInvalidateBlueprint(publicId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.detail(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
  };
}

export function useCreateBlueprint() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: StoreBlueprintRequest) =>
      apiClient.post<BlueprintResource>('/v1/blueprints', body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      toast.success(t('blueprint_created'));
      return data;
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateBlueprint(publicId: string) {
  const invalidate = useInvalidateBlueprint(publicId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: UpdateBlueprintRequest) =>
      apiClient.put<BlueprintResource>(`/v1/blueprints/${publicId}`, body),
    onSuccess: () => { invalidate(); toast.success(t('blueprint_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useActivateBlueprint(publicId: string) {
  const invalidate = useInvalidateBlueprint(publicId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: () => apiClient.post<BlueprintResource>(`/v1/blueprints/${publicId}/activate`),
    onSuccess: () => { invalidate(); toast.success(t('blueprint_activated')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeactivateBlueprint(publicId: string) {
  const invalidate = useInvalidateBlueprint(publicId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: () => apiClient.post<BlueprintResource>(`/v1/blueprints/${publicId}/deactivate`),
    onSuccess: () => { invalidate(); toast.success(t('blueprint_deactivated')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDuplicateBlueprint() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<BlueprintResource>(`/v1/blueprints/${publicId}/duplicate`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      toast.success(t('blueprint_duplicated'));
      return data;
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/blueprints/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      toast.success(t('blueprint_deleted'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// --- Stage mutations ---

export function useCreateStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: StoreBlueprintStageRequest) =>
      apiClient.post<BlueprintStageResource>(`/v1/blueprints/${blueprintId}/stages`, body),
    onSuccess: () => { invalidate(); toast.success(t('stage_added')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageId: string; body: Partial<StoreBlueprintStageRequest> }) =>
      apiClient.put<BlueprintStageResource>(`/v1/blueprints/${blueprintId}/stages/${vars.stageId}`, vars.body),
    onSuccess: () => { invalidate(); toast.success(t('stage_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (stageId: string) =>
      apiClient.delete(`/v1/blueprints/${blueprintId}/stages/${stageId}`),
    onSuccess: () => { invalidate(); toast.success(t('stage_deleted')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReorderStages(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (stages: { public_id: string; sequence_order: number }[]) =>
      apiClient.post(`/v1/blueprints/${blueprintId}/stages/reorder`, { stages }),
    onSuccess: () => { invalidate(); toast.success(t('stages_reordered')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

// --- Sub-stage mutations ---

export function useCreateSubStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageId: string; body: StoreBlueprintSubStageRequest }) =>
      apiClient.post<BlueprintSubStageResource>(`/v1/blueprints/${blueprintId}/stages/${vars.stageId}/sub-stages`, vars.body),
    onSuccess: () => { invalidate(); toast.success(t('sub_stage_added')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateSubStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageId: string; subStageId: string; body: Partial<StoreBlueprintSubStageRequest> }) =>
      apiClient.put<BlueprintSubStageResource>(`/v1/blueprints/${blueprintId}/stages/${vars.stageId}/sub-stages/${vars.subStageId}`, vars.body),
    onSuccess: () => { invalidate(); toast.success(t('sub_stage_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteSubStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageId: string; subStageId: string }) =>
      apiClient.delete(`/v1/blueprints/${blueprintId}/stages/${vars.stageId}/sub-stages/${vars.subStageId}`),
    onSuccess: () => { invalidate(); toast.success(t('sub_stage_deleted')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReorderSubStages(blueprintId: string, stageId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (subStages: { public_id: string; sequence_order: number }[]) =>
      apiClient.post(`/v1/blueprints/${blueprintId}/stages/${stageId}/sub-stages/reorder`, { sub_stages: subStages }),
    onSuccess: () => { invalidate(); toast.success(t('sub_stages_reordered')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

// --- Transition mutations ---

export function useCreateTransition(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: StoreBlueprintTransitionRequest) =>
      apiClient.post<BlueprintTransitionResource>(`/v1/blueprints/${blueprintId}/transitions`, body),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.transitions(blueprintId) });
      toast.success(t('transition_added'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTransition(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (transitionId: string) =>
      apiClient.delete(`/v1/blueprints/${blueprintId}/transitions/${transitionId}`),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.transitions(blueprintId) });
      toast.success(t('transition_deleted'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// --- Catalog mutations ---

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: { name_ar: string; name_en?: string; display_order?: number }) =>
      apiClient.post<BlueprintCategoryResource>('/v1/blueprints/categories', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.categories() }); toast.success(t('category_created')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { categoryId: string; body: { name_ar?: string; name_en?: string; display_order?: number } }) =>
      apiClient.put<BlueprintCategoryResource>(`/v1/blueprints/categories/${vars.categoryId}`, vars.body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.categories() }); toast.success(t('category_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeactivateCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (categoryId: string) =>
      apiClient.post(`/v1/blueprints/categories/${categoryId}/deactivate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.categories() }); toast.success(t('category_deactivated')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReactivateCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (categoryId: string) =>
      apiClient.post(`/v1/blueprints/categories/${categoryId}/reactivate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.categories() }); toast.success(t('category_reactivated')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (categoryId: string) =>
      apiClient.delete(`/v1/blueprints/categories/${categoryId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.categories() }); toast.success(t('category_deleted')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateStageType() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: { name_ar: string; name_en?: string; display_order?: number }) =>
      apiClient.post<StageTypeResource>('/v1/blueprints/stage-types', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.stageTypes() }); toast.success(t('stage_type_created')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateStageType() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageTypeId: string; body: { name_ar?: string; name_en?: string; display_order?: number } }) =>
      apiClient.put<StageTypeResource>(`/v1/blueprints/stage-types/${vars.stageTypeId}`, vars.body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.stageTypes() }); toast.success(t('stage_type_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteStageType() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (stageTypeId: string) =>
      apiClient.delete(`/v1/blueprints/stage-types/${stageTypeId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.stageTypes() }); toast.success(t('stage_type_deleted')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateSlaPolicy() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: { name_ar: string; name_en?: string; sla_value: number; sla_unit: number; warning_threshold_percentage?: number }) =>
      apiClient.post<SlaPolicyResource>('/v1/blueprints/sla-policies', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.slaPolicies() }); toast.success(t('sla_policy_created')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateSlaPolicy() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { slaPolicyId: string; body: { name_ar?: string; name_en?: string; sla_value?: number; sla_unit?: number; warning_threshold_percentage?: number } }) =>
      apiClient.put<SlaPolicyResource>(`/v1/blueprints/sla-policies/${vars.slaPolicyId}`, vars.body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.slaPolicies() }); toast.success(t('sla_policy_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteSlaPolicy() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (slaPolicyId: string) =>
      apiClient.delete(`/v1/blueprints/sla-policies/${slaPolicyId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.slaPolicies() }); toast.success(t('sla_policy_deleted')); },
    onError: (error: Error) => toast.error(error.message),
  });
}
