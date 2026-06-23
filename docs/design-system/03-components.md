# 03 — Components

> shadcn/ui base + Gov TMS domain patterns.
> **Rule:** Extend shadcn — do not reinvent. Check `components/ui/` before building custom.

---

## Component Hierarchy

```
components/
├── ui/                 # shadcn/ui managed (hand-edited for RTL: input-group, sidebar, dropdown-menu, command)
├── domain/             # Business domain components
│   ├── auth/           # Login form
│   ├── tasks/          # Task board + task details (~28 files)
│   ├── blueprints/     # Blueprint library + builder + catalog (~25 files)
│   ├── shell/          # AppSidebar, SiteHeader, nav, notifications (~8 files)
│   ├── search/         # Global search (command palette)
│   ├── follow-up/      # (not yet populated)
│   ├── analytics/      # (not yet populated)
│   └── organization/   # (not yet populated)
└── shared/             # Cross-domain reusable (~13 files)
    ├── empty-state.tsx
    ├── error-state.tsx
    ├── page-header.tsx
    ├── locale-toggle.tsx
    ├── active-badge.tsx
    ├── bilingual-name-fields.tsx
    ├── bilingual-description-fields.tsx
    ├── rtl-select.tsx
    ├── rtl-table.tsx
    ├── catalog-table.tsx
    ├── confirm-delete-dialog.tsx
    ├── brand-color-toggle.tsx
    └── copy-link-button.tsx
```

**Rules:**
- `ui/` is managed by shadcn CLI; 4 files hand-edited for RTL (see `coding-standards.md` Exception section) — re-apply changes after CLI reinstall
- `domain/` components import from `ui/` and `shared/` — never from other domain folders
- `shared/` components have no domain imports — generic and reusable

---

## App Chrome

### Sidebar

- Background: uses `--sidebar` CSS variable (solid, no glass)
- Width: `calc(var(--spacing) * 72)` (288px)
- Tenant logo + name in header
- Nav items: icon + label
- Active item: uses **dynamic brand color** (`data-[active=true]:bg-primary data-[active=true]:text-primary-foreground`)
- Inactive item: `text-slate-400 hover:text-white hover:bg-white/5`
- User footer: avatar, name, position
- RTL: Sidebar on the right (use logical `border-e` not `border-r`); pass `side={locale === 'ar' ? 'right' : 'left'}` to shadcn `Sidebar`
- Mobile: Collapse to Sheet drawer overlay

### Top Bar (SiteHeader)

- Background: solid, sticky (shadcn `SiteHeader` component)
- Height: `h-16`
- Border: `border-b border-border/50`
- Content: SidebarTrigger hamburger, breadcrumb (via `usePageBreadcrumb()` for known routes), global search trigger (dynamically imported `GlobalSearch`), notification bell with count badge, locale toggle
- **Theme toggle** (Light/Dark/System) and **brand color picker** moved to user menu dropdown (NavUser → Preferences submenu)
- Sticky: `sticky top-0`
- RTL: Breadcrumb chevrons use `rtl:rotate-180`

---

## Buttons

| Variant | shadcn Variant | Usage |
|---------|---------------|-------|
| Primary | `default` | One main CTA per view |
| Secondary | `outline` | Secondary actions |
| Ghost | `ghost` | Toolbar, table row actions |
| Danger | `destructive` | Cancel task, delete |
| Link | `link` | Inline navigation |

**Interaction:** Hover darken, `active:scale-[0.98]` micro-shrink, loading spinner + disabled. All buttons `rounded-lg` (14px). See `npx shadcn@latest docs button` for full API.

---

## Badges & SLA

### SLA Health Badge

See `npx shadcn@latest docs badge` for component API. SLA badge example would combine `Badge variant="outline"` with semantic Tailwind classes (`text-emerald-600`, `bg-amber-50`, etc.) and a dot indicator.

### Priority Badge

| Priority | Color Scheme |
|----------|-------------|
| Critical | Red (`text-red-600`, `bg-red-50`) |
| Urgent | Amber (`text-amber-600`, `bg-amber-50`) |
| Routine | Slate (`text-slate-600`, `bg-slate-50`) |

---

## Data Table (Task Board)

- Surface: shadcn `Table` component (desktop) / `Card` list (mobile)
- Columns (6-column hybrid enterprise): SLA (position 1 — risk-first), Task (rich cell: public_id + localized title + ClassificationBadge + TaskStatusBadge + PriorityBadge), Current Stage (with department subtext), Assignees (stacked AvatarGroup), Time In Stage (with due date subtext), Actions (DropdownMenu: Open Details, Copy Link)
- Row accent: `border-s-4` left border derived from SLA health color (emerald/amber/red/slate)
- Visual hierarchy: **SLA owns color** — status/priority/classification use neutral/outline styles
- Pagination: **Manual "Load More" button** (Cursor pagination). Do not use infinite scroll.
- Row click: navigates to task details
- Mobile (<768px): card list with matching information hierarchy

Use shadcn `Table` with `@tanstack/react-table`. See `npx shadcn@latest docs table` and the dashboard-01 block for the full pattern.

---

## Stage Timeline

Vertical `<ol>` timeline on task details page:

