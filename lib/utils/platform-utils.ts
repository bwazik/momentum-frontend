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
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export interface ImpersonationSession extends PlatformAuditEvent {
  tenant_slug: string | null;
  tenant_public_id: string | null;
  expires_at: string | null;
  target_user_id: string | null;
}

export function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function localizeName(locale: string, nameAr: string | null | undefined, nameEn: string | null | undefined): string {
  return locale === 'ar' ? (nameAr || nameEn || '') : (nameEn || nameAr || '');
}

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
  if (!r || typeof r.public_id !== 'string' || typeof r.entity_type !== 'string') return null;
  return {
    public_id: r.public_id,
    user_id: typeof r.user_id === 'string' ? r.user_id : null,
    action: String(r.action ?? ''),
    entity_type: r.entity_type,
    entity_id: typeof r.entity_id === 'string' ? r.entity_id : null,
    payload: record(r.payload),
    ip_address: typeof r.ip_address === 'string' ? r.ip_address : null,
    user_agent: typeof r.user_agent === 'string' ? r.user_agent : null,
    created_at: typeof r.created_at === 'string' ? r.created_at : null,
  };
}

export function narrowImpersonationSessionPage(input: unknown): CursorPage<ImpersonationSession> {
  const data = pageData(input).map((value) => {
    const event = narrowAuditEvent(value);
    const r = record(value);
    const payload = record(event?.payload);
    return event ? { ...event, tenant_slug: typeof r?.tenant_slug === 'string' ? r.tenant_slug : typeof payload?.tenant_slug === 'string' ? payload.tenant_slug : null, tenant_public_id: typeof r?.tenant_public_id === 'string' ? r.tenant_public_id : typeof payload?.tenant_public_id === 'string' ? payload.tenant_public_id : null, expires_at: typeof r?.expires_at === 'string' ? r.expires_at : null, target_user_id: typeof payload?.target_user_id === 'string' ? payload.target_user_id : null } : null;
  }).filter((x): x is ImpersonationSession => x !== null);
  return { data, ...pageMeta(input) };
}
