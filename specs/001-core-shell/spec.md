# Spec: Core Shell — Login, Dashboard Layout, Global Search & Notifications

> **Number:** 001
> **Date:** 2026-06-15
> **Status:** `draft`
> **Milestone:** F1 — Scaffold, Auth, Shell & Core
> **Depends on:** F0 — Scaffold & Design System
> **Backend spec:** `../backend/specs/003-iam-abac/` (auth/session), `../backend/specs/008-notifications/` (notifications center), `../backend/specs/011-search-discovery/` (global search + recent activity)
> **Contract status:** `stable` (auth uses Sanctum SPA cookies; no Bearer tokens; login response is flat `AuthTokenResource`; `X-Tenant` header required on all requests)
> **Author:** OpenCode
> **Branch:** `feat/001-core-shell`
> **Base branch:** `main`

---

## Problem

Every user of Gov TMS needs a single, consistent entry point into the platform. Today there is no shared authenticated shell: users cannot log in, navigate between modules, discover tasks through search, or see notifications alerting them to assignments, SLA breaches, or task lifecycle changes. Without this foundation, every subsequent feature (task board, blueprint builder, dashboards) has no container to render inside.

This spec delivers the "chrome" of the application: the login page, the authenticated dashboard shell (sidebar + top bar), global search, and the in-app notifications center. It is the first user-facing frontend feature and a hard dependency for every F1+ screen.

---

## Goal

Deliver the core application shell that wraps all authenticated screens:

1. **Login page** — email/password form, CSRF protection, session establishment, bilingual validation errors.
2. **Authenticated layout** — persistent sidebar navigation, sticky top bar, and scrollable main content area.
3. **Global search** — keyboard-shortcut search surface that discovers tasks via `/search` and shows recent activity.
4. **Notifications center** — bell icon with unread count, dropdown/panel listing notifications, mark-read actions.
5. **Locale & theme controls** — Arabic/English language switcher, Light/Dark/System theme toggle, and a persisted primary-brand-color picker in the top bar.

The shell must be RTL-first, responsive, accessible, and built entirely from the design system tokens and components.

---

## User Stories

### Internal User / Employee

- As an **internal user**, I want to log in with my email and password, so that I can access my organization's Gov TMS workspace.
- As an **internal user**, I want the login page to be available in Arabic and English, so that I can authenticate in my preferred language.
- As an **internal user**, I want a persistent sidebar showing the main modules, so that I can navigate between Dashboard, Tasks, Blueprints, Analytics, Follow-up, and Organization.
- As an **internal user**, I want the active module highlighted in the sidebar, so that I always know where I am.
- As an **internal user**, I want a sticky top bar with the current page title, so that context remains visible while scrolling.
- As an **internal user**, I want to search for tasks from anywhere using a keyboard shortcut, so that I can quickly find work without browsing.
- As an **internal user**, I want to see my last 20 viewed/actioned tasks, so that I can resume work quickly.
- As an **internal user**, I want a notification bell showing my unread count, so that I know when something needs my attention.
- As an **internal user**, I want to open a notifications panel and mark items as read, so that I can manage my alerts.
- As an **internal user**, I want to switch the UI language between Arabic and English, so that I can use the platform comfortably.
- As an **internal user**, I want to switch between Light, Dark, and System theme modes, so that the interface matches my environment.
- As an **internal user**, I want to choose a primary brand color (e.g., emerald, blue, purple) and have it persist for me, so that the interface feels personalized.

### Tenant Admin / Platform Admin

- As a **tenant admin**, I want admin-only navigation items to appear only when I have the relevant capability, so that the UI reflects my permissions.
- As a **platform admin**, I want to access platform-level admin surfaces from a separate route/host (`admin.momentum.test`), so that I do not confuse tenant administration with central platform administration.

### System

- As the **system**, I want unauthenticated users redirected to the login page, so that protected routes cannot be accessed without a session.
- As the **system**, I want the session cookie validated by the backend on every API call, so that expired sessions are rejected and the user is sent back to log in.
- As the **system**, I want notification counts and recent activity fetched efficiently, so that the shell remains performant.

---

## Acceptance Criteria

### Login Page

