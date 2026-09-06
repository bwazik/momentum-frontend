# Spec: Platform Administration

> **Number:** 022
> **Date:** 2026-07-22
> **Status:** `completed`
> **Milestone:** F6 — Admin, Org, Help, Onboarding
> **Depends on:** `001-core-shell`
> **Backend spec:** `../backend/specs/001-platform-admin/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/022-platform-administration`
> **Base branch:** `main`

---

## Problem

Momentum is a multi-tenant government task-management platform: every ministry or agency runs as an isolated tenant with its own database. Today, the platform operator team has no secure, audited UI to manage the tenant fleet or the platform admin roster. Provisioning a new organization, suspending a compromised tenant, adding a new platform operator, or reviewing an impersonation support session all require direct API/database access.

Without this screen:

- **Tenant onboarding is manual and error-prone** — new tenants are provisioned outside the product, bypassing validation and audit logging.
- **Tenant lifecycle control is unavailable** — suspending, reactivating, or updating tenant branding requires backend access.
- **Platform admin access cannot be self-managed** — adding or removing operators needs infrastructure-level intervention.
- **Support impersonation is invisible** — there is no central view of who is currently impersonating a tenant user.
- **The central audit trail is unreadable** — platform-level events are logged but not browsable by the operators who need them.

This spec delivers a standalone platform administration workspace at `admin.momentum.test` so Gov TMS operators can manage tenants, operators, support sessions, and audit records through a bilingual, RTL-first web UI.

---

## Goal

Build a dedicated platform-admin workspace served from `admin.momentum.test`. The workspace is a separate authenticated shell from the tenant dashboard and exposes four URL-addressable tabs: **Tenants**, **Platform Admins**, **Impersonation Sessions**, and **Audit Log**. Through these tabs, a platform administrator can provision tenants, manage tenant lifecycle states, manage platform admin accounts, monitor active impersonation sessions, and search the central audit trail — all consuming the stable `/api/v1/platform/` backend API.

The workspace uses Sanctum SPA session cookie authentication — identical mechanism to the tenant app. Platform admins authenticate against the central database via the same session-based flow. Both flows use `Auth::guard('web')->login()` server-side and share subdomain cookies. The only difference is the login endpoint (`/v1/platform/auth/login`) and the `me()` endpoint (`/v1/platform/auth/me`) which return a flat `PlatformAdminResource` (not nested) and require no `X-Tenant` header.

---

## User Stories

### Platform Admin Authentication

- As a **platform admin**, I want to log in with my email and password at `admin.momentum.test/login`, so that I can access the platform workspace.
- As a **platform admin**, I want to be redirected to the workspace after login, so that I can start operating immediately.
- As a **platform admin**, I want to log out, so that my session is cleared and I return to the login page.
- As a **platform admin**, I want failed login attempts to show a localized, non-technical message, so that I understand what went wrong without exposing internal details.

### Tenant Management

- As a **platform admin**, I want to see a cursor-paginated list of all tenants with search and status filters, so that I can locate any organization quickly.
- As a **platform admin**, I want to provision a new tenant by filling a bilingual form (name, slug, domain, timezone, default language, logo path, settings), so that a new ministry can be onboarded without CLI access.
- As a **platform admin**, I want to view a tenant's full profile (including immutable slug and database name), so that I can verify configuration and troubleshoot.
- As a **platform admin**, I want to edit a tenant's mutable fields (name, domain, timezone, default language, logo path, settings), so that configuration can be corrected after onboarding.
- As a **platform admin**, I want to suspend a tenant after confirmation, so that all tenant users are locked out while data is preserved.
- As a **platform admin**, I want to reactivate a suspended tenant, so that it can resume operations.
- As a **platform admin**, I want to trigger tenant migrations, so that a tenant's database is updated after a platform deployment.

### Platform Admin Management

- As a **platform admin**, I want to see a cursor-paginated list of all platform admin accounts, so that I know who has platform-level access.
- As a **platform admin**, I want to create a new platform admin account (name, email, password), so that the operations team can grow without server access.
- As a **platform admin**, I want to edit a platform admin's name and email, so that records stay accurate.
- As a **platform admin**, I want to deactivate any platform admin account except my own, so that departing team members lose access.
- As a **platform admin**, I want to reactivate a deactivated platform admin account, so that a returning team member can regain access.

