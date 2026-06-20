import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

type TaskDetailResource = components['schemas']['TaskDetailResource'];
type TaskSlaHealthResource = components['schemas']['TaskSlaHealthResource'];
type TaskTimelineResource = components['schemas']['TaskTimelineResource'];
type StageReturnResource = components['schemas']['StageReturnResource'];
type BlueprintTransitionResource = components['schemas']['BlueprintTransitionResource'];
type UserResource = components['schemas']['UserResource'];
type TaskResource = components['schemas']['TaskResource'];
type CompleteStageRequest = components['schemas']['CompleteStageRequest'];
type ReturnStageRequest = components['schemas']['ReturnStageRequest'];
type OverrideAssignmentRequest = components['schemas']['OverrideAssignmentRequest'];
type SuspendTaskRequest = components['schemas']['SuspendTaskRequest'];
type CancelTaskRequest = components['schemas']['CancelTaskRequest'];

interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export function useTaskDetail(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(publicId),
    queryFn: () => apiClient.get<TaskDetailResource>(`/v1/tasks/${publicId}`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

export function useTaskSlaHealth(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.slaHealth(publicId),
    queryFn: () => apiClient.get<TaskSlaHealthResource>(`/v1/tracking/sla/tasks/${publicId}`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

export function useTaskTimeline(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.timeline(publicId),
    queryFn: () => apiClient.get<TaskTimelineResource[]>(`/v1/tasks/${publicId}/timeline`),
    enabled: !!publicId,
  });
}

export function useTaskReturns(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.returns(publicId),
    queryFn: () => apiClient.get<StageReturnResource[]>(`/v1/tasks/${publicId}/returns`),
    enabled: !!publicId,
  });
}

export function useBlueprintTransitions(blueprintId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blueprints.transitions(blueprintId ?? ''),
    queryFn: () =>
      apiClient.get<BlueprintTransitionResource[]>(
        `/v1/blueprints/${blueprintId}/transitions`,
      ),
    enabled: !!blueprintId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsersSearch(search: string) {
  return useQuery({
    queryKey: queryKeys.users.list({ search, is_active: 1, per_page: 20 }),
    queryFn: () =>
      apiClient.get<CursorPage<UserResource>>('/v1/iam/users', {
        params: { search, is_active: 1, per_page: 20 },
      }),
    enabled: search.length >= 2,
    staleTime: 30 * 1000,
  });
}

function useInvalidateTaskDetail(publicId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.slaHealth(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.returns(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
  };
}

export function useCompleteStage(publicId: string) {
  const t = useTranslations('tasks.detail');
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: {
      taskPublicId: string;
      stageInstancePublicId: string;
      body: CompleteStageRequest;
    }) =>
      apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/stages/${vars.stageInstancePublicId}/complete`,
        vars.body,
      ),
    onSuccess: () => {
      invalidate();
      toast.success(t('toast_stage_completed'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useCompleteSubStage(publicId: string) {
  const t = useTranslations('tasks.detail');
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: {
      taskPublicId: string;
      subStageInstancePublicId: string;
      body: CompleteStageRequest;
    }) =>
      apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/sub-stages/${vars.subStageInstancePublicId}/complete`,
        vars.body,
      ),
    onSuccess: () => {
      invalidate();
      toast.success(t('toast_sub_stage_completed'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useReturnStage(publicId: string) {
  const t = useTranslations('tasks.detail');
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: {
      taskPublicId: string;
      stageInstancePublicId: string;
      body: ReturnStageRequest;
    }) =>
      apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/stages/${vars.stageInstancePublicId}/return`,
        vars.body,
      ),
    onSuccess: () => {
      invalidate();
      toast.success(t('toast_stage_returned'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useReturnSubStage(publicId: string) {
  const t = useTranslations('tasks.detail');
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: {
      taskPublicId: string;
      subStageInstancePublicId: string;
      body: { target_sub_stage_id: string; reason: string };
    }) =>
      apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/sub-stages/${vars.subStageInstancePublicId}/return`,
        vars.body,
      ),
    onSuccess: () => {
      invalidate();
      toast.success(t('toast_sub_stage_returned'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useOverrideAssignment(publicId: string, isSubStage: boolean) {
  const t = useTranslations('tasks.detail');
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: {
      taskPublicId: string;
      instancePublicId: string;
      body: OverrideAssignmentRequest;
    }) => {
      const segment = isSubStage ? 'sub-stages' : 'stages';
      return apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/${segment}/${vars.instancePublicId}/override-assignment`,
        vars.body,
      );
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('toast_assignment_overridden'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useSuspendTask(publicId: string) {
  const t = useTranslations('tasks.detail');
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (body: SuspendTaskRequest) =>
      apiClient.post<TaskResource>(`/v1/tasks/${publicId}/suspend`, body),
    onSuccess: () => {
      invalidate();
      toast.success(t('toast_task_suspended'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useResumeTask(publicId: string) {
  const t = useTranslations('tasks.detail');
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: () =>
      apiClient.post<TaskResource>(`/v1/tasks/${publicId}/resume`),
    onSuccess: () => {
      invalidate();
      toast.success(t('toast_task_resumed'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useCancelTask(publicId: string) {
  const t = useTranslations('tasks.detail');
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (body: CancelTaskRequest) =>
      apiClient.post<TaskResource>(`/v1/tasks/${publicId}/cancel`, body),
    onSuccess: () => {
      invalidate();
      toast.success(t('toast_task_cancelled'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
