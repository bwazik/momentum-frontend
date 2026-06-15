# 01 — Design Tokens

> Map to Tailwind CSS v4 `@theme` / CSS variables at scaffold.

---

## Brand

| Token | Value | Tailwind | CSS Variable | Usage |
|-------|-------|----------|-------------|-------|
| primary | `#10b981` | `bg-primary` | `--color-primary` | CTAs, active nav, success SLA |
| primary-hover | `#059669` | `hover:bg-primary-hover` | `--color-primary-hover` | Button hover |
| primary-muted | `emerald-600/20` | `bg-primary-muted` | `--color-primary-muted` | Active sidebar item bg |
| primary-foreground | `#ffffff` | `text-primary-foreground`| `--color-primary-foreground` | Text on primary buttons |

**Tenant Override:** `--color-primary` is injected from `/api/v1/tenant/branding` when the branding API is available. Default to emerald until then.

---

## Neutral

| Token | Value | Tailwind | CSS Variable | Usage |
|-------|-------|----------|-------------|-------|
| sidebar | `#0f172a` | `slate-900` | `--color-sidebar` | Sidebar background |
| page-bg | `#f1f5f9` | `slate-100` | `--color-page-bg` | Main canvas |
| surface | `#ffffff` | `white` | `--color-surface` | Cards, tables, modals |
| surface-glass | `rgba(255,255,255,0.72)` | — | `--color-surface-glass` | Glass card backgrounds |
| border | `#e2e8f0` | `slate-200` | `--color-border` | Card/table borders |
| border-glass | `rgba(255,255,255,0.25)` | — | `--color-border-glass` | Glass surface borders |
| text-primary | `#0f172a` | `slate-900` | `--color-text-primary` | Headings |
| text-secondary | `#64748b` | `slate-500` | `--color-text-secondary` | Labels, meta |
| text-muted | `#94a3b8` | `slate-400` | `--color-text-muted` | Placeholders |

---

## Semantic (SLA & Status)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| success | `#10b981` | `emerald-500/600` | On track, completed |
| warning | `#f59e0b` | `amber-500` | At risk |
| danger | `#ef4444` | `red-500` | Overdue, critical priority |
| info | `#3b82f6` | `blue-500` | Active stage, info badges |
| suspended | `#64748b` | `slate-500` | Suspended task SLA |
| purple-accent | `#8b5cf6` | `purple-500` | Completion rate, analytics |

**Rule:** Semantic colors must always be paired with a text label. Color-only indicators violate accessibility standards.

---

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| font-sans | `Geist, system-ui, sans-serif` | English UI text (load via `next/font`) |
| font-arabic | `Alexandria` | Primary Arabic UI text (load via `next/font`) |
| text-xs | 12px / `0.75rem` | Table headers, badge text, labels |
| text-sm | 14px / `0.875rem` | Body text, table cells, form inputs |
| text-base | 16px / `1rem` | Descriptions, longer content |
| text-lg | 18px / `1.125rem` | Page titles |
| text-xl | 20px / `1.25rem` | Task detail title, modal headings |
| text-2xl | 24px / `1.5rem` | Dashboard stat numbers |
| text-3xl | 30px / `1.875rem` | Executive dashboard KPI |
| font-normal | 400 | Body text |
| font-medium | 500 | Labels, nav items |
| font-semibold | 600 | Headings, nav active, badges |
| font-bold | 700 | Dashboard KPI numbers |
| uppercase-tracking | `uppercase tracking-wider` | Table column headers |

---

## Spacing Scale

Tailwind default 4px base. Common values:

| Class | px | Usage |
|-------|-----|-------|
| `p-1` / `gap-1` | 4px | Tight spacing (badge padding) |
| `p-2` / `gap-2` | 8px | Icon spacing, badge groups |
| `p-3` / `gap-3` | 12px | Form field gaps |
| `p-4` / `gap-4` | 16px | Grid gaps, card internal |
| `p-5` | 20px | Stat card padding |
| `p-6` / `gap-6` | 24px | Page/section padding |
| `p-8` | 32px | Major section separation |

---

## Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| radius-sm | 4px | `rounded-sm` | Small badges |
| radius-md | 6px | `rounded-md` | Inputs, selects |
| radius-lg | 8px | `rounded-lg` | Buttons, dropdowns |
| radius-xl | 12px | `rounded-xl` | Cards, panels, modals |
| radius-2xl | 16px | `rounded-2xl` | Hero cards (dashboard) |
| radius-full | 9999px | `rounded-full` | Avatars, priority pills, dots |