### Impersonation Support

- As a **platform admin**, I want to initiate an impersonation session for a tenant user directly from the tenant detail page, so that I can support that user inside their tenant app.
- As a **platform admin**, I want to see all currently active impersonation sessions, so that I can audit ongoing support activity.
- As a **platform admin**, I want to end an active impersonation session from the workspace, so that the support session is closed cleanly and logged.

### Audit Log

- As a **platform admin**, I want to browse the central audit log with filters for action, entity type, and date range, so that I can investigate platform-level changes.
- As a **platform admin**, I want to open a structured details view of any audit event payload, so that I can inspect metadata without raw database access.

### System

- As the **system**, I want all platform API calls to include the Sanctum session cookie (`credentials: 'include'`), so that central-database auth is satisfied.
- As the **system**, I want `public_id` used in all URLs and payloads, so that internal identifiers are never exposed.
- As the **system**, I want mutations to invalidate related cached lists, so that the workspace remains consistent after changes.

---

## Acceptance Criteria

### Authentication

- [x] `admin.momentum.test/login` renders a standalone login page with no tenant sidebar or shell chrome.
- [x] Login flow: `GET /sanctum/csrf-cookie` → `POST /api/v1/platform/auth/login` (same Sanctum SPA pattern as tenant auth).
- [x] Successful login sets the session cookie and redirects to `admin.momentum.test/` (workspace default tab: Tenants).
- [x] Failed login displays the API error message via `toast.error()` without exposing stack traces or internal IDs.
- [x] Logout calls `POST /api/v1/platform/auth/logout` which invalidates the session.
- [x] All platform API requests use `credentials: 'include'` (cookie-based session); **no `Authorization` header, no `X-Tenant` header**.
- [x] Login response is a **flat** `PlatformAuthResource`: `{ public_id, name_ar, name_en, email, account_type (string), is_active, created_at, updated_at }` — not nested under `user`.
- [x] `account_type` is a string via `apiValue()`: `"platform_admin"` for platform admins, `"internal_user"` / `"tenant_admin"` / `"external_auditor"` for tenant users.
- [x] Unauthenticated navigation to any protected platform route redirects to `/login`.
- [x] A 401 response from any platform API redirects to `/login` (same `QueryCache.onError` pattern as tenant app).

### Workspace Shell

- [x] The authenticated platform workspace uses a minimal top bar (logo, admin name/email, locale toggle, logout) and a main content area; no tenant sidebar is shown.
- [x] Tab state is URL-driven via `?tab=tenants|admins|impersonation|audit`; invalid or missing values resolve to `tenants`.
- [x] `PageHeader` renders a localized title, description, and the tab-specific primary action in its `actions` slot.
- [x] The locale toggle sets `NEXT_LOCALE` and reloads the page using the same mechanic as the tenant app.

### Tenants Tab

- [x] Loads cursor-paginated tenants from `GET /api/v1/platform/tenants` with a manual "Load More" button.
- [x] List columns: localized name, slug, domain, active status, created at (dual date), and row actions.
- [x] URL-driven filters: debounced search (300 ms) over name/slug, active-status select (`All / Active / Suspended`). The API param is `is_active` (boolean) — OpenAPI schema only shows `search` but the backend also accepts `is_active`. Use `asBool()` on the response `is_active` field.
- [x] "Provision Tenant" button in `PageHeader.actions` opens a create dialog.
- [x] Provision form fields: `name_ar` (required), `name_en` (optional), `slug` (required, alpha-dash, immutable), `domain` (optional), `timezone` (select), `default_language` (Arabic/English select), `logo_path` (optional string), `settings` (optional JSON). Uses `BilingualNameFields`.
- [x] Clicking a tenant row navigates to `/tenants/[publicId]` for the detail view.
- [x] Tenant detail page shows all fields: `public_id`, `name_ar`, `name_en`, `slug` (read-only), `domain`, `database_name` (read-only), `is_active`, `default_language`, `timezone`, `logo_path`, `settings` (escaped structured display), `created_at` (dual date), `updated_at`.
- [x] Edit Tenant dialog pre-populates mutable fields and keeps `slug`/`database_name` read-only.
- [x] Suspend action is hidden when `is_active` is false; shows `ConfirmDeleteDialog` (non-destructive variant) before calling `POST /api/v1/platform/tenants/{tenant}/suspend`.
- [x] Reactivate action is hidden when `is_active` is true; shows confirmation before calling `POST /api/v1/platform/tenants/{tenant}/reactivate`.
- [x] Run Migrations action shows confirmation, calls `POST /api/v1/platform/tenants/{tenant}/run-migrations`, and toasts success for the 202 response.
- [x] Impersonate User action opens a debounced user-picker dialog; on selection it calls `POST /api/v1/platform/tenants/{tenant}/impersonate` and hands off the returned token to the tenant app.
- [x] Active/suspended status uses the shared `ActiveBadge` pattern (emerald text for active, muted for suspended; color + text, never color-only).
- [x] All four states are implemented: loading skeleton (8 rows), empty (no tenants + CTA), empty-filtered (clear filters CTA), and error with retry.

