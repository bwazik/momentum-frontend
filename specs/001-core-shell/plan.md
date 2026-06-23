# Implementation Plan: 001 Core Shell

> **Spec:** `specs/001-core-shell/spec.md`
> **Date:** 2026-06-15
> **Status:** `implemented`

---

## Internationalization (i18n)

### Files

| File | Purpose |
|------|---------|
| `i18n/request.ts` | next-intl request config: reads `NEXT_LOCALE` cookie, returns locale + messages |
| `next.config.ts` | Wrapped with `createNextIntlPlugin('./i18n/request.ts')` |
| `messages/ar.json` | Arabic UI strings |
| `messages/en.json` | English UI strings |
| `lib/api/client.ts` | **MODIFIED** — sends `X-Locale` header on every request (reads `NEXT_LOCALE` cookie) |

### Approach: next-intl

Uses `next-intl` v4 for UI string translations. Entity data (names, titles from API) uses bilingual fields (`name_ar`/`name_en`) — the frontend picks via `user.name_ar || user.name_en`.

### App Name / Branding

The brand name fetches the **tenant name** from `GET /v1` API (returns `name_ar`/`name_en` from the `tenants` table) and combines it with the product name:

- Arabic: `مومنتوم - {tenant.name_ar}` (e.g. "مومنتوم - وزارة الصحة")
- English: `Momentum - {tenant.name_en}` (e.g. "Momentum - Ministry of Health")

Usage via `useBrandName()` hook from `lib/utils/use-brand-name.ts`. Falls back to `"{product} - Gov TMS"`.

The same file exports `getBrandDescription(locale)` for the metadata description tag:
- Arabic: "منصة إدارة المهام الحكومية"
- English: "Government Task Management Platform"

**Server-side metadata:** `generateMetadata()` in `app/layout.tsx` fetches from `GET /v1` directly with the `X-Tenant` header derived from the request hostname, ensuring the browser tab title matches the visual branding.

### Setup

1. **Install:** `next-intl` v4 added to `package.json`
2. **Translation files:** `messages/ar.json` and `messages/en.json` — keyed by namespace (e.g. `auth.login.email`, `nav.dashboard`)
3. **Plugin:** `next.config.ts` wrapped with `createNextIntlPlugin('./i18n/request.ts')`
4. **Request config:** `i18n/request.ts` with `getRequestConfig` reads `NEXT_LOCALE` cookie and returns locale + messages (server-side)
5. **Provider:** `NextIntlClientProvider` in root layout with `locale` and `messages` from `getMessages()` (next-intl/server)
6. **Usage:** `const t = useTranslations('namespace')` in Client Components
7. **Locale toggle:** Sets `NEXT_LOCALE` cookie + reloads page (server re-reads cookie, re-renders with correct messages)

### Backend: X-Locale header

The backend middleware `SetLocaleFromHeader` reads `X-Locale` header and calls `app()->setLocale()`.

**Frontend sends `X-Locale` on every request via `apiClient`:**
```ts
'X-Locale': getLocaleSlug()  // reads NEXT_LOCALE cookie
```

This ensures `__('auth.failed')` and other Laravel translation calls return in the correct language.

### Translation key convention (from `coding-standards.md`)

```ts
t('auth.login.email')        // "البريد الإلكتروني" / "Email"
t('nav.dashboard')            // "لوحة التحكم" / "Dashboard"
t('shared.error')             // "حدث خطأ" / "An error occurred"
```

### Migration plan

| Component | Namespace | Status |
|-----------|-----------|--------|
| `login-form.tsx` | `auth.login` | ✅ Migrated |
| `locale-toggle.tsx` | `locale` | ✅ Migrated |
| `nav-user.tsx` | `auth` | ✅ Migrated |
| `error-state.tsx` | `shared` | ✅ Migrated |
| Domain shell components (app-sidebar, site-header) | `nav`, `shell` | ✅ Migrated |
| Placeholder pages (dashboard, tasks, blueprints, analytics, follow-up, org, admin) | `placeholder`, `nav` | ✅ Migrated |
| Notifications (bell, panel, item) | `notifications` | ✅ Migrated |
| Search (global-search) | `search` | ✅ Migrated |

---

## Future Improvement (Post-MVP)

**Locale store initialization:** Currently, `useLocaleStore` always initializes with `'ar'` and a `LocaleProvider` syncs the server-determined value after hydration via `useEffect`. Consider either:
- **Provider-only solution:** Replace Zustand with React Context for locale state. The `LocaleProvider` (Server-fed) would own the state directly.
- **Initial state injection:** Have the Server Component serialize the locale into a `<script>` tag (e.g. `window.__INITIAL_LOCALE__`) and have the Zustand store read from that during module initialization instead of using `document` or a post-hydration sync.

Both approaches eliminate the post-hydration synchronization gap entirely.

---

## Open Questions Resolved

| # | Question (from spec) | Decision | Rationale |
|---|----------------------|----------|-----------|
| 1 | Auth mechanism — SPA cookies vs. token | **Use Sanctum SPA cookies.** `GET /sanctum/csrf-cookie` → `POST /v1/iam/auth/login` sets HttpOnly session cookie. Frontend stores no token. | Spec explicitly overrides backend `003-iam-abac` plan wording. Aligns with `security-policy.md` and `architecture.md`. |
| 2 | Tenant resolution | **Extract tenant slug from `window.location.hostname` subdomain and send as `X-Tenant` header on every API request.** Falls back to `NEXT_PUBLIC_DEFAULT_TENANT` env var in development. | Backend middleware resolves tenant from header. |
| 3 | Notifications frontend pairing | **Core shell owns the notifications center UI** (`NotificationBell` + `NotificationPanel`). | Spec declared `001-core-shell` authoritative. |
| 4 | Global search endpoint | **Use `GET /v1/search` (alias for `/v1/search/tasks`)** for the command palette. | Backend `011-search-discovery` exposes `/search`. |
| 5 | Theme & brand color | **Theme mode and primary brand color are per-browser preferences persisted locally.** Independent of tenant branding. | `next-themes` for mode; Zustand `persist` for brand color. |
| 6 | Capability list source | **Fetch `GET /v1/iam/users/{user_public_id}/capabilities` after `useCurrentUser()` returns; populate `useCapabilityStore`.** | Enables `useCapability()` synchronous reads across the UI. |
| 7 | Impersonation flow | **Out of scope for core shell.** | Spec out-of-scope item. |
| 8 | Brand color palette | **Allowed set: amber (default), blue, emerald, rose, slate.** | Spec confirmed. |
| 9 | Per-account vs. per-browser persistence | **Per-browser via localStorage for MVP.** Backend user-preference API deferred to `004-user-settings-delegation`. | Spec confirmed. |
| 10 | Login response shape | **Expect flat `AuthTokenResource` (`public_id`, `name_ar`, `name_en`, `email`, `account_type`).** No nested `user`, no `token`. | Spec and OpenAPI both define flat shape. |

---

## Technical Approach

**One-line:** Create domain components (`components/domain/`) alongside the installed `@shadcn/login-03` and `@shadcn/dashboard-01` ready blocks — blocks remain untouched as a comparison reference. Blocks live at root `components/` paths (e.g. `components/login-form.tsx`); Gov TMS implementations live at `components/domain/` paths (e.g. `components/domain/auth/login-form.tsx`). Block demo routes (`app/login-block/`, `app/dashboard-block/`) are preserved at non-conflicting paths; Gov TMS routes use `app/(auth)/` and `app/(dashboard)/` route groups.

