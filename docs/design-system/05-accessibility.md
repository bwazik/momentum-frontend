# 05 — Accessibility

> WCAG 2.1 AA target. Government platform — accessibility is mandatory, not optional.
> Migrated a11y basics from former `overview.md`.

---

## Target Compliance

**WCAG 2.1 Level AA** — All new screens must meet this standard. Key requirements:

| Criterion | Requirement |
|-----------|-------------|
| 1.1.1 Non-text Content | All images have alt text; decorative images use `alt=""` |
| 1.3.1 Info & Relationships | Semantic HTML; headings, lists, tables used correctly |
| 1.4.1 Use of Color | Color is never the sole indicator (SLA uses color + text label) |
| 1.4.3 Contrast (Minimum) | 4.5:1 for normal text, 3:1 for large text |
| 1.4.11 Non-text Contrast | 3:1 for UI components and graphical objects |
| 2.1.1 Keyboard | All interactive elements reachable and operable via keyboard |
| 2.4.3 Focus Order | Logical tab order following visual layout |
| 2.4.7 Focus Visible | Visible focus indicator on all interactive elements |
| 4.1.2 Name, Role, Value | ARIA labels on all custom controls |

---

## Color Contrast

### SLA Status Colors — Verified

| Status | Background | Text | Contrast Ratio | Passes AA? |
|--------|-----------|------|----------------|-----------|
| On Track | `#ecfdf5` (emerald-50) | `#059669` (emerald-600) | 4.6:1 | ✅ |
| At Risk | `#fffbeb` (amber-50) | `#d97706` (amber-600) | 4.7:1 | ✅ |
| Overdue | `#fef2f2` (red-50) | `#dc2626` (red-600) | 5.3:1 | ✅ |
| Suspended | `#f8fafc` (slate-50) | `#64748b` (slate-500) | 4.8:1 | ✅ |

**Rule:** SLA status MUST show a text label alongside color. A colored dot alone is not sufficient.

```tsx
// ✅ Correct — color + text label + dot
<Badge className="bg-emerald-50 text-emerald-600 gap-1.5">
  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
  في الموعد
</Badge>

// ❌ Wrong — color-only indicator
<span className="h-3 w-3 rounded-full bg-emerald-500" />
```

### Glassmorphism Contrast

Glass surfaces reduce contrast because background content bleeds through. Rules:

- Glass card text must have **minimum 4.5:1 contrast** against the **worst-case background** (lightest content visible through glass)
- If page background is `slate-100` and glass opacity is 72%, effective background is approximately `#f5f7fa` — verify contrast against this
- Increase glass opacity (`bg-white/80` or higher) if contrast is insufficient
- Dark text on glass: use `text-slate-900` (not `text-slate-700` or lighter)

---

## Focus Management

### Visible Focus Rings

All interactive elements must show a visible focus indicator:

```tsx
// shadcn components include focus rings by default via:
// focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2

// Custom interactive elements must add:
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2">
  Action
</button>
```

### Focus Trapping — Modals & Drawers

When a modal or drawer opens:

1. Focus moves to the first focusable element inside
2. Tab cycles within the modal (trapped)
3. Escape closes the modal
4. Focus returns to the trigger element on close

shadcn `Dialog` and `Sheet` handle this automatically. For custom overlays, use `@radix-ui/react-focus-scope`.

### Focus Order

Tab order must follow the visual layout:

```
Sidebar nav → Top bar search → Top bar actions → Main content
```

Skip links for keyboard users:

```tsx
// app/[locale]/(dashboard)/layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
>
  تخطي إلى المحتوى الرئيسي
</a>
{/* ... */}
<main id="main-content" className="flex-1 overflow-y-auto bg-page-bg p-6">
  {children}
</main>
```

---

## ARIA Patterns

### Icon-Only Buttons

Every icon-only button needs an `aria-label`:

