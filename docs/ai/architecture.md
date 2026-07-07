# Architecture — Momentum Frontend

> Read when touching routing, data fetching, state management, auth, or deployment.
> Blueprint: `../_blueprints/10_API_Frontend_Architecture.md`

---

## Cross-Origin Routing (Nginx)

```
api.momentum.test/v1/*      → Laravel (../backend) API
api.momentum.test/sanctum/* → Laravel CSRF/Auth
{tenant}.momentum.test/*    → Next.js (this repo) Tenant Users (e.g. mof, moh)
admin.momentum.test/*       → Next.js (this repo) Central Platform Admins
```

CORS is required and configured on the Laravel side. All API calls use absolute URLs (`https://api.momentum.test/v1/...`) via an env-configured base URL.

---

## High-Level Structure

```
frontend/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Unauthenticated layout (login)
│   ├── (dashboard)/               # Authenticated shell (sidebar + topbar)
│   │   ├── tasks/                 # Task board (spec 003)
│   │   │   └── [publicId]/        # Task details (spec 004)
│   │   ├── blueprints/            # Blueprint library (spec 005)
│   │   │   ├── [publicId]/        # Blueprint builder (spec 005)
│   │   │   └── catalog/           # Blueprint catalog (spec 005)
│   │   ├── follow-up/             # Follow-up center (spec 007)
│   │   ├── analytics/             # Analytics (spec 009)
│   │   ├── organization/          # Org structure (spec 008)
│   │   └── admin/                 # Admin panel
│   ├── layout.tsx                 # Root layout (reads NEXT_LOCALE, fonts, providers)
│   ├── not-found.tsx
│   ├── login-block/               # shadcn login block demo (reference)
│   ├── dashboard-block/           # shadcn dashboard block demo (reference)
│   └── proxy.ts                   # Security headers + cache control
├── components/
│   ├── ui/                        # shadcn/ui primitives (CLI-managed; hand-edited for RTL: input-group, sidebar, dropdown-menu, command; empty.tsx removed — unused)
│   ├── domain/                    # Business domain components
│   │   ├── auth/                  # Login form
│   │   ├── tasks/                 # Task board, task details, board table/filters/cards (~32 files)
│   │   ├── blueprints/            # Blueprint library + builder + catalog (~25 files)
│   │   ├── shell/                 # AppSidebar, SiteHeader, nav, notifications (~8 files)
│   │   ├── search/                # Global search (command palette)
│   │   ├── follow-up/             # Follow-up board, filters, cards (~5 files)
│   │   ├── analytics/             # (not yet populated)
│   │   └── organization/          # Org chart, departments, positions (~15 files)
│   ├── shared/                    # Cross-domain reusable components (~9 files)
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx
│   │   ├── page-header.tsx
│   │   ├── locale-toggle.tsx
│   │   ├── active-badge.tsx
│   │   ├── bilingual-name-fields.tsx
│   │   ├── bilingual-description-fields.tsx
│   │   ├── rtl-select.tsx
│   │   ├── rtl-table.tsx
│   │   ├── catalog-table.tsx
│   │   ├── confirm-delete-dialog.tsx
│   │   ├── brand-color-toggle.tsx
│   │   └── copy-link-button.tsx
│   ├── providers.tsx              # Root-wide providers (QueryClient, HydrationBoundary, 401 redirect)
│   ├── locale-provider.tsx        # Zustand locale sync
│   ├── version-switcher.tsx       # Sidebar header (app name + version)
│   └── theme-toggle.tsx           # Light/Dark/System toggle
├── lib/
│   ├── api/
│   │   ├── client.ts              # Fetch wrapper (credentials, CSRF, X-Tenant, X-Locale, array params)
│   │   ├── query-keys.ts          # Centralized query key factory
│   │   ├── query-keys-extra.ts    # Extra namespaces (search, notifications)
│   │   ├── types.ts               # Shared cursor-page type (CursorPage<T>)
│   │   └── hooks/                 # TanStack Query hooks per domain
│   │       ├── use-auth.ts
│   │       ├── use-blueprints.ts
│   │       ├── use-capabilities.ts
│   │       ├── use-escalations.ts
│   │       ├── use-follow-up.ts
│   │       ├── use-notifications.ts
│   │       ├── use-organization.ts
│   │       ├── use-search.ts
│   │       ├── use-task-board.ts
│   │       ├── use-task-comments.ts
│   │       ├── use-task-create.ts
│   │       ├── use-task-detail.ts
│   │       ├── use-task-documents.ts
│   │       ├── use-tasks.ts
│   │       └── use-tenant.ts
│   ├── auth/
│   │   └── server.ts              # Server-only auth utility (prefetchAuthenticatedUser)
│   ├── generated/
│   │   └── api-types.ts           # OpenAPI → TypeScript (auto-generated, never edit)
│   ├── stores/                    # Zustand stores
│   │   ├── use-locale-store.ts
│   │   ├── use-capability-store.ts
│   │   ├── use-brand-color-store.ts
│   │   ├── use-task-display-store.ts
│   │   ├── use-blueprint-builder-store.ts
│   │   └── use-task-form-store.ts  # Multi-step task creation form state (UI-only, not API data)
│   ├── hooks/
│   ├── tenant/
│   │   └── server.ts              # Server-only tenant prefetch
│   └── utils/
│       ├── utils.ts               # cn(), etc.
│       ├── localize.ts            # localizeName, localizeTitle (shared locale-aware pickers)
│       ├── tenant.ts              # extract tenant slug from hostname
│       └── manual-assignment-utils.ts  # toApiManual() — pure utility for manual assignment conversion
├── i18n/
│   └── request.ts                 # next-intl request config (reads NEXT_LOCALE cookie)
├── hooks/
│   └── use-mobile.ts              # shadcn sidebar mobile detection
├── messages/
│   ├── ar.json
│   └── en.json
├── proxy.ts                       # Security headers + cache control (root)
├── next.config.ts                 # Wrapped with createNextIntlPlugin
├── vitest.config.ts
├── __tests__/
│   ├── setup.ts
│   ├── utils/test-utils.tsx
│   ├── mocks/
│   │   ├── server.ts
│   │   └── handlers.ts
│   └── components/
│       ├── shared/
│       │   └── empty-state.test.tsx
│       ├── domain/
│       │   ├── shell/
│       │   │   ├── notification-panel.test.tsx
│       │   │   └── notification-item.test.tsx
│       │   └── tasks/
│       │       ├── task-board.test.tsx
│       │       ├── task-board-utils.test.ts
│       │       ├── task-badges.test.tsx
│       │       ├── task-detail.test.tsx
│       │       ├── stage-timeline.test.tsx
│       │       └── recent-activity-card.test.tsx
├── docs/
│   ├── ai/
│   └── design-system/
└── specs/
    ├── 001-core-shell/
    ├── 003-task-board/
    ├── 004-task-details/
    ├── 005-blueprint-builder/
    ├── 007-follow-up-center/
    └── ...
```