**Key decisions:**
- **Create domain components, keep blocks as reference.** Block originals (`components/login-form.tsx`, `components/app-sidebar.tsx`, etc.) remain unmodified. Gov TMS versions are created at `components/domain/auth/` and `components/domain/shell/`. This allows side-by-side comparison.
- **Sanctum SPA cookies only.** No Bearer token storage. Login fetches CSRF cookie first, then posts credentials.
- **Tenant header on every request.** `apiClient` (already implemented) reads hostname subdomain and injects `X-Tenant`.
- **Cookie-based locale.** Root layout (already implemented) reads `NEXT_LOCALE` cookie. Toggle updates cookie and reloads.
- **`next-themes` for Light/Dark/System.** Already implemented via `theme-toggle.tsx`.
- **`next-intl` for UI translations.** Translation JSON files at `messages/{locale}.json`. `NextIntlClientProvider` in root layout. `useTranslations()` hook in components.
- **Zustand `persist` for brand color only.** Already implemented via `use-brand-color-store.ts`.
- **All data fetching via TanStack Query.** Hooks already in `lib/api/hooks/`.
- **Dynamic import for `GlobalSearch`.** Heavy command palette loaded on-demand.

---

## Component Tree

```
app/
├── layout.tsx                    # Server — MODIFIED: read NEXT_LOCALE cookie, set dir/lang
├── (auth)/
│   └── login/
│       └── page.tsx              # Server — Gov TMS login page (NEW)
├── (dashboard)/
│   ├── layout.tsx                # Server — authenticated shell with Sidebar + TopBar (NEW)
│   ├── page.tsx                  # Server — dashboard home placeholder (NEW)
│   ├── tasks/
│   │   └── page.tsx              # Placeholder (NEW)
│   ├── blueprints/
│   │   └── page.tsx              # Placeholder (NEW)
│   ├── analytics/
│   │   └── page.tsx              # Placeholder (NEW)
│   ├── follow-up/
│   │   └── page.tsx              # Placeholder (NEW)
│   ├── organization/
│   │   └── page.tsx              # Placeholder (NEW)
│   └── admin/
│       └── page.tsx              # Placeholder (NEW, capability-gated)
├── login-block/
│   └── page.tsx                  # KEPT — login-03 block demo (renamed to avoid /login conflict)
├── dashboard-block/
│   └── page.tsx                  # KEPT — dashboard-01 block demo (renamed to avoid /dashboard conflict)


proxy.ts                         # Root — security headers + Cache-Control (MODIFIED, auth removed)
lib/auth/server.ts               # Server-only auth utility — validates session against Laravel (NEW)

components/
├── ui/                           # shadcn primitives (CLI-managed)
├── login-form.tsx                # KEPT — login-03 block (untouched, reference)
├── app-sidebar.tsx               # KEPT — dashboard-01 block (untouched, reference)
├── site-header.tsx               # KEPT — dashboard-01 block (untouched, reference)
├── nav-user.tsx                  # KEPT — dashboard-01 block (untouched, reference)
├── nav-main.tsx                  # KEPT — dashboard-01 block (untouched, reference)
├── nav-documents.tsx             # KEPT — dashboard-01 block (untouched, reference)
├── nav-secondary.tsx             # KEPT — dashboard-01 block (untouched, reference)
├── section-cards.tsx             # KEPT — dashboard-01 block (untouched, reference)
├── chart-area-interactive.tsx    # KEPT — dashboard-01 block (untouched, reference)
├── data-table.tsx                # KEPT — dashboard-01 block (untouched, reference)
├── theme-toggle.tsx              # KEPT — dashboard-01 block (untouched, reference)
├── locale-provider.tsx           # Client — syncs Zustand store with server-provided initialLocale (NEW)
├── domain/
│   ├── auth/
│   │   └── login-form.tsx        # Client — Gov TMS login (NEW, based on login-03 block)
│   ├── search/
│   │   └── global-search.tsx     # Client — command palette (NEW, dynamic import)
│   └── shell/
│       ├── app-sidebar.tsx       # Client — Gov TMS sidebar (NEW, based on dashboard-01 block)
│       ├── site-header.tsx       # Client — Gov TMS top bar (NEW, based on dashboard-01 block)
│       ├── nav-user.tsx          # Client — Gov TMS user menu (NEW, based on dashboard-01 block)
│       ├── nav-main.tsx          # Client — Gov TMS nav links (NEW, based on dashboard-01 block)
│       ├── notification-bell.tsx # Client — bell + unread count (NEW)
│       ├── notification-panel.tsx# Client — notification list with load-more (NEW)
│       ├── notification-item.tsx # Client — single notification row (NEW)
│       └── brand-color-provider.tsx # Client — injects CSS vars (NEW)
└── shared/
    ├── locale-toggle.tsx         # Client — AR/EN switcher (NEW)
    ├── brand-color-toggle.tsx    # Client — brand color picker (NEW)
    ├── empty-state.tsx           # Client — icon + headline + CTA (NEW)
    └── error-state.tsx           # Client — message + retry (NEW)

messages/
├── ar.json                       # Arabic UI strings (NEW)
├── en.json                       # English UI strings (NEW)

lib/
├── api/
│   ├── client.ts                 # KEPT (already has X-Tenant, CSRF)
│   ├── query-keys.ts             # KEPT (already has auth namespace)
│   └── hooks/
│       ├── use-auth.ts           # NEW — useLogin, useCurrentUser, useLogout with Sanctum
│       ├── use-capabilities.ts   # NEW — useCapabilities, useCapability hooks
│       ├── use-notifications.ts  # NEW — notification hooks (useNotifications, etc.)
│       └── use-search.ts         # NEW — useSearch, useRecentActivity hooks
│       └── query-keys-extra.ts   # NEW — extends query-keys.ts with notifications + search namespaces
├── stores/
│   ├── use-sidebar-store.ts      # KEPT
│   ├── use-locale-store.ts       # NEW — locale state (initializes as 'ar' for SSR, syncLocale for post-hydration sync)
│   ├── use-capability-store.ts   # NEW — capability strings from API
│   └── use-brand-color-store.ts  # NEW — persisted brand color
├── hooks/
│   └── use-debounce.ts          # NEW — debounce hook for search
└── utils/
    ├── tenant.ts                 # NEW — extract tenant slug from hostname
    └── use-brand-name.ts         # NEW — useBrandName() hook + getBrandDescription()
```

**Server vs Client:**
- **Modified Server:** `app/layout.tsx` (add locale cookie reading + dir/lang).
- **New Server:** `app/(auth)/login/page.tsx`, `app/(dashboard)/layout.tsx`, `app/(dashboard)/page.tsx`, `app/(dashboard)/tasks/page.tsx`, `app/(dashboard)/blueprints/page.tsx`, `app/(dashboard)/analytics/page.tsx`, `app/(dashboard)/follow-up/page.tsx`, `app/(dashboard)/organization/page.tsx`, `app/(dashboard)/admin/page.tsx`, `proxy.ts`.
- **New Client (Domain — based on blocks):** `components/domain/auth/login-form.tsx`, `components/domain/shell/app-sidebar.tsx`, `components/domain/shell/site-header.tsx`, `components/domain/shell/nav-user.tsx`, `components/domain/shell/nav-main.tsx`.
- **New Client (Fresh):** `components/locale-provider.tsx`, `components/domain/search/global-search.tsx`, `components/domain/shell/notification-bell.tsx`, `components/domain/shell/notification-panel.tsx`, `components/domain/shell/notification-item.tsx`, `components/domain/shell/brand-color-provider.tsx`, `components/shared/locale-toggle.tsx`, `components/shared/brand-color-toggle.tsx`, `components/shared/empty-state.tsx`, `components/shared/error-state.tsx`.
- **New Lib:** `lib/api/hooks/use-auth.ts`, `lib/api/hooks/use-capabilities.ts`, `lib/api/hooks/use-notifications.ts`, `lib/api/hooks/use-search.ts`, `lib/api/query-keys-extra.ts`, `lib/stores/use-locale-store.ts`, `lib/stores/use-capability-store.ts`, `lib/stores/use-brand-color-store.ts`, `lib/hooks/use-debounce.ts`, `lib/utils/tenant.ts`.
- **Block originals (untouched):** `components/login-form.tsx`, `components/app-sidebar.tsx`, `components/site-header.tsx`, `components/nav-user.tsx`, `components/nav-main.tsx`, `components/nav-documents.tsx`, `components/nav-secondary.tsx`, `components/section-cards.tsx`, `components/chart-area-interactive.tsx`, `components/data-table.tsx`, `components/theme-toggle.tsx`, `app/login-block/page.tsx`, `app/dashboard-block/page.tsx`.

