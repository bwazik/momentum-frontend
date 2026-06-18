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
├── app/                        # Next.js App Router
│   ├── (auth)/             # Unauthenticated layout (login)
│   ├── (dashboard)/        # Authenticated shell (sidebar + topbar)
│   ├── layout.tsx          # Root layout (reads NEXT_LOCALE cookie for dir/lang)
│   ├── not-found.tsx
│   ├── login-block/        # shadcn login block demo (reference)
│   └── dashboard-block/    # shadcn dashboard block demo (reference)
├── components/
│   ├── ui/                     # shadcn/ui primitives (CLI-managed)
│   ├── domain/                 # Business domain components
│   │   ├── tasks/
│   │   ├── blueprints/
│   │   ├── follow-up/
│   │   ├── analytics/
│   │   └── organization/
│   └── shared/                 # Cross-domain reusable components
├── lib/
│   ├── api/
│   │   ├── client.ts           # Fetch wrapper (credentials, CSRF, errors)
│   │   ├── query-keys.ts       # Centralized query key factory
│   │   └── hooks/              # TanStack Query hooks per domain
│   ├── generated/
│   │   └── api-types.ts        # OpenAPI → TypeScript (auto-generated)
│   ├── stores/                 # Zustand stores
│   └── utils/                  # Pure utility functions
├── docs/
│   ├── ai/                     # AI agent documentation (this folder)
│   └── design-system/          # Design system documentation
└── specs/                      # Frontend feature specs
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
| Domain components self-contained | `components/domain/tasks/` owns all task-related UI |
| Shared components are generic | `components/shared/` has no domain imports |
| UI primitives mostly untouched | `components/ui/` managed by shadcn CLI — some files hand-edited for RTL fixes: `input-group.tsx`, `sidebar.tsx`, `dropdown-menu.tsx`, `command.tsx`. Changes noted in `specs/001-core-shell/plan.md`. |
| Hooks per domain | `lib/api/hooks/use-tasks.ts` — one hook file per API domain |
| Stores are minimal | Zustand stores for UI-only state — never API data |
| Utils are pure | `lib/utils/` has no React imports, no side effects |

---

## Known Risk Areas

- **RTL regressions** on new components — test both locales on every PR
- **Stale generated types** after backend API changes — CI must catch
- **Permission UI divergence** — client capability checks drift from server ABAC
- **Blueprint builder state complexity** — use Zustand, save in one API call
- **Large bundle size** — dynamic import heavy components (charts, blueprint canvas)
- **Cursor pagination UX** — no total count available; design for "load more" not page numbers

---

→ **Next:** [coding-standards.md](coding-standards.md)