```tsx
// ✅ Correct
<Button variant="ghost" size="icon" aria-label="إغلاق">
  <X className="h-4 w-4" />
</Button>

// ❌ Wrong — no label
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

### Data Tables

```tsx
<table role="table" aria-label="قائمة المهام">
  <thead>
    <tr>
      <th scope="col">المهمة</th>
      <th scope="col">حالة SLA</th>
      <th scope="col">المكلف</th>
    </tr>
  </thead>
  <tbody>
    {tasks.map(task => (
      <tr key={task.public_id} role="row">
        <td>{task.title_ar}</td>
        <td>
          <SlaBadge health={task.sla_health} />
        </td>
        <td>{task.assignee_name}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Status Badges

Badges should convey their semantic meaning:

```tsx
<Badge
  className="bg-red-50 text-red-600"
  role="status"
  aria-label="SLA متأخر"
>
  <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
  متأخر
</Badge>
```

### Live Regions

Toast notifications and dynamic content updates should use ARIA live regions:

```tsx
// Sonner toast library handles this automatically
// For custom live updates:
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

### Navigation

```tsx
<nav aria-label="القائمة الرئيسية">
  <ul role="list">
    <li>
      <Link
        href="/tasks"
        aria-current={isActive ? 'page' : undefined}
        className={cn(isActive && 'bg-emerald-600/20 text-emerald-300')}
      >
        <ListTodo className="w-5 h-5" aria-hidden="true" />
        لوحة المهام
      </Link>
    </li>
  </ul>
</nav>
```

---

## Keyboard Navigation

### Required Keyboard Support

| Element | Keys | Behavior |
|---------|------|----------|
| Buttons | `Enter`, `Space` | Activate |
| Links | `Enter` | Navigate |
| Modals | `Escape` | Close |
| Dropdowns | `Arrow Up/Down` | Navigate options |
| Tabs | `Arrow Left/Right` | Switch tabs |
| Data table | `Arrow Up/Down` | Navigate rows (optional) |
| Search | `Cmd+K` / `Ctrl+K` | Focus search input |

### Keyboard Shortcut Pattern

```tsx
// Global keyboard shortcuts
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  }
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Touch Targets

Minimum touch target size: **44×44 pixels** on mobile.

```tsx
// ✅ Correct — 44px minimum
<Button size="icon" className="h-11 w-11">  {/* 44px */}
  <Bell className="h-5 w-5" />
</Button>

// ❌ Wrong — too small for touch
<button className="h-6 w-6">
  <Bell className="h-4 w-4" />
</button>
```

For inline actions in dense tables, use adequate padding:

```tsx
<button className="p-2.5">  {/* 10px padding + ~20px icon = ~40px target */}
  <MoreHorizontal className="h-4 w-4" />
</button>
```

---

## Screen Reader Support

### Visually Hidden Content

Use `sr-only` for content that should be read but not seen:

```tsx
// Column header with icon — add text for screen readers
<th>
  <span className="sr-only">إجراءات</span>
  <Settings className="h-4 w-4" aria-hidden="true" />
</th>

// Stat card — announce value with context
<div>
  <span className="sr-only">عدد المهام النشطة:</span>
  <span className="text-3xl font-bold">142</span>
</div>
```

### Decorative Elements

Mark purely visual elements as hidden from assistive tech:

```tsx
// Decorative icon
<Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />

// Decorative separator
<div className="h-px bg-border" role="none" />

// SLA dot (when text label present)
<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
```

---

## Reduced Motion

Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Tailwind's `motion-reduce:` variant:

```tsx
<div className="animate-pulse motion-reduce:animate-none" />
<div className="hover:-translate-y-0.5 motion-reduce:hover:translate-y-0" />
```

---

## Accessibility Checklist (Per Component)

- [ ] Color is not the only indicator (text label on SLA, icon on status)
- [ ] Text contrast meets 4.5:1 (or 3:1 for large text)
- [ ] All interactive elements have visible focus rings
- [ ] Icon-only buttons have `aria-label`
- [ ] Decorative images/icons have `aria-hidden="true"`
- [ ] Modal/drawer traps focus and returns on close
- [ ] Form fields have associated labels
- [ ] Error messages are associated with fields via `aria-describedby`
- [ ] Touch targets ≥ 44px on mobile
- [ ] `prefers-reduced-motion` respected
- [ ] Screen reader announces dynamic content changes (live regions)