---

## Request Flow

```
Browser
  → Next.js Middleware (proxy.ts: no auth logic, security headers + cache control)
  → App Router → Root Layout (reads `NEXT_LOCALE` cookie for dir/lang) → Page
  → Client Component renders with TanStack Query hooks
  → fetch('https://api.momentum.test/v1/...', { credentials: 'include' })
  → Nginx routes api.momentum.test to Laravel PHP-FPM
  → Laravel: Sanctum auth (stateful domain) → tenant context → business logic → API Resource
  → JSON response → TanStack Query cache → React re-render
```

---

## Data Layer Decision Matrix

| Concern | Tool | Why |
|---------|------|-----|
| API data (tasks, blueprints, users) | TanStack Query (`useQuery`, `useMutation`) | Caching, deduplication, background refetch |
| Paginated lists | TanStack Query (`useInfiniteQuery`) | Cursor pagination with automatic page merging |
| Auth session / current user | TanStack Query + Sanctum cookie | Cache user data, refetch on focus |
| Filter/sort state (shareable) | URL search params | Bookmarkable, back-button works |
| UI preferences (sidebar open) | Zustand | Persists across navigation, no URL noise |
| Wizard/builder local state | Zustand | Complex multi-step state too large for URL |
| Form input values | shadcn Field + InputGroup | Form layout via `FieldGroup`, `Field`, icons via `InputGroup` |
| Single-component toggle | `useState` | Simplest option for local state |

### Rules

- **Never** duplicate API data in Zustand — that's TanStack Query's job
- **Never** use `useEffect` + `fetch` for API calls — use query hooks
- **Never** use React context for frequently changing global state — use Zustand
- **Always** colocate query keys in `lib/api/query-keys.ts`
- **Store query key extensions** in `lib/api/query-keys-extra.ts` (e.g. search, notifications)
- **Always** use `useInfiniteQuery` for cursor-paginated lists, `useQuery` for bounded lists

---

## Auth Flow

1. `GET /sanctum/csrf-cookie` — Sets XSRF-TOKEN cookie
2. `POST /api/v1/iam/auth/login` — Sets HttpOnly session cookie
3. Subsequent requests include cookie automatically (`credentials: 'include'`)
4. Dashboard layout calls `prefetchAuthenticatedUser()` server-side — redirects to `/login` on 401 before shell HTML renders
5. 401 response → `QueryCache.onError` clears cache and redirects to `/login` (skips if already on `/login`)

See `security-policy.md` for full security details.

---

## OpenAPI Type Generation