- [ ] Route `/login` renders outside the dashboard shell.
- [ ] Form fields: email, password, both required.
- [ ] Form validation uses Zod and shadcn Form; errors display inline in the active locale.
- [ ] Submitting valid credentials calls `GET /sanctum/csrf-cookie` then `POST /v1/iam/auth/login` (with `X-Tenant` header); backend uses `Auth::guard('web')->login()` to set HttpOnly session cookie.
- [ ] Login response is flat `AuthTokenResource` (`public_id`, `name_ar`, `name_en`, `email`, `account_type`) — no nested `user` wrapper, no token field.
- [ ] On success, the user's `preferred_language` (from `/me` or existing cookie) is saved to the `NEXT_LOCALE` cookie and `dir`/`lang` are updated.
- [ ] On success, the user is redirected to `/` (dashboard) — no locale prefix in URL (cookie-based routing).
- [ ] On 401/422, a user-friendly authentication error is shown (no internal details).
- [ ] Every API request includes `X-Tenant` header extracted from browser hostname subdomain.
- [ ] Loading state disables the submit button and shows a spinner.
- [ ] The page is RTL by default and flips cleanly to LTR when locale is switched.

### Authenticated Shell

- [ ] The `(dashboard)` layout renders for all authenticated routes.
- [ ] Shell structure: sidebar (`w-64`, 256px) + main area (top bar + scrollable content).
- [ ] Sidebar: tenant logo/name header, navigation items, user footer (avatar + name + position).
- [ ] Navigation items: Dashboard, Tasks, Blueprints, Analytics, Follow-up, Organization, Admin (hidden unless capability present).
- [ ] Active nav item uses the emerald accent token (`bg-emerald-600/20 text-emerald-300`).
- [ ] Inactive nav item uses slate-400 with hover state.
- [ ] Top bar: `h-16`, sticky, glass background, page title, global search trigger, theme toggle, brand color toggle, locale toggle, notification bell, user menu.
- [ ] Main content area: `bg-page-bg`, `p-6`, scrollable.
- [ ] Skip link to main content is present for keyboard users.
- [ ] Mobile (<1024px): sidebar collapses to a Sheet drawer toggled by a hamburger button.

### Global Search

- [ ] `Cmd+K` / `Ctrl+K` focuses the search input.
- [ ] Search input opens a command-palette-style dialog with placeholder text in active locale.
- [ ] Typing ≥2 characters debounces 300ms and calls `GET /v1/search`.
- [ ] Results display task title, SLA badge, department, and blueprint category.
- [ ] Selecting a result navigates to `/tasks/[publicId]`.
- [ ] Recent activity (`GET /v1/search/recent`) is shown by default when the palette opens with no query.
- [ ] Empty state shows when no results match.
- [ ] Error state shows with retry when the search API fails.

### Notifications Center

- [ ] Bell icon in the top bar shows unread count badge when `unread_count > 0`.
- [ ] Clicking the bell opens a dropdown/panel listing the most recent notifications.
- [ ] Notifications display title, body, relative timestamp, and read/unread state.
- [ ] Unread items have a visual indicator (e.g., dot or tinted background).
- [ ] Clicking a notification marks it read and navigates to the related task when applicable.
- [ ] A "Mark all as read" button clears the unread count.
- [ ] The list uses cursor pagination with a "Load more" button.
- [ ] Empty state: "No notifications" message in active locale.
- [ ] Error state: inline retry button.

### Locale & Theme

- [ ] Locale toggle switches between `ar` and `en` and updates `NEXT_LOCALE` cookie.
- [ ] Root layout re-renders with correct `dir` (`rtl`/`ltr`) and `lang`.
- [ ] Fonts switch: Alexandria for Arabic, Geist for English.
- [ ] Theme toggle supports Light / Dark / System and uses `next-themes`.
- [ ] Preference persists across sessions without using `localStorage` for auth data.

### Brand Color Preference

- [ ] A primary-brand-color picker is available in the top bar (e.g., emerald, blue, purple, teal, rose).
- [ ] The selected color persists for the current user across sessions using a Zustand store with `persist` middleware (localStorage).
- [ ] On app load, the selected color injects `--color-primary` and `--color-primary-hover` CSS variables on `:root`.
- [ ] Brand color changes apply immediately without a full page reload.
- [ ] The default color is emerald (`#10b981`).
- [ ] Login page uses the default emerald theme; brand-color preference is applied after authentication.

