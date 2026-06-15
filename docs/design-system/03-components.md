# 03 — Components

> shadcn/ui base + Gov TMS domain patterns.
> **Rule:** Extend shadcn — do not reinvent. Check `components/ui/` before building custom.

---

## Component Hierarchy

```
components/
├── ui/                 # shadcn/ui managed (do not hand-edit)
├── domain/             # Business domain components
│   ├── tasks/          # Task-specific UI
│   ├── blueprints/     # Blueprint builder UI
│   ├── follow-up/      # Follow-up center UI
│   ├── analytics/      # Dashboard charts, stat cards
│   └── organization/   # Org chart, position tree
└── shared/             # Cross-domain reusable
    ├── data-table.tsx
    ├── page-header.tsx
    ├── empty-state.tsx
    ├── glass-card.tsx
    └── skeleton-card.tsx
```

**Rules:**
- `ui/` is managed by shadcn CLI — never hand-edit these files
- `domain/` components import from `ui/` and `shared/` — never from other domain folders
- `shared/` components have no domain imports — generic and reusable

---

## App Chrome

### Sidebar

- Background: `bg-slate-900/95 backdrop-blur-xl` (dark glass)
- Width: `w-64` (256px)
- Tenant logo + name in header
- Nav items: icon + label
- Active item: `bg-emerald-600/20 text-emerald-300`
- Inactive item: `text-slate-400 hover:text-white hover:bg-white/5`
- User footer: avatar, name, position
- RTL: Sidebar on the right (use logical `border-e` not `border-r`)
- Mobile: Collapse to drawer overlay

### Top Bar

- Background: `bg-white/80 backdrop-blur-md` (glass, sticky)
- Height: `h-16`
- Border: `border-b border-border/50`
- Content: page title, global search input, theme toggle (Light/Dark/System), notification bell with count badge, primary action button
- Sticky: `sticky top-0 z-sticky`

---

## Buttons

| Variant | shadcn Variant | Tailwind | Usage |
|---------|---------------|----------|-------|
| Primary | `default` | emerald bg, white text | One main CTA per view |
| Secondary | `outline` | border, transparent bg | Secondary actions |
| Ghost | `ghost` | transparent, hover bg | Toolbar, table row actions |
| Danger | `destructive` | red bg | Cancel task, delete |
| Link | `link` | underline, no bg | Inline navigation |

```tsx
<Button>إنشاء مهمة</Button>                     {/* Primary */}
<Button variant="outline">تصدير</Button>         {/* Secondary */}
<Button variant="ghost" size="icon">             {/* Ghost icon */}
  <MoreHorizontal className="h-4 w-4" />
</Button>
<Button variant="destructive">إلغاء المهمة</Button> {/* Danger */}
```

**Interaction:**
- Hover: slight darken + cursor pointer
- Press: `active:scale-[0.98]` micro-shrink
- Loading: spinner icon replacing text, button disabled
- All buttons: `rounded-lg` (8px radius)

---

## Badges & SLA

### SLA Health Badge

```tsx
// components/domain/tasks/sla-badge.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { SLA_CONFIG } from '@/lib/utils/sla-utils';

interface SlaBadgeProps {
  health: 'green' | 'amber' | 'red' | 'grey';
  locale?: 'ar' | 'en';
}

export function SlaBadge({ health, locale = 'ar' }: SlaBadgeProps) {
  const config = SLA_CONFIG[health];
  return (
    <Badge variant="outline" className={cn(config.bg, config.color, 'gap-1.5')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {locale === 'ar' ? config.label_ar : config.label_en}
    </Badge>
  );
}
```

### Priority Badge

| Priority | Background | Text |
|----------|-----------|------|
| Critical | `bg-red-50` | `text-red-600` |
| Urgent | `bg-amber-50` | `text-amber-600` |
| Routine | `bg-slate-50` | `text-slate-600` |

```tsx
<Badge className="bg-red-50 text-red-600 rounded-full">حرجة</Badge>
<Badge className="bg-amber-50 text-amber-600 rounded-full">عاجلة</Badge>
<Badge className="bg-slate-50 text-slate-600 rounded-full">روتينية</Badge>
```

### Stage Type Badge

```tsx
<Badge className="bg-blue-50 text-blue-700">مراجعة</Badge>
```

---

## Data Table (Task Board)

