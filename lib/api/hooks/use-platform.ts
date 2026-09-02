'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, ApiRequestError, localizedApiError } from '@/lib/api/client';
import { queryKeys, type PlatformAdminFilters, type PlatformAuditFilters, type PlatformTenantFilters, type PlatformTenantUserFilters } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';
import { narrowAuditEventPage, narrowImpersonationSessionPage, narrowPlatformAdminPage, narrowPlatformTenantPage, narrowTenantUserPage, type ImpersonationSession, type PlatformAdmin, type PlatformAuditEvent, type PlatformTenant, type PlatformTenantUser } from '@/lib/utils/platform-utils';

type PlatformLoginRequest = components['schemas']['PlatformLoginRequest'];
type StorePlatformAdminRequest = components['schemas']['StorePlatformAdminRequest'];
type UpdatePlatformAdminRequest = components['schemas']['UpdatePlatformAdminRequest'];
type StoreTenantRequest = components['schemas']['StoreTenantRequest'];
type UpdateTenantRequest = components['schemas']['UpdateTenantRequest'];
type ImpersonateRequest = components['schemas']['ImpersonateRequest'];

const csrf = async (): Promise<void> => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test');
  await fetch(`${baseUrl}/sanctum/csrf-cookie`, { credentials: 'include' });
};

const pageOptions = { initialPageParam: undefined as string | undefined, staleTime: 30_000 };

function deferToast(callback: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
    return;
  }

  setTimeout(callback, 0);
}

function showSuccessToast(message: string): void {
  deferToast(() => toast.success(message));
}

function showErrorToast(message: string): void {
  deferToast(() => toast.error(message));
}

export function usePlatformAuth(enabled = true) {
  return useQuery({
    queryKey: queryKeys.platform.auth.me(),
    queryFn: () => apiClient.get<PlatformAdmin>('/v1/platform/auth/me'),
    enabled,
    staleTime: 5 * 60_000,
    retry: (count, error) => error instanceof ApiRequestError && error.status === 401 ? false : count < 3,
  });
}

export function usePlatformLogin() {
  const qc = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: async (body: PlatformLoginRequest) => { await csrf(); return apiClient.post('/v1/platform/auth/login', body); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.platform.auth.me() }); showSuccessToast(t('login_success')); },
    onError: (error) => showErrorToast(localizedApiError(error, t)),
  });
}

export function usePlatformLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: () => apiClient.post('/v1/platform/auth/logout'),
    onSuccess: () => { qc.clear(); router.push('/login'); },
    onError: (error) => { if (error instanceof ApiRequestError) showErrorToast(localizedApiError(error, t)); qc.clear(); router.push('/login'); },
  });
}

export function usePlatformTenantsInfinite(filters: PlatformTenantFilters) {
  return useInfiniteQuery({ ...pageOptions, queryKey: queryKeys.platform.tenants.list(filters), queryFn: ({ pageParam }) => apiClient.get('/v1/platform/tenants', { params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 15 } }).then(narrowPlatformTenantPage), getNextPageParam: (last) => last.has_more ? last.next_cursor : undefined });
}

export function usePlatformTenant(publicId: string) {
  return useQuery({ queryKey: queryKeys.platform.tenants.detail(publicId), queryFn: () => apiClient.get<PlatformTenant>(`/v1/platform/tenants/${publicId}`), enabled: !!publicId });
}

function usePlatformMutation<TVariables, TData = unknown>(mutationFn: (variables: TVariables) => Promise<TData>, message: string, invalidate: (qc: ReturnType<typeof useQueryClient>) => void) {
  const qc = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({ mutationFn: (variables: TVariables) => mutationFn(variables), onSuccess: () => { invalidate(qc); showSuccessToast(t(message)); }, onError: (error) => showErrorToast(localizedApiError(error, t)) });
}