### Security & Permissions

- [ ] Middleware checks session cookie presence and redirects unauthenticated users to `/login`.
- [ ] Admin navigation item is hidden unless the user's capabilities include relevant admin rights.
- [ ] No PII (email, mobile, employee ID) is logged to the browser console or displayed in URLs.
- [ ] 401 responses from any API call clear the query cache and redirect to `/login`.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [ ] `useCurrentUser()` — `GET /v1/iam/auth/me`, query key `queryKeys.auth.me`, stale time 5 minutes.
- [ ] `useCapabilities(userPublicId)` — `GET /v1/iam/users/{user_public_id}/capabilities` returns `EffectiveCapabilityResource[]`, query key `queryKeys.auth.capabilities(userPublicId)`, stale time 5 minutes, enabled when `userPublicId` exists.
- [ ] `useNotifications(filters)` — `GET /v1/notifications`, query key `queryKeys.notifications.list(filters)`, cursor-paginated via `useInfiniteQuery`.
- [ ] `useNotificationsCount()` — `GET /v1/notifications/unread-count`, query key `queryKeys.notifications.unreadCount()`, refetch interval 60s.
- [ ] `useRecentActivity()` — `GET /v1/search/recent`, query key `queryKeys.search.recent()`, bounded list (max 20).
- [ ] `useSearch(query, filters)` — `GET /v1/search`, query key `queryKeys.search.list({ q, ...filters })`, enabled when `q.length >= 2`.
- [ ] No `useEffect` + `fetch`; all API calls go through TanStack Query hooks.
- [ ] Prefetch strategy: none in MVP; notification count and recent activity fetch on shell mount.

### Query Key Structure

> From `lib/api/query-keys.ts` factory:

```ts
auth: {
  me: ['auth', 'me'] as const,
  capabilities: (userPublicId: string) => ['auth', 'capabilities', userPublicId] as const,
},
notifications: {
  all: ['notifications'] as const,
  lists: () => [...queryKeys.notifications.all, 'list'] as const,
  list: (filters: NotificationFilters) => [...queryKeys.notifications.lists(), filters] as const,
  unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
},
search: {
  all: ['search'] as const,
  recent: () => [...queryKeys.search.all, 'recent'] as const,
  list: (params: SearchParams) => [...queryKeys.search.all, 'list', params] as const,
},
```

### State Management

- [ ] **TanStack Query:** all API-derived state (user, capabilities, notifications, recent activity, search results).
- [ ] **URL state:** none for the shell itself; search query lives in the search dialog's local state until submitted.
- [ ] **Zustand:**
  - `useSidebarStore` — mobile sidebar open/closed.
  - `useThemeStore` — theme mode preference (Light/Dark/System) persisted per visitor via `next-themes`.
  - `useBrandColorStore` — primary brand color (emerald, blue, purple, teal, rose) persisted per visitor via Zustand `persist` middleware.
  - `useLocaleStore` — current locale, synced with `NEXT_LOCALE` cookie.
  - `useCapabilityStore` — flat array of capability strings from `useCapabilities()`, used by `useCapability()` hook.
- [ ] **Local component state:** search input value, notification panel open/closed, command palette open/closed.
- [ ] No API data duplicated in Zustand.

### Mutations

- [ ] `useLogin()` — fetches CSRF cookie first (`GET /sanctum/csrf-cookie`), then `POST /v1/iam/auth/login`; on success invalidates `queryKeys.auth.me` and redirects. No token is saved on the client.
- [ ] `useLogout()` — `POST /v1/iam/auth/logout`; on success clears TanStack Query cache and redirects to `/login`.
- [ ] `useMarkNotificationRead()` — `POST /v1/notifications/{notification}/read`; on success invalidates `queryKeys.notifications.unreadCount()` and the active notification list.
- [ ] `useMarkAllNotificationsRead()` — `POST /v1/notifications/read-all`; same invalidation as above.
- [ ] No optimistic updates for notifications in MVP (simple invalidation is sufficient).

### Error Handling