---

## Affected Files

### Block Originals — Untouched (Reference)

| File | Block Source | Purpose |
|------|-------------|---------|
| `app/login-block/page.tsx` | `@shadcn/login-03` | Block demo — kept at `/login-block` |
| `app/dashboard-block/page.tsx` | `@shadcn/dashboard-01` | Block demo — kept at `/dashboard-block` |
| `components/login-form.tsx` | `@shadcn/login-03` | Block form with Apple/Google login — kept for comparison |
| `components/app-sidebar.tsx` | `@shadcn/dashboard-01` | Block sidebar with mock data — kept for comparison |
| `components/site-header.tsx` | `@shadcn/dashboard-01` | Block header with static title — kept for comparison |
| `components/nav-user.tsx` | `@shadcn/dashboard-01` | Block user menu with mock user — kept for comparison |
| `components/nav-main.tsx` | `@shadcn/dashboard-01` | Block nav with Quick Create/Inbox — kept for comparison |
| `components/nav-documents.tsx` | `@shadcn/dashboard-01` | Block component — kept |
| `components/nav-secondary.tsx` | `@shadcn/dashboard-01` | Block component — kept |
| `components/section-cards.tsx` | `@shadcn/dashboard-01` | Block stat cards — kept |
| `components/chart-area-interactive.tsx` | `@shadcn/dashboard-01` | Block chart — kept |
| `components/data-table.tsx` | `@shadcn/dashboard-01` | Block data table — kept |
| `components/theme-toggle.tsx` | `@shadcn/dashboard-01` | Theme toggle — kept |

### New Files

| File | Purpose |
|------|---------|
| `proxy.ts` | Next.js 16 Proxy — security headers (`X-Frame-Options`, `X-Content-Type-Options`) + `Cache-Control: no-store` (prevents bfcache). No auth logic. |
| `app/layout.tsx` | **MODIFIED** — add NEXT_LOCALE cookie reading, set `dir`/`lang` on `<html>`. |
| `app/page.tsx` | **REPLACED** — dashboard home or redirect. |
| `app/(auth)/login/page.tsx` | Gov TMS login page route. |
| `app/(dashboard)/layout.tsx` | Authenticated dashboard shell (SidebarProvider + AppSidebar + SiteHeader). Skip link uses `getTranslations('shell.skip_to_main')` for i18n. |
| `app/(dashboard)/page.tsx` | Dashboard landing page placeholder. |
| `app/(dashboard)/tasks/page.tsx` | Placeholder page (spec 002). |
| `app/(dashboard)/blueprints/page.tsx` | Placeholder page (spec 003). |
| `app/(dashboard)/analytics/page.tsx` | Placeholder page (spec 005). |
| `app/(dashboard)/follow-up/page.tsx` | Placeholder page (spec 004). |
| `app/(dashboard)/organization/page.tsx` | Placeholder page (spec 006). |
| `app/(dashboard)/admin/page.tsx` | Placeholder page (capability-gated). |
| `components/domain/auth/login-form.tsx` | Gov TMS login form — clean email/password, Zod, useLogin, no social buttons, Arabic. |
| `components/domain/shell/app-sidebar.tsx` | Gov TMS sidebar — real nav, real user, capability-gated admin, active highlighting. |
| `components/domain/shell/site-header.tsx` | Gov TMS top bar — dynamic title, notification bell, locale toggle, `GlobalSearch` trigger (dynamically imported via `next/dynamic`). Theme + brand color moved to user dropdown. Uses `useBrandName()` instead of `useTenant` for consistent branding with sidebar. |
| `components/domain/shell/nav-user.tsx` | Gov TMS user menu — avatar/name header, Preferences group with Theme submenu (light/dark/system) + Brand Color submenu (5 colors), logout. All interactive items use `cursor-pointer`. |
| `components/domain/shell/nav-main.tsx` | Gov TMS nav links — Link-based, active state, LucideIcon type. |
| `components/domain/shell/notification-bell.tsx` | Bell icon with unread count badge. |
| `components/domain/shell/notification-panel.tsx` | Notification list panel with cursor pagination. "Mark all as read" button uses `cursor-pointer`. |
| `components/domain/shell/notification-item.tsx` | Single notification row with `cursor-pointer`. Reads `title_ar`/`title_en` and `body_ar`/`body_en` from `data` field (matches backend `NotificationResource` shape). |
| `components/domain/shell/brand-color-provider.tsx` | Injects `--color-primary` and `--primary` CSS vars from store. **Moved to root layout** — both login and dashboard pages receive the persisted brand color. **Module-level localStorage read** sets CSS vars before React initializes — eliminates color flash. |
| `components/locale-provider.tsx` | Syncs Zustand locale store with server-provided `initialLocale` prop on mount — prevents SSR/hydration mismatch. |
| `components/domain/search/global-search.tsx` | Command-palette search dialog. Results show SLA health dot, blueprint name, department name. **Wired into `site-header.tsx`** — trigger button replaces static search InputGroup. Uses `useLocale()` for locale-aware title display. Items use `cursor-pointer`. |
| `components/shared/locale-toggle.tsx` | AR/EN locale switcher (`cursor-pointer`). |
| `components/shared/brand-color-toggle.tsx` | Brand color picker (amber, blue, emerald, rose, slate). **Orphaned** — replaced by inline submenu in `NavUser`. Kept for potential future use. |
| `components/shared/empty-state.tsx` | Icon + headline + CTA for empty data states. |
| `components/shared/error-state.tsx` | Error message + retry button. |
| `lib/api/hooks/use-capabilities.ts` | useCapabilities, useCapability hooks. |
| `lib/api/hooks/use-notifications.ts` | useNotifications, useNotificationsCount, etc. **Exported `Notification` interface** updated to match backend `NotificationResource` shape (`data.title_ar`/`data.title_en`, `data.body_ar`/`data.body_en`). Removed `refetchInterval` polling — uses `staleTime: 5min` instead. |
| `lib/api/hooks/use-search.ts` | useSearch, useRecentActivity hooks. |
| `lib/api/query-keys-extra.ts` | Extra query key namespaces (notifications, search). |
| `lib/api/query-keys.ts` | **MODIFIED** — added `tenant.info` query key. `auth.capabilities` changed from static to function. |
| `lib/utils/use-brand-name.ts` | **MODIFIED** — replaced `useLocaleStore` with `useLocale()` from `next-intl` as the locale source of truth (server-initialized, no hydration flash). |
| `lib/tenant/server.ts` | **NEW** — `prefetchTenant()` server-only utility with query key `queryKeys.tenant.info`. |
| `components/providers.tsx` | **MODIFIED** — accepts `dehydratedState` prop, wraps children in `HydrationBoundary` for root-level TanStack Query hydration. Also added `QueryCache` 401 redirect. |
| `lib/stores/use-locale-store.ts` | Locale state (initializes as 'ar' for SSR, `syncLocale` for post-hydration sync, `setLocale` for user toggle + reload). Still used by `LocaleToggle` but no longer read by sidebar/user components. |
| `app/(dashboard)/layout.tsx` | **MODIFIED** — reads `NEXT_LOCALE` cookie and passes `locale` prop to `<AppSidebar>`. Removed `BrandColorProvider` (moved to root layout). Removed `prefetchTenant` (moved to root layout). |
| `components/domain/shell/app-sidebar.tsx` | **MODIFIED** — accepts `locale` prop from server layout (used for `side` positioning). Passes `locale` to `<NavUser>`. No longer imports `useLocaleStore`. |
| `components/domain/shell/nav-user.tsx` | **MODIFIED** — accepts `locale` prop from `AppSidebar` (used for name display, menu side, `DropdownMenu` dir). No longer imports `useLocaleStore`. |
| `lib/stores/use-capability-store.ts` | Capability strings array from API. |
| `lib/stores/use-brand-color-store.ts` | Persisted brand color (amber/blue/emerald/rose/slate) with hex values. |
| `lib/hooks/use-debounce.ts` | Debounce hook for search input. |
| `lib/utils/tenant.ts` | Extract tenant slug from browser hostname subdomain. |
| `lib/utils/use-brand-name.ts` | `useBrandName()` hook + `getBrandDescription()` for dynamic tenant-based branding. |
| `lib/tenant/server.ts` | **NEW** — `prefetchTenant()` server-only utility. Fetches `GET /v1` server-side and hydrates query cache so `useTenant()` returns immediately without network request. |
| `app/(dashboard)/layout.tsx` | **MODIFIED** — calls `await prefetchTenant(queryClient)` alongside `prefetchAuthenticatedUser`. |
| `i18n/request.ts` | next-intl request config: reads `NEXT_LOCALE` cookie, returns locale + messages. |
| `next.config.ts` | **MODIFIED** — wrapped with `createNextIntlPlugin('./i18n/request.ts')`. |
| `app/layout.tsx` | **MODIFIED** — creates `QueryClient`, calls `prefetchTenant()`, passes dehydrated state to `Providers` via `HydrationBoundary`. Renders `BrandColorProvider` so both login and dashboard receive persisted color. **Blocking `<script>`** in `<body>` reads localStorage and sets `--color-primary` before first paint — eliminates brand color flash. |
| `messages/ar.json` | Arabic UI translation strings. |
| `messages/en.json` | English UI translation strings. |
| `lib/api/client.ts` | **MODIFIED** — added `getLocaleSlug()` and `X-Locale` header on all requests. |
| `components/ui/input-group.tsx` | **MODIFIED** — replaced physical `pl`/`pr`/`ml`/`mr` with logical `ps`/`pe`/`ms`/`me` in `inline-start`/`inline-end` addon variants and container input padding selectors. Fixes icon sticking to edge in RTL. |
| `components/ui/dropdown-menu.tsx` | **MODIFIED** — replaced `ml-auto` with `ms-auto` and added `rtl:rotate-180` on `ChevronRightIcon` in `DropdownMenuSubTrigger`. Fixes sub-menu arrow in RTL. |
| `components/ui/sidebar.tsx` | **MODIFIED** — replaced `ml-0`/`ml-2` with `ms-0`/`ms-2` in `SidebarInset` variant selectors. Fixes main content padding stuck to left edge in RTL when sidebar is expanded (`data-side="right"`). |
| `components/ui/command.tsx` | **MODIFIED** — wrapped `CommandDialog` children in `<Command>` component to provide cmdk context (fixes runtime error). Added `shouldFilter={false}` to disable cmdk's built-in client-side filtering (conflicts with server-side search results). |

