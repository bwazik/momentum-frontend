# Spec & Plan Creation Guide — Momentum Frontend

> Use these prompt templates to create new frontend specs, implementation plans, and design reviews.
> The agent MUST read all `docs/ai/` files before creating any spec or plan.

---

## Mandatory Pre-Work

Before using any prompt, the agent MUST read ALL of these files in order:

1. `docs/ai/context.md`
2. `docs/ai/roadmap.md`
3. `docs/ai/architecture.md`
4. `docs/ai/coding-standards.md`
5. `docs/ai/security-policy.md`
6. `docs/ai/testing-policy.md`
7. `docs/ai/release-policy.md`
8. `docs/ai/glossary.md`
9. `docs/ai/spec-creation-guide.md` (this file)

If the agent skips any file, the spec or plan will miss critical constraints.

---

## Prompt 1: Create a New Frontend Spec

Copy and paste the following prompt. Fill in the bracketed sections before sending.

```
Create a new frontend feature spec for the following screen/feature:

**Feature description:**
[Describe what you want to build in plain English. Focus on WHAT the user sees and interacts with — not how to implement it technically.]

**Spec number:**
[Look at the existing folders in specs/ and use the next number. e.g. 004]

**Feature name (short, kebab-case):**
[e.g. blueprint-builder, task-board, executive-dashboard]

---

## Instructions for the agent:

1. Read ALL files in `docs/ai/` in order:
   - context.md → roadmap.md → architecture.md → coding-standards.md → security-policy.md → testing-policy.md → release-policy.md → glossary.md → spec-creation-guide.md
2. Read the spec template at `specs/_example/001-example-screen/spec.md`.
3. Check `docs/ai/roadmap.md` for the correct milestone and any dependencies.
4. Check existing specs in `specs/` for related or overlapping features.
5. Read the relevant design-system docs in `docs/design-system/` for applicable tokens, components, and patterns.
6. If a backend spec exists for this feature, read its `spec.md` and `plan.md` at `../backend/specs/{number}-{name}/` to understand the API contract.
7. Read `../backend/openapi/openapi.json` for the stable API endpoints this spec will consume (if available).
8. Create the folder: `specs/[number]-[feature-name]/`
9. Create `specs/[number]-[feature-name]/spec.md` with:
    - Header: number, date, status (`draft`), milestone, depends on, backend spec, contract status (`draft`), author, branch, base branch
    - A clear problem statement (WHY this screen/feature is needed from a user perspective)
    - User stories in "As a [role], I want to [action], so that [outcome]" format
    - Specific, testable acceptance criteria (checkboxes)
    - **Technical Requirements section** referencing `coding-standards.md` for:
      - Data fetching strategy (query hooks, infinite query, prefetch)
      - State management (URL params vs Zustand vs local state)
      - Query key structure (from query-keys.ts factory)
      - Mutation patterns (optimistic updates, cache invalidation)
      - Error handling approach
    - **UI Requirements section** referencing design-system docs for:
      - Component breakdown (which shadcn + domain components)
      - States: loading (skeleton shape), empty, error, success
      - Responsive behavior (desktop, tablet, mobile)
      - RTL considerations (logical properties, icon flipping, layout changes)
      - Accessibility requirements (ARIA, keyboard nav, screen reader)
      - Animation/transition specifications
    - Explicit out-of-scope items
    - Any open questions that need answering before implementation
10. Do NOT create `plan.md` yet — that comes after the spec is reviewed and approved.
11. After creating the file, show me its contents for review.

**Do not start implementing.** This prompt is spec creation only.
**You can know the next spec from the roadmap.md**
**You can access any files you need from the blueprint folder at `../_blueprints/`**
**You can access the backend project at `../backend/` for specs, plans, and API contracts**
**You can access any plan.md or spec.md from older specs as a reference if you needed to**
**Take D:\Projects\momentum\_blueprints\ui-concepts\06-follow-up-center.html as a reference for the UI design (Reference only, not has to be the same cuz our api might not support all of the ui design, and also u can make totally a new design if u think it is better than the reference or not compitable with our current setup)**
```

---

## Prompt 2: Create an Implementation Plan

