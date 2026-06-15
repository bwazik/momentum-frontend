# Implementation Roadmap — Momentum Frontend

> Frontend execution plan. Spec IDs align with `../backend/docs/ai/roadmap.md` where paired.

---

## Current Focus

**Phase:** F0 — Scaffold & design system (no application code yet)
**Active spec:** none (waiting for Next.js scaffold)
**Next planned:** `009-system-administration` after backend `001` + `003` APIs stable

---

## Milestone Overview

| # | Name | Status | Requires Backend |
|---|------|--------|------------------|
| F0 | Scaffold & design system | ⬜ Not Started | — |
| F1 | App shell, auth, i18n/RTL | ⬜ Not Started | M2 backend (IAM) |
| F2 | Task board & task details | ⬜ Not Started | M4 backend |
| F3 | Blueprint builder | ⬜ Not Started | M3 backend |
| F4 | Follow-up & workflow viz | ⬜ Not Started | M4–M5 backend |
| F5 | Dashboards & analytics | ⬜ Not Started | M6 backend |
| F6 | Admin, org, help, onboarding | ⬜ Not Started | M1–M2, M7 backend |

**Legend:** ✅ Done · 🔄 In Progress · ⬜ Not Started · 🚧 Blocked

---

## Frontend Spec Catalog

| Spec | Requires backend specs | Status |
|------|------------------------|--------|
| `001-executive-dashboard` | `009-analytics-reporting` | ⬜ |
| `002-task-board` | `005-task-execution` | ⬜ |
| `003-task-details` | `005`, `006`, `012`, `013` | ⬜ |
| `004-blueprint-builder` | `004-blueprint-engine` | ⬜ |
| `005-workflow-visualization` | `006-stage-lifecycle` | ⬜ |
| `006-follow-up-center` | `007`, `010-follow-up-board` | ⬜ |
| `007-organization-structure` | `002-organization-structure` | ⬜ |
| `008-analytics-reporting` | `009-analytics-reporting` | ⬜ |
| `009-system-administration` | `001`, `003`, `015` | ⬜ |
| `010-help-center` | `020-help-center` | ⬜ |
| `011-department-manager-dashboard` | `009-analytics-reporting` | ⬜ |
| `012-pending-approvals` | `006-stage-lifecycle` | ⬜ |
| `013-team-capacity-workload` | `009` (V2 workload) | ⬜ Deferred V2 |
| `014-staff-performance-hub` | `009` (V2) | ⬜ Deferred V2 |
| `015-decisions-registry` | TBD | ⬜ Deferred |
| `016-department-memos` | TBD | ⬜ Deferred |

Note: Spec IDs are frontend-specific. Cross-reference backend roadmap for API dependencies.

---

## F0 — Scaffold & Design System

**Status:** ⬜ Not Started

**Tasks:**
- `create-next-app` with TypeScript, Tailwind v4, App Router
- shadcn/ui init
- TanStack Query + Zustand setup
- OpenAPI typegen script (pointing to `../backend/openapi/openapi.json`)
- Locale routing (`ar`/`en`) + RTL shell
- Implement design tokens from `docs/design-system/01-tokens.md`
- Liquid glass effects from `docs/design-system/02-glassmorphism.md`
- Dashboard shell layout (sidebar + topbar)

**Established patterns:** (none yet — update when F0 complete)

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
