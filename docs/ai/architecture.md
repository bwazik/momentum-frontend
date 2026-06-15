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
│   ├── [locale]/               # ar | en
│   │   ├── (auth)/             # Unauthenticated layouts (login)
│   │   ├── (dashboard)/        # Authenticated shell (sidebar + topbar)
│   │   └── layout.tsx          # Root locale layout (dir, lang, fonts)
│   ├── layout.tsx              # Root layout
│   └── not-found.tsx
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
  → Next.js Middleware (locale redirect, session cookie check)
  → App Router → Layout → Page (Server Component)
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
| Form input values | React Hook Form | Validation, dirty tracking, controlled fields |
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
4. Next.js middleware checks session cookie presence for protected routes
5. 401 response → clear query cache → redirect to login

See `security-policy.md` for full security details.

---

## OpenAPI Type Generation

- **Input:** `../backend/openapi/openapi.json`
- **Output:** `lib/generated/api-types.ts`
- **Command:** `npm run generate:api` (script TBD at scaffold)
- **CI check:** Fail if generated types are out of date vs. `openapi.json`
- **Rule:** Never edit generated files. Never hand-write API response interfaces.

---

## i18n & RTL

- **Locales:** `ar` (default), `en`
- **Routing:** `app/[locale]/` dynamic segment
- **Document direction:** `<html dir="rtl" lang="ar">` or `dir="ltr" lang="en"`
- **Layout properties:** Tailwind logical (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) — see `coding-standards.md`
- **Hijri dates:** Display layer only (API returns Gregorian; convert via `Intl.DateTimeFormat`)
- **Typography:** Inter font via `next/font` (supports Arabic glyphs; fallback to Noto Sans Arabic if needed)

---

## Dynamic Branding

- Fetch `/api/v1/tenant/branding` on load (when backend ready)
- Inject CSS variables for `--color-primary` from tenant settings
- Logo from object storage URL
- Default to emerald theme until branding API available

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
| UI primitives untouched | `components/ui/` managed by shadcn CLI — do not hand-edit |
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