### Platform Admins Tab

- [x] Loads cursor-paginated admins from `GET /api/v1/platform/admins` with manual "Load More".
- [x] List columns: localized name, email, active status, and row actions.
- [x] URL-driven debounced search by name/email.
- [x] "Add Platform Admin" button in `PageHeader.actions` opens a create dialog.
- [x] Create form: `name_ar` (required), `name_en` (optional), `email` (required), `password` (required, min 8).
- [x] Edit form: `name_ar`, `name_en`, `email`; optional password replacement field.
- [x] Deactivate action is hidden for the currently authenticated admin's own row (compare row `public_id` with `GET /api/v1/platform/auth/me`); shows confirmation before calling `POST /api/v1/platform/admins/{admin}/deactivate`.
- [x] Reactivate action is shown for deactivated admins after confirmation.
- [x] All four states implemented.

### Impersonation Tab

- [x] Loads active sessions from `GET /api/v1/platform/impersonation-sessions`.
- [x] List columns: impersonator admin name, impersonated user name + tenant slug, started at (dual date + relative time), End Session action.
- [x] End Session calls `POST /api/v1/platform/tenants/{tenant}/leave-impersonation` and refreshes the session list.
- [x] Empty state: "No active impersonation sessions" with an informational note.
- [x] Loading and error states implemented.

### Audit Log Tab

- [x] Loads events from `GET /api/v1/platform/audit-events` with cursor pagination and manual "Load More".
- [x] List columns: timestamp (dual date), actor name, action, entity type, entity `public_id`, Details action.
- [x] URL-driven filters: action type select (known `AuditAction` enum values + free-text fallback), entity type select, date range with `CalendarSystemToggle`.
- [x] Details dialog shows escaped structured payload, IP address, and user agent — never `dangerouslySetInnerHTML`.
- [x] Audit log is read-only; no edit/delete actions.
- [x] All four states implemented.

### General

- [x] Every mutation shows `toast.success()` on success and `toast.error(error.message)` on failure.
- [x] All cursor-paginated lists use `next_cursor`/`has_more` with a manual "Load More" button.
- [x] All bilingual entity fields are localized via `localizeName` / `localizeTitle` (`name_ar` / `name_en`).
- [x] All dates use `DualDateDisplay` (Gregorian + Hijri companion).

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Authentication Architecture

Platform admin auth uses the **same Sanctum SPA session cookie** mechanism as the tenant app — **not** token-based auth.

**Why session-based?** The actual backend code uses `Auth::guard('web')->login($user)` for both tenant and platform auth, creating a server-side session stored in Redis with an HttpOnly cookie. There are no Bearer tokens involved. Both flows share the same Sanctum SPA infrastructure:
- `GET /sanctum/csrf-cookie` fetches the XSRF-TOKEN cookie before mutating requests
- Session cookie is automatically set by the server on login (`Set-Cookie` header)
- All subsequent requests include the cookie automatically with `credentials: 'include'`
- Logout invalidates the server-side session and regenerates the CSRF token

**Key differences from tenant auth:**

| Aspect | Tenant (`apiClient`) | Platform |
|--------|---------------------|----------|
| CSRF cookie | Required before login | **Same** — required |
| Login endpoint | `POST /v1/iam/auth/login` | `POST /v1/platform/auth/login` |
| `credentials` | `'include'` | **Same** — `'include'` |
| `X-Tenant` header | Required (from hostname) | **Never sent** |
| Login response | `AuthTokenResource` (flat) | `PlatformAuthResource` (flat, same shape) |
| `account_type` format | String via `apiValue()` | **Same** — string via `apiValue()` |
| `me()` response | `UserResource` (rich, with position/capabilities) | `PlatformAdminResource` (lean profile only) |
| `me()` route guard | `auth:sanctum` only | `auth:sanctum` + `platform.admin` middleware |

