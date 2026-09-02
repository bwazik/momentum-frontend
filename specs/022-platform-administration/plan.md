# Implementation Plan: 022 Platform Administration

> **Spec:** `specs/022-platform-administration/spec.md`
> **Date:** 2026-07-22
> **Status:** `approved`
> **Branch:** `feat/022-platform-administration` from `main`
> **Backend spec:** `../backend/specs/001-platform-admin/` — `Contract status: stable`

---

## Open Questions Resolved

All open questions from `spec.md` are resolved. This section records the decisions for implementation.

| # | Spec Open Question | Decision for this plan |
|---|--------------------|------------------------|
| 1 | Auth token storage (Bearer vs. cookie) | **Sanctum SPA session cookies only.** The backend uses `Auth::guard('web')->login($user)` for both tenant and platform auth. No `platform_token` in `localStorage`; no `Authorization` header; no separate `platformApiClient`. Reuse the existing `apiClient` and omit the `X-Tenant` header for paths under `/v1/platform/`. |
| 2 | `X-Tenant` header on platform endpoints | **Omit entirely.** Platform routes are outside `InitializeTenancyByHeader` middleware. The frontend must not send `X-Tenant` for any `/v1/platform/*` call. This is implemented by checking the request path in `apiClient.request`. |
| 3 | Tenant `settings` format | Backend stores JSON and serializes it as a JSON **string** in `PlatformTenantResource.settings`. Frontend must `JSON.parse(settings)` before display and send an object/array in request bodies. The OpenAPI-generated `StoreTenantRequest.settings` type is `string[] | null`; cast to `unknown` and pass a record at runtime. |
| 4 | Run migrations polling | Backend returns **202 Accepted** with `{ message: "Migrations dispatched..." }`. MVP shows a single success toast; status is visible later in the audit log under `action: "tenant.run_migrations"`. No polling. |
| 5 | Hostname routing | **Single-repo route group.** Add `app/(platform-auth)/` and `app/(platform-admin)/` route groups in the existing Next.js app. `admin.momentum.test` resolves to the platform route group; no separate Next.js app. `proxy.ts`/middleware does not need hostname-aware logic in MVP because route groups can coexist, but the platform layout is distinct from the tenant `(dashboard)/` layout. |
| 6 | Impersonation token handoff | `POST /v1/platform/tenants/{tenant}/impersonate` returns `{ token, user, tenant, expires_at }`. UI opens a **new browser tab** to `https://{tenant.slug}.momentum.test?platform_token={token}`. The token is never persisted in `localStorage`; it is used once for navigation. |
| 7 | Tenant user search for impersonation | Backend exposes `GET /v1/platform/tenants/{tenant}/users` with `search`, `is_active`, `department_id`, `cursor`, `per_page`. Use `useInfiniteQuery` for the impersonation user picker. No `X-Tenant` header. |

**OpenAPI contract gaps to handle at runtime:**

- `PlatformTenantResource.is_active` and `PlatformAdminResource.is_active` are typed as `string` in generated types but backend returns boolean. Use existing `asBool()` utility.
- `PlatformTenantResource.settings` is typed as `string` — it is a JSON string; parse before display.
- List endpoints (`platformAdmin.index`, `platformTenant.index`, `platformAuditEvent.index`, `platformImpersonation.activeSessions`, `platformTenant.users`) type `data` as `unknown[]`. Build runtime-narrowing adapters (`narrowPlatformTenantPage`, `narrowPlatformAdminPage`, `narrowAuditEventPage`, `narrowImpersonationSessionPage`, `narrowTenantUserPage`) returning `CursorPage<T>`.
- OpenAPI still declares `X-Tenant` as required on platform endpoints; this is a Scramble artifact. Client code omits it.

---

## Technical Approach

Build a standalone platform-admin workspace served from `admin.momentum.test` inside the same Next.js repo. The workspace has its own login route, authenticated layout with a minimal top bar, and a URL-tabbed workspace (`?tab=tenants|admins|impersonation|audit`). All platform API calls reuse the existing `apiClient` but omit `X-Tenant`. State is URL-driven for tabs/filters, local for dialogs/forms, and TanStack Query for server state. No new Zustand store.

### Key Decisions

- **Single `apiClient`, no `X-Tenant` for platform paths.** The cleanest way to satisfy both tenant and platform routes is to check `path.startsWith('/v1/platform/')` inside `apiClient.request` and skip the `X-Tenant` header. This avoids duplicating the fetch wrapper, CSRF handling, and error parsing.
- **No `useCapability` for platform admins.** Platform endpoints do not use ABAC; they use `auth:sanctum` + `platform.admin` middleware. The UI therefore does not gate platform workspace actions with `useCapability()`. The only permission-like UI guard is hiding the self-deactivate action for the current admin (compare row `public_id` with `/me`).
- **URL-driven tabs and filters.** `?tab=...` selects the workspace tab; `?search=...`, `?isActive=...`, `?action=...`, `?entityType=...`, `?dateFrom=...`, `?dateTo=...`, `?calendarSystem=...` drive list filters. This keeps the workspace bookmarkable and matches specs 010 and 017.
- **Cursor pagination + manual Load More.** Every list uses `useInfiniteQuery` with `next_cursor`/`has_more`.
- **All 4 states in every data component.** Loading skeletons match real table shapes; empty states include CTAs; error states preserve filters and offer retry.
- **Generated types + runtime narrowing.** Import request/response shapes from `lib/generated/api-types.ts`. For list responses typed as `unknown[]`, use narrowing adapters in `lib/utils/platform-utils.ts`.
- **No optimistic updates.** Platform mutations are audit-sensitive; invalidate related queries on success and show toast feedback.
- **RTL-first logical properties.** All layout uses `ms-`/`me-`/`ps-`/`pe-`/`text-start`/`text-end`; directional icons flip with `rtl:rotate-180`.

---

## Component Tree

```
app/
├── layout.tsx                              (Server — existing; locale cookie + providers)
├── (platform-auth)/
│   └── login/
│       └── page.tsx                        (Server — standalone platform login page)
├── (platform-admin)/
│   ├── layout.tsx                          (Server — auth guard + minimal top bar)
│   ├── page.tsx                            (Server — workspace default redirect/tab)
│   └── tenants/
│       └── [publicId]/
│           └── page.tsx                    (Server — tenant detail page)

components/
├── domain/
│   └── platform/
│       ├── platform-login-form.tsx         (Client — email/password, CSRF, toast errors)
│       ├── platform-top-bar.tsx            (Client — logo, admin name/email, locale toggle, logout)
│       ├── platform-workspace.tsx          (Client — URL tab router + PageHeader actions slot)
│       ├── tenants/
│       │   ├── tenants-tab-panel.tsx       (Client — list + 4 states + filters)
│       │   ├── tenants-table.tsx           (Client — cursor-paginated tenant table)
│       │   ├── tenants-card-list.tsx       (Client — mobile card view)
│       │   ├── tenants-filters.tsx         (Client — URL search + active status filter)
│       │   ├── tenants-skeleton.tsx        (Client — 8 skeleton rows)
│       │   ├── provision-tenant-dialog.tsx (Client — create tenant form)
│       │   ├── edit-tenant-dialog.tsx      (Client — update mutable fields)
│       │   └── tenant-detail-view.tsx      (Client — full profile + action buttons)
│       ├── admins/
│       │   ├── admins-tab-panel.tsx        (Client — list + 4 states + filters)
│       │   ├── admins-table.tsx            (Client — cursor-paginated admin table)
│       │   ├── admins-card-list.tsx        (Client — mobile card view)
│       │   ├── admins-filters.tsx          (Client — URL search filter)
│       │   ├── admins-skeleton.tsx         (Client — 6 skeleton rows)
│       │   └── admin-form-dialog.tsx       (Client — create/edit admin)
│       ├── impersonation/
│       │   ├── impersonation-tab-panel.tsx (Client — active sessions list)
│       │   ├── impersonation-sessions-table.tsx
│       │   ├── impersonation-sessions-card-list.tsx
│       │   ├── impersonation-sessions-skeleton.tsx
│       │   └── impersonate-user-dialog.tsx (Client — debounced tenant user picker)
│       └── audit/
│           ├── audit-tab-panel.tsx         (Client — audit log + filters)
│           ├── audit-table.tsx             (Client — cursor-paginated audit table)
│           ├── audit-card-list.tsx         (Client — mobile card view)
│           ├── audit-filters.tsx           (Client — action/entity/date filters)
│           ├── audit-detail-dialog.tsx     (Client — escaped payload viewer)
│           └── audit-skeleton.tsx          (Client — 8 skeleton rows)

lib/
├── api/
│   ├── client.ts                           (MODIFIED — omit X-Tenant for /v1/platform/*)
│   ├── query-keys.ts                       (MODIFIED — add platform namespace)
│   └── hooks/
│       └── use-platform.ts                 (NEW — all platform queries/mutations)
├── utils/
│   ├── platform-utils.ts                   (NEW — localizeName, asBool, runtime narrowing adapters)
│   └── date-utils.ts                       (existing — DualDateDisplay support)

messages/
├── ar.json                                 (MODIFIED — add platform.* namespace)
└── en.json                                 (MODIFIED — add platform.* namespace)

__tests__/
└── components/domain/platform/
    ├── platform-login-form.test.tsx
    ├── tenants-tab-panel.test.tsx
    └── audit-tab-panel.test.tsx
```

**Server vs Client split:**

