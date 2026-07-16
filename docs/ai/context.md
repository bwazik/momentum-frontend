# Project Context — Momentum Frontend (Gov TMS)

> Read every session. Dense project truth for the Next.js SPA workspace.
> Blueprints: `../_blueprints/` · API contract: `../backend/openapi/openapi.json`
> Do NOT put secrets here.

| Asset | Location |
|-------|----------|
| API Contract | `../backend/openapi/openapi.json` |
| Backend Roadmap | `../backend/docs/ai/roadmap.md` |

---

## Required Reading Chain

Every agent working on this codebase **must** read these files in order before writing any code:

1. **`docs/ai/context.md`** — You are here. Project identity and critical rules.
2. **`docs/ai/roadmap.md`** — Milestone status, active spec, established patterns.
3. **`docs/ai/architecture.md`** — File structure, routing, data fetching, state management.
4. **`docs/ai/coding-standards.md`** — Component patterns, query hooks, forms, i18n, performance. **Must read before ANY implementation.**
5. **`docs/ai/security-policy.md`** — Auth flow, permission UI, PII, XSS, CSP. Must read when touching auth, permissions, or sensitive data display.
6. **`docs/ai/testing-policy.md`** — Test structure, component testing, MSW, assertion patterns.
7. **`docs/ai/release-policy.md`** — Deployment, type generation, CI, coordination with backend.
8. **`docs/ai/glossary.md`** — Domain terms, UI terms, naming conventions.
9. **`docs/ai/spec-creation-guide.md`** — Prompt templates for creating frontend specs and plans.

**Rule:** If you are writing code, you MUST have read `coding-standards.md` and `security-policy.md`. No exceptions.

---

## What Is This Project?

**Gov TMS (Momentum)** frontend — a bilingual (Arabic/English) task lifecycle management UI for government and enterprise organizations. Users track work through **Blueprints**, **Tasks**, and **Stages** with SLA health indicators, follow-up boards, and executive dashboards.

This repo is **Next.js only**. Laravel API lives in `../backend/`.

---

## Project Type

- [x] Frontend SPA (Next.js App Router)
- [x] Paired with separate backend polyrepo

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Server state | TanStack Query (React Query) |
| Client state | Zustand |
| API types | Generated from OpenAPI (`../backend/openapi/openapi.json`) |
| Auth | Sanctum SPA cookies (same-origin) |
| Forms | shadcn Field + InputGroup (nova) |
| CI/CD | GitHub Actions → VPS on merge to `main` |
| i18n | next-intl v4 (messages/{locale}.json), cookie-based locale, X-Locale header for backend |

---



Design system: `docs/design-system/`.

---

## Critical Rules

1. **Backend leads** — Implement against `stable` OpenAPI contracts; mock until ready
2. **Cross-origin** — API is at `api.momentum.test/v1`; frontend configures base URL and includes credentials
3. **No localStorage auth** — Sanctum HttpOnly cookies only
4. **Generated types** — Regenerate when `openapi.json` changes; never duplicate DTOs by hand
5. **RTL primary** — Arabic is default; layout must flip correctly using logical properties
6. **SLA colors** — emerald=on track, amber=at risk, red=overdue, slate/grey=suspended
7. **public_id in URLs** — Route params use task/entity `public_id`, not internal ids
8. **Permission UI** — Hide/disable actions user likely cannot perform; server returns 403 regardless
9. **All 4 states** — Every data-fetching component must handle loading, error, empty, and success
10. **Out of scope** — No DMS UI, correspondence registry, G2G, e-signatures

---

## MVP Scope

UI for ~178 MVP features (see `_blueprints/02_Feature_Inventory.md`). V2/V3 screens deferred unless spec pulls forward.

Frontend specs are domain-level (~16), aligned with backend spec IDs where applicable.

---

## Current Focus

**Milestone F0 — Scaffold & Design System: ✅ Done**

**Milestone F1 — App Shell, Auth, i18n/RTL: ✅ Done**
- ✅ `001-core-shell` — Login, dashboard shell, sidebar, global search, notifications, i18n, RTL, brand theming

**Milestone F2 — Task Board & Task Details: ✅ Done**
- ✅ `003-task-board` — Cursor-paginated enterprise table, SLA row accents, URL-driven filters, 4 states
- ✅ `004-task-details` — Stage timeline, sub-stage checklist, SLA countdown, stage lifecycle actions, recent activity
- ✅ `016-task-creation-launch` — Multi-step creation form, manual assignment, draft/edit/launch flow
- ✅ `023-task-comments` — Comment UI, reply, threading, composer, 4 states, cursor pagination
- ✅ `024-task-documents` — Document attachment UI, upload with Attachment states, version history, preview, download
- ✅ `025-external-references` — External reference UI, entity catalog, board filter, global search by reference

**Milestone F3 — Blueprint Builder: ✅ Done**
- ✅ `005-blueprint-builder` — Visual stage canvas, properties panel, sub-stage CRUD, transitions, lock/read-only

**Milestone F4 — Follow-up & Workflow Viz: ✅ Done**
- ✅ `006-workflow-visualization` — Workflow graph, stage nodes, advance/return arrows, timeline bar
- ✅ `007-follow-up-center` — Board, overdue/at-risk panels, bottlenecks, escalations, action log

**Milestone F5 — Dashboards & Analytics: ✅ Done**
- ✅ `002-executive-dashboard` — KPI stat cards, department health panel, bottleneck ranking, drill-down routes, shared StatCard
- ✅ `009-analytics-reporting` — Task aging report, read-only filterable table, capability-gated sidebar, breadcrumb
- ✅ `012-department-manager-dashboard` — Department KPI stat cards, team workload panel, cursor-paginated drill-down, department selector

**Milestone F6 — Admin, Org, Help, Onboarding: 🔄 In Progress**
- ✅ `008-organization-structure` — Org chart, department/position/grade CRUD, working calendars, holidays
- ⬜ `010-system-administration` — Tenant admin screens (requires `015-audit-trail` — ✅ Done on backend)
- ⬜ `011-help-center` — Help center CMS (requires `020-help-center` — ✅ Done on backend)
- ✅ `017-user-settings-delegation` — Profile editing, out-of-office toggle, delegation management, settings page with capability-gated tabs
- ⬜ `019-confidential-access` — Confidential task access (requires `017-confidentiality-access` — ✅ Done on backend)
- ✅ `020-localization-calendar` — Hijri date picker, dual date display, calendar system filter, department calendar assignment
- ⬜ `021-onboarding-training` — Onboarding module (requires `019-onboarding-training` — ✅ Done on backend)
- ⬜ `022-platform-administration` — Platform tenant management (requires `001-platform-tenancy/admin` — ✅ Done on backend)

---

## What To Avoid

- Hand-written API response interfaces — use generated types
- Business logic duplication (SLA calculation, ABAC decisions) — server is truth
- Hardcoded English-only strings in user-facing components
- Ignoring RTL when adding new layouts — use logical Tailwind properties
- Physical direction classes (`ml-`, `mr-`, `pl-`, `pr-`) — use `ms-`, `me-`, `ps-`, `pe-`
- Fetching from wrong origin (CORS workarounds — fix routing instead)
- `console.log` in committed code
- Components without loading/empty/error states
- `any` type annotations

---

→ **Next:** [roadmap.md](roadmap.md)