**Implementation:**
- **Do NOT** create a separate `platformApiClient`. Reuse the existing `apiClient` — it already handles `credentials: 'include'`, CSRF, JSON parsing, and error handling. The only change is omitting `X-Tenant` header for platform endpoints.
- To omit `X-Tenant`, either:
  - Option A: Check the request URL path in `apiClient` — if it starts with `/v1/platform/`, skip the `X-Tenant` header
  - Option B: Create a thin wrapper `platformClient` that extends `apiClient` and overrides the header injection to never add `X-Tenant`
- No `platform_token` in `localStorage`. No `Authorization` header.
- On 401: redirect to `/login` (use the same `QueryCache.onError` global handler as the tenant app).
- Login response shape (flat, confirmed by backend code — not nested under `user`):
  ```json
  {
    "public_id": "01912345-...",
    "name_ar": "مدير المنصة",
    "name_en": "Platform Admin",
    "email": "admin@momentum.test",
    "account_type": "platform_admin",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-07-22T00:00:00Z"
  }
  ```
- Logout response: `{ "message": "Logged out successfully." }`
- `account_type` values: `"platform_admin"`, `"internal_user"`, `"tenant_admin"`, `"external_auditor"` (all via backend `AccountType::apiValue()`).

### Data Fetching

- New hook file: `lib/api/hooks/use-platform.ts`.
- `usePlatformTenants(filters)` — `useInfiniteQuery`, key `queryKeys.platform.tenants.list(filters)`. The `PlatformTenantFilters` type must include `is_active?: boolean` in addition to `search?: string` — OpenAPI only shows `search` but the backend accepts both `search` and `is_active` query params.
- `usePlatformTenant(publicId)` — `useQuery`, key `queryKeys.platform.tenants.detail(publicId)`.
- `usePlatformAdmins(filters)` — `useInfiniteQuery`, key `queryKeys.platform.admins.list(filters)`.
- `usePlatformAuth()` — `useQuery` for `GET /api/v1/platform/auth/me`, key `queryKeys.platform.auth.me()`. Returns `PlatformAdminResource` (flat shape: `{ public_id, name_ar, name_en, email, account_type, is_active, created_at, updated_at }`). Route requires `auth:sanctum` + `platform.admin` middleware — 403 if accessed by non-platform-admin.
- `useImpersonationSessions()` — `useQuery`, key `queryKeys.platform.impersonation.sessions()`.
- `usePlatformAuditEvents(filters)` — `useInfiniteQuery`, key `queryKeys.platform.audit.list(filters)`.
- All mutations use `useMutation` with `onSuccess` cache invalidation and toast feedback.
- No `useEffect` + `fetch` for API calls.

### State Management

- **Tab selection:** URL search param `?tab=...` (shareable, bookmarkable).
- **List filters:** URL search params (search, status, action, entity type, date range).
- **Dialog open/close:** local `useState`.
- **Platform auth session:** managed by Sanctum SPA cookie (HttpOnly, same as tenant app). No client-side token storage needed.
- **Impersonation token:** ephemeral; used immediately for navigation, never persisted.
- No new Zustand stores required.

### Query Key Structure

Add a `platform` namespace to `lib/api/query-keys.ts`:

```ts
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
      // PlatformTenantFilters: { search?: string; is_active?: boolean }
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
}
```

### Mutation Patterns

- Tenant provision → invalidate `queryKeys.platform.tenants.lists()`.
- Tenant update → invalidate `detail(publicId)` + `lists()`.
- Tenant suspend/reactivate → invalidate `detail(publicId)` + `lists()`.
- Run migrations → toast success; no list invalidation needed.
- Admin create/update/deactivate/reactivate → invalidate `queryKeys.platform.admins.lists()`.
- End impersonation → invalidate `queryKeys.platform.impersonation.sessions()`.
- After any mutation → invalidate `queryKeys.platform.audit.lists()` so the audit tab reflects the new event on next load.
- No optimistic updates for platform mutations (audit-sensitive).

### Error Handling