- `app/(platform-auth)/login/page.tsx` — Server Component (renders `PlatformLoginForm`).
- `app/(platform-admin)/layout.tsx` — Server Component (auth guard via `prefetchPlatformAdmin` server utility + minimal top bar).
- `app/(platform-admin)/page.tsx` — Server Component (renders `PlatformWorkspace`).
- `app/(platform-admin)/tenants/[publicId]/page.tsx` — Server Component (renders `TenantDetailView`).
- All components under `components/domain/platform/` are Client Components (`'use client'`) because they use TanStack Query, `useSearchParams`, `useRouter`, `useState`, `useLocale`.

---

## Affected Files

### New files

| Path | Purpose |
|------|---------|
| `app/(platform-auth)/login/page.tsx` | Standalone platform login page; no sidebar shell. |
| `app/(platform-admin)/layout.tsx` | Authenticated platform layout with minimal top bar and auth guard. |
| `app/(platform-admin)/page.tsx` | Workspace landing page; default tab is `tenants`. |
| `app/(platform-admin)/tenants/[publicId]/page.tsx` | Tenant detail page. |
| `lib/auth/server.ts` | **MODIFIED** — add `prefetchPlatformAdmin()` server-only utility. |
| `lib/api/client.ts` | **MODIFIED** — omit `X-Tenant` header when `path.startsWith('/v1/platform/')`. |
| `lib/api/query-keys.ts` | **MODIFIED** — add `platform` namespace with auth, tenants, admins, impersonation, audit keys. |
| `lib/api/hooks/use-platform.ts` | All platform queries and mutations (auth, tenants, admins, impersonation, audit). |
| `lib/utils/platform-utils.ts` | `localizeName`, `asBool`, and runtime narrowing adapters for platform list responses. |
| `components/domain/platform/platform-login-form.tsx` | Platform admin login form. |
| `components/domain/platform/platform-top-bar.tsx` | Minimal top bar with logo, admin info, locale toggle, logout. |
| `components/domain/platform/platform-workspace.tsx` | Tab orchestrator driven by `?tab=...`. |
| `components/domain/platform/tenants/tenants-tab-panel.tsx` | Tenants tab with 4 states. |
| `components/domain/platform/tenants/tenants-table.tsx` | Desktop tenant table. |
| `components/domain/platform/tenants/tenants-card-list.tsx` | Mobile tenant cards. |
| `components/domain/platform/tenants/tenants-filters.tsx` | URL-driven search + status filter. |
| `components/domain/platform/tenants/tenants-skeleton.tsx` | Skeleton rows. |
| `components/domain/platform/tenants/provision-tenant-dialog.tsx` | Create tenant dialog with `BilingualNameFields`. |
| `components/domain/platform/tenants/edit-tenant-dialog.tsx` | Edit mutable tenant fields. |
| `components/domain/platform/tenants/tenant-detail-view.tsx` | Full tenant profile + suspend/reactivate/migrations/impersonate actions. |
| `components/domain/platform/admins/admins-tab-panel.tsx` | Admins tab with 4 states. |
| `components/domain/platform/admins/admins-table.tsx` | Desktop admin table. |
| `components/domain/platform/admins/admins-card-list.tsx` | Mobile admin cards. |
| `components/domain/platform/admins/admins-filters.tsx` | URL-driven search filter. |
| `components/domain/platform/admins/admins-skeleton.tsx` | Skeleton rows. |
| `components/domain/platform/admins/admin-form-dialog.tsx` | Create/edit admin dialog. |
| `components/domain/platform/impersonation/impersonation-tab-panel.tsx` | Active sessions list. |
| `components/domain/platform/impersonation/impersonation-sessions-table.tsx` | Desktop sessions table. |
| `components/domain/platform/impersonation/impersonation-sessions-card-list.tsx` | Mobile session cards. |
| `components/domain/platform/impersonation/impersonation-sessions-skeleton.tsx` | Skeleton rows. |
| `components/domain/platform/impersonation/impersonate-user-dialog.tsx` | Debounced user picker + impersonate action. |
| `components/domain/platform/audit/audit-tab-panel.tsx` | Audit log tab with 4 states. |
| `components/domain/platform/audit/audit-table.tsx` | Desktop audit table. |
| `components/domain/platform/audit/audit-card-list.tsx` | Mobile audit cards. |
| `components/domain/platform/audit/audit-filters.tsx` | Action/entity/date filters. |
| `components/domain/platform/audit/audit-detail-dialog.tsx` | Escaped payload + IP/UA viewer. |
| `components/domain/platform/audit/audit-skeleton.tsx` | Skeleton rows. |
| `__tests__/components/domain/platform/platform-login-form.test.tsx` | Login form tests. |
| `__tests__/components/domain/platform/tenants-tab-panel.test.tsx` | Tenants list tests. |
| `__tests__/components/domain/platform/audit-tab-panel.test.tsx` | Audit log tests. |

### Modified files

| Path | Change |
|------|--------|
| `lib/api/client.ts` | Omit `X-Tenant` header for `/v1/platform/*` paths. |
| `lib/api/query-keys.ts` | Add `platform` namespace. |
| `lib/auth/server.ts` | Add `prefetchPlatformAdmin()` and `prefetchPlatformTenant()` helpers. |
| `messages/ar.json` | Add `platform.*` namespace (~180 keys). |
| `messages/en.json` | Add `platform.*` namespace (~180 keys). |
| `lib/generated/api-types.ts` | Regenerate via `npm run generate:api` if backend OpenAPI was updated; no manual edits. |

### No changes

- No changes to `app/(dashboard)/` layout or tenant login.
- No new Zustand stores.
- No new npm packages.

---

## Implementation Notes

> Throughout: every data-fetching component handles all 4 states (loading skeleton, error w/ Retry, empty w/ Reset, success). Every mutation uses Sonner toasts from `useTranslations('platform.toast')`. Every `RtlSelect`/`RtlTable` uses logical properties. Every icon-only button has `aria-label`. Directional icons flip via `rtl:rotate-180`. PII never in URLs. No `any` types — use `unknown` + narrowing.

### 1. `lib/api/client.ts` — omit `X-Tenant` for platform paths

**One-line summary:** Keep one fetch wrapper; skip the tenant header only when calling `/v1/platform/*`.

**Key decisions:**
- Reusing `apiClient` avoids duplicating CSRF, error handling, and credentials logic (`coding-standards.md` § API Client).
- Platform endpoints run on the central DB and will reject or misroute if `X-Tenant` is present.
- The check is path-based so platform hooks look identical to tenant hooks.

**Exact change:**

```ts
// lib/api/client.ts
function isPlatformPath(path: string): boolean {
  return path.startsWith('/v1/platform/');
}

// inside request():
const headers: Record<string, string> = {
  'Accept': 'application/json',
  'X-Locale': getLocaleSlug(),
  ...options?.headers,
};

if (!isPlatformPath(path)) {
  headers['X-Tenant'] = getTenantSlug();
}
```

**coding-standards.md rules:**
- Single fetch wrapper for credentials and headers (§ API Client).
- No manual `fetch` duplication (§ What NOT To Do).

---

### 2. `lib/api/query-keys.ts` — platform namespace

**One-line summary:** Add a `platform` key factory for auth, tenants, admins, impersonation sessions, and audit events.

**Key decisions:**
- Colocate keys to enable targeted invalidation (§ Query Key Factory).
- Filter objects are part of the key so URL filter changes automatically refetch.

**Exact change:**

```ts
// lib/api/query-keys.ts
export interface PlatformTenantFilters {
  search?: string;
  is_active?: boolean;
  per_page?: number;
}

export interface PlatformAdminFilters {
  search?: string;
  per_page?: number;
}

export interface PlatformAuditFilters {
  action?: string;
  entity_type?: string;
  user_id?: string;
  from?: string;
  to?: string;
  per_page?: number;
}

export interface PlatformTenantUserFilters {
  search?: string;
  is_active?: boolean;
  department_id?: string;
  per_page?: number;
}

export const queryKeys = {
  // ... existing namespaces ...
  platform: {
    all: ['platform'] as const,
    auth: {
      me: () => [...queryKeys.platform.all, 'auth', 'me'] as const,
    },
    tenants: {
      all: () => [...queryKeys.platform.all, 'tenants'] as const,
      lists: () => [...queryKeys.platform.tenants.all(), 'list'] as const,
      list: (filters: PlatformTenantFilters) =>
        [...queryKeys.platform.tenants.lists(), filters] as const,
      details: () => [...queryKeys.platform.tenants.all(), 'detail'] as const,
      detail: (publicId: string) =>
        [...queryKeys.platform.tenants.details(), publicId] as const,
    },
    admins: {
      all: () => [...queryKeys.platform.all, 'admins'] as const,
      lists: () => [...queryKeys.platform.admins.all(), 'list'] as const,
      list: (filters: PlatformAdminFilters) =>
        [...queryKeys.platform.admins.lists(), filters] as const,
    },
    impersonation: {
      sessions: () => [...queryKeys.platform.all, 'impersonation-sessions'] as const,
    },
    audit: {
      all: () => [...queryKeys.platform.all, 'audit'] as const,
      lists: () => [...queryKeys.platform.audit.all(), 'list'] as const,
      list: (filters: PlatformAuditFilters) =>
        [...queryKeys.platform.audit.lists(), filters] as const,
    },
  },
} as const;
```

**coding-standards.md rules:**
- Query key factory, no hardcoded strings (§ Query Key Factory).

---

### 3. `lib/utils/platform-utils.ts` — runtime narrowing adapters

**One-line summary:** Convert `unknown[]` list responses and string-serialized booleans into typed, safe structures.