### Unchanged

| File | Reason |
|------|--------|
| `lib/stores/use-sidebar-store.ts` | Pre-existing scaffold file. Currently unused — sidebar state uses shadcn's `useSidebar()` hook. |
| Block files (listed above) | Untouched reference copies. |

---

## Implementation Notes

### 1. LoginForm — Create Domain Auth Component

**One-line summary:** Create `components/domain/auth/login-form.tsx` with clean email/password form (no social buttons), Zod validation, `useLogin()` hook, Arabic strings, and loading/error states. Block original at `components/login-form.tsx` stays untouched.

**Key decisions:**
- **New file** at `components/domain/auth/login-form.tsx` — block original stays as reference.
- **Remove** Apple/Google social buttons, FieldSeparator, forgot password link, sign up link, TOS footer. Gov TMS uses email/password only.
- Add Zod schema validation via `react-hook-form` + `zodResolver`.
- Wire `useLogin()` mutation from existing hooks (`lib/api/hooks/use-auth.ts`).
- Show loading spinner on submit button while pending.
- Show auth error as `toast.error()` only (no inline `Alert`).
- **i18n:** Uses `useTranslations('auth.login')` from `next-intl` for all strings (labels, placeholders, validation messages, toast). Zod error messages are generated inside the component using `t()` so they stay in sync with the active locale.
- **Forgot password:** Link below password field. Shows `toast.error(t('forgot_password_toast'))` on click ("يرجى التواصل مع مسؤول المنصة" / "Please contact your platform admin"). Text and toast are i18n'd via `auth.login.forgot_password` and `auth.login.forgot_password_toast`.
- **Sign up:** Link below submit button. Same toast as forgot password ("يرجى التواصل مع مسؤول المنصة"). i18n'd via `auth.login.no_account` and `auth.login.sign_up`.
- **TOS & Privacy:** Footer below card using `FieldDescription` (same as block) with "Terms of Service" and "Privacy Policy" text (no click action). i18n'd via `auth.login.terms_prefix`, `auth.login.terms`, `auth.login.terms_and`, `auth.login.privacy`.

**Files:** `components/domain/auth/login-form.tsx` (NEW)

> **Note:** The login form uses `next-intl` for UI strings. Messages are in `messages/{locale}.json` under the `auth.login` namespace.

```tsx
// components/domain/auth/login-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useLogin } from '@/lib/api/hooks/use-auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const login = useLogin();
  const [authError, setAuthError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  function onSubmit(values: LoginFormValues) {
    setAuthError(null);
    login.mutate(values, {
      onSuccess: () => {
        toast.success('تم تسجيل الدخول بنجاح');
      },
      onError: (error: Error) => {
        const message = error.message || 'فشل تسجيل الدخول. تأكد من صحة البريد الإلكتروني وكلمة المرور.';
        setAuthError(message);
        toast.error(message);
      },
    });
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">البريد الإلكتروني</FieldLabel>
                <Input id="email" type="email" placeholder="m@example.com" {...form.register('email')} />
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="password">كلمة المرور</FieldLabel>
                <Input id="password" type="password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <FieldError>{form.formState.errors.password.message}</FieldError>
                )}
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending && <Spinner data-icon="inline-start" />}
                  {login.isPending ? 'جاري الدخول...' : 'دخول'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Test cases:**
1. Submit empty form → inline validation errors for email and password.
2. Submit valid credentials → button shows spinner, then redirects to `/` on success.

**Coding standards:** `coding-standards.md` forms via shadcn Field + InputGroup; all 4 states; `security-policy.md` no PII in logs.

---

### 2. AppSidebar — Create Domain Shell Component

**One-line summary:** Create `components/domain/shell/app-sidebar.tsx` with Gov TMS navigation items, real user from API, capability-gated Admin link, and active route highlighting. Block original at `components/app-sidebar.tsx` stays untouched.

**Key decisions:**
- **New file** at `components/domain/shell/app-sidebar.tsx` — block original stays as reference.
- Nav items: Dashboard (`/`), Tasks (`/tasks`), Blueprints (`/blueprints`), Analytics (`/analytics`), Follow-up (`/follow-up`), Organization (`/organization`), Admin (`/admin`, hidden unless admin capability).
- Active route highlighted via `usePathname()`.
- User footer uses `useCurrentUser()` with skeleton loading state.
- Remove NavDocuments and NavSecondary sections (not applicable to Gov TMS MVP).
- Use `next/link` for navigation.
- Domain `nav-main.tsx` handles Link items. Domain `nav-user.tsx` handles user footer.
- RTL: passes `side={locale === 'ar' ? 'right' : 'left'}` to `<Sidebar>` — shadcn sidebar uses physical `left`/`right` positioning, not logical properties.

**Files:** `components/domain/shell/app-sidebar.tsx` (NEW)

```tsx
// components/domain/shell/app-sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  BarChart3,
  GitMerge,
  Building2,
  Shield,
  Zap,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavMain } from '@/components/domain/shell/nav-main';