- 401 → redirect to `/login` (use the same `QueryCache.onError` global handler as the tenant app).
- 403 → localized "Access denied" `ErrorState`.
- 422 → `toast.error(error.message)` with the backend's localized message.
- 500 / network → `ErrorState` with retry; preserve URL filter state.
- No PII in console logs or error messages.
- **OpenAPI artifact — `is_active` typed as `string` in `PlatformTenantResource` and `PlatformAdminResource`.** Backend serializes boolean natively but the OpenAPI spec shows `type: string`. Use `asBool()` utility for runtime narrowing whenever reading `is_active` from API responses. This applies to: tenant list/detail, admin list, and the impersonation sessions table. The `asBool()` utility already exists in the project (handles `true`, `'1'`, `1`, `'true'`).

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`

### Routing & Shell

This feature lives at `admin.momentum.test` as a separate route group within the same Next.js repo:

```
app/
├── (platform-auth)/
│   └── login/
│       └── page.tsx
├── (platform-admin)/
│   ├── layout.tsx
│   ├── page.tsx
│   └── tenants/
│       └── [publicId]/
│           └── page.tsx
```

- `(platform-auth)/login` is a standalone page with no sidebar.
- `(platform-admin)/layout` renders the minimal top bar and auth guard.
- `(platform-admin)/page` hosts the tabbed workspace.
- `proxy.ts` (or hostname-aware middleware) must detect `admin.momentum.test` and route to the platform route group instead of the tenant dashboard layout.

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `PlatformLoginForm` | Client | Domain: platform | Email + password, Sanctum SPA session auth with CSRF cookie |
| `PlatformTopBar` | Client | Domain: platform | Logo, admin name/email, locale toggle, logout |
| `PlatformWorkspace` | Client | Domain: platform | URL tab router + PageHeader actions slot |
| `TenantsTable` | Client | Domain: platform + `RtlTable` | Cursor-paginated tenant list with filters/actions |
| `TenantDetailView` | Client | Domain: platform | Full tenant profile + action buttons |
| `ProvisionTenantDialog` | Client | Domain: platform + shadcn `Dialog` | Create form with `BilingualNameFields` |
| `EditTenantDialog` | Client | Domain: platform + shadcn `Dialog` | Update mutable fields; slug/db read-only |
| `ImpersonateUserDialog` | Client | Domain: platform + shadcn `Dialog` | Debounced user search + impersonate action |
| `PlatformAdminsTable` | Client | Domain: platform + `RtlTable` | Cursor-paginated admin list |
| `PlatformAdminFormDialog` | Client | Domain: platform + shadcn `Dialog` | Create/edit admin form |
| `ImpersonationSessionsTable` | Client | Domain: platform + `RtlTable` | Active sessions list |
| `PlatformAuditTable` | Client | Domain: platform + `RtlTable` | Cursor-paginated audit log |
| `PlatformAuditDetailDialog` | Client | Domain: platform + shadcn `Dialog` | Structured payload viewer |
| `PlatformTenantsSkeleton`, `PlatformAdminsSkeleton`, `PlatformAuditSkeleton` | Client | Domain: platform | Match real table shapes |
| `PageHeader`, `EmptyState`, `ErrorState`, `ActiveBadge`, `ConfirmDeleteDialog`, `BilingualNameFields`, `RtlSelect`, `RtlTable`, `DualDateDisplay`, `CalendarSystemToggle` | Shared | `components/shared/` | Reuse established patterns |
| `Button`, `Card`, `Badge`, `Dialog`, `AlertDialog`, `Tabs`, `Input`, `Skeleton`, `Separator`, `Tooltip` | Client | shadcn/ui | Standard primitives |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | Tenants list | 8 skeleton rows matching name, slug, status, date, actions |
| Empty (no tenants) | Tenants list | `EmptyState` with Building icon + "No tenants provisioned yet" + Provision CTA |
| Empty (filtered) | Tenants list | `EmptyState` with Search icon + "No tenants match filters" + Clear filters CTA |
| Error | Tenants list | `ErrorState` + Retry; URL filters preserved |
| Success | Tenants list | Table with Load More control |
| Loading | Tenant detail | Full-page skeleton matching detail card layout |
| Error | Tenant detail | `ErrorState` with Back button |
| Success | Tenant detail | All fields rendered; actions visible/hidden by state |
| Loading | Admins list | 6 skeleton rows matching name, email, status, actions |
| Empty | Admins list | `EmptyState` + Add Platform Admin CTA |
| Error | Admins list | `ErrorState` + Retry |
| Success | Admins list | Table with Load More control |
| Loading | Impersonation | 3 skeleton rows |
| Empty | Impersonation | `EmptyState` with UserCheck icon + "No active impersonation sessions" |
| Error | Impersonation | `ErrorState` + Retry |
| Success | Impersonation | Session list with End Session actions |
| Loading | Audit log | 8 skeleton rows matching timestamp, actor, action, entity |
| Empty | Audit log | `EmptyState` + Clear filters CTA |
| Error | Audit log | `ErrorState` + Retry |
| Success | Audit log | Newest-first table with Load More control |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Top bar collapses to logo + logout; tables switch to card view; filters collapse to a Sheet; dialogs are full-width; touch targets ≥ 44×44px |
| Tablet (640-1024px) | Tab navigation wraps if needed; tables remain compact; dialogs use centered modal |
| Desktop (≥1024px) | Full `PageHeader` + multi-column tables; tenant detail uses summary card + action buttons layout |

### RTL Considerations

- [x] All layout uses logical properties: `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `border-s`, `border-e`.
- [x] Table column order is stable; text columns `text-start`, action columns `text-end`.
- [x] Directional icons (chevrons, arrows, back buttons) use `rtl:rotate-180`.
- [x] `RtlSelect` and `RtlTable` used for selects and data tables.
- [x] Bilingual fields: `name_ar` input `dir="rtl"`, `name_en` input `dir="ltr"`.
- [x] Dates use `DualDateDisplay` (Gregorian + Hijri companion) consistent with Spec 020.
- [x] `CalendarSystemToggle` used in audit date-range filter.
- [x] Locale toggle sets `NEXT_LOCALE` cookie and reloads.
- [x] Platform login defaults to Arabic RTL layout.