Use this AFTER a spec has been reviewed and approved. The agent reads the spec plus all docs/ai files to produce a detailed technical plan.

```
Create plan.md for specs/[number]-[name]/ based on the approved spec.

---

## Instructions for the agent:

1. Read ALL files in `docs/ai/` in order:
   - context.md → roadmap.md → architecture.md → coding-standards.md → security-policy.md → testing-policy.md → release-policy.md → glossary.md → spec-creation-guide.md
2. Read `specs/[number]-[name]/spec.md` completely.
3. Read `docs/ai/architecture.md` and `docs/ai/security-policy.md` for structure and security constraints.
4. Read relevant `docs/design-system/` files for tokens, components, layout patterns, and accessibility.
5. Read dependency spec `plan.md` files listed in the spec's `Depends on:` field.
6. Read the backend spec and plan at `../backend/specs/{backend-spec-number}-{name}/` to understand the API contract.
7. Read `../backend/openapi/openapi.json` for endpoint signatures, request/response shapes.
8. Read existing component code in `components/` and `lib/` to match established patterns.
9. Create `specs/[number]-[name]/plan.md` with the following sections:

### Required Sections

- **Open Questions Resolved** — List every open question from the spec and the decision made. If any remain unresolved, mark them `<!-- TODO: verify -->`.
- **Technical Approach** — One-line summary + key decisions with short rationale.
- **Component Tree** — Visual hierarchy of components for this screen/feature. Include which are Server vs Client components.
- **Affected Files** — List every new file and modified file with brief change description.
- **Implementation Notes** — For each major component, include:
  - One-line summary of the approach
  - Key decisions (bulleted) with short rationale
  - Exact files to create/edit (full paths)
  - Query hooks: query keys, fetch functions, mutation + invalidation
  - State management: what goes in URL, what goes in Zustand, what goes in local state
  - Minimal, copy-pasteable code snippets for core components (TSX)
  - Two simple test cases (render → expected output)
  - Explicit notes on which `coding-standards.md` rules apply
- **Data Flow** — How data flows from API → query hook → component → display.
- **Route Structure** — File paths under `app/` for pages and layouts (locale is cookie-based).
- **Execution Order** — Numbered steps with dependencies.
- **What to Test Manually** — Numbered list of manual test scenarios covering:
  - Happy paths in both locales (AR RTL + EN LTR)
  - Loading, empty, and error states
  - Permission-gated UI elements
  - Responsive behavior
  - Keyboard navigation

### Implementation Detail Requirements

Write implementation details inline so that a low-capacity model can implement directly. Include:

- One-line summary of the approach
- Key decisions (bulleted) with short rationale
- Exact files to create/edit (paths)
- Query hook signatures (queryKey, queryFn, onSuccess)
- Component props interfaces
- Minimal, copy-pasteable TSX snippets for core UI
- Two simple test cases (render → expected output)

Keep concise; mark uncertain details with `<!-- TODO: verify -->`.

10. Ensure every section references applicable rules from `coding-standards.md`:
    - Query key factory usage (not hardcoded strings)
    - Cursor pagination with `useInfiniteQuery`
    - All 4 states handled (loading skeleton, error, empty, success)
    - Logical Tailwind properties for RTL
    - Permission checks via `useCapability()`
    - Form handling via shadcn Field + InputGroup (nova)
    - Generated types (no hand-written API interfaces)
11. After generating the plan, include a short **Implementation Prompt** that can be given directly to another coding LLM.
12. After implementation is completed, perform a full review of the implementation against the approved spec and plan.

    Generate a concise issues report containing:
    - Missing files
    - Missing components or states
    - Incorrect logic or data flow
    - Accessibility issues
    - RTL issues
    - Architecture or standards violations

    Include file paths and recommended fixes.
13. After creating the file, show me its contents for review.

**Do not start implementing.** This prompt is plan creation only.
**You can access the backend project at `../backend/` for API contracts, specs, and plans**
**You can access any files in the current codebase to know about existing code (ONLY IF NEEDED)**
**You can access any plan.md from older specs as a reference if you needed to**
**You may update any part of the spec.md if you discover that it is no longer relevant**
```