- Surface: glass card or white `rounded-xl border`
- Header row: `text-[10px] uppercase tracking-wider text-slate-500 font-semibold`
- Columns: Task (title + ref), Blueprint, Stage, Assignee (avatar), SLA, Priority, Due
- Row hover: `hover:bg-slate-50/50`
- Row click: navigates to task details
- Quick filter chips above table
- Pagination: **Manual "Load More" button** (Cursor pagination). Do not use infinite scroll for dense data tables to preserve memory and allow footer access.

```tsx
// Column header pattern
<th className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3 text-start">
  المهمة
</th>

// Row pattern
<tr className="border-b border-border/50 hover:bg-slate-50/50 cursor-pointer transition-colors">
  <td className="px-4 py-3 text-sm">{task.title_ar}</td>
  <td className="px-4 py-3"><SlaBadge health={task.sla_health} /></td>
  {/* ... */}
</tr>
```

---

## Stage Timeline

Vertical timeline on task details page:

- Completed stage: emerald check icon, solid line
- Active stage: blue pulse dot (`animate-pulse`), bold text
- Pending stage: grey number, dashed line
- Overdue indicator: red label on active stage
- Pagination: **Automatic Infinite Scroll** using `useInfiniteQuery` and an Intersection Observer when approaching the bottom of the feed.

```tsx
// Timeline node pattern
<div className="flex gap-3 items-start">
  {/* Node indicator */}
  <div className={cn(
    'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
    status === 'completed' && 'bg-emerald-100 text-emerald-600',
    status === 'active' && 'bg-blue-100 text-blue-600 animate-pulse',
    status === 'pending' && 'bg-slate-100 text-slate-400',
  )}>
    {status === 'completed' ? <Check className="w-4 h-4" /> : <span>{sequence}</span>}
  </div>
  {/* Content */}
  <div>
    <p className={cn('text-sm', status === 'active' && 'font-semibold')}>
      {stageName}
    </p>
    {status === 'active' && isOverdue && (
      <span className="text-xs text-red-600">متأخر</span>
    )}
  </div>
</div>
```

---

## Stat Cards (Executive Dashboard)

- Glass card: `GlassCard variant="elevated"`
- Grid: 5-column on desktop, 2-column on tablet, 1-column on mobile
- Layout: icon in tinted square top-right, large number, trend caption
- At-risk / overdue cards: tinted border (`border-amber-200` / `border-red-200`)
- Hover: lift + shadow increase

---

## Blueprint Builder

- Canvas: dashed border area for stage nodes
- Stage cards: `w-44`, `border-2`, sequence badge top-left
- Selected stage: `ring-2 ring-blue-500`
- Return path: dashed red arrow between nodes
- Properties panel: right side panel (left in RTL), sliding drawer on mobile

---

## Forms

- Use shadcn `Form` + `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage`
- Bilingual fields: Arabic required indicator (`*`), English optional
- Date picker: support Hijri display at presentation layer
- Select: use shadcn `Select` with `SelectTrigger`, `SelectContent`, `SelectItem`
- Error: red text below field via `FormMessage`

---

## Empty States

Every data component needs an empty state:

```tsx
// components/shared/empty-state.tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
      {action}
    </div>
  );
}
```

---

## Loading Skeletons

Skeletons must match the shape of real content:

```tsx
// Stat card skeleton
<div className="rounded-xl border p-5 animate-pulse">
  <div className="flex justify-between mb-3">
    <div className="h-4 w-24 bg-slate-200 rounded" />
    <div className="h-10 w-10 bg-slate-200 rounded-lg" />
  </div>
  <div className="h-8 w-16 bg-slate-200 rounded" />
</div>

// Table row skeleton
<div className="flex items-center gap-4 px-4 py-3 animate-pulse">
  <div className="h-4 w-48 bg-slate-200 rounded" />
  <div className="h-4 w-20 bg-slate-200 rounded" />
  <div className="h-6 w-6 bg-slate-200 rounded-full" />
  <div className="h-5 w-16 bg-slate-200 rounded-full" />
</div>
```

---

## Icon Library

Use **Lucide React** (bundled with shadcn/ui):

```tsx
import { ListTodo, ChevronRight, Bell, Search, Plus, X, Check } from 'lucide-react';
```

**Directional icons** must flip in RTL:
```tsx
<ChevronRight className="w-4 h-4 rtl:rotate-180" />
```

**Non-directional icons** do NOT flip: `Check`, `Plus`, `X`, `Search`, `Bell`, `Settings`, `User`.