### Accessibility

- [x] Login form: associated labels, visible required indicators, `aria-describedby` for error messages.
- [x] Tab navigation uses Radix Tabs: `aria-selected`, arrow-key navigation, logical focus order.
- [x] Tables use semantic `<table>`, `<th scope="col">`, and localized `aria-label`.
- [x] Icon-only buttons (edit, suspend, end-session, details) have localized `aria-label`; decorative icons are `aria-hidden="true"`.
- [x] Confirm dialogs use `AlertDialog` with specific action labels (e.g., "Suspend Tenant", "Deactivate Admin").
- [x] Audit detail dialog traps focus, closes on Escape, and returns focus to the trigger row.
- [x] Status uses `ActiveBadge` (color + text, never color-only).
- [x] Mobile card views include `sr-only` labels for implied fields.
- [x] All interactive elements have visible focus rings.
- [x] Slug field includes an accessible explanation that it is immutable after creation.

### Animation / Transition

- [x] Row hover: `transition-colors duration-150`.
- [x] Dialog/Sheet: shadcn default enter/exit transitions.
- [x] Skeleton: `animate-pulse` with `motion-reduce:animate-none`.
- [x] Status badge after state change: `transition-colors duration-200`.
- [x] No blur or backdrop-filter on dense table rows.

---

## Non-Functional Requirements

### Performance

- Tenant and admin lists use cursor pagination; never load all records.
- Audit log loads on demand; no unbounded history fetch.
- Impersonate-user search is debounced (300 ms) and does not preload all tenant users.
- No localStorage reads for auth — Sanctum SPA cookie is managed by the browser.

### Security

- Platform admin auth uses Sanctum SPA session cookies (HttpOnly) — consistent with the tenant app's auth model. No client-side token storage.
- All `/api/v1/platform/` requests use `credentials: 'include'`; no `Authorization` header, no `X-Tenant` header.
- No PII (email, name, IP) in console logs, URLs, or client error messages.
- Audit payload rendered as escaped structured data — never `dangerouslySetInnerHTML`.
- Impersonation token is used for navigation only and never persisted.
- Self-deactivation is blocked in the UI by comparing row `public_id` with `/api/v1/platform/auth/me`.

---

## Out of Scope

