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
└── shared/             # Cross-domain reusable (planned — not yet created)
    ├── data-table.tsx   # currently at components/data-table.tsx
    └── site-header.tsx  # currently at components/site-header.tsx
```

**Rules:**
- `ui/` is managed by shadcn CLI — never hand-edit these files
- `domain/` components import from `ui/` and `shared/` — never from other domain folders
- `shared/` components have no domain imports — generic and reusable

---

## App Chrome

### Sidebar

- Background: uses `--sidebar` CSS variable (solid, no glass)
- Width: `calc(var(--spacing) * 72)` (288px)
- Tenant logo + name in header
- Nav items: icon + label
- Active item: `bg-amber-600/20 text-amber-300`
- Inactive item: `text-slate-400 hover:text-white hover:bg-white/5`
- User footer: avatar, name, position
- RTL: Sidebar on the right (use logical `border-e` not `border-r`)
- Mobile: Collapse to drawer overlay

### Top Bar

- Background: solid, sticky (shadcn `SiteHeader` component)
- Height: `h-16`
- Border: `border-b border-border/50`
- Content: page title, global search input, theme toggle (Light/Dark/System), notification bell with count badge, primary action button
- Sticky: `sticky top-0`

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

- Surface: shadcn `Card` or `Table` component
- Columns: Task (title + ref), Blueprint, Stage, Assignee, SLA, Priority, Due
- Pagination: **Manual "Load More" button** (Cursor pagination). Do not use infinite scroll.
- Row click: navigates to task details

Use shadcn `Table` with `@tanstack/react-table`. See `npx shadcn@latest docs table` and the dashboard-01 block for the full pattern.

---

## Stage Timeline

Vertical timeline on task details page:

- Completed stage: emerald check icon, solid line
- Active stage: blue pulse dot, bold text
- Pending stage: grey number, dashed line
- Overdue indicator: red label on active stage
- Pagination: **Automatic Infinite Scroll** using `useInfiniteQuery` + Intersection Observer

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

- Canvas: dashed border area for stage nodes
- Stage cards: fixed-width cards with sequence badge
- Selected stage: focus ring
- Return path: dashed arrow between nodes
- Properties panel: right side panel (left in RTL), sliding drawer on mobile

---

## Forms

- Use shadcn `Field` + `FieldGroup` + `FieldLabel` + `FieldDescription` + `FieldError` (nova pattern)
- For inputs with icons/addons: use `InputGroup` + `InputGroupInput` + `InputGroupAddon`
- Bilingual fields: Arabic required indicator (`*`), English optional
- Date picker: support Hijri display at presentation layer
- Select: use shadcn `Select` with `SelectTrigger`, `SelectContent`, `SelectItem`
- Error: red text below field via `FieldError`

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
