# 04 — Layout Patterns

> Page layouts, grids, responsive behavior, navigation, and RTL rules.
> Migrated from: `overview.md`, `patterns.md`, `rtl.md`.

---

## Dashboard Shell

Standard authenticated layout used across all screens:

```
┌──────────┬──────────────────────────────────────┐
│ Sidebar  │  Top bar (title, search, actions)   │
│ 288px    ├──────────────────────────────────────┤
│          │  Main content (scrollable)          │
│          │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

Uses shadcn `SidebarProvider` + `AppSidebar` + `SiteHeader` — see the dashboard-01 block for the implementation pattern.

### Sidebar

| Property | Value |
|----------|-------|
| Width | `calc(var(--spacing) * 72)` (288px) |
| Background | uses `--sidebar` CSS variable (solid) |
| Border | logical (`border-e`) — flips in RTL |
| Position | Start edge (left in LTR, right in RTL) |
| Mobile | Hidden by default, overlay drawer on toggle |

### Top Bar

| Property | Value |
|----------|-------|
| Height | `h-16` |
| Background | solid (shadcn `SiteHeader`) |
| Position | `sticky top-0` |
| Border | `border-b border-border/50` |
| Content | Page title, search, theme toggle (Light/Dark/System), notifications, primary CTA |

---

## Page Templates

### List Page (Task Board, Follow-Up Center)

```
┌─────────────────────────────────────┐
│ PageHeader: title + primary action  │
├─────────────────────────────────────┤
│ FilterBar: chips + dropdowns        │
├─────────────────────────────────────┤
│ DataTable: rows with columns        │
│ ...                                 │
│ ...                                 │
├─────────────────────────────────────┤
│ LoadMore button (manual cursor pagination)│
└─────────────────────────────────────┘
```

### Detail Page (Task Details)

```
┌──────────────────────────┬────────────────┐
│ Main Column (2/3)        │ Side Panel     │
│ ┌──────────────────────┐ │ (1/3)         │
│ │ Title + status       │ │ ┌────────────┐│
│ │ Description          │ │ │ Meta info  ││
│ │ Stage Timeline       │ │ │ Assignees  ││
│ │ Comments (future)    │ │ │ References ││
│ └──────────────────────┘ │ │ Actions    ││
│                          │ └────────────┘│
└──────────────────────────┴────────────────┘
```

### Dashboard Page (Executive, Department Manager)

```
┌───────┬───────┬───────┬───────┬───────┐
│ Stat  │ Stat  │ Stat  │ Stat  │ Stat  │  ← 5-col grid
└───────┴───────┴───────┴───────┴───────┘
┌─────────────────────┬─────────────────┐
│ Chart / Table       │ Side widget     │  ← 2/3 + 1/3
│ (Department health) │ (Top overdue)   │
└─────────────────────┴─────────────────┘
```

### Form Page (Create Task, Edit Blueprint)

```
┌─────────────────────────────────────┐
│ PageHeader: title + Cancel / Save   │
├─────────────────────────────────────┤
│ Form Card                           │
│ ┌─────────────────────────────────┐ │
│ │ Section: Basic Info             │ │
│ │ Fields...                       │ │
│ ├─────────────────────────────────┤ │
│ │ Section: Configuration          │ │
│ │ Fields...                       │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Footer: Cancel + Submit             │
└─────────────────────────────────────┘
```

### Blueprint Builder (Split View)

```
┌─────────────────────────┬───────────────┐
│ Canvas (stage nodes)    │ Properties    │
│ ┌───┐   ┌───┐   ┌───┐ │ Panel         │
│ │ 1 │──▶│ 2 │──▶│ 3 │ │ ┌───────────┐ │
│ └───┘   └───┘   └───┘ │ │ Stage Name│ │
│                         │ │ SLA Policy│ │
│   ◀── Return ──         │ │ Assignees │ │
│                         │ └───────────┘ │
└─────────────────────────┴───────────────┘
```

---

## Navigation

### Sidebar Navigation Items

- Dashboard, Task Board, Blueprints, Analytics, Follow-Up, Organization
- Active route: highlighted with amber accent
- Grouped by category (future: collapsible groups)

### Breadcrumbs

Detail pages show breadcrumb below top bar:

```
Task Board / T-2026-0412
```

---

## Grid System

| Layout | Tailwind | Usage |
|--------|----------|-------|
| 5-column stats | `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` | Executive dashboard |
| 3-column detail | `grid-cols-1 lg:grid-cols-3` | Task details (2/3 + 1/3) |
| 2-column form | `grid-cols-1 md:grid-cols-2` | Side-by-side AR/EN fields |
| 4-column admin | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | Admin cards |

**Gap standard:** `gap-4` for card grids, `gap-6` for major sections.

---

## Responsive Behavior

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column, sidebar hidden (drawer), compact tables |
| Tablet | 640-1024px | 2-column grids, sidebar visible or drawer |
| Desktop | ≥ 1024px | Full layout, sidebar fixed, multi-column grids |

Responsive behavior is handled by shadcn `SidebarProvider` — collapses to icons on mobile, full sidebar on desktop.

### Tables on Mobile

Dense data tables collapse to card view on mobile. Use responsive utilities (`hidden md:block` / `md:hidden`).

---

## RTL Layout Rules

### Logical Properties — Mandatory

All layout properties use CSS logical equivalents:

| Physical (never) | Logical (always) |
|-------------------|-------------------|
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-*` / `right-*` | `start-*` / `end-*` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `border-l` / `border-r` | `border-s` / `border-e` |
| `rounded-l` / `rounded-r` | `rounded-s` / `rounded-e` |
| `float-left` / `float-right` | `float-start` / `float-end` |

