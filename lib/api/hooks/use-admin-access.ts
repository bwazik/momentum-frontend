'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, localizedApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';

type CapabilityResource = components['schemas']['CapabilityResource'];
type UpdateCapabilityRequest = components['schemas']['UpdateCapabilityRequest'];
type PositionCapabilityGrantResource = components['schemas']['PositionCapabilityGrantResource'];
type GrantPositionCapabilityRequest = components['schemas']['GrantPositionCapabilityRequest'];
type UserCapabilityGrantResource = components['schemas']['UserCapabilityGrantResource'];
type GrantUserCapabilityRequest = components['schemas']['GrantUserCapabilityRequest'];
type MonitoringScopeGrantResource = components['schemas']['MonitoringScopeGrantResource'];
type GrantMonitoringScopeRequest = components['schemas']['GrantMonitoringScopeRequest'];
type AuditGrantResource = components['schemas']['AuditGrantResource'];
type GrantAuditGrantRequest = components['schemas']['GrantAuditGrantRequest'];

export function useCapabilities() {
  return useQuery({
    queryKey: queryKeys.iam.capabilities(),
    queryFn: () => apiClient.get<CapabilityResource[]>('/v1/iam/capabilities'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCapability(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: UpdateCapabilityRequest) =>
      apiClient.put<CapabilityResource>(`/v1/iam/capabilities/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.iam.capabilities() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('capability_updated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function usePositionCapabilities(positionPublicId: string | null) {
  return useQuery({
    queryKey: queryKeys.iam.positionCapabilities(positionPublicId ?? ''),
    queryFn: () =>
      apiClient.get<PositionCapabilityGrantResource[]>(
        `/v1/iam/positions/${positionPublicId}/capabilities`,
      ),
    enabled: !!positionPublicId,
    staleTime: 30 * 1000,
  });
}

export function useGrantPositionCapability(positionPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: GrantPositionCapabilityRequest) =>
      apiClient.post<PositionCapabilityGrantResource>(
        `/v1/iam/positions/${positionPublicId}/capabilities`, body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.iam.positionCapabilities(positionPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.details() });
      qc.invalidateQueries({ queryKey: ['auth', 'capabilities'] });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('capability_granted'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useRevokePositionCapability() {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: ({ grantPublicId, positionPublicId }: { grantPublicId: string; positionPublicId: string }) =>
      apiClient.post(`/v1/iam/position-capability-grants/${grantPublicId}/revoke`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.iam.positionCapabilities(variables.positionPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.details() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('capability_revoked'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useUserDirectGrants(publicId: string) {
  return useQuery({
    queryKey: queryKeys.users.capabilityGrants(publicId),
    queryFn: () =>
      apiClient.get<UserCapabilityGrantResource[]>(
        `/v1/iam/users/${publicId}/capability-grants`,
      ),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

export function useGrantUserCapability(userPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: GrantUserCapabilityRequest) =>
      apiClient.post(`/v1/iam/users/${userPublicId}/capabilities`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.capabilityGrants(userPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(userPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('direct_capability_granted'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useRevokeUserCapability() {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: ({ grantPublicId, userPublicId }: { grantPublicId: string; userPublicId: string }) =>
      apiClient.post(`/v1/iam/user-capability-grants/${grantPublicId}/revoke`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.capabilityGrants(variables.userPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('direct_capability_revoked'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useUserMonitoringScopes(publicId: string) {
  return useQuery({
    queryKey: queryKeys.users.monitoringScopes(publicId),
    queryFn: () =>
      apiClient.get<MonitoringScopeGrantResource[]>(
        `/v1/iam/users/${publicId}/monitoring-scopes`,
      ),
    enabled: !!publicId,
  });
}

export function useGrantMonitoringScope(userPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: GrantMonitoringScopeRequest) =>
      apiClient.post(`/v1/iam/users/${userPublicId}/monitoring-scopes`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.monitoringScopes(userPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('monitoring_scope_granted'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useRevokeMonitoringScope() {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: ({ grantPublicId, userPublicId }: { grantPublicId: string; userPublicId: string }) =>
      apiClient.post(`/v1/iam/monitoring-scope-grants/${grantPublicId}/revoke`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.monitoringScopes(variables.userPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('monitoring_scope_revoked'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useUserAuditGrants(publicId: string) {
  return useQuery({
    queryKey: queryKeys.users.auditGrants(publicId),
    queryFn: () =>
      apiClient.get<AuditGrantResource[]>(`/v1/iam/users/${publicId}/audit-grants`),
    enabled: !!publicId,
  });
}

export function useGrantAuditScope(userPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: GrantAuditGrantRequest) =>
      apiClient.post(`/v1/iam/users/${userPublicId}/audit-grants`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.auditGrants(userPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('audit_scope_granted'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useRevokeAuditGrant() {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: ({ grantPublicId, userPublicId }: { grantPublicId: string; userPublicId: string }) =>
      apiClient.post(`/v1/iam/audit-grants/${grantPublicId}/revoke`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.auditGrants(variables.userPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('audit_scope_revoked'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}
