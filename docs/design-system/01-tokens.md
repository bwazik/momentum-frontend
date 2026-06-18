# 01 — Design Tokens

> Map to Tailwind CSS v4 `@theme` / CSS variables at scaffold.

---

## Brand

| Token | Value | Tailwind | CSS Variable | Usage |
|-------|-------|----------|-------------|-------|
| primary | `#9A3B00` | `bg-primary` | `--color-primary` | CTAs, active nav, buttons |
| primary-foreground | `#ffffff` | `text-primary-foreground`| `--color-primary-foreground` | Text on primary buttons |

**Tenant Override:** `--color-primary` is injected from `/api/v1/tenant/branding` when the branding API is available. Default to amber until then.

---

<!-- Neutral: not yet implemented. See globals.css for current border/sidebar colors. -->

---

<!-- Semantic (SLA) colors: not yet tokenized in globals.css. Use raw Tailwind classes (text-emerald-600, bg-amber-50, etc.) until tokens are added. -->

---

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| font-sans | `Geist, system-ui, sans-serif` | English UI text (load via `next/font`) |
| font-arabic | `IBM Plex Sans Arabic` | Primary Arabic UI text (loaded via `next/font`) |
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

Derived from a single `--radius` variable (`0.875rem`). Components compute their radius from this base:

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.875rem` (14px) | Base radius |
| radius-sm | `calc(var(--radius) * 0.6)` ≈ 8px | Small badges |
| radius-md | `calc(var(--radius) * 0.8)` ≈ 11px | Inputs, selects |
| radius-lg | `var(--radius)` ≈ 14px | Buttons, dropdowns |
| radius-xl | `calc(var(--radius) * 1.4)` ≈ 20px | Cards, panels, modals |
| radius-2xl | `calc(var(--radius) * 1.8)` ≈ 25px | Hero cards (dashboard) |
| radius-full | `9999px` | Avatars, priority pills, dots |

---

## Shadows

| Token | CSS | Tailwind | Usage |
|-------|-----|----------|-------|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | Cards at rest |
| shadow-md | `0 4px 6px rgba(0,0,0,0.07)` | `shadow-md` | Dropdowns, popovers |
| shadow-lg | `0 10px 15px rgba(0,0,0,0.1)` | `shadow-lg` | Modals |
| shadow-xl | `0 20px 25px rgba(0,0,0,0.1)` | `shadow-xl` | Stat card hover |
<!-- Glass shadows deferred — see 02-glassmorphism.md -->

---

<!-- Z-index tokens not yet implemented in globals.css. shadcn components handle their own stacking. -->

---

## Motion & Transitions

<!-- Duration/easing not yet tokenized in globals.css. Use standard Tailwind duration utilities. -->

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

See `app/globals.css` for the full `@theme inline`, `:root`, and `.dark` variable declarations. The file is the single source of truth for all CSS custom properties.

---

## Dark Mode & Theming

The system is prepared from day one for Light Mode, Dark Mode, and System Theme support. We use `next-themes` to manage the `dark` class on the HTML element.

See `globals.css:root` and `globals.css .dark` for light/dark values.

---

## Tenant Override

The `--color-primary` CSS variable is injected from `/api/v1/tenant/branding` at runtime:

```tsx
// Fetch branding and apply
const branding = useBranding(); // TanStack Query hook

  useEffect(() => {
    if (branding?.primary_color) {
      document.documentElement.style.setProperty('--color-primary', branding.primary_color);
    }
  }, [branding]);
```

Default to amber (`#f59e0b`) until branding API is available.