### Sidebar Position

The sidebar uses `border-e` (end border) which automatically flips:
- LTR: sidebar on left, border on right edge
- RTL: sidebar on right, border on left edge

### Icon Flipping

Directional icons (chevrons, arrows) must flip in RTL with `rtl:rotate-180`. Non-directional icons (`Check`, `Plus`, `Search`, `Bell`, etc.) must NOT flip.

### Form Layout

- Labels align to `text-start` (right in RTL, left in LTR)
- Required marker (`*`) follows label in reading direction
- Error messages below field, aligned `text-start`

### Tables

- Column order remains consistent (data columns don't reverse)
- Text columns follow `text-start` alignment
- Numeric columns may use `text-end` for alignment
- Action columns use `text-end`

### Dates

- Display Hijri + Gregorian dual format per blueprint requirement
- Storage/API: Gregorian ISO; convert in display utilities only
- Use `Intl.DateTimeFormat` with `islamic` calendar for Hijri

### Testing

Every new screen: verify layout in both `ar` (RTL) and `en` (LTR) before PR merge.

---

## Spacing & Content Padding

| Class | px | Usage |
|-------|-----|-------|
| `p-6` | 24px | Page content padding |
| `p-5` | 20px | Stat card padding |
| `p-4` | 16px | Card internal padding, table cell padding |
| `gap-4` | 16px | Card grid gaps |
| `gap-6` | 24px | Section separation |
| `space-y-4` | 16px | Vertical form field spacing |
| `space-y-6` | 24px | Vertical section spacing |

---

## Filter Patterns

### Task Board Filters

- Chip buttons: All, My Tasks, Overdue, At Risk, Suspended
- Dropdown selects: Department, Priority, Blueprint via shadcn `Select`
- Sticky below top bar on scroll
- Reset button to clear all filters

See `npx shadcn@latest docs select` for the Select API.

---

## Confirmation Dialogs

Use shadcn `AlertDialog` for destructive actions:

- Cancel task: danger outline button → confirmation dialog with mandatory reason textarea
- Destructive button label: specific ("Cancel Task" not "Confirm")
- Cancel button: always available ("إلغاء" / "Cancel")

---

## Data Loading Patterns

| Context | Pattern |
|---------|---------|
| Initial table | Skeleton rows matching column widths |
| Dashboard metrics | Skeleton stat cards (number + label shape) |
| Mutation in progress | Button loading spinner, disabled state |
| Search | Debounce 300ms, inline loading indicator |

---

## Search

- Global search in top bar: tasks, references, people
- Debounce: 300ms before API call
- Results: dropdown with task title, SLA badge, department
- Keyboard: `Cmd+K` / `Ctrl+K` to focus search
- Empty: "No results" with suggestion text

---

## Permission-Gated UI

- Hide actions user cannot perform (capabilities from `/me` endpoint)
- Disabled + tooltip if showing for discoverability
- Never block navigation client-side — server returns 403
- See `security-policy.md` for full details
