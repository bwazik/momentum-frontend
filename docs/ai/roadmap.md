# Implementation Roadmap — Momentum Frontend

> Frontend execution plan. Spec IDs align with `../backend/docs/ai/roadmap.md` where paired.

---

## Current Focus

**Phase:** F2 — Task board & task details (in progress)
**Active spec:** `003-task-board`

---

## Milestone Overview

| # | Name | Status | Requires Backend |
|-------|------|--------|------------------|
| F0 | Scaffold & design system | ✅ Done | — |
| F1 | App shell, auth, i18n/RTL | ✅ Done | M2 backend (IAM) |
| F2 | Task board & task details | 🔄 In Progress | M4 backend |
| F3 | Blueprint builder | ⬜ Not Started | M3 backend |
| F4 | Follow-up & workflow viz | ⬜ Not Started | M4–M5 backend |
| F5 | Dashboards & analytics | ⬜ Not Started | M6 backend |
| F6 | Admin, org, help, onboarding | ⬜ Not Started | M1–M2, M7 backend |

**Legend:** ✅ Done · 🔄 In Progress · ⬜ Not Started · 🚧 Blocked

---

## Frontend Spec Catalog

| Spec | Milestone | Domain | Requires backend specs | Status |
|------|-----------|--------|------------------------|--------|
| `001-core-shell` | F1 | Core | `003-iam-abac`, `008-notifications`, `011-search-discovery` | ✅ |
| `002-executive-dashboard` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `003-task-board` | F2 | Tasks | `005-task-execution`, `014` | ⬜ |
| `004-task-details` | F2 | Tasks | `005`, `006`, `012`, `013` | ⬜ |
| `005-blueprint-builder` | F3 | Blueprints | `004-blueprint-engine` | ⬜ |
| `006-workflow-visualization` | F4 | Workflow | `006-stage-lifecycle` | ⬜ |
| `007-follow-up-center` | F4 | Follow-up | `007`, `010-follow-up-board` | ⬜ |
| `008-organization-structure` | F6 | Organization | `002-organization-structure` | ⬜ |
| `009-analytics-reporting` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `010-system-administration` | F6 | Platform | `001`, `003`, `015` | ⬜ |
| `011-help-center` | F6 | Support | `020-help-center` | ⬜ |
| `012-department-manager-dashboard` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `013-pending-approvals` | F2 | Tasks | `006-stage-lifecycle` | ⬜ |
| `014-team-capacity-workload` | V2 | Analytics | `009` (V2 workload) | ⬜ Deferred V2 |
| `015-staff-performance-hub` | V2 | Analytics | `009` (V2) | ⬜ Deferred V2 |
| `016-notifications-search` | F1 | Core | `008`, `011` | ✅ (merged into `001`) |
| `017-user-settings-delegation` | F6 | Settings | `016` | ⬜ |

Note: Spec IDs are frontend-specific. Cross-reference backend roadmap for API dependencies. `015` and `016` were removed as orphaned specs with no backend counterpart.

---

## F0 — Scaffold & Design System

**Status:** ✅ Done

**Completed:**
- `create-next-app` with TypeScript, Tailwind v4, App Router ✅
- shadcn/ui init ✅
- shadcn preset applied (amber theme) ✅
- TanStack Query + Zustand installed ✅
- Dashboard + login pages scaffolded ✅
- Design tokens documented (amber theme) ✅
- Test skeleton (vitest, MSW, testing-library) ✅
- API client + query keys + hooks + stores ✅
- OpenAPI typegen script added ✅
- Cookie-based locale routing (`NEXT_LOCALE`) + RTL shell ✅
- IBM Plex Sans Arabic font loading ✅
- Middleware for route protection (proxy.ts security headers) ✅
- CSP headers for production (pending deployment config) ⬜

---

## F1 — App Shell, Auth, i18n/RTL

**Status:** ✅ Done

**Active spec:** `001-core-shell`