- [ ] Global query client config: do not retry 401s; redirect to `/login` and clear cache.
- [ ] 403: show inline "no permission" state or hide the action (do not block navigation client-side).
- [ ] 500 / network error: inline error state with retry button.
- [ ] Login form: validation errors inline; authentication failure shown as a non-dismissible alert.
- [ ] `ApiRequestError` class handles structured backend errors per `coding-standards.md`.

---

## UI Requirements

> Reference: `docs/design-system/` (01-tokens.md, 02-glassmorphism.md, 03-components.md, 04-layout-patterns.md, 05-accessibility.md, 06-anti-patterns.md)

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `LoginPage` | Server | Page | `app/(auth)/login/page.tsx` |
| `LoginForm` | Client | Component | `components/domain/auth/login-form.tsx` |
| `DashboardLayout` | Server | Layout | `app/(dashboard)/layout.tsx` — shell wrapper |
| `Sidebar` | Client | Domain | `components/domain/shell/sidebar.tsx` — nav + user footer |
| `SidebarNavItem` | Client | Domain | individual nav link with active state |
| `TopBar` | Client | Domain | `components/domain/shell/top-bar.tsx` — title, search, actions |
| `GlobalSearch` | Client | Domain | command palette using shadcn Command |
| `NotificationBell` | Client | Domain | bell + unread count badge |
| `NotificationPanel` | Client | Domain | dropdown/panel listing notifications |
| `NotificationItem` | Client | Domain | single notification row |
| `LocaleToggle` | Client | Shared | AR/EN switcher |
| `ThemeToggle` | Client | Shared | Light/Dark/System switcher |
| `BrandColorToggle` | Client | Shared | primary brand color picker |
| `BrandColorProvider` | Client | Domain | injects `--color-primary` from `useBrandColorStore` |
| `UserMenu` | Client | Domain | avatar + name + logout |
| `PageHeader` | Client | Shared | title + optional actions |
| `EmptyState` | Client | Shared | icon + headline + CTA |
| `ErrorState` | Client | Shared | message + retry |
| `Button`, `Input`, `Form`, `Badge`, `Sheet`, `Command`, `DropdownMenu`, `Avatar`, `Skeleton` | Client | shadcn | base primitives |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading (user) | `TopBar` / `Sidebar` user footer | Avatar skeleton + name skeleton |
| Loading (notifications count) | `NotificationBell` | Hide badge until count arrives |
| Loading (search) | `GlobalSearch` | Inline spinner in command input |
| Loading (notification list) | `NotificationPanel` | 5 skeleton rows matching notification item shape |
| Empty (notifications) | `NotificationPanel` | `EmptyState` with `Bell` icon |
| Empty (search) | `GlobalSearch` | "No results" message in active locale |
| Empty (recent activity) | `GlobalSearch` | "No recent activity" message |
| Error (any shell data) | `ErrorState` | Alert + retry button; 401 redirects to login |
| Success | Real shell content | Data rendered |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Sidebar hidden; hamburger toggles Sheet drawer; top bar compact; search icon opens full-width palette |
| Tablet (640-1023px) | Sidebar hidden by default; optional collapse toggle; command palette narrower |
| Desktop (≥1024px) | Sidebar fixed visible; full top bar with all controls; command palette centered modal |

### RTL Considerations

- [ ] All layout uses logical properties: `ms-` / `me-`, `ps-` / `pe-`, `text-start` / `text-end`, `border-s` / `border-e`.
- [ ] Sidebar uses `border-e border-white/5`; in RTL the border appears on the left edge of the sidebar.
- [ ] Directional icons flip with `rtl:rotate-180`: chevrons, arrows, logout/log-in icons.
- [ ] Command palette and dropdowns align to the logical start/end of their triggers.
- [ ] Page title and text align `text-start`; numeric counters align `text-end`.
- [ ] Breadcrumb separator icon flips in RTL.

### Accessibility

