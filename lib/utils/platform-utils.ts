import type { CursorPage } from '@/lib/api/types';

export interface PlatformTenant {
  public_id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  domain: string | null;
  database_name: string | null;
  logo_path: string | null;
  default_language: string | null;
  timezone: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlatformAdmin {
  public_id: string;
  name_ar: string;
  name_en: string;
  email: string;
  account_type: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlatformTenantUser {
  public_id: string;
  name_ar: string;
  name_en: string | null;
  email: string;
  is_active: boolean;
  account_type?: string;
}

export interface PlatformAuditEvent {
  public_id: string;
  user_id: string | null;
  user_name_ar?: string | null;
  user_name_en?: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  created_at_hijri?: string | null;
}

export const PLATFORM_AUDIT_ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  'tenant.create': { ar: 'إنشاء مؤسسة', en: 'Create Tenant' },
  'tenant.update': { ar: 'تحديث مؤسسة', en: 'Update Tenant' },
  'tenant.suspend': { ar: 'تعليق مؤسسة', en: 'Suspend Tenant' },
  'tenant.reactivate': { ar: 'إعادة تفعيل مؤسسة', en: 'Reactivate Tenant' },
  'tenant.run_migrations': { ar: 'ترحيل قاعدة بيانات المؤسسة', en: 'Run Tenant Migrations' },
  'platform_admin.created': { ar: 'إنشاء مدير منصة', en: 'Create Platform Admin' },
  'platform_admin.updated': { ar: 'تحديث مدير منصة', en: 'Update Platform Admin' },
  'platform_admin.deactivated': { ar: 'تعطيل مدير منصة', en: 'Deactivate Platform Admin' },
  'platform_admin.reactivated': { ar: 'إعادة تفعيل مدير منصة', en: 'Reactivate Platform Admin' },
  'platform_admin.logged_in': { ar: 'تسجيل دخول مدير', en: 'Admin Logged In' },
  'platform_admin.logged_out': { ar: 'تسجيل خروج مدير', en: 'Admin Logged Out' },
  'impersonation.start': { ar: 'بدء انتحال هوية', en: 'Start Impersonation' },
  'impersonation.end': { ar: 'إنهاء انتحال هوية', en: 'End Impersonation' },
};

export const PLATFORM_AUDIT_ENTITY_LABELS: Record<string, { ar: string; en: string }> = {
  tenant: { ar: 'مؤسسة', en: 'Tenant' },
  platform_admin: { ar: 'مدير منصة', en: 'Platform Admin' },
  impersonation: { ar: 'جلسة انتحال', en: 'Impersonation' },
};

export function formatPlatformAuditAction(locale: string, action: string): string {
  const item = PLATFORM_AUDIT_ACTION_LABELS[action];
  if (!item) return action;
  return locale === 'ar' ? item.ar : item.en;
}

export function formatPlatformAuditEntity(locale: string, entityType: string): string {
  const item = PLATFORM_AUDIT_ENTITY_LABELS[entityType];
  if (!item) return entityType;
  return locale === 'ar' ? item.ar : item.en;
}

export interface ImpersonationSession extends PlatformAuditEvent {
  tenant_slug: string | null;
  tenant_public_id: string | null;
  expires_at: string | null;
  target_user_id: string | null;
  target_email: string | null;
  target_name_ar: string | null;
  target_name_en: string | null;
  actor_name_ar: string | null;
  actor_name_en: string | null;
}



export function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export { localizeName } from '@/lib/utils/localize';


function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

function pageData(input: unknown): unknown[] {
  const root = record(input);
  return Array.isArray(root?.data) ? root.data : [];
}

function pageMeta(input: unknown): Pick<CursorPage<unknown>, 'next_cursor' | 'has_more'> {
  const root = record(input);
  return {
    next_cursor: typeof root?.next_cursor === 'string' ? root.next_cursor : null,
    has_more: asBool(root?.has_more),
  };
}

function tenant(value: unknown): PlatformTenant | null {
  const r = record(value);
  if (!r || typeof r.public_id !== 'string' || typeof r.slug !== 'string' || typeof r.name_ar !== 'string') return null;
  const settings = record(r.settings);
  return {
    public_id: r.public_id,
    name_ar: r.name_ar,
    name_en: typeof r.name_en === 'string' ? r.name_en : r.name_ar,
    slug: r.slug,
    domain: typeof r.domain === 'string' ? r.domain : null,
    database_name: typeof r.database_name === 'string' ? r.database_name : null,
    logo_path: typeof r.logo_path === 'string' ? r.logo_path : null,
    default_language: r.default_language == null ? null : String(r.default_language),
    timezone: typeof r.timezone === 'string' ? r.timezone : null,
    is_active: asBool(r.is_active),
    settings: settings ?? {},
    created_at: typeof r.created_at === 'string' ? r.created_at : null,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : null,
  };
}

function admin(value: unknown): PlatformAdmin | null {
  const r = record(value);
  if (!r || typeof r.public_id !== 'string' || typeof r.email !== 'string' || typeof r.name_ar !== 'string') return null;
  return {
    public_id: r.public_id,
    name_ar: r.name_ar,
    name_en: typeof r.name_en === 'string' ? r.name_en : r.name_ar,
    email: r.email,
    account_type: String(r.account_type ?? ''),
    is_active: asBool(r.is_active),
    created_at: typeof r.created_at === 'string' ? r.created_at : null,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : null,
  };
}

function user(value: unknown): PlatformTenantUser | null {
  const r = record(value);
  if (!r || typeof r.public_id !== 'string' || typeof r.email !== 'string' || typeof r.name_ar !== 'string') return null;
  return {
    public_id: r.public_id,
    name_ar: r.name_ar,
    name_en: typeof r.name_en === 'string' ? r.name_en : null,
    email: r.email,
    is_active: asBool(r.is_active),
    account_type: typeof r.account_type === 'string' ? r.account_type : undefined,
  };
}

export function narrowPlatformTenantPage(input: unknown): CursorPage<PlatformTenant> {
  return { data: pageData(input).map(tenant).filter((x): x is PlatformTenant => x !== null), ...pageMeta(input) };
}

export function narrowPlatformAdminPage(input: unknown): CursorPage<PlatformAdmin> {
  return { data: pageData(input).map(admin).filter((x): x is PlatformAdmin => x !== null), ...pageMeta(input) };
}

export function narrowTenantUserPage(input: unknown): CursorPage<PlatformTenantUser> {
  return { data: pageData(input).map(user).filter((x): x is PlatformTenantUser => x !== null), ...pageMeta(input) };
}

export function narrowAuditEventPage(input: unknown): CursorPage<PlatformAuditEvent> {
  return { data: pageData(input).map((value) => narrowAuditEvent(value)).filter((x): x is PlatformAuditEvent => x !== null), ...pageMeta(input) };
}

export function narrowAuditEvent(value: unknown): PlatformAuditEvent | null {
  const r = record(value);
  if (!r || typeof r.public_id !== 'string') return null;
  return {
    public_id: r.public_id,
    user_id: typeof r.user_id === 'string' ? r.user_id : null,
    user_name_ar: typeof r.user_name_ar === 'string' ? r.user_name_ar : null,
    user_name_en: typeof r.user_name_en === 'string' ? r.user_name_en : null,
    action: String(r.action ?? ''),
    entity_type: String(r.entity_type ?? ''),
    entity_id: typeof r.entity_id === 'string' ? r.entity_id : null,
    payload: record(r.payload),
    ip_address: typeof r.ip_address === 'string' ? r.ip_address : null,
    user_agent: typeof r.user_agent === 'string' ? r.user_agent : null,
    created_at: typeof r.created_at === 'string' ? r.created_at : null,
    created_at_hijri: typeof r.created_at_hijri === 'string' ? r.created_at_hijri : null,
  };
}

export function narrowImpersonationSessionPage(input: unknown): CursorPage<ImpersonationSession> {
  const data = pageData(input).map((value) => {
    const event = narrowAuditEvent(value);
    const r = record(value);
    const payload = record(event?.payload);
    if (!event) return null;

    let expiresAt = typeof r?.expires_at === 'string' ? r.expires_at : null;
    if (!expiresAt && event.created_at) {
      try {
        expiresAt = new Date(new Date(event.created_at).getTime() + 60 * 60 * 1000).toISOString();
      } catch {
        expiresAt = null;
      }
    }

    return {
      ...event,
      tenant_slug: typeof r?.tenant_slug === 'string' ? r.tenant_slug : typeof payload?.tenant_slug === 'string' ? payload.tenant_slug : null,
      tenant_public_id: typeof r?.tenant_public_id === 'string' ? r.tenant_public_id : typeof payload?.tenant_public_id === 'string' ? payload.tenant_public_id : null,
      expires_at: expiresAt,
      target_user_id: typeof payload?.target_user_id === 'string' ? payload.target_user_id : null,
      target_email: typeof payload?.target_email === 'string' ? payload.target_email : null,
      target_name_ar: typeof payload?.target_name_ar === 'string' ? payload.target_name_ar : null,
      target_name_en: typeof payload?.target_name_en === 'string' ? payload.target_name_en : null,
      // actor name: from top-level resource fields (new) or payload fallback
      actor_name_ar: typeof r?.user_name_ar === 'string' ? r.user_name_ar : typeof payload?.impersonated_by_name_ar === 'string' ? payload.impersonated_by_name_ar : null,
      actor_name_en: typeof r?.user_name_en === 'string' ? r.user_name_en : typeof payload?.impersonated_by_name_en === 'string' ? payload.impersonated_by_name_en : null,
    };
  }).filter((x): x is ImpersonationSession => x !== null);
  return { data, ...pageMeta(input) };
}