export function useCreateTenant() { return usePlatformMutation((body: StoreTenantRequest) => apiClient.post('/v1/platform/tenants', body as unknown), 'tenant_created', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.tenants.lists() }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }
export function useUpdateTenant(id: string) { return usePlatformMutation((body: UpdateTenantRequest) => apiClient.put(`/v1/platform/tenants/${id}`, body as unknown), 'tenant_updated', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.tenants.lists() }); qc.invalidateQueries({ queryKey: queryKeys.platform.tenants.detail(id) }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }
export function useSuspendTenant(id: string) { return usePlatformMutation(() => apiClient.post(`/v1/platform/tenants/${id}/suspend`), 'tenant_suspended', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.tenants.lists() }); qc.invalidateQueries({ queryKey: queryKeys.platform.tenants.detail(id) }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }
export function useReactivateTenant(id: string) { return usePlatformMutation(() => apiClient.post(`/v1/platform/tenants/${id}/reactivate`), 'tenant_reactivated', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.tenants.lists() }); qc.invalidateQueries({ queryKey: queryKeys.platform.tenants.detail(id) }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }
export function useRunTenantMigrations(id: string) { const t = useTranslations('platform.toast'); return useMutation({ mutationFn: () => apiClient.post(`/v1/platform/tenants/${id}/run-migrations`), onSuccess: () => showSuccessToast(t('migrations_dispatched')), onError: (error) => showErrorToast(localizedApiError(error, t)) }); }

export function usePlatformAdminsInfinite(filters: PlatformAdminFilters) { return useInfiniteQuery({ ...pageOptions, queryKey: queryKeys.platform.admins.list(filters), queryFn: ({ pageParam }) => apiClient.get('/v1/platform/admins', { params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 15 } }).then(narrowPlatformAdminPage), getNextPageParam: (last) => last.has_more ? last.next_cursor : undefined }); }
export function useCreateAdmin() { return usePlatformMutation((body: StorePlatformAdminRequest) => apiClient.post('/v1/platform/admins', body), 'admin_created', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.admins.lists() }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }
export function useUpdateAdmin(id: string) { return usePlatformMutation((body: UpdatePlatformAdminRequest) => apiClient.put(`/v1/platform/admins/${id}`, body), 'admin_updated', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.admins.lists() }); qc.invalidateQueries({ queryKey: queryKeys.platform.auth.me() }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }
export function useDeactivateAdmin(id: string) { return usePlatformMutation(() => apiClient.post(`/v1/platform/admins/${id}/deactivate`), 'admin_deactivated', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.admins.lists() }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }
export function useReactivateAdmin(id: string) { return usePlatformMutation(() => apiClient.post(`/v1/platform/admins/${id}/reactivate`), 'admin_reactivated', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.admins.lists() }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }

export function useImpersonationSessions() { return useQuery({ queryKey: queryKeys.platform.impersonation.sessions(), queryFn: () => apiClient.get('/v1/platform/impersonation-sessions').then(narrowImpersonationSessionPage), staleTime: 30_000 }); }
export function usePlatformTenantUsersInfinite(id: string, filters: PlatformTenantUserFilters) { return useInfiniteQuery({ ...pageOptions, queryKey: [...queryKeys.platform.tenants.detail(id), 'users', filters], queryFn: ({ pageParam }) => apiClient.get(`/v1/platform/tenants/${id}/users`, { params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 15 } }).then(narrowTenantUserPage), getNextPageParam: (last) => last.has_more ? last.next_cursor : undefined, enabled: !!id }); }
export function useImpersonateUser(id: string) {
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: (body: ImpersonateRequest) => apiClient.post<{ token: string; tenant: { slug: string } }>(`/v1/platform/tenants/${id}/impersonate`, body),
    onSuccess: (data) => {
      const { protocol, port, hostname } = window.location;
      const baseDomain = hostname.split('.').slice(1).join('.');
      const portSuffix = port ? `:${port}` : '';
      const targetUrl = `${protocol}//${data.tenant.slug}.${baseDomain}${portSuffix}/?platform_token=${encodeURIComponent(data.token)}`;
      window.open(targetUrl, '_blank');
      showSuccessToast(t('impersonation_started'));
    },
    onError: (error) => showErrorToast(localizedApiError(error, t)),
  });
}
export function useEndImpersonation(id: string) { return usePlatformMutation(() => apiClient.post(`/v1/platform/tenants/${id}/leave-impersonation`), 'impersonation_ended', (qc) => { qc.invalidateQueries({ queryKey: queryKeys.platform.impersonation.sessions() }); qc.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() }); }); }
export function usePlatformAuditEventsInfinite(filters: PlatformAuditFilters) { return useInfiniteQuery({ ...pageOptions, queryKey: queryKeys.platform.audit.list(filters), queryFn: ({ pageParam }) => apiClient.get('/v1/platform/audit-events', { params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 15 } }).then(narrowAuditEventPage), getNextPageParam: (last) => last.has_more ? last.next_cursor : undefined }); }

export type { ImpersonationSession, PlatformAdmin, PlatformAuditEvent, PlatformTenant, PlatformTenantUser };