---

## Shadows

| Token | CSS | Tailwind | Usage |
|-------|-----|----------|-------|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | Cards at rest |
| shadow-md | `0 4px 6px rgba(0,0,0,0.07)` | `shadow-md` | Dropdowns, popovers |
| shadow-lg | `0 10px 15px rgba(0,0,0,0.1)` | `shadow-lg` | Modals |
| shadow-xl | `0 20px 25px rgba(0,0,0,0.1)` | `shadow-xl` | Stat card hover |
| shadow-glass | `0 8px 32px rgba(0,0,0,0.08)` | Custom | Glass surfaces |
| shadow-glow | `0 0 20px rgba(16,185,129,0.15)` | Custom | Primary action glow |

---

## Z-Index

| Token | Value | Usage |
|-------|-------|-------|
| base | 0 | Default content |
| dropdown | 100 | Dropdown menus, select options |
| sticky | 200 | Sticky headers, filter bars |
| overlay | 300 | Backdrop overlays |
| modal | 400 | Modals, dialogs |
| toast | 500 | Toast notifications |
| tooltip | 600 | Tooltips |

---

## Motion & Transitions

| Token | Value | Usage |
|-------|-------|-------|
| duration-fast | `150ms` | Hover states, toggles |
| duration-normal | `200ms` | Card transitions, accordion |
| duration-slow | `300ms` | Modal open/close, page transitions |
| duration-slower | `500ms` | Complex animations, chart reveals |
| easing-default | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing |
| easing-spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bounce/spring for interactive elements |

### Animation Patterns

| Pattern | Implementation | Usage |
|---------|---------------|-------|
| Card hover | `transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5` | Stat cards, task cards |
| Button press | `active:scale-[0.98] transition-transform` | All clickable buttons |
| SLA pulse | `animate-pulse` on dot element | Active stage indicator |
| Skeleton | `animate-pulse` on background | Loading placeholders |
| Slide in | `animate-in slide-in-from-end` | Sidebar drawers, panels |
| Fade in | `animate-in fade-in` | Modal overlays |

**Performance:** Avoid animating `width`, `height`, or `top`/`left`. Prefer `transform` and `opacity` which trigger GPU compositing.

---

## Tailwind v4 `@theme` Configuration

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Brand */
  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-primary-muted: oklch(0.65 0.15 160 / 0.2);

  /* Neutral */
  --color-sidebar: #0f172a;
  --color-page-bg: #f1f5f9;
  --color-surface: #ffffff;
  --color-surface-glass: oklch(1 0 0 / 0.72);
  --color-border-glass: oklch(1 0 0 / 0.25);

  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;

  /* Glass */
  --shadow-glass: 0 8px 32px oklch(0 0 0 / 0.08);
  --blur-glass: 16px;

  /* Radius */
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

---

## Dark Mode & Theming

The system is prepared from day one for Light Mode, Dark Mode, and System Theme support. We use `next-themes` to manage the `dark` class on the HTML element.

| Token | Light | Dark |
|-------|-------|------|
| page-bg | `slate-100` | `slate-950` |
| surface | `white` | `slate-900` |
| surface-glass | `rgba(255,255,255,0.72)` | `rgba(15,23,42,0.72)` |
| border | `slate-200` | `slate-800` |
| border-glass | `rgba(255,255,255,0.25)` | `rgba(255,255,255,0.08)` |
| text-primary | `slate-900` | `slate-100` |
| text-secondary | `slate-500` | `slate-400` |

Glass effects in dark mode use a darker base with more visible luminance borders. components automatically respond via Tailwind's `dark:` variant mapping in `@theme`.

---

## Tenant Override

The `--color-primary` CSS variable is injected from `/api/v1/tenant/branding` at runtime:

```tsx
// Fetch branding and apply
const branding = useBranding(); // TanStack Query hook

useEffect(() => {
  if (branding?.primary_color) {
    document.documentElement.style.setProperty('--color-primary', branding.primary_color);
    document.documentElement.style.setProperty('--color-primary-hover', darken(branding.primary_color));
  }
}, [branding]);
```

Default to emerald (`#10b981`) until branding API is available.