**Completed:**
- Login page with Sanctum SPA cookie auth ✅
- Dashboard shell (sidebar + top bar + main content) ✅
- RTL-first layout with logical CSS properties ✅
- Global search (Cmd+K command palette) ✅
- Notifications center (bell + panel + mark-read) ✅
- Locale toggle (Arabic/English, cookie-based) ✅
- Theme toggle (Light/Dark/System) in user menu ✅
- Brand color picker (amber/blue/emerald/rose/slate) in user menu ✅
- OpenAPI type integration ✅
- TanStack Query + Zustand patterns established ✅
- i18n via next-intl v4 with `messages/{locale}.json` ✅

**Established by 001:**
- **Login:** Sanctum SPA cookies, CSRF-first, `getCsrfCookie()` before `POST /login`, flat `AuthTokenResource` response
- **Auth guard:** Server-side `prefetchAuthenticatedUser()` in dashboard layout — 401 redirects before shell HTML renders; client-side `QueryCache.onError` handles mid-session expiry
- **Tenant resolution:** `X-Tenant` header from hostname subdomain on every API request via `apiClient`
- **Locale:** `NEXT_LOCALE` cookie read server-side in root layout; `X-Locale` header on every API request; `next-intl` `useTranslations()` / `getTranslations()` for UI strings; bilingual entity fields (`name_ar`/`name_en`) picked by locale
- **RTL:** Logical properties (`ms-`/`me-`, `ps-`/`pe-`, `text-start`/`text-end`) mandatory; directional icons flip with `rtl:rotate-180`; shadcn `Sidebar` passes `side` based on locale
- **Sidebar:** shadcn `SidebarProvider` + `AppSidebar` + `SidebarInset`; nav items with `usePathname()` active highlighting + primary color accent; Quick Create + Inbox buttons; user footer with dropdown (preferences + logout)
- **Global search:** cmdk `CommandDialog` with debounced server-side search; `shouldFilter={false}` to avoid client-side filtering conflict; `next/dynamic` lazy-load
- **Notifications:** Cursor-paginated list; `NotificationResource` shape (`data.title_ar`/`data.title_en`, `data.body_ar`/`data.body_en`); unread dot indicator; mark-read on click
- **Brand color:** Zustand `persist` middleware saving to localStorage; `BrandColorProvider` injects `--color-primary` via inline style; palette: amber (default), blue, emerald, rose, slate
- **403 handling:** Capability-gated nav items (hide/disable); server is source of truth
- **Error states:** All data-fetching components handle loading (skeleton), error (retry button), empty (icon + message), success

---

## Dependency Map

```
F0: Scaffold & Design System
  └── Design tokens, shell layout, API client ────────────────┐
                                                               ↓
F1: App Shell, Auth, i18n/RTL ──────────────────────────────────┐
  └── Login flow, route protection, locale routing             │
                                                               ↓
F2: Task Board & Task Details ─────────────────────────────────┤
  └── Data table, task card, stage timeline                    │
                                                               ↓
F3: Blueprint Builder ──────────────────────────────────────────┤
  └── Visual editor, stage nodes, transition arrows            │
                                                               ↓
F4: Follow-up & Workflow Viz ───────────────────────────────────┤
  └── Follow-up board, action log, workflow diagram            │
                                                               ↓
F5: Dashboards & Analytics ─────────────────────────────────────┤
  └── Stat cards, charts, department health                    │
                                                               ↓
F6: Admin, Org, Help, Onboarding ───────────────────────────────
```

---

## Rules for the AI Agent

- Never implement ⬜ specs without explicit instruction
- Do not implement F1+ until F0 complete
- Do not implement a frontend spec until all `Requires backend specs` are `Contract status: stable`
- Mocks allowed on feature branches with `// MOCK` comments
- Update this file when specs move to 🔄 or ✅
- When a milestone completes, extract **Established Patterns** from completed specs into the milestone section (mirrors backend's `Established by NNN` format)

---

→ **Next:** [architecture.md](architecture.md)