import { NavUser } from '@/components/domain/shell/nav-user';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapabilities, useCapability } from '@/lib/api/hooks/use-capabilities';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrandName } from '@/lib/utils/use-brand-name';

export function AppSidebar({ locale = 'ar', ...props }: React.ComponentProps<typeof Sidebar> & { locale?: 'ar' | 'en' }) {
  const pathname = usePathname();
  const tnav = useTranslations('nav');
  const { data: user, isLoading } = useCurrentUser();
  const canAdmin = useCapability('iam.manage_users');
  const appName = useBrandName();

  useCapabilities(user?.public_id);

  const navItems = [
    { title: tnav('dashboard'), url: '/', icon: LayoutDashboard },
    { title: tnav('tasks'), url: '/tasks', icon: ListTodo },
    { title: tnav('blueprints'), url: '/blueprints', icon: FolderKanban },
    { title: tnav('analytics'), url: '/analytics', icon: BarChart3 },
    { title: tnav('follow_up'), url: '/follow-up', icon: GitMerge },
    { title: tnav('organization'), url: '/organization', icon: Building2 },
  ];

  return (
    <Sidebar collapsible="offcanvas" side={locale === 'ar' ? 'right' : 'left'} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5! cursor-pointer">
              <Zap className="size-5!" />
              <span className="text-base font-semibold">{appName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} pathname={pathname} />
        {canAdmin && (
          <NavMain
            items={[{ title: 'الإدارة', url: '/admin', icon: Shield }]}
            pathname={pathname}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        {isLoading || !user ? (
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ) : (
          <NavUser user={user} />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
```

**Test cases:**
1. Admin nav item hidden for normal user; visible for user with `iam.manage_users`.
2. Active route highlighted with accent color.

**Coding standards:** `coding-standards.md` permission UI via `useCapability()`; `design-system/03-components.md` sidebar.

---

### 3. SiteHeader — Create Domain Shell Component

**One-line summary:** Create `components/domain/shell/site-header.tsx` with dynamic page title, notification bell, locale/brand/toggle controls. Block original at `components/site-header.tsx` stays untouched.

**Key decisions:**
- **New file** at `components/domain/shell/site-header.tsx` — block original stays as reference.
- Add `NotificationBell` component from domain shell.
- Add `LocaleToggle` in the header actions. Theme and Brand Color moved to user menu dropdown.
- Dynamic page title via `usePathname()`.
- Search input placeholder for global search trigger.
- Header matches block: `transition-[width,height]` + `group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)` for smooth sidebar collapse animation.

**Files:** `components/domain/shell/site-header.tsx` (NEW)

```tsx
// components/domain/shell/site-header.tsx
'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/domain/shell/notification-bell';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { useBrandName } from '@/lib/utils/use-brand-name';

const GlobalSearch = dynamic(() => import('@/components/domain/search/global-search').then(m => m.GlobalSearch), { ssr: false });

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations('shell');
  const appName = useBrandName();

  const pageTitles: Record<string, string> = {
    '/': t('page_titles.dashboard'),
    '/tasks': t('page_titles.tasks'),
    '/blueprints': t('page_titles.blueprints'),
    '/analytics': t('page_titles.analytics'),
    '/follow-up': t('page_titles.follow_up'),
    '/organization': t('page_titles.organization'),
    '/admin': t('page_titles.admin'),
  };
  const pageTitle = pageTitles[pathname] ?? appName;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1 cursor-pointer" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ms-auto flex items-center gap-2">
          <GlobalSearch />
          <NotificationBell />
          <LocaleToggle />
        </div>
      </div>
    </header>
  );
}
```

**Coding standards:** `coding-standards.md` logical properties; `design-system/04-layout-patterns.md` top bar dimensions.

---

### 4. NavUser — Create Domain Shell Component

**One-line summary:** Create `components/domain/shell/nav-user.tsx` with real logout, RTL-safe logical properties, and minimal menu (avatar + logout only). Block original at `components/nav-user.tsx` stays untouched.

**Key decisions:**
- **New file** at `components/domain/shell/nav-user.tsx` — block original stays as reference.
- Use logical properties: `size-8` not `h-8 w-8`, `text-start` not `text-left`, `ms-auto` not `ml-auto`.
- Use locale-aware menu side: `locale === 'ar' ? 'left' : 'right'` so the dropdown opens into the page (Radix only supports physical directions — `start`/`end` are not valid values).
- Remove Account, Billing, Notifications dropdown items (out of scope).
- Add real logout via `useLogout()`.
- Accept `UserResource` type instead of the mock `{ name, email, avatar }`.
- AvatarFallback shows computed initials from user name.
- User name is locale-aware: picks `name_ar` in Arabic mode, `name_en` in English mode (with fallback to the other).

**Files:** `components/domain/shell/nav-user.tsx` (NEW)

```tsx
// components/domain/shell/nav-user.tsx
'use client';

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { EllipsisVertical, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLogout } from '@/lib/api/hooks/use-auth';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];

interface NavUserProps {
  user: UserResource;
  locale?: 'ar' | 'en';
}

export function NavUser({ user, locale = 'ar' }: NavUserProps) {
  const { isMobile } = useSidebar();
  const t = useTranslations('auth');
  const logout = useLogout();
  const name = locale === 'ar' ? (user.name_ar || user.name_en || user.email) : (user.name_en || user.name_ar || user.email);
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const menuSide = isMobile ? 'bottom' : (locale === 'ar' ? 'left' : 'right');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="size-8 rounded-lg grayscale">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <EllipsisVertical data-slot="sidebar-menu-button-icon" className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={menuSide}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar_url ?? ''} alt={name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout.mutate()} disabled={logout.isPending} className="cursor-pointer">
              <LogOut data-slot="sidebar-menu-button-icon" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
```

**Test cases:**
1. Click logout → calls `useLogout.mutate()` → clears cache → redirects to `/login`.
2. RTL layout: sidebar user menu aligned correctly with `ms-auto`.

**Coding standards:** `coding-standards.md` permission UI; `security-policy.md` server is truth; RTL logical properties.

---

### 5. NavMain — Create Domain Shell Component

**One-line summary:** Create `components/domain/shell/nav-main.tsx` with Link-based navigation items and active state. Block original at `components/nav-main.tsx` stays untouched.

**Key decisions:**
- **New file** at `components/domain/shell/nav-main.tsx` — block original stays as reference.
- Accept `pathname` prop for active highlighting via `usePathname()` (passed from parent `AppSidebar`).
- Use `next/link` for each nav item.
- Active item gets `bg-sidebar-accent text-sidebar-accent-foreground`.
- Remove Quick Create button and Inbox button (out of scope for shell).
- Items type: `{ title: string; url: string; icon: LucideIcon }` (component reference, not JSX).

**Files:** `components/domain/shell/nav-main.tsx` (NEW)

```tsx
// components/domain/shell/nav-main.tsx
'use client';

import Link from 'next/link';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export function NavMain({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className={isActive ? 'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground' : ''}>
                  <Link href={item.url}>
                    <Icon data-slot="sidebar-menu-button-icon" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

**Coding standards:** `coding-standards.md` logical properties; `design-system/03-components.md` sidebar.

---

### 6. New: Shared Components

**Files:**
- `components/shared/empty-state.tsx` — Icon + headline + description + optional CTA.
- `components/shared/error-state.tsx` — Error message + retry button.
- `components/shared/locale-toggle.tsx` — AR/EN button that calls `useLocaleStore.setLocale()`.
- `components/shared/brand-color-toggle.tsx` — Dropdown with 5 color options (amber/blue/emerald/rose/slate), calls `useBrandColorStore.setColor()`.

```tsx
// components/shared/empty-state.tsx
'use client';

import type { LucideIcon } from 'lucide-react';
import { InboxIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = InboxIcon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <Icon className="size-12 text-muted-foreground/50" />
      <div>
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
```

```tsx
// components/shared/error-state.tsx
'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message = 'حدث خطأ. يرجى المحاولة مرة أخرى.', onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <AlertCircle className="size-12 text-destructive/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
```

```tsx
// components/shared/page-header.tsx — DELETED (unused)
'use client';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-center justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
```

```tsx
// components/shared/locale-toggle.tsx
'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocaleStore } from '@/lib/stores/use-locale-store';

export function LocaleToggle() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Languages data-slot="icon" />
    </Button>
  );
}
```

```tsx
// components/shared/brand-color-toggle.tsx
'use client';

import { Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBrandColorStore, type BrandColor, brandColorHex } from '@/lib/stores/use-brand-color-store';

const colors: BrandColor[] = ['amber', 'blue', 'emerald', 'rose', 'slate'];

export function BrandColorToggle() {
  const { color, setColor } = useBrandColorStore();
  const t = useTranslations('colors');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer" aria-label={t('amber')}>
          <Palette data-slot="icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {colors.map((c) => (
          <DropdownMenuItem key={c} onClick={() => setColor(c)} className="gap-3 cursor-pointer">
            <span
              className="size-4 rounded-full border"
              style={{ backgroundColor: brandColorHex[c] }}
            />
            <span>{t(c)}</span>
            {color === c && <span className="ms-auto text-xs text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### 7. New: Notification Components

**Files:**
- `components/domain/shell/notification-bell.tsx` — Bell icon with unread count badge.
- `components/domain/shell/notification-panel.tsx` — Dropdown with notification list, load more, mark all read.
- `components/domain/shell/notification-item.tsx` — Single notification row with read/unread state.

```tsx
// components/domain/shell/notification-bell.tsx
'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useNotificationsCount } from '@/lib/api/hooks/use-notifications';
import { NotificationPanel } from './notification-panel';

export function NotificationBell() {
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const { data: countData } = useNotificationsCount();
  const unreadCount = countData?.unread_count ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer" aria-label={t('title')}>
          <Bell data-slot="icon" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -end-1 size-5 rounded-full p-0 text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <NotificationPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
```

```tsx
// components/domain/shell/notification-panel.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAllNotificationsRead } from '@/lib/api/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const allNotifications = data?.pages.flatMap(p => p.data) ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-medium">الإشعارات</h3>
        {allNotifications.some(n => !n.read_at) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto text-xs"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            تحديد الكل كمقروء
          </Button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        {isError && (
          <div className="p-3">
            <ErrorState onRetry={() => refetch()} />
          </div>
        )}
        {!isLoading && !isError && allNotifications.length === 0 && (
          <EmptyState icon={Bell} title="لا توجد إشعارات" description="سيتم عرض الإشعارات هنا" />
        )}
        {!isLoading && !isError && allNotifications.length > 0 && (
          <>
            {allNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onClose={onClose} />
            ))}
            {hasNextPage && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'جاري التحميل...' : 'تحميل المزيد'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

```tsx
// components/domain/shell/notification-item.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useMarkNotificationRead } from '@/lib/api/hooks/use-notifications';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string;
    data?: Record<string, string>;
  };
  onClose: () => void;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const markRead = useMarkNotificationRead();
  const router = useRouter();
  const isUnread = !notification.read_at;
  const taskPublicId = notification.data?.task_public_id;

  function handleClick() {
    if (isUnread) {
      markRead.mutate(notification.id);
    }
    if (taskPublicId) {
      router.push(`/tasks/${taskPublicId}`);
    }
    onClose();
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full flex-col gap-1 px-3 py-2.5 text-start text-sm transition-colors hover:bg-muted/50',
        isUnread && 'bg-muted/30',
      )}
    >
      <div className="flex items-start gap-2">
        {isUnread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
        <span className={cn('flex-1 font-medium', !isUnread && 'me-4')}>{notification.title}</span>
      </div>
      <span className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</span>
      <span className="text-[10px] text-muted-foreground/60">
        {new Date(notification.created_at).toLocaleDateString('ar-SA')}
      </span>
    </button>
  );
}
```

**Test cases:**
1. `NotificationBell` shows badge only when `unread_count > 0`.
2. `NotificationPanel` renders loading skeleton, empty state, error state, and populated list.

**Coding standards:** `coding-standards.md` cursor pagination with `useInfiniteQuery`; all 4 states.

---

### 8. New: BrandColorProvider

```tsx
// components/domain/shell/brand-color-provider.tsx
'use client';

import { useEffect } from 'react';
import { useBrandColorStore, getBrandColorHex } from '@/lib/stores/use-brand-color-store';

export function BrandColorProvider() {
  const color = useBrandColorStore((s) => s.color);

  useEffect(() => {
    const hex = getBrandColorHex(color);
    document.documentElement.style.setProperty('--color-primary', hex);
    document.documentElement.style.setProperty('--primary', hex);
  }, [color]);

  return null;
}
```

---

### 9. New: LocaleProvider

```tsx
// components/locale-provider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useLocaleStore } from '@/lib/stores/use-locale-store';

// Receives the server-determined locale from the root layout (via NEXT_LOCALE cookie)
// and syncs it into the Zustand store once on mount. This ensures SSR and hydration
// use the same locale value — no hydration mismatch, no post-render correction.
export function LocaleProvider({ initialLocale, children }: { initialLocale: string; children: React.ReactNode }) {
  const synced = useRef(false);

  useEffect(() => {
    if (!synced.current && (initialLocale === 'ar' || initialLocale === 'en')) {
      useLocaleStore.getState().syncLocale(initialLocale as 'ar' | 'en');
      synced.current = true;
    }
  }, [initialLocale]);

  return <>{children}</>;
}
```

---

### 11. New: GlobalSearch (Command Palette)

```tsx
// components/domain/search/global-search.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useSearch, useRecentActivity } from '@/lib/api/hooks/use-search';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/lib/hooks/use-debounce';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  const { data: recentData, isLoading: recentLoading } = useRecentActivity();
  const { data: searchData, isLoading: searchLoading } = useSearch(debouncedQuery);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelect = useCallback(
    (publicId: string) => {
      setOpen(false);
      router.push(`/tasks/${publicId}`);
    },
    [router],
  );

  const showResults = debouncedQuery.length >= 2;
  const results = searchData?.data ?? [];
  const recentItems = recentData?.data ?? [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground"
      >
        <SearchIcon className="size-4" />
        <span className="hidden lg:inline">بحث...</span>
        <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] lg:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="ابحث عن مهمة..." value={query} onValueChange={setQuery} />
        <CommandList>
          {!showResults && (
            <CommandGroup heading="آخر النشاطات">
              {recentLoading && (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              )}
              {!recentLoading && recentItems.length === 0 && (
                <CommandEmpty>لا توجد نتائج</CommandEmpty>
              )}
              {recentItems.map((item: { public_id: string; title_ar?: string; title_en?: string }) => (
                <CommandItem key={item.public_id} onSelect={() => handleSelect(item.public_id)}>
                  <SearchIcon className="size-4" />
                  <span>{item.title_ar || item.title_en}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {showResults && (
            <CommandGroup heading="نتائج البحث">
              {searchLoading && (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              )}
              {!searchLoading && results.length === 0 && (
                <CommandEmpty>لا توجد نتائج لـ "{debouncedQuery}"</CommandEmpty>
              )}
              {results.map((result: { public_id: string; title_ar?: string; title_en?: string; status?: string }) => (
                <CommandItem key={result.public_id} onSelect={() => handleSelect(result.public_id)}>
                  <SearchIcon className="size-4" />
                  <div className="flex flex-col">
                    <span>{result.title_ar || result.title_en}</span>
                    {result.status && <span className="text-xs text-muted-foreground">{result.status}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

> **Note:** Requires a `useDebounce` hook. Create at `hooks/use-debounce.ts`.

---

### 12. Route Structure, Root Layout, & Middleware

**Files:**
- `app/layout.tsx` — **MODIFIED** — add NEXT_LOCALE cookie reading, set `dir`/`lang` attributes.
- `app/page.tsx` — **REPLACED** — dashboard home placeholder.
- `app/(auth)/login/page.tsx` — Gov TMS login page (imports from domain component).
- `app/(dashboard)/layout.tsx` — Authenticated shell (imports from domain components).
- `app/(dashboard)/page.tsx` — Dashboard home placeholder.
- `proxy.ts` — Session check + redirect.

**Root Layout Change (`app/layout.tsx`):**
The existing layout has `Geist` fonts, `ThemeProvider`, `TooltipProvider`, and sonner `Toaster` — but does **not** read the `NEXT_LOCALE` cookie or set `dir`/`lang`. Add Server Component logic to read the cookie and apply RTL/LTR attributes.

> **Toaster:** Added `richColors` prop + 6s `duration` + locale-aware position (bottom-left for Arabic, bottom-right for English). Font override in globals.css (`[data-sonner-toaster] { font-family: var(--font-sans) !important; }`) to fix sonner's hardcoded system font stack.

> **Font switching:** Arabic uses `IBM Plex Sans Arabic` (via `next/font/google`), English uses `Geist`. Applied via:
> 1. `html[lang="ar"] { --font-sans: var(--font-ibm-plex-arabic); }` in `globals.css` — swaps the CSS variable for all `var(--font-sans)` consumers (`.font-heading`, Tailwind `font-sans`, etc.)
> 2. Inline `style={{ fontFamily }}` on `<html>` in layout — handles inherited cascade for elements without explicit `font-family`
> Both methods are needed because Tailwind v4 resolves `@apply font-sans` at build time to a fixed value, but `var(--font-sans)` is dynamic.

> **Note:** The implementation also wraps children in `<Providers>` (QueryClientProvider) and `<NextIntlClientProvider>` (i18n). The full snippet includes both. Messages are loaded server-side based on the `NEXT_LOCALE` cookie.

```tsx
// app/layout.tsx — MODIFIED
import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { LocaleProvider } from "@/components/locale-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gov TMS",
  description: "منصة إدارة المهام الحكومية",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${geistSans.variable} ${ibmPlexArabic.variable} ${geistMono.variable} h-full antialiased`}
      style={{ fontFamily: locale === 'ar' ? 'IBM Plex Sans Arabic, sans-serif' : 'Geist, sans-serif' }}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <LocaleProvider initialLocale={locale}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </ThemeProvider>
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
```

```tsx
// app/(auth)/login/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { LoginForm } from '@/components/domain/auth/login-form';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { ModeToggle } from '@/components/theme-toggle';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useBrandName } from '@/lib/utils/use-brand-name';

export default function LoginPage() {
  const router = useRouter();
  const { data: user, isFetched } = useCurrentUser();
  const redirected = useRef(false);
  const appName = useBrandName();

  useEffect(() => {
    if (isFetched && user && !redirected.current) {
      redirected.current = true;
      router.push('/');
    }
  }, [isFetched, user, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          {appName}
        </Link>
        <LoginForm />
        <div className="flex items-center justify-center gap-2">
          <LocaleToggle />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
```
> **Note:** Uses `useCurrentUser()` via `apiClient` which includes the required `X-Tenant` header. Previous direct `fetch` to `/api/me` was removed because it skipped `apiClient` and returned 400 (missing `X-Tenant`). The `redirected` ref prevents duplicate `router.push` calls in React StrictMode. Login page also includes `LocaleToggle` and `ModeToggle` below the form for language/theme switching without needing the dashboard shell.

```tsx
// app/(dashboard)/layout.tsx — authenticates via Laravel + hydrates TanStack Query
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchAuthenticatedUser } from '@/lib/auth/server';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/domain/shell/app-sidebar';
import { SiteHeader } from '@/components/domain/shell/site-header';
import { BrandColorProvider } from '@/components/domain/shell/brand-color-provider';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  await prefetchAuthenticatedUser(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <BrandColorProvider />
        <AppSidebar variant="inset" />
        <SidebarInset>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
          >
            تخطي إلى المحتوى الرئيسي
          </a>
          <SiteHeader />
          <div className="flex flex-1 flex-col" id="main-content">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
```

> **Auth flow:** The layout creates a request-scoped `QueryClient`, calls `prefetchAuthenticatedUser()` which fetches `/v1/iam/auth/me` server-side (with `Origin`, `Cookie`, `X-Tenant` headers forwarded). On 401 → `redirect('/login')` before any shell HTML. On 200 → `setQueryData()` populates the cache. `HydrationBoundary` serializes the cache into the HTML so client-side `useCurrentUser()` returns immediately without a network request.

```tsx
// app/(dashboard)/page.tsx
export default function DashboardPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">لوحة التحكم — قيد التطوير</p>
    </div>
  );
}
```

```tsx
// app/page.tsx — REMOVED (conflicted with (dashboard)/page.tsx at /)
// (dashboard)/page.tsx serves at / with the dashboard layout instead
```

```typescript
// proxy.ts — Next.js 16 proxy (security headers + cache control only)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|v1/|sanctum/|.*\\..*).*)'],
};
```

> **Auth philosophy:** proxy.ts no longer handles auth decisions. All authentication validation is performed in the dashboard layout via a server-side fetch to Laravel's `/v1/iam/auth/me` endpoint. See `lib/auth/server.ts` and `app/(dashboard)/layout.tsx`. Laravel is the single source of truth.

### Environment Variables

Add to `.env.local`:

```ini
# Laravel session cookie name — must match backend config/session.php SESSION_COOKIE
SESSION_COOKIE_NAME=momentum-session
```

---

### 13. Placeholder Pages

Each module route gets a simple placeholder:

```tsx
// app/(dashboard)/tasks/page.tsx
export default function TasksPage() {
  return <div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">المهام — قيد التطوير</p></div>;
}

// app/(dashboard)/blueprints/page.tsx
export default function BlueprintsPage() {
  return <div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">القوالب — قيد التطوير</p></div>;
}

// app/(dashboard)/analytics/page.tsx
export default function AnalyticsPage() {
  return <div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">التحليلات — قيد التطوير</p></div>;
}

// app/(dashboard)/follow-up/page.tsx
export default function FollowUpPage() {
  return <div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">المتابعة — قيد التطوير</p></div>;
}

// app/(dashboard)/organization/page.tsx
export default function OrganizationPage() {
  return <div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">الهيكل التنظيمي — قيد التطوير</p></div>;
}

// app/(dashboard)/admin/page.tsx
'use client';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
export default function AdminPage() {
  const canAdmin = useCapability('iam.manage_users');
  if (!canAdmin) return <div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">ليس لديك صلاحية الوصول</p></div>;
  return <div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">الإدارة — قيد التطوير</p></div>;
}
```

---

## Data Flow

1. **Login:** User submits form → `useLogin.mutate()` → CSRF cookie → POST login → backend sets session cookie → redirect to `/`.
2. **Shell load:** `DashboardLayout` (Server Component) → `prefetchAuthenticatedUser()` → server-side fetch `/v1/iam/auth/me` → 200 → `setQueryData()` → `HydrationBoundary` → client renders → `useCurrentUser()` reads from cache, zero network requests.
3. **Unauthenticated access:** Any dashboard route → `prefetchAuthenticatedUser()` → fetch returns 401 → `redirect('/login')` before any HTML is sent.
4. **Notifications:** Bell shows count → panel opens → `useNotifications()` fetches cursor pages → click marks read + navigates.
5. **Global search:** `Cmd+K` → palette opens → recent activity shown by default → typing ≥2 chars triggers debounced search → select navigates.
6. **Logout:** User menu → logout → `useLogout.mutate()` → clears cache → redirects to `/login`. Next navigation → `prefetchAuthenticatedUser()` → 401 → redirect before shell.

---

## Route Structure

```
app/
├── layout.tsx                    # Root layout — MODIFIED: reads NEXT_LOCALE cookie, dir/lang
├── (auth)/
│   └── login/
│       └── page.tsx              # /login — Gov TMS login (domain auth login-form)
├── (dashboard)/
│   ├── layout.tsx                # Authenticated shell (domain shell components)
│   ├── page.tsx                  # / (dashboard home placeholder)
│   ├── tasks/page.tsx            # /tasks — placeholder (spec 002)
│   ├── blueprints/page.tsx       # /blueprints — placeholder (spec 003)
│   ├── analytics/page.tsx        # /analytics — placeholder (spec 005)
│   ├── follow-up/page.tsx        # /follow-up — placeholder (spec 004)
│   ├── organization/page.tsx     # /organization — placeholder (spec 006)
│   └── admin/page.tsx            # /admin — placeholder (capability-gated)
├── login-block/
│   └── page.tsx                  # KEPT — login-03 block demo at `/login-block` (no conflict)
├── dashboard-block/
│   └── page.tsx                  # KEPT — dashboard-01 block demo at `/dashboard-block` (no conflict)
```
**Note:** `app/page.tsx` was removed to avoid route conflict — `app/(dashboard)/page.tsx` serves at `/` with the dashboard shell layout.
```

**Rules:** Locale is cookie-based — no `[locale]` segment. Route params use `publicId`.

---

### Authentication Architecture

Route protection uses server-side session validation against Laravel (the single source of truth), not proxy-level cookie checks:

- `proxy.ts` has no auth logic — it only sets `Cache-Control: no-store` (prevents bfcache) and security headers.
- `lib/auth/server.ts` exports `prefetchAuthenticatedUser()` — a `server-only` utility that:
  - Reads `momentum-session` from `cookies()`
  - Extracts tenant slug from `headers().get('host')`
  - Forwards `Origin`, `Cookie`, `X-Tenant`, `X-Locale` to Laravel
  - Fetches `/v1/iam/auth/me` server-side with `cache: 'no-store'` and `AbortSignal.timeout(5000)`
  - On 401: `redirect('/login')` before any HTML is sent
  - On 200: populates the TanStack Query cache via `setQueryData()`
- `app/(dashboard)/layout.tsx` calls `prefetchAuthenticatedUser()` before rendering the shell, wrapped in `HydrationBoundary`.
- `export const dynamic = 'force-dynamic'` on the layout prevents Next.js Router Cache from caching RSC payloads.
- Client-side `useCurrentUser()` returns hydrated data immediately — zero additional network requests on initial load.

## Execution Order

| Step | What | Status |
|------|------|--------|
| 1 | Create `lib/hooks/use-debounce.ts` | ✅ |
| 2 | Create `lib/utils/tenant.ts` | ✅ |
| 2b | Create `lib/utils/use-brand-name.ts` with `useBrandName()` hook | ✅ |
| 3 | Create stores: `use-locale-store`, `use-capability-store`, `use-brand-color-store` | ✅ |
| 4 | Create extra query keys: `lib/api/query-keys-extra.ts` | ✅ |
| 5 | Create hooks: `use-capabilities`, `use-notifications`, `use-search` | ✅ |
| 6 | Create shared components: `empty-state`, `error-state`, `locale-toggle`, `brand-color-toggle` | ✅ |
| 7 | Create domain components: `notification-bell`, `notification-panel`, `notification-item`, `brand-color-provider`, `locale-provider` | ✅ |
| 8 | Create `global-search` component | ✅ |
| 9 | Create `components/domain/shell/nav-main.tsx` | ✅ |
| 10 | Create `components/domain/shell/nav-user.tsx` | ✅ |
| 11 | Create `components/domain/auth/login-form.tsx` | ✅ |
| 12 | Create `components/domain/shell/app-sidebar.tsx` | ✅ |
| 13 | Create `components/domain/shell/site-header.tsx` | ✅ |
| 13b | Add Quick Create + Inbox buttons to `components/domain/shell/app-sidebar.tsx` | ✅ |
| 14 | Create `app/(auth)/login/page.tsx` | ✅ |
| 15 | Create `app/(dashboard)/layout.tsx` | ✅ |
| 16 | Create `app/(dashboard)/page.tsx` | ✅ |
| 17 | Create placeholder pages (tasks, blueprints, analytics, follow-up, org, admin) | ✅ |
| 18 | Create `proxy.ts` | ✅ |
| 19 | Update `.env.local` — remove `ENABLE_AUTH_PROXY`, keep `SESSION_COOKIE_NAME` | ✅ |
| 20 | Update `app/layout.tsx` — NEXT_LOCALE cookie, dir/lang, NextIntlClientProvider | ✅ |
| 21 | Add `messages/ar.json`, `messages/en.json` | ✅ |
| 22 | Create `i18n/request.ts` with `getRequestConfig` | ✅ |
| 23 | Wrap `next.config.ts` with `createNextIntlPlugin` | ✅ |
| 24 | Install `next-intl` package | ✅ |
| 25 | Migrate components to `useTranslations()` | ✅ |
| 26 | Update `lib/api/client.ts` — add `getLocaleSlug()` and `X-Locale` header | ✅ |
| 27 | Remove `app/page.tsx` — route conflict | ✅ |
| 28 | Add `command`, `popover`, `alert`, `spinner` components via shadcn CLI | ✅ |
| 29 | Refactor auth: create `lib/auth/server.ts`, update `proxy.ts`, update `app/(dashboard)/layout.tsx` with validation + hydration | ✅ |
| 30 | Install `server-only` package for build-time safety | ✅ |
| 31 | Update `.env.local` — remove `ENABLE_AUTH_PROXY`, `NEXT_PUBLIC_BYPASS_AUTH` | ✅ |
| 32 | Run `npm run lint && npm run typecheck && npm run test` | ✅ |
| 33 | Create component tests: `empty-state`, `notification-item`, `notification-panel`, with MSW mocks | ✅ |

---

## What to Test Manually

### Happy Paths
1. **Login (AR):** `/login` → enter credentials → submit → redirected to `/` with Arabic RTL shell.
2. **Auth redirect (guest):** Clear cookies → visit `/` → redirected to `/login` before any dashboard HTML.
3. **Auth redirect (expired):** Wait for SESSION_LIFETIME (120 min) or manually delete Redis session → visit `/` → redirected to `/login`.
4. **Navigation:** Click each sidebar item → route changes, active item highlighted.
5. **Admin nav:** Log in as tenant admin → Admin item appears; as internal user → hidden.
6. **Global search:** `Cmd+K` → palette with recent activity → type → results → click navigates.
7. **Notifications:** Bell badge increments → panel shows list → click marks read + navigates.
8. **Theme:** Toggle Light/Dark/System → UI updates.
9. **Brand color:** Select blue → primary color updates immediately and persists after reload.
10. **Locale:** Toggle AR/EN → cookie updates → page reloads with correct direction.

### States
9. **Login loading:** Submit button disabled with spinner.
10. **Login error:** Invalid credentials → inline alert (no internal details).
11. **Shell loading:** Sidebar user footer shows skeleton.
12. **Notifications empty:** Panel shows "No notifications" empty state.
13. **Notifications error:** Panel shows error state with retry.
14. **Search empty:** Unmatched query → "No results" message.
15. **Search error:** Error message with retry.

### RTL/LTR
16. **Arabic:** Sidebar on right, border on correct edge, icons flip, text aligned start.
17. **English:** Sidebar on left, icons flip back, text aligned start.

### Keyboard
18. **Skip link:** Tab from page start → skip link visible → focus moves to main content.
19. **Search shortcut:** `⌘K` / `Ctrl+K` opens palette; `Escape` closes.
20. **Focus rings:** All interactive elements show visible focus indicators.