- **Input:** `../backend/openapi/openapi.json`
- **Output:** `lib/generated/api-types.ts`
- **Command:** `npm run generate:api`
- **CI check:** Fail if generated types are out of date vs. `openapi.json`
- **Rule:** Never edit generated files. Never hand-write API response interfaces.

---

## i18n & RTL

- **Library:** `next-intl` v4
- **Locales:** `ar` (default), `en`
- **Routing:** Cookie-based (`NEXT_LOCALE`), URLs remain clean (e.g., `/tasks` instead of `/ar/tasks`).
- **Config:** `next.config.ts` wrapped with `createNextIntlPlugin('./i18n/request.ts')`. The request config reads `NEXT_LOCALE` cookie and returns locale + messages.
- **Translation files:** `messages/ar.json` and `messages/en.json` — dot-namespaced keys by feature (e.g. `auth.login.email`, `nav.dashboard`).
- **Server Components:** `getTranslations('namespace')` from `next-intl/server` (async).
- **Client Components:** `useTranslations('namespace')` from `next-intl` (hook).
- **Provider:** `NextIntlClientProvider` in root layout receives `locale` + `messages` from `getMessages()`.
- **Syncing:** Upon login, the user's `preferred_language` from the backend should be saved to `NEXT_LOCALE` cookie (not yet wired).
- **Locale toggle:** Sets `NEXT_LOCALE` cookie + reloads page — server re-reads cookie, renders correct messages.
- **Backend locale:** `X-Locale` header sent on every API request via `apiClient`. Backend middleware `SetLocaleFromHeader` reads it and calls `app()->setLocale()`. This localizes `__('auth.failed')`, validation errors, etc.
- **Entity data:** Backend returns bilingual fields (`name_ar`/`name_en`). The frontend picks locale-aware: `locale === 'ar' ? name_ar || name_en : name_en || name_ar`. These are NOT translated — they come from the database.
- **Hijri dates:** Display layer only (API returns Gregorian; convert via `Intl.DateTimeFormat`).
- **Typography:** Geist for English, IBM Plex Sans Arabic for Arabic (loaded via `next/font`).
- **Logical properties:** Tailwind logical (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) — see `coding-standards.md`.

---

## Dynamic Branding

- Brand color persisted in localStorage via Zustand persist (`useBrandColorStore`), default `#9A3B00`
- `BrandColorProvider` injects `--color-primary` and `--primary` CSS variables on `<html>`
- Blocking `<script>` in root layout reads localStorage before React hydrates (eliminates color flash)
- Default amber (`#9A3B00`) until user selects a different color via Preferences menu
- Future: tenant branding API will override default color per-tenant

---

## Infrastructure (MVP)

| Item | Choice |
|------|--------|
| Hosting | Same VPS as backend |
| Process | Node server behind Nginx |
| Environments | Local + Production |
| CI | GitHub Actions: lint, typecheck, build, deploy on `main` |

---

## Module Boundaries (Frontend)

| Rule | Meaning |
|------|---------|
| Domain components self-contained | `components/domain/tasks/` owns all task-related UI; `board-filters`, `board-table`, `board-task-card`, `advanced-filters-sheet` live in domain/tasks/, not shared/ |
| Shared components are generic | `components/shared/` has no domain imports (enforced; 4 task-specific components moved out to domain/tasks/) |
| UI primitives mostly untouched | `components/ui/` managed by shadcn CLI — some files hand-edited for RTL fixes: `input-group.tsx`, `sidebar.tsx`, `dropdown-menu.tsx`, `command.tsx`. Changes noted in `specs/001-core-shell/plan.md`. |
| Hooks per domain | `lib/api/hooks/use-tasks.ts` — one hook file per API domain |
| Stores are minimal | Zustand stores for UI-only state — never API data |
| Utils are pure | `lib/utils/` has no React imports, no side effects |

---

## Known Risk Areas

- **RTL regressions** on new components — test both locales on every PR
- **Stale generated types** after backend API changes — CI must catch
- **Permission UI divergence** — client capability checks drift from server ABAC
- **Blueprint builder state complexity** — use Zustand for UI/selection only (never API data); granular per-entity mutations (no batch save — backend has no batch endpoint)
- **Large bundle size** — dynamic import heavy components (charts, blueprint canvas)
- **Cursor pagination UX** — no total count available; design for "load more" not page numbers
- **ui/ hand-edits drift** — 4 shadcn files modified for RTL (`input-group.tsx`, `sidebar.tsx`, `dropdown-menu.tsx`, `command.tsx`); track changes in specs/plan.md — re-add after CLI reinstall; `empty.tsx` removed (unused — project uses shared `EmptyState`)
- **Shared components vs domain** — `board-table`, `board-filters`, `board-task-card`, `advanced-filters-sheet` live in `components/domain/tasks/` (not shared/). Follow-up reuses them via cross-domain import.

---

→ **Next:** [coding-standards.md](coding-standards.md)