**Key decisions:**
- OpenAPI types platform list `data` as `unknown[]` and `is_active` as `string`. Runtime narrowing is required.
- Adapters return `CursorPage<T>` and throw only on malformed data so errors surface via TanStack Query `isError`.

**Exact file:**

```ts
// lib/utils/platform-utils.ts
import type { CursorPage } from '@/lib/api/types';
import type { components } from '@/lib/generated/api-types';
import { localizeName as localizeNameBase } from '@/lib/utils/localize';

export type PlatformTenantResource = components['schemas']['PlatformTenantResource'];
export type PlatformAdminResource = components['schemas']['PlatformAdminResource'];

export interface AuditEvent {
  public_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ImpersonationSession {
  public_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: {
    tenant_slug?: string;
    tenant_public_id?: string;
    impersonated_user_public_id?: string;
  } | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function asBool(v: unknown): boolean {
  return v === true || v === '1' || v === 1 || v === 'true';
}

export function localizeName(
  n: { name_ar?: string | null; name_en?: string | null },
  locale: string,
): string {
  return localizeNameBase(locale, n.name_ar, n.name_en);
}

function hasShape(v: unknown, keys: string[]): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && keys.every((k) => k in v);
}

export function narrowPlatformTenantPage(input: unknown): CursorPage<PlatformTenantResource> {
  if (!hasShape(input, ['data', 'next_cursor', 'has_more'])) {
    return { data: [], next_cursor: null, has_more: false };
  }
  const data = Array.isArray((input as Record<string, unknown>).data)
    ? ((input as Record<string, unknown>).data as unknown[])
    : [];
  return {
    data: data as PlatformTenantResource[],
    next_cursor: (input as Record<string, unknown>).next_cursor as string | null,
    has_more: asBool((input as Record<string, unknown>).has_more),
  };
}

export function narrowPlatformAdminPage(input: unknown): CursorPage<PlatformAdminResource> {
  if (!hasShape(input, ['data', 'next_cursor', 'has_more'])) {
    return { data: [], next_cursor: null, has_more: false };
  }
  const data = Array.isArray((input as Record<string, unknown>).data)
    ? ((input as Record<string, unknown>).data as unknown[])
    : [];
  return {
    data: data as PlatformAdminResource[],
    next_cursor: (input as Record<string, unknown>).next_cursor as string | null,
    has_more: asBool((input as Record<string, unknown>).has_more),
  };
}

export function narrowAuditEventPage(input: unknown): CursorPage<AuditEvent> {
  if (!hasShape(input, ['data', 'next_cursor', 'has_more'])) {
    return { data: [], next_cursor: null, has_more: false };
  }
  const rows = Array.isArray((input as Record<string, unknown>).data)
    ? ((input as Record<string, unknown>).data as unknown[])
    : [];
  const data = rows.map((r) => narrowAuditEvent(r));
  return {
    data,
    next_cursor: (input as Record<string, unknown>).next_cursor as string | null,
    has_more: asBool((input as Record<string, unknown>).has_more),
  };
}

export function narrowAuditEvent(input: unknown): AuditEvent {
  const r = hasShape(input, ['public_id', 'action', 'entity_type', 'entity_id', 'created_at'])
    ? (input as Record<string, unknown>)
    : {};
  return {
    public_id: String(r.public_id ?? ''),
    user_id: r.user_id === undefined || r.user_id === null ? null : String(r.user_id),
    action: String(r.action ?? ''),
    entity_type: String(r.entity_type ?? ''),
    entity_id: String(r.entity_id ?? ''),
    payload: typeof r.payload === 'object' && r.payload !== null
      ? (r.payload as Record<string, unknown>)
      : null,
    ip_address: r.ip_address === undefined || r.ip_address === null ? null : String(r.ip_address),
    user_agent: r.user_agent === undefined || r.user_agent === null ? null : String(r.user_agent),
    created_at: String(r.created_at ?? ''),
  };
}

export function narrowImpersonationSessionPage(input: unknown): CursorPage<ImpersonationSession> {
  const base = narrowAuditEventPage(input);
  return { ...base, data: base.data.map((d) => d as ImpersonationSession) };
}

export function narrowTenantUserPage(
  input: unknown,
): CursorPage<components['schemas']['UserResource']> {
  if (!hasShape(input, ['data', 'next_cursor', 'has_more'])) {
    return { data: [], next_cursor: null, has_more: false };
  }
  const data = Array.isArray((input as Record<string, unknown>).data)
    ? ((input as Record<string, unknown>).data as unknown[])
    : [];
  return {
    data: data as components['schemas']['UserResource'][],
    next_cursor: (input as Record<string, unknown>).next_cursor as string | null,
    has_more: asBool((input as Record<string, unknown>).has_more),
  };
}
```

**coding-standards.md rules:**
- No `any` — use `unknown` and narrow (§ Type Safety).
- Hand-written types only for runtime adapters, not API DTOs (§ Generated Types).

**Two simple tests:**
1. `narrowPlatformTenantPage({ data: [{ public_id: 'a', is_active: '1' }], next_cursor: null, has_more: false })` → `data[0].is_active === '1'` and `has_more === false`.
2. `asBool('true') === true && asBool(false) === false`.

---

### 4. `lib/api/hooks/use-platform.ts`

**One-line summary:** Single hook file for all platform auth, tenant, admin, impersonation, and audit API calls.

**Key decisions:**
- Mirror the tenant `use-auth.ts` pattern but use platform endpoints.
- All mutations invalidate related platform keys and the audit list so the audit tab stays current.
- `usePlatformLogin` fetches CSRF cookie first, then posts credentials, then invalidates `auth.me`.
- `usePlatformLogout` clears the query cache and redirects to `/login`.

**Exact file (signatures):**

