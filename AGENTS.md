<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Instructions — Momentum Frontend (Gov TMS)

Next.js SPA workspace. **Before writing any code, follow the reading rules below.**

---

## Business Truth (Shared)

- `../_blueprints/` — business requirements
- `../backend/openapi/openapi.json` — API contract for TypeScript types
- `../backend/specs/` — backend spec & plan files (accessible for reference)

---

## Required Reading Chain

Read these files **in order** at the start of every session:

| # | File | Purpose |
|---|------|---------|
| 1 | `docs/ai/context.md` | Project identity, tech stack, critical rules |
| 2 | `docs/ai/roadmap.md` | Milestones, active spec, established patterns |
| 3 | `docs/ai/architecture.md` | File structure, routing, data fetching, state management |
| 4 | `docs/ai/coding-standards.md` | **NON-NEGOTIABLE.** Component patterns, queries, forms, i18n, performance |
| 5 | `docs/ai/security-policy.md` | Auth flow, permission UI, PII, XSS, CSP |
| 6 | `docs/ai/testing-policy.md` | Vitest, Testing Library, MSW, assertion patterns |
| 7 | `docs/ai/release-policy.md` | Deployment, type generation, CI, backend coordination |
| 8 | `docs/ai/glossary.md` | Domain terms, UI terms, naming conventions |
| 9 | `docs/ai/spec-creation-guide.md` | Prompt templates for creating specs and plans |

**If you are writing code, you MUST have read `coding-standards.md`. No exceptions.**

---

## Working on a Feature

1. Read `specs/{number}-{name}/spec.md` and `plan.md`
2. Check `Requires backend specs:` — backend API must be `Contract status: stable` unless using mocks
3. Read the relevant backend spec at `../backend/specs/{number}-{name}/` for API contract details

---

## Read Conditionally

| Task involves... | Read |
|------------------|------|
| Any UI work | `design-system/README.md` (index + reading order) |
| Colors, spacing, motion | `design-system/01-tokens.md` |
| Cards, surfaces, overlays | `design-system/02-glassmorphism.md` |
| Components, badges, tables | `design-system/03-components.md` |
| Page layout, grids, RTL | `design-system/04-layout-patterns.md` |
| Interactive elements, forms | `design-system/05-accessibility.md` |
| Adding or using a shadcn component | Run `npx shadcn@latest docs <component>` first — don't guess the API |
| Code review, before PR | `design-system/06-anti-patterns.md` |

---

## API & State

- TanStack Query for server state
- Zustand for client/global UI state
- Types from generated OpenAPI client — not hand-written API types
- Sanctum SPA cookies (same-origin)

---

## Branch Rules

- `feat/{number}-{name}` from `main`
- Match backend spec ID when paired

---

## Rules

- Smallest safe change
- shadcn/ui + Tailwind CSS v4 — before adding or using any component, read `docs/design-system/03-components.md` and run `npx shadcn@latest docs <component>` first — don't guess the API
- RTL-first for Arabic (logical properties: `ms-`, `me-`, `ps-`, `pe-`)
- No client-side authority enforcement — server is source of truth
- Mocks allowed until backend contract stable (mark with `// MOCK`)
- All 4 states: loading (skeleton), error, empty, success
- No `any` type — use generated types or `unknown`
- No `console.log` in committed code
- No physical direction classes (`ml-`, `mr-`, `pl-`, `pr-`)

---

## Response Format

1. Files changed
2. Risks
3. Manual test steps
