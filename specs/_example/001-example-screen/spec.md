# Spec: [Feature Name]

> **Number:** NNN
> **Date:** YYYY-MM-DD
> **Status:** `draft`
> **Milestone:** F# — [Milestone Name]
> **Depends on:** [list frontend specs this spec requires]
> **Backend spec:** `../backend/specs/{number}-{name}/` — `Contract status: draft|stable`
> **Contract status:** `draft`
> **Author:** [name or tool]
> **Branch:** `feat/{number}-{name}`
> **Base branch:** `main`

---

## Problem

[WHY this screen/feature is needed. Written from the user's perspective — what pain does it solve? What does the user do today without this feature? Be specific to government/enterprise workflows.]

---

## Goal

[One paragraph describing what this spec delivers. Focus on the deliverable, not the implementation.]

---

## User Stories

### [Role/Persona Group]

- As a **[role]**, I want to [action], so that [outcome].
- As a **[role]**, I want to [action], so that [outcome].

### System

- As the **system**, I want [behavior], so that [constraint/requirement].

---

## Acceptance Criteria

### [Feature Area]

- [ ] [Specific, testable criterion — "When X, then Y"]
- [ ] [Criterion with exact UI behavior — "Badge shows 'متأخر' in red-50/red-600"]
- [ ] [Data display criterion — "Table shows columns: A, B, C, D"]

### [Another Feature Area]

- [ ] [Criterion]

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [ ] Query hook: `useXxx()` using `queryKeys.xxx.list(filters)`
- [ ] Pagination: `useInfiniteQuery` for cursor-paginated endpoints / `useQuery` for bounded data
- [ ] Prefetch: [describe any prefetch strategy, or "none in MVP"]
- [ ] Cache invalidation: invalidate `queryKeys.xxx.lists()` on mutations

### State Management

- [ ] Filters: URL search params (shareable, bookmarkable)
- [ ] [Specify if any state goes in Zustand and why]
- [ ] [Specify if any local component state is needed]

### Error Handling

- [ ] 401 → redirect to login (handled globally)
- [ ] 403 → show "no permission" message
- [ ] 500 → show error state with retry button
- [ ] Network error → show offline/retry state

---

## UI Requirements

> Reference: `docs/design-system/`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| [ComponentName] | Client | Domain | [Brief purpose] |
| [ComponentName] | Server | Page | [Brief purpose] |
| [ComponentName] | Client | shadcn | [Which shadcn component] |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | [Skeleton name] | Match shape of real content |
| Empty | [EmptyState] | Icon + headline + CTA |
| Error | [ErrorState] | Message + retry button |
| Success | [Real content] | Data rendered |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | [Describe mobile layout] |
| Tablet (640-1024px) | [Describe tablet layout] |
| Desktop (≥1024px) | [Describe desktop layout] |

### RTL Considerations

- [ ] All layout uses logical properties (`ms-`, `me-`, `text-start`)
- [ ] Directional icons flip (`rtl:rotate-180`)
- [ ] [Any screen-specific RTL notes]

### Accessibility

- [ ] All interactive elements have visible focus rings
- [ ] Icon-only buttons have `aria-label`
- [ ] SLA badges use color + text (never color-only)
- [ ] [Screen-specific a11y requirements]

### Animation

- [ ] [Describe any hover effects, transitions, or animations]
- [ ] Respects `prefers-reduced-motion`

---

## Non-Functional Requirements

### Performance

- [ ] [Heavy components lazy-loaded with dynamic import]
- [ ] [Image optimization via next/image]
- [ ] [Glass effects limited to N concurrent surfaces]

### Security

- [ ] Capability checks hide/disable actions user cannot perform
- [ ] No PII in console logs or URLs
- [ ] [Screen-specific security notes]

---

## Out of Scope

- [Explicit deferral — what this spec does NOT include]
- [V2 feature — what was considered but deferred]

---

## Open Questions

- [ ] [Question 1 — with decision if already answered]
- [ ] [Question 2]

---

→ **Next:** Read `docs/ai/coding-standards.md` before creating `plan.md`.