```ts
// lib/api/hooks/use-platform.ts
'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, ApiRequestError, localizedApiError } from '@/lib/api/client';
import { queryKeys, type PlatformTenantFilters, type PlatformAdminFilters, type PlatformAuditFilters, type PlatformTenantUserFilters } from '@/lib/api/query-keys';
import { narrowPlatformTenantPage, narrowPlatformAdminPage, narrowAuditEventPage, narrowImpersonationSessionPage, narrowTenantUserPage, asBool } from '@/lib/utils/platform-utils';
import type { CursorPage } from '@/lib/api/types';
import type { components } from '@/lib/generated/api-types';

type PlatformAdminResource = components['schemas']['PlatformAdminResource'];
type PlatformTenantResource = components['schemas']['PlatformTenantResource'];
type PlatformAuthResource = components['schemas']['PlatformAuthResource'];
type PlatformLoginRequest = components['schemas']['PlatformLoginRequest'];
type StorePlatformAdminRequest = components['schemas']['StorePlatformAdminRequest'];
type UpdatePlatformAdminRequest = components['schemas']['UpdatePlatformAdminRequest'];
type StoreTenantRequest = components['schemas']['StoreTenantRequest'];
type UpdateTenantRequest = components['schemas']['UpdateTenantRequest'];
type ImpersonateRequest = components['schemas']['ImpersonateRequest'];
type UserResource = components['schemas']['UserResource'];

async function getCsrfCookie(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test';
  await fetch(`${baseUrl}/sanctum/csrf-cookie`, { credentials: 'include' });
}

export function usePlatformAuth() {
  return useQuery({
    queryKey: queryKeys.platform.auth.me(),
    queryFn: () => apiClient.get<PlatformAdminResource>('/v1/platform/auth/me'),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiRequestError && error.status === 401) return false;
      return failureCount < 3;
    },
  });
}

export function usePlatformLogin() {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: async (credentials: PlatformLoginRequest) => {
      await getCsrfCookie();
      return apiClient.post<PlatformAuthResource>('/v1/platform/auth/login', credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.auth.me() });
      toast.success(t('login_success'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function usePlatformLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: () => apiClient.post('/v1/platform/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
    onError: (e) => {
      if (e instanceof ApiRequestError) toast.error(localizedApiError(e, t));
      queryClient.clear();
      router.push('/login');
    },
  });
}

export function usePlatformTenantsInfinite(filters: PlatformTenantFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.platform.tenants.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<unknown>('/v1/platform/tenants', {
        params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 15 },
      }).then(narrowPlatformTenantPage),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    staleTime: 30 * 1000,
  });
}

export function usePlatformTenant(publicId: string) {
  return useQuery({
    queryKey: queryKeys.platform.tenants.detail(publicId),
    queryFn: () => apiClient.get<PlatformTenantResource>(`/v1/platform/tenants/${publicId}`),
    enabled: !!publicId,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: (body: StoreTenantRequest) =>
      apiClient.post<PlatformTenantResource>('/v1/platform/tenants', body as unknown),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenants.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('tenant_created'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useUpdateTenant(publicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: (body: UpdateTenantRequest) =>
      apiClient.put<PlatformTenantResource>(`/v1/platform/tenants/${publicId}`, body as unknown),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenants.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenants.detail(publicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('tenant_updated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useSuspendTenant(publicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: () => apiClient.post<PlatformTenantResource>(`/v1/platform/tenants/${publicId}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenants.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenants.detail(publicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('tenant_suspended'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useReactivateTenant(publicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: () => apiClient.post<PlatformTenantResource>(`/v1/platform/tenants/${publicId}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenants.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.tenants.detail(publicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('tenant_reactivated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useRunTenantMigrations(publicId: string) {
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ message: string }>(`/v1/platform/tenants/${publicId}/run-migrations`),
    onSuccess: () => toast.success(t('migrations_dispatched')),
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function usePlatformAdminsInfinite(filters: PlatformAdminFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.platform.admins.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<unknown>('/v1/platform/admins', {
        params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 15 },
      }).then(narrowPlatformAdminPage),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    staleTime: 30 * 1000,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: (body: StorePlatformAdminRequest) =>
      apiClient.post<PlatformAdminResource>('/v1/platform/admins', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.admins.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('admin_created'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useUpdateAdmin(publicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: (body: UpdatePlatformAdminRequest) =>
      apiClient.put<PlatformAdminResource>(`/v1/platform/admins/${publicId}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.admins.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.auth.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('admin_updated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useDeactivateAdmin(publicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: () => apiClient.post<PlatformAdminResource>(`/v1/platform/admins/${publicId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.admins.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('admin_deactivated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useReactivateAdmin(publicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: () => apiClient.post<PlatformAdminResource>(`/v1/platform/admins/${publicId}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.admins.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('admin_reactivated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useImpersonationSessions() {
  return useQuery({
    queryKey: queryKeys.platform.impersonation.sessions(),
    queryFn: () =>
      apiClient.get<unknown>('/v1/platform/impersonation-sessions').then(narrowImpersonationSessionPage),
    staleTime: 30 * 1000,
  });
}

export function usePlatformTenantUsersInfinite(tenantPublicId: string, filters: PlatformTenantUserFilters) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.platform.tenants.detail(tenantPublicId), 'users', filters],
    queryFn: ({ pageParam }) =>
      apiClient.get<unknown>(`/v1/platform/tenants/${tenantPublicId}/users`, {
        params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 15 },
      }).then(narrowTenantUserPage),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    enabled: !!tenantPublicId,
    staleTime: 30 * 1000,
  });
}

export function useImpersonateUser(tenantPublicId: string) {
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: (body: ImpersonateRequest) =>
      apiClient.post<{ token: string; user: UserResource; tenant: { slug: string }; expires_at: string }>(
        `/v1/platform/tenants/${tenantPublicId}/impersonate`,
        body,
      ),
    onSuccess: (data) => {
      window.open(`https://${data.tenant.slug}.momentum.test?platform_token=${data.token}`, '_blank');
      toast.success(t('impersonation_started'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useEndImpersonation(tenantPublicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('platform.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ message: string }>(`/v1/platform/tenants/${tenantPublicId}/leave-impersonation`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.impersonation.sessions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.audit.lists() });
      toast.success(t('impersonation_ended'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function usePlatformAuditEventsInfinite(filters: PlatformAuditFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.platform.audit.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<unknown>('/v1/platform/audit-events', {
        params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 15 },
      }).then(narrowAuditEventPage),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    staleTime: 30 * 1000,
  });
}
```

**coding-standards.md rules:**
- `useInfiniteQuery` for cursor pagination (§ Cursor Pagination).
- Mutation invalidation (§ Mutation Patterns).
- `useTranslations` for toast strings (§ i18n).
- No `any` — cast request body to `unknown` when generated type is wrong (settings), use narrowing adapters for responses.

**Two simple tests:**
1. `usePlatformLogin` mutation: MSW returns `PlatformAuthResource` on POST `/v1/platform/auth/login` → `isSuccess` true and `auth.me` query is invalidated.
2. `usePlatformTenantsInfinite`: MSW returns `{ data: [tenant], next_cursor: null, has_more: false }` → `data.pages[0].data[0].public_id` equals the mock tenant public_id.

---

### 5. `lib/auth/server.ts` — platform auth guard

**One-line summary:** Add server-side prefetch helpers for platform routes so unauthenticated requests redirect before HTML renders.

**Exact additions:**

```ts
// lib/auth/server.ts (additions)
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';

export async function prefetchPlatformAdmin(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.platform.auth.me(),
    queryFn: async () => {
      try {
        return await apiClient.get<components['schemas']['PlatformAdminResource']>('/v1/platform/auth/me');
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 401) {
          redirect('/login');
        }
        throw e;
      }
    },
  });
}
```

**Note:** `apiClient` currently reads `X-Tenant` from `getTenantSlug()` which uses `window.location.hostname` — this fails server-side. The `isPlatformPath` check in `apiClient.request` must skip `X-Tenant` for `/v1/platform/auth/me` so the server-side prefetch works. `getLocaleSlug()` also reads `document.cookie`; on the server it returns `'ar'` by design.

**coding-standards.md rules:**
- Server-side auth guard before shell render (§ Auth Flow).

---

### 6. `app/(platform-auth)/login/page.tsx`

**One-line summary:** Standalone login page with no tenant chrome, Arabic default.

**Exact file:**

```tsx
// app/(platform-auth)/login/page.tsx
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { PlatformLoginForm } from '@/components/domain/platform/platform-login-form';

export const dynamic = 'force-dynamic';

export default async function PlatformLoginPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'ar';
  const t = await getTranslations({ locale, namespace: 'platform.login' });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <PlatformLoginForm />
      </div>
    </main>
  );
}
```

**coding-standards.md rules:**
- Server Component for pages unless interactivity required (§ Server vs Client).
- `getTranslations` for server-side strings (§ i18n).

---

### 7. `components/domain/platform/platform-login-form.tsx`

**One-line summary:** Email/password form with CSRF-first login, toast errors, redirect to workspace on success.

**Exact file:**

```tsx
// components/domain/platform/platform-login-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { usePlatformLogin } from '@/lib/api/hooks/use-platform';

export function PlatformLoginForm() {
  const router = useRouter();
  const t = useTranslations('platform.login');
  const login = usePlatformLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      // next-intl t returns string; toast handled by mutation on real submit
      return;
    }
    login.mutate({ email, password }, {
      onSuccess: () => router.push('/'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field>
        <FieldLabel>{t('email')}</FieldLabel>
        <Input
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('email_placeholder')}
          required
        />
      </Field>
      <Field>
        <FieldLabel>{t('password')}</FieldLabel>
        <Input
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('password_placeholder')}
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
```

**coding-standards.md rules:**
- `Field` + `InputGroup` (nova) for forms; here plain `Field`/`Input` is sufficient because there are no icons/addons (§ Form Handling).
- Validation errors via `toast.error()` (mutation `onError`) — no `FieldError` (§ Toast Notifications).
- No hardcoded strings (§ i18n).

**Two simple tests:**
1. Render → email and password inputs are present; submit button is enabled.
2. Fill and submit → mutation is called with `{ email, password }`; on success, router pushes `/`.

---

### 8. `app/(platform-admin)/layout.tsx`

**One-line summary:** Authenticated platform layout with minimal top bar and server-side auth guard.

**Exact file:**

```tsx
// app/(platform-admin)/layout.tsx
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchPlatformAdmin } from '@/lib/auth/server';
import { PlatformTopBar } from '@/components/domain/platform/platform-top-bar';

export const dynamic = 'force-dynamic';

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'ar';
  const t = await getTranslations({ locale, namespace: 'shell' });

  await prefetchPlatformAdmin(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex min-h-screen flex-col" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
        >
          {t('skip_to_main')}
        </a>
        <PlatformTopBar />
        <main id="main-content" className="flex-1 p-6">
          {children}
        </main>
      </div>
    </HydrationBoundary>
  );
}
```

**coding-standards.md rules:**
- Server-side auth guard (§ Auth Flow).
- Skip link for accessibility (§ Accessibility).
- Logical properties used in skip link (`focus:start-4`).

---

### 9. `components/domain/platform/platform-top-bar.tsx`

**One-line summary:** Minimal top bar with logo, admin name/email, locale toggle, and logout.

**Exact file:**

```tsx
// components/domain/platform/platform-top-bar.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { usePlatformAuth, usePlatformLogout } from '@/lib/api/hooks/use-platform';
import { localizeName } from '@/lib/utils/platform-utils';
import { LogOut } from 'lucide-react';

export function PlatformTopBar() {
  const locale = useLocale();
  const t = useTranslations('platform.shell');
  const { data: admin } = usePlatformAuth();
  const logout = usePlatformLogout();

  const name = admin ? localizeName(admin, locale) : '';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/50 bg-background px-6">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{t('brand')}</span>
        <span className="text-xs text-muted-foreground">{t('workspace_label')}</span>
      </div>
      <div className="flex items-center gap-3">
        {admin && (
          <div className="hidden text-start sm:block">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{admin.email}</p>
          </div>
        )}
        <LocaleToggle />
        <Button variant="ghost" size="icon" onClick={() => logout.mutate()} aria-label={t('logout')}>
          <LogOut className="size-5" />
        </Button>
      </div>
    </header>
  );
}
```

**coding-standards.md rules:**
- `useLocale` + `useTranslations` for client i18n (§ i18n).
- Icon-only button has `aria-label` (§ Accessibility).
- Logical properties (`justify-between`, `text-start`).

---

### 10. `app/(platform-admin)/page.tsx` and `components/domain/platform/platform-workspace.tsx`

**One-line summary:** Workspace page renders `PlatformWorkspace`, which routes tabs via `?tab=...`.

**Exact file (`page.tsx`):**

```tsx
// app/(platform-admin)/page.tsx
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { PlatformWorkspace } from '@/components/domain/platform/platform-workspace';

export const dynamic = 'force-dynamic';

export default async function PlatformAdminPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'ar';
  const t = await getTranslations({ locale, namespace: 'platform.workspace' });

  return (
    <div className="space-y-6">
      <PlatformWorkspace title={t('title')} description={t('description')} />
    </div>
  );
}
```

**Exact file (`platform-workspace.tsx`):**

```tsx
// components/domain/platform/platform-workspace.tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { TenantsTabPanel } from './tenants/tenants-tab-panel';
import { AdminsTabPanel } from './admins/admins-tab-panel';
import { ImpersonationTabPanel } from './impersonation/impersonation-tab-panel';
import { AuditTabPanel } from './audit/audit-tab-panel';
import { Plus } from 'lucide-react';

const TABS = ['tenants', 'admins', 'impersonation', 'audit'] as const;
type Tab = (typeof TABS)[number];

interface PlatformWorkspaceProps {
  title: string;
  description: string;
}

export function PlatformWorkspace({ title, description }: PlatformWorkspaceProps) {
  const t = useTranslations('platform.workspace');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawTab = searchParams.get('tab');
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : 'tenants';

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function setCreateOpen(open: boolean) {
    // Each tab panel owns its own dialog state; this function is passed down.
  }

  const createAction = {
    tenants: (
      <Button key="tenants" onClick={() => {}}>
        <Plus className="size-4" />
        {t('provision_tenant')}
      </Button>
    ),
    admins: (
      <Button key="admins" onClick={() => {}}>
        <Plus className="size-4" />
        {t('add_admin')}
      </Button>
    ),
    impersonation: null,
    audit: null,
  }[tab];

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={createAction} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="tenants">{t('tab_tenants')}</TabsTrigger>
          <TabsTrigger value="admins">{t('tab_admins')}</TabsTrigger>
          <TabsTrigger value="impersonation">{t('tab_impersonation')}</TabsTrigger>
          <TabsTrigger value="audit">{t('tab_audit')}</TabsTrigger>
        </TabsList>
        <TabsContent value="tenants">
          <TenantsTabPanel />
        </TabsContent>
        <TabsContent value="admins">
          <AdminsTabPanel />
        </TabsContent>
        <TabsContent value="impersonation">
          <ImpersonationTabPanel />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTabPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Key decisions:**
- Tab state in URL so deep links work; invalid/missing tab defaults to `tenants` (matches spec and spec 010).
- PageHeader action slot renders the active tab's primary create action.
- Dialog open state is lifted to each tab panel because create buttons live in PageHeader actions (pass a callback or use a small local-state wrapper).

**Refined pattern:** Instead of empty `onClick={() => {}}`, pass `onProvisionOpen`/`onAddAdminOpen` callbacks from tab panels to `PlatformWorkspace` via render props, or let each tab panel render its own `PageHeader`. To keep the spec's "PageHeader actions slot" requirement cleanly, have each tab panel export a `renderActions(onOpen)` helper, or have `PlatformWorkspace` render a composite header.

Simpler implementation: each tab panel receives `isCreateOpen`/`setCreateOpen` props from `PlatformWorkspace` and exposes a static `createLabel` icon. For copy-paste clarity, keep the action buttons in `PlatformWorkspace` and wire them to local `createOpen` state per tab.

**coding-standards.md rules:**
- URL state for filters/tabs (§ State Management).
- `PageHeader` reuse (§ Component Mapping).
- Tabs with Radix keyboard support (§ Accessibility).

**Two simple tests:**
1. Render with `?tab=audit` → Audit tab content is visible and tab trigger has `aria-selected="true"`.
2. Click "Admins" tab → URL updates to `?tab=admins` and admins panel renders.

---

### 11. Tenants tab — `tenants-tab-panel.tsx`, `tenants-table.tsx`, `tenants-filters.tsx`

**One-line summary:** Cursor-paginated tenant list with search/status filters, row actions, and create/edit dialogs.

**Key decisions:**
- Filters are URL-driven and debounced (300 ms) for search.
- Status filter maps UI values to `is_active` boolean: `all` → undefined, `active` → true, `suspended` → false.
- Row click navigates to `/tenants/[publicId]`.
- Use `ActiveBadge` for status column.
- Slug and database_name are read-only in edit dialog.

**Exact file (`tenants-tab-panel.tsx`):**

```tsx
// components/domain/platform/tenants/tenants-tab-panel.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { TenantsFilters } from './tenants-filters';
import { TenantsTable } from './tenants-table';
import { TenantsCardList } from './tenants-card-list';
import { TenantsSkeleton } from './tenants-skeleton';
import { ProvisionTenantDialog } from './provision-tenant-dialog';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { usePlatformTenantsInfinite } from '@/lib/api/hooks/use-platform';
import { asBool } from '@/lib/utils/platform-utils';

export function TenantsTabPanel() {
  const t = useTranslations('platform.tenants');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? undefined;
  const status = searchParams.get('status') ?? 'all';
  const isActive = status === 'all' ? undefined : status === 'active';
  const filters = { search, is_active: isActive };
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    usePlatformTenantsInfinite(filters);
  const [createOpen, setCreateOpen] = useState(false);

  const tenants = data?.pages.flatMap((p) => p.data) ?? [];
  const isFiltered = !!search || status !== 'all';

  if (isLoading) return <TenantsSkeleton />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;
  if (tenants.length === 0) {
    return (
      <div className="space-y-4">
        <TenantsFilters />
        <EmptyState
          icon={isFiltered ? undefined : undefined}
          title={isFiltered ? t('empty_filtered_title') : t('empty_title')}
          description={isFiltered ? t('empty_filtered_desc') : t('empty_desc')}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t('provision_tenant')}
            </Button>
          }
        />
        <ProvisionTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TenantsFilters />
      <div className="hidden md:block">
        <TenantsTable tenants={tenants} />
      </div>
      <div className="md:hidden">
        <TenantsCardList tenants={tenants} />
      </div>
      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
      <ProvisionTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
```

**Exact file (`tenants-filters.tsx`):**

```tsx
// components/domain/platform/tenants/tenants-filters.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { RtlSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/rtl-select';

export function TenantsFilters() {
  const t = useTranslations('platform.tenants');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = searchParams.get('status') ?? 'all';
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) params.set('search', search.trim());
      else params.delete('search');
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchParams, pathname, router]);

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('status');
    else params.set('status', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder={t('search_placeholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-xs"
      />
      <RtlSelect value={status} onValueChange={setStatus}>
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder={t('status_all')} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('status_all')}</SelectItem>
          <SelectItem value="active">{t('status_active')}</SelectItem>
          <SelectItem value="suspended">{t('status_suspended')}</SelectItem>
        </SelectContent>
      </RtlSelect>
    </div>
  );
}
```

**Exact file (`tenants-table.tsx`):**

```tsx
// components/domain/platform/tenants/tenants-table.tsx
'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RtlTable } from '@/components/shared/rtl-table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { TenantRowActions } from './tenant-row-actions';
import { asBool, localizeName } from '@/lib/utils/platform-utils';
import type { components } from '@/lib/generated/api-types';

type PlatformTenantResource = components['schemas']['PlatformTenantResource'];

interface TenantsTableProps {
  tenants: PlatformTenantResource[];
}

export function TenantsTable({ tenants }: TenantsTableProps) {
  const locale = useLocale();
  const t = useTranslations('platform.tenants');

  return (
    <RtlTable aria-label={t('table_label')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('col_name')}</TableHead>
          <TableHead>{t('col_slug')}</TableHead>
          <TableHead>{t('col_domain')}</TableHead>
          <TableHead>{t('col_status')}</TableHead>
          <TableHead>{t('col_created')}</TableHead>
          <TableHead className="text-end">{t('col_actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tenants.map((tenant) => (
          <TableRow key={tenant.public_id} className="transition-colors duration-150">
            <TableCell>
              <Link href={`/tenants/${tenant.public_id}`} className="font-medium hover:underline">
                {localizeName(tenant, locale)}
              </Link>
            </TableCell>
            <TableCell className="font-mono text-xs">{tenant.slug}</TableCell>
            <TableCell dir="ltr">{tenant.domain || '-'}</TableCell>
            <TableCell>
              <ActiveBadge
                isActive={asBool(tenant.is_active)}
                activeLabel={t('status_active')}
                inactiveLabel={t('status_suspended')}
              />
            </TableCell>
            <TableCell>
              <DualDateDisplay gregorian={tenant.created_at} variant="stacked" />
            </TableCell>
            <TableCell className="text-end">
              <TenantRowActions tenant={tenant} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </RtlTable>
  );
}
```

**Key decisions:**
- `RtlTable` auto-sets `dir` per locale.
- Action column uses `text-end`.
- `ActiveBadge` shows text + color (no color-only indicator).
- Domain is displayed LTR because it is ASCII.

**coding-standards.md rules:**
- Cursor pagination with `useInfiniteQuery` (§ Cursor Pagination UI).
- All 4 states (§ Loading States — Required Pattern).
- Logical properties (`text-end`, `font-mono`).
- `ActiveBadge` pattern (§ Shared Components).
- `DualDateDisplay` for dates (§ Hijri Date Display).

**Two simple tests:**
1. `TenantsTable` with one tenant → row contains localized name, slug, and status label.
2. `TenantsFilters` typing in search input → after 300 ms, URL contains `?search=typed`.

---

### 12. Tenant dialogs — `provision-tenant-dialog.tsx`, `edit-tenant-dialog.tsx`

**One-line summary:** Create/edit tenant forms using `BilingualNameFields`, `RtlSelect`, and sentinel values for nullable fields.

**Key decisions:**
- `name_ar` required; `name_en` optional.
- `slug` required, alpha-dash, immutable (not shown in edit).
- `default_language` maps UI values `ar`/`en` to API strings `"1"`/`"2"`.
- `timezone` uses a curated list of common timezone strings (Asia/Riyadh, Asia/Dubai, UTC, Africa/Cairo, Europe/London, America/New_York) plus free-text input fallback.
- `settings` is a JSON object; UI uses a textarea that parses/stringifies.
- `logo_path` is a plain string input (file upload is out of scope).

**Exact file (`provision-tenant-dialog.tsx`):**

```tsx
// components/domain/platform/tenants/provision-tenant-dialog.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { RtlSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/rtl-select';
import { useCreateTenant } from '@/lib/api/hooks/use-platform';
import type { components } from '@/lib/generated/api-types';

type StoreTenantRequest = components['schemas']['StoreTenantRequest'];

const TIMEZONES = ['Asia/Riyadh', 'Asia/Dubai', 'UTC', 'Africa/Cairo', 'Europe/London', 'America/New_York'];

interface ProvisionTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProvisionTenantDialog({ open, onOpenChange }: ProvisionTenantDialogProps) {
  const t = useTranslations('platform.tenants');
  const create = useCreateTenant();
  const [form, setForm] = useState<Partial<StoreTenantRequest>>({
    name_ar: '',
    name_en: '',
    slug: '',
    domain: '',
    timezone: 'Asia/Riyadh',
    default_language: '1',
    logo_path: '',
  });

  function handleFieldChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.name_ar?.trim() || !form.slug?.trim()) {
      // Required-field toast handled by backend 422; optionally add client-side toast.
      return;
    }
    const body: StoreTenantRequest = {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en?.trim() || null,
      slug: form.slug.trim(),
      domain: form.domain?.trim() || null,
      timezone: form.timezone || null,
      default_language: form.default_language ?? '1',
      logo_path: form.logo_path?.trim() || null,
      settings: null,
    };
    create.mutate(body, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('provision_title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <BilingualNameFields form={form} setForm={setForm} t={t} />
          <Field>
            <FieldLabel>{t('slug')} <span className="text-destructive">*</span></FieldLabel>
            <Input
              dir="ltr"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder={t('slug_placeholder')}
            />
          </Field>
          <Field>
            <FieldLabel>{t('domain')}</FieldLabel>
            <Input dir="ltr" value={form.domain} onChange={(e) => handleFieldChange('domain', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t('timezone')}</FieldLabel>
            <RtlSelect value={form.timezone} onValueChange={(v) => handleFieldChange('timezone', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>
          <Field>
            <FieldLabel>{t('default_language')}</FieldLabel>
            <RtlSelect value={form.default_language} onValueChange={(v) => handleFieldChange('default_language', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{t('lang_ar')}</SelectItem>
                <SelectItem value="2">{t('lang_en')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>
          <Field>
            <FieldLabel>{t('logo_path')}</FieldLabel>
            <Input dir="ltr" value={form.logo_path} onChange={(e) => handleFieldChange('logo_path', e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Key decisions:**
- `BilingualNameFields` reused for `name_ar`/`name_en`.
- `default_language` sent as `"1"` or `"2"` per generated enum.
- Settings omitted from MVP create dialog (null). If required by backend, send `{}` as object cast to `unknown`.

**Edit dialog (`edit-tenant-dialog.tsx`):**
- Same fields as create except `slug` is read-only text and `database_name` is shown read-only.
- Uses `useUpdateTenant(publicId)`.
- Pre-populates from `PlatformTenantResource`.

**coding-standards.md rules:**
- `BilingualNameFields` for bilingual names (§ Forms).
- `RtlSelect` for selects (§ Shared Components).
- Validation errors via toast (§ Toast Notifications).
- No `FieldError` (§ Form Handling).

**Two simple tests:**
1. Open provision dialog, fill `name_ar` and `slug`, click Save → `useCreateTenant.mutate` called with expected body.
2. Edit dialog pre-populates `name_ar` from tenant; `slug` input is disabled/read-only.

---

### 13. Tenant detail — `tenant-detail-view.tsx`

**One-line summary:** Full tenant profile with read-only immutable fields, mutable fields in an edit dialog, and action buttons.

**Key decisions:**
- Display `public_id`, `name_ar`, `name_en`, `slug` (read-only), `domain`, `database_name` (read-only), `is_active`, `default_language`, `timezone`, `logo_path`, `settings` (escaped structured JSON), `created_at`, `updated_at`.
- Actions: Edit, Suspend/Reactivate, Run Migrations, Impersonate User.
- Suspend/Reactivate use `ConfirmDeleteDialog` with `destructive={false}`.
- Impersonate opens `ImpersonateUserDialog`.

**Exact snippet (skeleton structure):**

```tsx
// components/domain/platform/tenants/tenant-detail-view.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { ActiveBadge } from '@/components/shared/active-badge';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { EditTenantDialog } from './edit-tenant-dialog';
import { ImpersonateUserDialog } from '../impersonation/impersonate-user-dialog';
import { usePlatformTenant, useSuspendTenant, useReactivateTenant, useRunTenantMigrations } from '@/lib/api/hooks/use-platform';
import { asBool, localizeName } from '@/lib/utils/platform-utils';
import { ArrowLeft, Pencil, PauseCircle, PlayCircle, Database, UserCheck } from 'lucide-react';

export function TenantDetailView() {
  const params = useParams();
  const publicId = String(params.publicId);
  const locale = useLocale();
  const t = useTranslations('platform.tenants');
  const { data: tenant, isLoading, isError, error, refetch } = usePlatformTenant(publicId);
  const suspend = useSuspendTenant(publicId);
  const reactivate = useReactivateTenant(publicId);
  const runMigrations = useRunTenantMigrations(publicId);
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [migrationsOpen, setMigrationsOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);

  if (isLoading) return <TenantDetailSkeleton />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;
  if (!tenant) return null;

  const isActive = asBool(tenant.is_active);
  const settingsObj = parseSettings(tenant.settings);

  return (
    <div className="space-y-6">
      <PageHeader
        title={localizeName(tenant, locale)}
        description={tenant.slug}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t('back')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              {t('edit')}
            </Button>
            {isActive ? (
              <Button variant="outline" size="sm" onClick={() => setSuspendOpen(true)}>
                <PauseCircle className="size-4" />
                {t('suspend')}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setReactivateOpen(true)}>
                <PlayCircle className="size-4" />
                {t('reactivate')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setMigrationsOpen(true)}>
              <Database className="size-4" />
              {t('run_migrations')}
            </Button>
            <Button size="sm" onClick={() => setImpersonateOpen(true)}>
              <UserCheck className="size-4" />
              {t('impersonate')}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('detail_title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldReadOnly label={t('public_id')} value={tenant.public_id} />
          <FieldReadOnly label={t('slug')} value={tenant.slug} />
          <FieldReadOnly label={t('database_name')} value={tenant.database_name} />
          <FieldReadOnly label={t('domain')} value={tenant.domain || '-'} />
          <FieldReadOnly label={t('timezone')} value={tenant.timezone || '-'} />
          <FieldReadOnly label={t('default_language')} value={tenant.default_language === '2' ? t('lang_en') : t('lang_ar')} />
          <FieldReadOnly label={t('logo_path')} value={tenant.logo_path || '-'} />
          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('settings')}</p>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs" dir="ltr">
              {JSON.stringify(settingsObj, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('status')}</p>
            <ActiveBadge isActive={isActive} activeLabel={t('status_active')} inactiveLabel={t('status_suspended')} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('created_at')}</p>
            <DualDateDisplay gregorian={tenant.created_at} variant="stacked" />
          </div>
        </CardContent>
      </Card>

      <EditTenantDialog tenant={tenant} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDeleteDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={t('suspend_title')}
        description={t('suspend_desc', { name: localizeName(tenant, locale) })}
        onConfirm={() => suspend.mutate(undefined, { onSuccess: () => setSuspendOpen(false) })}
        confirmLabel={t('suspend')}
        destructive={false}
        isPending={suspend.isPending}
      />
      <ConfirmDeleteDialog
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        title={t('reactivate_title')}
        description={t('reactivate_desc', { name: localizeName(tenant, locale) })}
        onConfirm={() => reactivate.mutate(undefined, { onSuccess: () => setReactivateOpen(false) })}
        confirmLabel={t('reactivate')}
        destructive={false}
        isPending={reactivate.isPending}
      />
      <ConfirmDeleteDialog
        open={migrationsOpen}
        onOpenChange={setMigrationsOpen}
        title={t('migrations_title')}
        description={t('migrations_desc')}
        onConfirm={() => runMigrations.mutate(undefined, { onSuccess: () => setMigrationsOpen(false) })}
        confirmLabel={t('run_migrations')}
        destructive={false}
        isPending={runMigrations.isPending}
      />
      <ImpersonateUserDialog tenantPublicId={publicId} open={impersonateOpen} onOpenChange={setImpersonateOpen} />
    </div>
  );
}

function FieldReadOnly({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function parseSettings(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function TenantDetailSkeleton() {
  return <div>{/* skeleton matching card layout */}</div>;
}
```

**Key decisions:**
- Settings displayed inside `<pre>` as escaped JSON — never `dangerouslySetInnerHTML` (§ Security).
- `ArrowLeft` flips in RTL.
- Confirm dialogs are non-destructive for suspend/reactivate/migrations.

**coding-standards.md rules:**
- All 4 states (§ Loading States).
- `ActiveBadge` text + color (§ Color).
- `DualDateDisplay` (§ Hijri Date Display).
- Logical properties and icon flipping (§ RTL).
- No `dangerouslySetInnerHTML` (§ Security).

**Two simple tests:**
1. Active tenant → Suspend button visible, Reactivate hidden.
2. Suspended tenant → Reactivate button visible, Suspend hidden.

---

### 14. Admins tab — `admins-tab-panel.tsx`, `admins-table.tsx`, `admin-form-dialog.tsx`

**One-line summary:** Cursor-paginated platform admin list with create/edit/deactivate/reactivate; self-deactivation hidden.

**Key decisions:**
- Compare row `public_id` to `/me` response to hide deactivate action on own row.
- Create form requires `name_ar`, `email`, `password` (min 8).
- Edit form allows `name_ar`, `name_en`, `email`, optional password replacement.
- Use `BilingualNameFields`.

**Exact snippet (`admins-table.tsx`):**

```tsx
// components/domain/platform/admins/admins-table.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RtlTable } from '@/components/shared/rtl-table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { AdminRowActions } from './admin-row-actions';
import { asBool, localizeName } from '@/lib/utils/platform-utils';
import { usePlatformAuth } from '@/lib/api/hooks/use-platform';
import type { components } from '@/lib/generated/api-types';

type PlatformAdminResource = components['schemas']['PlatformAdminResource'];

interface AdminsTableProps {
  admins: PlatformAdminResource[];
}

export function AdminsTable({ admins }: AdminsTableProps) {
  const locale = useLocale();
  const t = useTranslations('platform.admins');
  const { data: me } = usePlatformAuth();

  return (
    <RtlTable aria-label={t('table_label')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('col_name')}</TableHead>
          <TableHead>{t('col_email')}</TableHead>
          <TableHead>{t('col_status')}</TableHead>
          <TableHead className="text-end">{t('col_actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin) => (
          <TableRow key={admin.public_id} className="transition-colors duration-150">
            <TableCell className="font-medium">{localizeName(admin, locale)}</TableCell>
            <TableCell dir="ltr">{admin.email}</TableCell>
            <TableCell>
              <ActiveBadge
                isActive={asBool(admin.is_active)}
                activeLabel={t('status_active')}
                inactiveLabel={t('status_inactive')}
              />
            </TableCell>
            <TableCell className="text-end">
              <AdminRowActions admin={admin} isSelf={admin.public_id === me?.public_id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </RtlTable>
  );
}
```

**coding-standards.md rules:**
- Reuse `ActiveBadge`, `RtlTable` (§ Shared Components).
- Self-deactivation hidden via `/me` comparison (§ Security).

**Two simple tests:**
1. Render with two admins including current user → current user's row has no Deactivate action.
2. Deactivate action on another row opens confirm dialog; confirm calls `useDeactivateAdmin.mutate`.

---

### 15. Impersonation tab — `impersonation-tab-panel.tsx`, `impersonate-user-dialog.tsx`

**One-line summary:** List active impersonation sessions with End Session action; user picker dialog for initiating impersonation.

**Key decisions:**
- Sessions are derived from central audit events (`action === 'impersonation.start'` with no matching end).
- End Session calls `POST /v1/platform/tenants/{tenant}/leave-impersonation` using `tenant_public_id` from the session payload.
- User picker uses `usePlatformTenantUsersInfinite` with debounced search.

**Exact snippet (`impersonate-user-dialog.tsx`):**

```tsx
// components/domain/platform/impersonation/impersonate-user-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePlatformTenantUsersInfinite, useImpersonateUser } from '@/lib/api/hooks/use-platform';
import { localizeName } from '@/lib/utils/platform-utils';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];

interface ImpersonateUserDialogProps {
  tenantPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImpersonateUserDialog({ tenantPublicId, open, onOpenChange }: ImpersonateUserDialogProps) {
  const locale = useLocale();
  const t = useTranslations('platform.impersonation');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePlatformTenantUsersInfinite(tenantPublicId, {
    search: debounced || undefined,
    is_active: true,
  });
  const impersonate = useImpersonateUser(tenantPublicId);
  const [selected, setSelected] = useState<UserResource | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const users = data?.pages.flatMap((p) => p.data) ?? [];

  function handleImpersonate() {
    if (!selected) return;
    impersonate.mutate({ user_public_id: selected.public_id }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('impersonate_title')}</DialogTitle>
        </DialogHeader>
        <Input
          placeholder={t('search_user')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-64 overflow-y-auto rounded-md border">
          {users.map((user) => (
            <button
              key={user.public_id}
              onClick={() => setSelected(user)}
              className={`w-full px-4 py-2 text-start transition-colors hover:bg-muted ${selected?.public_id === user.public_id ? 'bg-muted' : ''}`}
            >
              <p className="text-sm font-medium">{localizeName(user, locale)}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{user.email}</p>
            </button>
          ))}
          {hasNextPage && (
            <Button variant="ghost" className="w-full" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? t('loading') : t('load_more')}
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleImpersonate} disabled={!selected || impersonate.isPending}>
            {impersonate.isPending ? t('starting') : t('start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**coding-standards.md rules:**
- Debounced search (§ Performance / Filter Patterns).
- Cursor pagination (§ Cursor Pagination).
- Icon flipping not needed here; focus states visible by default on buttons.

**Two simple tests:**
1. Type in user picker search → after 300 ms the API call includes `search` param.
2. Select a user and click Start → `useImpersonateUser.mutate` called with `user_public_id`; on success a new tab opens.

---

### 16. Audit tab — `audit-tab-panel.tsx`, `audit-table.tsx`, `audit-detail-dialog.tsx`, `audit-filters.tsx`

**One-line summary:** Cursor-paginated central audit log with action/entity/date filters and escaped payload detail dialog.

**Key decisions:**
- Filters: `action` free-text with curated suggestions, `entity_type` free-text with curated suggestions (`tenant`, `platform_admin`, `impersonation`), `from`/`to` date range with `CalendarSystemToggle`.
- Date range picker uses Spec 020 `DateRangePicker` with `calendarSystem` URL param.
- Details dialog shows `payload` as escaped JSON plus `ip_address` and `user_agent`.
- No edit/delete actions.

**Exact snippet (`audit-filters.tsx`):**

```tsx
// components/domain/platform/audit/audit-filters.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { RtlSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/rtl-select';
import { CalendarSystemToggle } from '@/components/shared/calendar-system-toggle';
import { DateRangePicker } from '@/components/shared/date-range-picker';

const ACTIONS = ['tenant.create', 'tenant.update', 'tenant.suspend', 'tenant.reactivate', 'tenant.run_migrations', 'platform_admin.create', 'platform_admin.update', 'impersonation.start', 'impersonation.end'];
const ENTITY_TYPES = ['tenant', 'platform_admin', 'impersonation'];

export function AuditFilters() {
  const t = useTranslations('platform.audit');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const action = searchParams.get('action') ?? '';
  const entityType = searchParams.get('entityType') ?? '';
  const calendarSystem = (searchParams.get('calendarSystem') ?? 'gregorian') as 'gregorian' | 'hijri';
  const dateFrom = searchParams.get('dateFrom') ?? undefined;
  const dateTo = searchParams.get('dateTo') ?? undefined;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        placeholder={t('action_placeholder')}
        value={action}
        onChange={(e) => setParam('action', e.target.value || null)}
        className="sm:max-w-xs"
        list="audit-actions"
      />
      <datalist id="audit-actions">
        {ACTIONS.map((a) => <option key={a} value={a} />)}
      </datalist>
      <RtlSelect value={entityType} onValueChange={(v) => setParam('entityType', v || null)}>
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder={t('entity_type_all')} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('entity_type_all')}</SelectItem>
          {ENTITY_TYPES.map((et) => (
            <SelectItem key={et} value={et}>{t(`entity_type_${et}`)}</SelectItem>
          ))}
        </SelectContent>
      </RtlSelect>
      <CalendarSystemToggle value={calendarSystem} onChange={(v) => setParam('calendarSystem', v)} />
      <DateRangePicker
        calendarSystem={calendarSystem}
        value={{ from: dateFrom, to: dateTo }}
        onChange={(range) => {
          setParam('dateFrom', range?.from || null);
          setParam('dateTo', range?.to || null);
        }}
      />
    </div>
  );
}
```

**Key decisions:**
- `action` is a free-text input with a `<datalist>` for curated suggestions; backend accepts any string.
- `entity_type` uses a select with an "all" sentinel that maps to undefined.
- Date range picker is from Spec 020 and handles Hijri/Gregorian switching.

**Exact snippet (`audit-detail-dialog.tsx`):**

```tsx
// components/domain/platform/audit/audit-detail-dialog.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import type { AuditEvent } from '@/lib/utils/platform-utils';

interface AuditDetailDialogProps {
  event: AuditEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditDetailDialog({ event, open, onOpenChange }: AuditDetailDialogProps) {
  const t = useTranslations('platform.audit');
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('detail_title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('action')} value={event.action} />
            <Field label={t('entity_type')} value={event.entity_type} />
            <Field label={t('entity_id')} value={event.entity_id} />
            <Field label={t('actor')} value={event.user_id ?? t('system_actor')} />
            <Field label={t('created_at')} value={<DualDateDisplay gregorian={event.created_at} variant="stacked" />} />
            <Field label={t('ip_address')} value={event.ip_address ?? '-'} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('payload')}</p>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs" dir="ltr">
              {JSON.stringify(event.payload ?? {}, null, 2)}
            </pre>
          </div>
          {event.user_agent && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('user_agent')}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground" dir="ltr">{event.user_agent}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
```

**coding-standards.md rules:**
- Escaped structured display of payload — no `dangerouslySetInnerHTML` (§ Security).
- `DualDateDisplay` for timestamps (§ Hijri Date Display).
- `CalendarSystemToggle` for date range (§ Spec 020 patterns).
- Dialog traps focus automatically (shadcn Dialog).

**Two simple tests:**
1. Click Details on an audit row → dialog opens with the same action/entity/payload.
2. Select an entity type filter → URL updates and list refetches.

---

### 17. Skeletons

**One-line summary:** Every data component has a skeleton matching the real layout.

**Key files:**
- `tenants-skeleton.tsx` — 8 `TableRow`s with `Skeleton` cells.
- `admins-skeleton.tsx` — 6 rows.
- `impersonation-sessions-skeleton.tsx` — 3 rows.
- `audit-skeleton.tsx` — 8 rows.
- `tenant-detail-skeleton.tsx` — card with skeleton fields.

**Pattern:**

```tsx
// components/domain/platform/tenants/tenants-skeleton.tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function TenantsSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="ms-auto h-4 w-10" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-14" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="ms-auto h-8 w-8" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**coding-standards.md rules:**
- Skeletons match content shape (§ Loading Skeletons).
- Logical properties (`ms-auto`).

---

### 18. Messages (`messages/ar.json`, `messages/en.json`)

**One-line summary:** Add a `platform` namespace with ~180 keys covering login, workspace, tenants, admins, impersonation, audit, and toast strings.

**Key namespace structure:**

```json
{
  "platform": {
    "login": {
      "title": "منصة Gov TMS",
      "subtitle": "تسجيل دخول مسؤول المنصة",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "submit": "دخول",
      "submitting": "جاري الدخول..."
    },
    "shell": {
      "brand": "Gov TMS",
      "workspace_label": "إدارة المنصة",
      "logout": "تسجيل الخروج"
    },
    "workspace": {
      "title": "إدارة المنصة",
      "description": "إدارة المستأجرين والمشغلين وعمليات انتحال الهوية وسجل التدقيق.",
      "tab_tenants": "المستأجرون",
      "tab_admins": "مسؤولو المنصة",
      "tab_impersonation": "جلسات انتحال الهوية",
      "tab_audit": "سجل التدقيق",
      "provision_tenant": "إنشاء مستأجر",
      "add_admin": "إضافة مسؤول"
    },
    "tenants": { ... },
    "admins": { ... },
    "impersonation": { ... },
    "audit": { ... },
    "toast": {
      "login_success": "تم تسجيل الدخول بنجاح",
      "tenant_created": "تم إنشاء المستأجر",
      "tenant_updated": "تم تحديث المستأجر",
      "tenant_suspended": "تم تعليق المستأجر",
      "tenant_reactivated": "تم إعادة تفعيل المستأجر",
      "migrations_dispatched": "تم إرسال الترحيلات",
      "admin_created": "تم إنشاء المسؤول",
      "admin_updated": "تم تحديث المسؤول",
      "admin_deactivated": "تم تعطيل المسؤول",
      "admin_reactivated": "تم إعادة تفعيل المسؤول",
      "impersonation_started": "تم فتح جلسة انتحال الهوية في تبويب جديد",
      "impersonation_ended": "تم إنهاء الجلسة",
      "generic_error": "حدث خطأ. يرجى المحاولة مرة أخرى."
    }
  }
}
```

**coding-standards.md rules:**
- Dot-namespaced snake_case keys (§ Translation Key Conventions).
- No hardcoded user-facing strings (§ RTL Anti-Patterns).

---

## Data Flow

```
Browser (admin.momentum.test)
  → Next.js route group (platform-auth / platform-admin)
  → Server layout prefetches /v1/platform/auth/me (401 → /login)
  → Client components mount with TanStack Query hydrated state
  → URL params (tab, search, status, action, entityType, dateFrom, dateTo, calendarSystem)
     drive query hook filters
  → usePlatformTenantsInfinite / usePlatformAdminsInfinite / usePlatformAuditEventsInfinite
     call apiClient.get('/v1/platform/...')
  → apiClient omits X-Tenant for /v1/platform/*, includes credentials + X-Locale + CSRF header
  → Nginx → Laravel Platform controllers → central DB
  → JSON response → runtime narrowing adapter → CursorPage<T>
  → TanStack Query cache → component re-render → RtlTable / Card list / Load More
  → Mutation (create/update/suspend/reactivate/deactivate/end impersonation)
     → apiClient.post/put → backend writes + audit event
     → onSuccess invalidates related query keys + audit list + toast.success
```

---

## Route Structure

```
app/
├── layout.tsx                              (existing tenant + platform shared root)
├── (platform-auth)/
│   └── login/
│       └── page.tsx                        (/login)
├── (platform-admin)/
│   ├── layout.tsx                          (auth guard + top bar)
│   ├── page.tsx                            (/ → workspace, default tab=tenants)
│   └── tenants/
│       └── [publicId]/
│           └── page.tsx                    (/tenants/:publicId)
```

**Notes:**
- Locale is cookie-based (`NEXT_LOCALE`). No `[locale]` segment.
- `admin.momentum.test` must be configured in DNS/Nginx to point to the same Next.js app. The route group does not require hostname-aware middleware in Next.js.
- Platform login is at `/login`, same path as tenant login but served under a different hostname. This is acceptable because the hostname selects the app context.

---

## Execution Order

| Step | File / Task | Depends On |
|------|-------------|------------|
| 1 | Modify `lib/api/client.ts` to omit `X-Tenant` for `/v1/platform/*` | None |
| 2 | Extend `lib/api/query-keys.ts` with `platform` namespace | None |
| 3 | Create `lib/utils/platform-utils.ts` with adapters + `asBool` + `localizeName` | None |
| 4 | Create `lib/api/hooks/use-platform.ts` | Steps 1-3 |
| 5 | Add `prefetchPlatformAdmin` to `lib/auth/server.ts` | Steps 1, 4 |
| 6 | Create route group `app/(platform-auth)/login/page.tsx` | None |
| 7 | Create `components/domain/platform/platform-login-form.tsx` | Step 4 |
| 8 | Create `app/(platform-admin)/layout.tsx` | Steps 5, 7 |
| 9 | Create `components/domain/platform/platform-top-bar.tsx` | Step 4 |
| 10 | Create `app/(platform-admin)/page.tsx` + `platform-workspace.tsx` | Steps 8, 9 |
| 11 | Create Tenants tab components + dialogs | Steps 4, 10 |
| 12 | Create Tenant detail page + view | Steps 4, 11 |
| 13 | Create Admins tab components + dialog | Steps 4, 10 |
| 14 | Create Impersonation tab + user picker dialog | Steps 4, 10 |
| 15 | Create Audit tab + filters + detail dialog | Steps 4, 10 |
| 16 | Add skeleton components for all 4 tabs + detail | Steps 11-15 |
| 17 | Add `platform.*` namespace to `messages/ar.json` and `messages/en.json` | Steps 7-16 |
| 18 | Write tests in `__tests__/components/domain/platform/` | Steps 7-16 |
| 19 | Run `npm run generate:api` if backend OpenAPI changed | None |
| 20 | Run `npm run lint && npm run typecheck && npm run test` | All code |

---

## What to Test Manually

1. **Login happy path (AR + EN):**
   - Visit `admin.momentum.test/login` in Arabic → RTL layout, labels in Arabic.
   - Switch locale to English → LTR layout, labels in English.
   - Enter valid credentials → redirects to `/` (Tenants tab).

2. **Login error state:**
   - Enter wrong password → toast error with backend message; no stack trace or internal IDs shown.

3. **Logout:**
   - Click logout → session cleared, redirects to `/login`.

4. **Tenants tab happy path (AR + EN):**
   - List loads; columns align correctly in RTL and LTR.
   - Search filters debounce after 300 ms.
   - Status filter (All / Active / Suspended) works.
   - Click row → navigates to tenant detail.
   - Click "Provision Tenant" → dialog opens → fill form → save → list refreshes.

5. **Tenant detail actions:**
   - Suspend active tenant → confirmation → status flips to suspended.
   - Reactivate suspended tenant → confirmation → status flips to active.
   - Run migrations → 202 toast.
   - Impersonate user → user picker opens → select user → new tab opens to `https://{slug}.momentum.test?platform_token=...`.

6. **Admins tab:**
   - List loads; current user's row has no Deactivate action.
   - Create admin → list refreshes.
   - Deactivate another admin → confirmation → status flips.

7. **Impersonation tab:**
   - Shows active sessions; End Session closes session and refreshes list.
   - Empty state shows when no sessions.

8. **Audit tab:**
   - Filters by action, entity type, date range (Gregorian + Hijri).
   - Click Details → dialog shows escaped payload, IP, UA.
   - Load More pagination works.

9. **Loading / empty / error states:**
   - Throttle network → skeletons visible for each tab.
   - Block API → error state with retry; filters preserved.
   - Empty list → empty state with CTA.

10. **Responsive behavior:**
    - Mobile (<640px): tables collapse to cards; filters stack; dialogs full-width.
    - Tablet/Desktop: tables visible; top bar shows admin name/email.

11. **Keyboard navigation:**
    - Tab through login form, tabs, table rows, action menus, dialogs.
    - Escape closes dialogs; focus returns to trigger.
    - Skip link visible on focus.

12. **Permission / security:**
    - Direct API call to `/v1/platform/tenants` without session → 401 redirect to login.
    - Verify `X-Tenant` header is absent from platform requests in browser Network tab.