- [ ] Skip link to `#main-content` is the first focusable element in the dashboard layout.
- [ ] All interactive elements show visible focus rings (`focus-visible:ring-2`).
- [ ] Icon-only buttons have `aria-label` in the active locale.
- [ ] Sidebar navigation uses `<nav aria-label="...">` and `aria-current="page"` for the active route.
- [ ] Notification bell announces count changes via `aria-live="polite"`.
- [ ] Search palette traps focus and closes on `Escape`.
- [ ] Notification panel closes on `Escape` and returns focus to the bell.
- [ ] Form fields have associated `<label>`; errors linked via `aria-describedby`.
- [ ] Touch targets ≥ 44px on mobile.
- [ ] `prefers-reduced-motion` disables hover lifts and skeleton pulse.

### Animation

- [ ] Card/surface hover: `transition-all duration-200`.
- [ ] Button press: `active:scale-[0.98]`.
- [ ] Mobile sidebar sheet: slide-in from start edge.
- [ ] Command palette: `animate-in fade-in` overlay + `animate-in zoom-in-95` content.
- [ ] Notification panel: `animate-in slide-in-from-top-2`.
- [ ] Unread dot: subtle pulse when count increases.
- [ ] Respect `prefers-reduced-motion` for all animations.

---

## Non-Functional Requirements

### Performance

- [ ] Heavy search palette component lazy-loaded with `next/dynamic`.
- [ ] Notification count polled at 60s intervals; no real-time websocket in MVP.
- [ ] `next/image` used for user avatar.
- [ ] Brand color injection reads from localStorage via Zustand `persist`; no API call required.
- [ ] Limit concurrent glass surfaces in the shell to the sidebar + top bar only.

### Security

- [ ] No auth tokens in `localStorage`/`sessionStorage`; rely on HttpOnly session cookie + Sanctum.
- [ ] CSRF token fetched before login and included on mutating requests.
- [ ] Tenant resolution via `X-Tenant` header on every request, extracted from browser hostname subdomain (`{tenant}.momentum.test` → send `mof` as `X-Tenant`). Falls back to `NEXT_PUBLIC_DEFAULT_TENANT` env var in development.
- [ ] Capability checks hide admin nav item; server enforces 403 regardless.
- [ ] No PII in URLs or console logs.

---

## Out of Scope

- Task board, task details, blueprint builder, analytics dashboards, follow-up center, organization admin — each has its own frontend spec.
- Platform admin UI for central tenant management (lives on `admin.momentum.test`, separate from tenant shell).
- User profile / account settings page (feature #004 user-settings-delegation).
- Real-time websocket push for notifications.
- Email notification preferences (per-user channel settings).
- Help center / onboarding walkthrough.
- Platform admin impersonation UI — uses Bearer tokens and lives on `admin.momentum.test`; deferred to platform admin spec.
- Hijri date display within the shell itself (Hijri conversion utilities are established but not required for shell chrome).

---

## Open Questions — Resolved

- [x] **Auth mechanism:** Use Sanctum SPA cookies. `GET /sanctum/csrf-cookie` → `POST /v1/iam/auth/login` sets HttpOnly session cookie. Frontend stores no token. `AuthTokenResource` and spec 003 token wording are outdated.
- [x] **Tenant resolution:** Frontend extracts tenant slug from `window.location.hostname` subdomain and sends it as `X-Tenant` header on every API request. Backend middleware (`InitializeTenancyByHeader`) resolves and initializes tenant DB connection.
- [x] **Notifications frontend pairing:** `001-core-shell` is the authoritative frontend spec for the notifications center UI.
- [x] **Global search endpoint:** Use unified `GET /v1/search` for the command palette.
- [x] **Theme & brand color:** Theme mode (Light/Dark/System) and primary brand color are both per-visitor preferences persisted locally; they are independent of tenant settings.
- [x] **Capability list source:** Fetch capabilities from `GET /v1/iam/users/{user_public_id}/capabilities` after `useCurrentUser()` returns; populate `useCapabilityStore`.
- [x] **Impersonation flow:** Platform admin impersonation uses `Authorization: Bearer` 1hr tokens, but the UI is out of scope for F1 / core shell.
- [x] **Brand color palette:** The allowed set of primary brand colors is confirmed: emerald (default), blue, purple, teal, rose.
- [x] **Per-account vs. per-browser persistence:** Persistence will remain strictly per-browser via localStorage for MVP. A backend user-preference API is deferred to `004-user-settings-delegation`.
---

→ **Next:** Read `docs/ai/coding-standards.md` before creating `plan.md`.