- Tenant user management — belongs to tenant `/admin` workspace (Spec 010). Platform admins only impersonate tenant users.
- Cross-tenant analytics or platform-wide metrics dashboard (V2).
- Subscription management / billing (V2).
- Password reset for platform admins (V2). MVP: another platform admin sets a replacement password.
- Automated tenant database backup/restore (infrastructure concern).
- Global platform announcements (V2).
- SSO for platform admins (V2).
- Tenant-level audit trail — platform audit log covers central-DB events only.
- Real-time polling for impersonation sessions — manual refresh only.
- Tenant logo file upload — API accepts `logo_path` string only.
- Hand-written local types for missing OpenAPI schemas should be marked `// MOCK` and regenerated when the backend contract is updated.

---

## Open Questions — All Resolved

- [x] **Auth token storage:** Platform admin auth returns a Sanctum Bearer token. Proposed `localStorage` key `platform_token` is the only auth-token-in-localStorage exception. **Needs explicit approval** before implementation. Alternative: backend issues a short-lived HttpOnly cookie from the central domain. — **Resolved.** Backend uses `Auth::guard('web')->login($user)` — Sanctum SPA session cookies, not Bearer tokens. No `platform_token` in localStorage, no `platformApiClient`. Reuse the existing `apiClient` with a path check to omit `X-Tenant` for `/v1/platform/` routes. See Authentication Architecture section for full details.
- [x] **X-Tenant header artifact:** OpenAPI lists `X-Tenant` as required on platform endpoints, but the backend spec says platform endpoints operate on the central DB without `X-Tenant`. Clarify whether `platformApiClient` must send a sentinel `X-Tenant` value or omit it entirely. — **Resolved.** Platform routes are registered outside `InitializeTenancyByHeader` middleware. The backend never resolves tenant context for platform endpoints. **Omit `X-Tenant` entirely** from platform requests.
- [x] **Tenant settings format:** `PlatformTenantResource.settings` is typed as a string in OpenAPI. Confirm whether it is a JSON string to parse or a pre-formatted display string. — **Resolved.** Response is a JSON-serialized `string` (frontend must `JSON.parse` before display). Request body accepts as `array`/`object`.
- [x] **Run migrations polling:** Backend returns 202 Accepted with no body. Confirm no poll/status endpoint is required in MVP; assumption is a single success toast. — **Resolved.** No poll/status endpoint in MVP. Single success toast on 202. Migration status (`completed` / `failed`) visible in audit log events under `action: "tenant.run_migrations"`.
- [x] **Hostname routing:** Should `admin.momentum.test` be served by a separate Next.js app or a hostname-aware route group in the existing repo? — **Resolved.** Single-repo route group using existing Next.js app. Add `(platform-auth)/` and `(platform-admin)/` route groups under `app/`. The existing `proxy.ts` or a new middleware detects `admin.momentum.test` hostname and routes to the platform layout instead of the tenant dashboard. The platform shell uses a minimal top bar (no sidebar), separate from the tenant `(dashboard)/` layout. `admin.momentum.test` must be added to Sanctum's `stateful` domains config on the backend.
- [x] **Impersonation token handoff:** `POST /v1/platform/tenants/{tenant}/impersonate` returns `{ token, user, tenant, expires_at }` (1-hour tenant-scoped Sanctum token). How does the UI transfer this token to the tenant app? — **Resolved.** Open a **new tab** to `https://{slug}.momentum.test?platform_token={token}`. The tenant app middleware detects `?platform_token=` in the URL, stores it ephemerally, and uses it for the impersonated API session. Do not navigate same-tab (loses the platform workspace). Do not persist the impersonation token in localStorage. The `expires_at` can be displayed as a visible countdown in the tenant app UI to warn the admin before expiry.
- [x] **Tenant user search:** The impersonation endpoint requires a `user_public_id`. Is there a `GET /api/v1/platform/tenants/{tenant}/users?search=...` endpoint for searching tenant users from the platform panel? — **Resolved.** Backend now exposes `GET /v1/platform/tenants/{tenant}/users` with `search`, `is_active`, `department_id`, `cursor`, and `per_page` params. Returns cursor-paginated `UserResource` items (`public_id`, `name_ar`, `name_en`, `email`, etc.). Uses `tenancy()->initialize()` internally to switch to the tenant DB. No `X-Tenant` header required — platform admin session only. Use `useInfiniteQuery` with `usePlatformTenantUsers(tenantPublicId, filters)` for the impersonation user picker.