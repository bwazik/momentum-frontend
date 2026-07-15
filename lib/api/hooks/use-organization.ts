'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';
import type { CursorPage } from '@/lib/api/types';

type DepartmentResource = components['schemas']['DepartmentResource'];
type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];
type AuthorityGradeResource = components['schemas']['AuthorityGradeResource'];
type PositionResource = components['schemas']['PositionResource'];
type WorkingCalendarResource = components['schemas']['WorkingCalendarResource'];
type PublicHolidayResource = components['schemas']['PublicHolidayResource'];
type StoreDepartmentRequest = components['schemas']['StoreDepartmentRequest'];
type UpdateDepartmentRequest = components['schemas']['UpdateDepartmentRequest'];
type StorePositionRequest = components['schemas']['StorePositionRequest'];
type UpdatePositionRequest = components['schemas']['UpdatePositionRequest'];
type TransferPositionRequest = components['schemas']['TransferPositionRequest'];
type StoreAuthorityGradeRequest = components['schemas']['StoreAuthorityGradeRequest'];
type UpdateAuthorityGradeRequest = components['schemas']['UpdateAuthorityGradeRequest'];
type StoreWorkingCalendarRequest = components['schemas']['StoreWorkingCalendarRequest'];
type UpdateWorkingCalendarRequest = components['schemas']['UpdateWorkingCalendarRequest'];
type StorePublicHolidayRequest = components['schemas']['StorePublicHolidayRequest'];
type UpdatePublicHolidayRequest = components['schemas']['UpdatePublicHolidayRequest'];

// ---- Reads ---------------------------------------------------------------

