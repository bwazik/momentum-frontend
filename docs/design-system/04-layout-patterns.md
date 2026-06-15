# 04 — Layout Patterns

> Page layouts, grids, responsive behavior, navigation, and RTL rules.
> Migrated from: `overview.md`, `patterns.md`, `rtl.md`.

---

## Dashboard Shell

Standard authenticated layout used across all screens:

```
┌──────────┬──────────────────────────────────────┐
│ Sidebar  │  Top bar (title, search, actions)   │
│ 256px    ├──────────────────────────────────────┤
│ slate-900│  Main content (scrollable)          │
│ /95      │  bg-slate-100                       │
│ glass    │  p-6                                │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

### Implementation

```tsx
// app/[locale]/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-page-bg p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Sidebar

| Property | Value |
|----------|-------|
| Width | `w-64` (256px) |
| Background | `bg-slate-900/95 backdrop-blur-xl` |
| Border | `border-e border-white/5` (logical — flips in RTL) |
| Position | Start edge (left in LTR, right in RTL) |
| Mobile | Hidden by default, overlay drawer on toggle |

### Top Bar

| Property | Value |
|----------|-------|
| Height | `h-16` |
| Background | `bg-white/80 backdrop-blur-md` (glass) |
| Position | `sticky top-0 z-sticky` |
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

```tsx
export default function TaskBoardPage() {
  return (
    <>
      <PageHeader title="لوحة المهام" action={<Button>مهمة جديدة</Button>} />
      <TaskFilters className="mb-4" />
      <TaskBoard />
    </>
  );
}
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

```tsx
export default function TaskDetailPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <TaskHeader />
        <TaskDescription />
        <StageTimeline />
      </div>
      <aside className="space-y-6">
        <TaskMetaPanel />
        <TaskAssignees />
        <TaskReferences />
        <TaskActions />
      </aside>
    </div>
  );
}
```

### Dashboard Page (Executive, Department Manager)

```
┌───────┬───────┬───────┬───────┬───────┐
│ Stat  │ Stat  │ Stat  │ Stat  │ Stat  │  ← 5-col grid (glass cards)
└───────┴───────┴───────┴───────┴───────┘
┌─────────────────────┬─────────────────┐
│ Chart / Table       │ Side widget     │  ← 2/3 + 1/3
│ (Department health) │ (Top overdue)   │
└─────────────────────┴─────────────────┘
```

```tsx
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="لوحة المتابعة" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="المهام النشطة" value={142} icon={ListTodo} />
        <StatCard label="متأخرة" value={23} icon={AlertTriangle} variant="danger" />
        {/* ... */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DepartmentHealthChart />
        </div>
        <div>
          <TopOverdueWidget />
        </div>
      </div>
    </>
  );
}
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
- Active route: highlighted with emerald accent
- Grouped by category (future: collapsible groups)

### Breadcrumbs

Detail pages show breadcrumb below top bar:

```
Task Board / T-2026-0412
```

```tsx
<nav className="flex items-center gap-1 text-sm text-text-secondary mb-4">
  <Link href="/tasks" className="hover:text-text-primary">لوحة المهام</Link>
  <ChevronRight className="w-3 h-3 rtl:rotate-180" />
  <span className="text-text-primary font-medium">T-2026-0412</span>
</nav>
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

### Sidebar Responsive

```tsx
// Mobile: drawer overlay
// Desktop: fixed sidebar

export function Sidebar() {
  const { isOpen, toggle } = useSidebarStore();

  return (
    <>
      {/* Desktop: always visible */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-e border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile: drawer */}
      <Sheet open={isOpen} onOpenChange={toggle}>
        <SheetContent side="start" className="w-64 bg-sidebar p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
```

### Tables on Mobile

Dense data tables collapse to card view on mobile:

```tsx
// Desktop: full table
<div className="hidden md:block">
  <DataTable columns={columns} data={tasks} />
</div>

// Mobile: card list
<div className="md:hidden space-y-3">
  {tasks.map(task => (
    <TaskCardCompact key={task.public_id} task={task} />
  ))}
</div>
```

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

Directional icons must flip in RTL:

```tsx
// These MUST flip
<ChevronRight className="rtl:rotate-180" />
<ArrowLeft className="rtl:rotate-180" />
<ArrowRight className="rtl:rotate-180" />

// These must NOT flip
<Check />  <X />  <Plus />  <Search />  <Bell />  <Settings />
```

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
- Dropdown selects: Department, Priority, Blueprint
- Sticky below top bar on scroll
- Reset button to clear all filters

```tsx
<div className="flex flex-wrap items-center gap-2 mb-4">
  <FilterChip active={!status} onClick={() => setFilter('status', null)}>الكل</FilterChip>
  <FilterChip active={status === 'overdue'} onClick={() => setFilter('status', 'overdue')}>
    متأخرة
  </FilterChip>
  <FilterChip active={status === 'at_risk'} onClick={() => setFilter('status', 'at_risk')}>
    قريبة من الموعد
  </FilterChip>
  <div className="ms-auto flex gap-2">
    <Select onValueChange={(v) => setFilter('department', v)}>
      <SelectTrigger className="w-40"><SelectValue placeholder="القسم" /></SelectTrigger>
      <SelectContent>{/* department options */}</SelectContent>
    </Select>
  </div>
</div>
```

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