---

## Prompt 3: Design Review

Use this AFTER implementation to verify visual fidelity, accessibility, and RTL correctness.

```
Perform a design review of the implementation for specs/[number]-[name]/.

---

## Instructions for the agent:

1. Read `specs/[number]-[name]/spec.md` and `specs/[number]-[name]/plan.md`.
2. Read `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`.
3. Review the implemented component files against:
   - Design token usage (colors, spacing, typography, radius)
   - Glassmorphism effects (deferred — see docs/design-system/02-glassmorphism.md)
   - Component patterns (correct shadcn variant usage)
   - Layout patterns (shell, grid, responsive breakpoints)
   - Accessibility (ARIA labels, focus management, color contrast, keyboard nav)
   - Anti-patterns (check every item in `06-anti-patterns.md`)
5. Test or verify both locales (Arabic RTL, English LTR).
6. Generate a design review report with:
   - **Token violations** — wrong colors, spacing, or typography
   - **Accessibility issues** — missing ARIA labels, insufficient contrast, no focus ring
   - **RTL issues** — physical direction properties, non-flipping icons, alignment problems
   - **Anti-pattern matches** — any violations from `06-anti-patterns.md`
   - **Recommendations** — prioritized list of fixes
7. You can access the backend project at `../backend/` if needed.

**This is review only — do not make changes.** Present findings for approval.
```

---

## Checklist: Spec Review Criteria

Before approving a spec, verify:

- [ ] Problem statement is clear and explains WHY from the user's perspective
- [ ] User stories cover all roles (tenant admin, internal user, follow-up specialist, system)
- [ ] Acceptance criteria are specific, testable, and have checkboxes
- [ ] Technical Requirements section exists and references `coding-standards.md`
- [ ] Data fetching strategy specified (query hooks, infinite query)
- [ ] State management strategy specified (URL params, Zustand, local)
- [ ] UI Requirements section exists and references design-system docs
- [ ] Component breakdown listed with shadcn + domain components
- [ ] All 4 states specified: loading (skeleton shape), empty, error, success
- [ ] Responsive behavior specified (desktop, tablet, mobile)
- [ ] RTL considerations specified (logical properties, icon flipping)
- [ ] Accessibility requirements specified (ARIA, keyboard, screen reader)
- [ ] Out-of-scope items are explicit
- [ ] Open questions are listed
- [ ] Dependency on backend specs is stated with contract status check

## Checklist: Plan Review Criteria

Before approving a plan, verify:

- [ ] Every open question from the spec has a resolution
- [ ] Technical approach is clear with key decisions explained
- [ ] Component tree shows visual hierarchy with Server/Client distinction
- [ ] All new and modified files are listed with full paths
- [ ] Implementation notes include copy-pasteable TSX snippets
- [ ] Query hooks use query key factory (not hardcoded strings)
- [ ] Cursor pagination uses `useInfiniteQuery` where applicable
- [ ] All 4 states implemented in every data component
- [ ] RTL logical properties used throughout (no `ml-`, `mr-`)
- [ ] Permission checks use `useCapability()` hook
- [ ] Forms use shadcn Field + InputGroup (nova)
- [ ] Generated types used (no hand-written API interfaces)
- [ ] Route structure specified (locale is cookie-based — no `[locale]` prefix)
- [ ] Manual test checklist covers both locales, states, and responsive

## Checklist: Design Review Criteria

Before approving a design review, verify:

- [ ] All design tokens used correctly (colors, spacing, typography)
- [ ] Glassmorphism effects (deferred — see docs/design-system/02-glassmorphism.md)
- [ ] SLA colors match token mapping (emerald/amber/red/slate)
- [ ] Both locales tested (AR RTL + EN LTR)
- [ ] Directional icons flip in RTL (`rtl:rotate-180`)
- [ ] Focus rings visible on all interactive elements
- [ ] Color is not the only indicator (text labels on SLA badges, etc.)
- [ ] Touch targets ≥ 44px on mobile
- [ ] No anti-patterns from `06-anti-patterns.md`

---

→ **Next:** [context.md](context.md) (start of reading chain)