export function useDepartmentTree() {
  return useQuery({
    queryKey: queryKeys.organization.departmentTree(),
    queryFn: () => apiClient.get<DepartmentTreeResource[]>('/v1/organization/departments/tree'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartmentsInfinite(filters: { is_active?: boolean; parent_department_id?: string } = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.organization.departments(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<DepartmentResource>>('/v1/organization/departments', {
        params: { ...filters, per_page: 50, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 60 * 1000,
  });
}

export function useDepartment(publicId: string) {
  return useQuery({
    queryKey: queryKeys.organization.department(publicId),
    queryFn: () => apiClient.get<DepartmentResource>(`/v1/organization/departments/${publicId}`),
    enabled: !!publicId,
  });
}

export function useAuthorityGrades() {
  return useQuery({
    queryKey: queryKeys.organization.authorityGrades(),
    queryFn: () => apiClient.get<AuthorityGradeResource[]>('/v1/organization/authority-grades'),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePositions(filters?: { is_active?: boolean; per_page?: number }) {
  return useInfiniteQuery({
    queryKey: queryKeys.organization.positions(filters ?? {}),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<PositionResource>>('/v1/organization/positions', {
        params: { is_active: true, per_page: 100, ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 5 * 60 * 1000,
  });
}

export interface PositionListFilters {
  department_id?: string;
  authority_grade_id?: string;
  is_active?: boolean;
  search?: string;
  per_page?: number;
}

export function usePositionsInfinite(filters: PositionListFilters = {}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- search is not sent to API
  const { search, ...sent } = filters;
  return useInfiniteQuery({
    queryKey: queryKeys.organization.positions(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<PositionResource>>('/v1/organization/positions', {
        params: { ...sent, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 60 * 1000,
  });
}

export function usePosition(publicId: string) {
  return useQuery({
    queryKey: queryKeys.organization.position(publicId),
    queryFn: () => apiClient.get<PositionResource>(`/v1/organization/positions/${publicId}`),
    enabled: !!publicId,
  });
}

export function useWorkingCalendars() {
  return useQuery({
    queryKey: queryKeys.organization.workingCalendars(),
    queryFn: () => apiClient.get<WorkingCalendarResource[]>('/v1/organization/working-calendars'),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicHolidays(calendarPublicId: string, filters: { year?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.organization.holidays(calendarPublicId, filters),
    queryFn: () => apiClient.get<PublicHolidayResource[]>(
      `/v1/organization/working-calendars/${calendarPublicId}/holidays`,
      { params: { year: filters.year } },
    ),
    enabled: !!calendarPublicId,
  });
}

// ---- Department mutations ------------------------------------------------

function qiDepartments(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'departments'] });
  qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: StoreDepartmentRequest) =>
      apiClient.post<DepartmentResource>('/v1/organization/departments', body),
    onSuccess: () => {
      qiDepartments(qc);
      toast.success(t('dept_created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDepartment(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: UpdateDepartmentRequest) =>
      apiClient.put<DepartmentResource>(`/v1/organization/departments/${publicId}`, body),
    onSuccess: () => {
      qiDepartments(qc);
      qc.invalidateQueries({ queryKey: queryKeys.organization.department(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.organization.workingCalendars() });
      toast.success(t('dept_saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeactivateDepartment(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (cascade: boolean) =>
      apiClient.post<DepartmentResource>(`/v1/organization/departments/${publicId}/deactivate`, { cascade_to_children: cascade }),
    onSuccess: () => {
      qiDepartments(qc);
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'positions'] });
      toast.success(t('dept_deactivated'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReactivateDepartment(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post<DepartmentResource>(`/v1/organization/departments/${publicId}/reactivate`),
    onSuccess: () => {
      qiDepartments(qc);
      toast.success(t('dept_reactivated'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/organization/departments/${publicId}`),
    onSuccess: () => {
      qiDepartments(qc);
      toast.success(t('dept_deleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Authority-grade mutations ------------------------------------------

export function useCreateAuthorityGrade() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: StoreAuthorityGradeRequest) =>
      apiClient.post<AuthorityGradeResource>('/v1/organization/authority-grades', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.authorityGrades() });
      toast.success(t('grade_created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAuthorityGrade(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: UpdateAuthorityGradeRequest) =>
      apiClient.put<AuthorityGradeResource>(`/v1/organization/authority-grades/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.authorityGrades() });
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'positions'] });
      qc.invalidateQueries({ queryKey: queryKeys.organization.authorityGrade(publicId) });
      toast.success(t('grade_saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAuthorityGrade() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/organization/authority-grades/${publicId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.authorityGrades() });
      toast.success(t('grade_deleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Position mutations --------------------------------------------------

function qiPositions(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'positions'] });
}

function qiTree(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: Omit<StorePositionRequest, 'department_id' | 'authority_grade_id' | 'reports_to_position_id'> & {
      department_id: string; authority_grade_id: string; reports_to_position_id?: string;
    }) =>
      apiClient.post<PositionResource>('/v1/organization/positions', body as unknown as StorePositionRequest),
    onSuccess: () => {
      qiPositions(qc);
      qiTree(qc);
      toast.success(t('pos_created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: Omit<UpdatePositionRequest, 'authority_grade_id' | 'reports_to_position_id'> & {
      authority_grade_id: string; reports_to_position_id?: string;
    }) =>
      apiClient.put<PositionResource>(`/v1/organization/positions/${publicId}`, body as unknown as UpdatePositionRequest),
    onSuccess: () => {
      qiPositions(qc);
      qiTree(qc);
      qc.invalidateQueries({ queryKey: queryKeys.organization.position(publicId) });
      toast.success(t('pos_saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTransferPosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (departmentId: string) =>
      apiClient.post<PositionResource>(
        `/v1/organization/positions/${publicId}/transfer`,
        { department_id: departmentId } as unknown as TransferPositionRequest,
      ),
    onSuccess: () => {
      qiPositions(qc);
      qiTree(qc);
      qc.invalidateQueries({ queryKey: queryKeys.organization.position(publicId) });
      toast.success(t('pos_transferred'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeactivatePosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post<PositionResource>(`/v1/organization/positions/${publicId}/deactivate`),
    onSuccess: () => {
      qiPositions(qc);
      qiTree(qc);
      qc.invalidateQueries({ queryKey: queryKeys.organization.position(publicId) });
      toast.success(t('pos_deactivated'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReactivatePosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post<PositionResource>(`/v1/organization/positions/${publicId}/reactivate`),
    onSuccess: () => {
      qiPositions(qc);
      qiTree(qc);
      qc.invalidateQueries({ queryKey: queryKeys.organization.position(publicId) });
      toast.success(t('pos_reactivated'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/organization/positions/${publicId}`),
    onSuccess: () => {
      qiPositions(qc);
      qiTree(qc);
      toast.success(t('pos_deleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Calendar / holiday mutations ---------------------------------------

export function useCreateWorkingCalendar() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: StoreWorkingCalendarRequest) =>
      apiClient.post<WorkingCalendarResource>('/v1/organization/working-calendars', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.workingCalendars() });
      toast.success(t('cal_created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWorkingCalendar(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: UpdateWorkingCalendarRequest) =>
      apiClient.put<WorkingCalendarResource>(`/v1/organization/working-calendars/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.workingCalendars() });
      toast.success(t('cal_saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWorkingCalendar() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/organization/working-calendars/${publicId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.workingCalendars() });
      toast.success(t('cal_deleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreatePublicHoliday(calendarPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: StorePublicHolidayRequest) =>
      apiClient.post<PublicHolidayResource>(
        `/v1/organization/working-calendars/${calendarPublicId}/holidays`,
        body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'working-calendars', calendarPublicId, 'holidays'] });
      toast.success(t('holiday_created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePublicHoliday(calendarPublicId: string, holidayPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: UpdatePublicHolidayRequest) =>
      apiClient.put<PublicHolidayResource>(
        `/v1/organization/working-calendars/${calendarPublicId}/holidays/${holidayPublicId}`,
        body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'working-calendars', calendarPublicId, 'holidays'] });
      toast.success(t('holiday_saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePublicHoliday(calendarPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (holidayPublicId: string) =>
      apiClient.delete(`/v1/organization/working-calendars/${calendarPublicId}/holidays/${holidayPublicId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'working-calendars', calendarPublicId, 'holidays'] });
      toast.success(t('holiday_deleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