- Completed stage: emerald check icon (size-9 rounded-full), solid connecting line
- Active stage: blue pulse dot (animate-pulse, motion-reduce:animate-none), bold text, SLA inline status
- Pending stage: grey number (index), dashed connecting line
- Returned stage: undo arrow icon (rtl:rotate-180), muted, with return_reason shown inline
- Sub-stages: nested checklist items with complete/return/override actions
- SLA inline on active node: "Overdue by 2d" (red) / "At risk — 3d left" (amber) / "3d left" (emerald)
- Action buttons: Complete Stage (submit_and_advance), Return to Previous, Override Assignment (capability-gated)
- Pagination: **full list render** (`useQuery`, no pagination — timeline returns <200 entries)

---

## Stat Cards (Executive Dashboard)

- Card: shadcn `Card` component
- Grid: 5-column on desktop, 2-column on tablet, 1-column on mobile
- Layout: icon in tinted square top-right, large number, trend caption
- At-risk / overdue cards: tinted border
- Hover: lift + shadow increase

See `npx shadcn@latest docs card` and the dashboard-01 block for the full pattern.

---

## Blueprint Builder

Split-view editor (`/blueprints/[publicId]`):

- **Canvas** (left pane): dashed-border area with vertical stage list in `sequence_order`, flow connectors between stages, "Add Stage" button at end
- **Stage cards**: fixed-width cards showing sequence badge ("Stage N"), localized name, type + SLA summary, assignee summary, sub-stage count, return-path badge. Cards are selectable (click loads into properties panel)
- **Selected stage**: `ring-2 ring-primary` focus ring + accent border
- **Properties panel** (right pane, ~320px, sticky, independently scrollable): StageForm (12 fields), TransitionEditor (advance/return multi-select integer codes), SubStageList (ordered with add/edit/delete/reorder)
- **Locked behavior**: panel read-only when `is_locked=true`, lock banner visible, "Add Stage" hidden
- **View-only**: panel fully disabled for users without `blueprint.manage` capability
- **Sub-stage editing**: inline in properties panel (not a dialog) with "Back to stage" navigation
- **Mobile**: panel collapses to Sheet drawer, top-bar actions to overflow menu

Catalog (`/blueprints/catalog`): three tabs (Categories, Stage Types, SLA Policies) with per-tab CRUD dialogs, URL `?tab=` param for shareable state.

## Shared Components

### BilingualNameFields
Reusable AR/EN name input pair. Arabic required (`dir="rtl"`), English optional (`dir="ltr"`). Used in create-blueprint, blueprint-settings, stage-form, sub-stage-form, catalog dialogs (~7 locations).

### BilingualDescriptionFields
Same pattern for description textareas.

### RtlSelect
Wraps shadcn `Select` with `dir={locale === 'ar' ? 'rtl' : 'ltr'}` — eliminates duplicate locale checks across ~25 locations. SelectContent uses `position="popper"` with no `align` prop.

### RtlTable
Wraps shadcn `Table` with automatic `dir` for RTL column rendering. All `SelectContent` use `position="popper"`.

### ConfirmDeleteDialog
Reusable `AlertDialog` wrapper with configurable title, description, confirm/cancel labels. Uses `cursor-pointer` on trigger.

### CatalogTable
Building blocks for blueprint catalog: `ActionsDropdown` (factory helpers `editAction`, `deleteAction`, `deactivateAction`, `reactivateAction`), `FormDialog` (Dialog with footer buttons), `CatalogSkeleton` (skeleton table rows), re-exports `RtlTable`.

### ActiveBadge
Dark-mode-aware green/grey span (`text-emerald-600 dark:text-emerald-400` / `text-muted-foreground`) for active/inactive status.

### PageHeader
Reusable title + description + actions header block used across all list/detail pages. Replaces inline page headers.

### EmptyState / ErrorState
Shared icon + headline + CTA (empty) and message + retry button (error). Used across all domain components.

---

## Forms

- Use shadcn `Field` + `FieldGroup` + `FieldLabel` + `FieldDescription` + `FieldError` (nova pattern)
- For inputs with icons/addons: use `InputGroup` + `InputGroupInput` + `InputGroupAddon`
- Bilingual fields: Arabic required indicator (`*`), English optional; use `BilingualNameFields` / `BilingualDescriptionDescriptionFields` shared components
- Date picker: support Hijri display at presentation layer
- Select: use shadcn `Select` with `SelectTrigger`, `SelectContent`, `SelectItem`; for RTL use `RtlSelect` wrapper
- SelectItem must be inside `SelectGroup`
- Sentinel values for nullable selects: `'no-sla'` for SLA policy, `'none'` for escalation position (avoids empty-string conflicts)
- Error: red text below field via `FieldError`
- Enum maps for API serialization: `ASSIGNMENT_TYPE_MAP`, `CARDINALITY_MAP`, `COMPLETION_RULE_MAP`, `SLA_UNIT_MAP` in `blueprint-utils.ts` (string → integer codes)

---

## Empty States

Every data component needs an empty state. Use shadcn `Card` or custom markup with a centered layout, icon, title, description, and optional CTA. See `npx shadcn@latest docs card` for available components.
```

---

## Loading Skeletons

Skeletons must match the shape of real content. Use shadcn `Skeleton` component — see `npx shadcn@latest docs skeleton`.

---

## Icon Library

Use **Lucide React** (bundled with shadcn/ui). Import icons individually from `lucide-react`.

- **Directional icons** (chevrons, arrows) must flip in RTL with `rtl:rotate-180`
- **Non-directional icons** do NOT flip: `Check`, `Plus`, `X`, `Search`, `Bell`, `Settings`, `User`
- Inside shadcn components, use `data-icon="inline-start"` or `data-icon="inline-end"` — no sizing classes
