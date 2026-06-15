# 02 — Glassmorphism & Liquid Glass

> Inspired by Apple's macOS Sequoia / visionOS Liquid Glass aesthetic.
> Use glass effects for layered surfaces. Never sacrifice legibility for visual flair.

---

## Philosophy

Liquid Glass creates a sense of **depth and spatial hierarchy** through translucent surfaces, blur, and luminance borders. It communicates that UI elements exist in layers — content behind glass is visible but receded, while the glass surface is the focus.

**When to use glass:** Cards, panels, modals, sidebars, stat cards — surfaces that float above the page background.

**When NOT to use glass:** Dense data tables, form inputs, small badges, text-heavy content areas where blur reduces readability.

---

## Core Glass Recipe

The Liquid Glass effect combines four layers:

```
┌─────────────────────────────────┐
│ 1. Luminance border (subtle)   │  ← White/light inner border for depth
│ ┌─────────────────────────────┐ │
│ │ 2. Translucent background   │ │  ← Semi-transparent white/dark
│ │ ┌─────────────────────────┐ │ │
│ │ │ 3. Backdrop blur        │ │ │  ← Blurs content behind
│ │ │ ┌─────────────────────┐ │ │ │
│ │ │ │ 4. Content (sharp)  │ │ │ │  ← Text and icons remain crisp
│ │ │ └─────────────────────┘ │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Implementation

### Base Glass Card

```tsx
// components/shared/glass-card.tsx
import { cn } from '@/lib/utils/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle';
  children: React.ReactNode;
}

export function GlassCard({
  variant = 'default',
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        // Base glass
        'rounded-xl border backdrop-blur-md',
        'transition-all duration-200',
        // Variants
        variant === 'default' && [
          'bg-white/72 border-white/25',
          'shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
        ],
        variant === 'elevated' && [
          'bg-white/80 border-white/30',
          'shadow-[0_12px_40px_rgba(0,0,0,0.12)]',
          'hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)]',
          'hover:-translate-y-0.5',
        ],
        variant === 'subtle' && [
          'bg-white/50 border-white/15',
          'shadow-sm',
        ],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### CSS Custom Properties

```css
/* app/globals.css — glass variables */
@theme {
  --color-surface-glass: oklch(1 0 0 / 0.72);
  --color-border-glass: oklch(1 0 0 / 0.25);
  --shadow-glass: 0 8px 32px oklch(0 0 0 / 0.08);
  --blur-glass: 16px;
}

/* Utility class for reuse */
.glass {
  background: var(--color-surface-glass);
  border: 1px solid var(--color-border-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  box-shadow: var(--shadow-glass);
}
```

### Tailwind Utility Approach

```tsx
// Direct Tailwind classes (no component needed)
<div className="rounded-xl bg-white/72 border border-white/25 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
  {/* Content */}
</div>
```

---

## Glass in Specific UI Elements

### Stat Cards (Executive Dashboard)

Stat cards use the `elevated` glass variant with hover lift:

```tsx
<GlassCard variant="elevated" className="p-5">
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-medium text-text-secondary">المهام النشطة</span>
    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
      <ListTodo className="w-5 h-5 text-blue-500" />
    </div>
  </div>
  <div className="text-3xl font-bold text-text-primary">142</div>
  <div className="text-xs text-emerald-600 mt-1">+12% من الأسبوع الماضي</div>
</GlassCard>
```

### Modal / Dialog Overlay

Modals use glass backdrop + elevated glass surface:

```tsx
// Glass backdrop
<div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-overlay" />

// Glass modal surface
<div className="fixed inset-0 z-modal flex items-center justify-center p-4">
  <div className="w-full max-w-lg rounded-2xl bg-white/85 border border-white/30 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] p-6">
    {/* Modal content */}
  </div>
</div>
```

### Sidebar (Optional Glass)

The sidebar uses a dark glass effect on top of `slate-900`:

```tsx
<aside className="w-64 bg-slate-900/95 backdrop-blur-xl border-e border-white/5">
  {/* Navigation items */}
</aside>
```

### Top Bar

Sticky top bar with glass effect for depth when content scrolls beneath:

```tsx
<header className="sticky top-0 z-sticky h-16 border-b border-border/50 bg-white/80 backdrop-blur-md">
  {/* Page title, search, actions */}
</header>
```

### Tooltip / Popover

Small glass surfaces for tooltips and popovers:

```tsx
<div className="rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-2 text-sm text-white shadow-lg">
  {/* Tooltip content */}
</div>
```

---

## Dark Mode Glass

Glass surfaces automatically invert via Tailwind dark mode utilities (`dark:`):

| Property | Light Mode | Dark Mode |
|----------|-----------|-----------|
| Background | `bg-white/72` | `bg-slate-900/72` |
| Border | `border-white/25` | `border-white/8` |
| Blur | `backdrop-blur-md` (16px) | `backdrop-blur-md` (16px) |
| Shadow | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.3)` |
| Luminance | White glow on top edge | Subtle white glow on top edge |
| Text | `text-slate-900` | `text-slate-100` |

```tsx
// Dark mode variant
<div className={cn(
  'rounded-xl backdrop-blur-md',
  'bg-white/72 border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
  'dark:bg-slate-900/72 dark:border-white/8 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
)}>
  {children}
</div>
```

---

## Luminance Borders (Advanced)

For a more authentic Liquid Glass look, add a subtle gradient border that simulates light refraction:

```css
/* Inner luminance border effect */
.glass-luminance {
  position: relative;
}

.glass-luminance::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0.05)
  );
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  pointer-events: none;
}
```

Use sparingly — on hero cards and primary surfaces only. Not on every card.

---

## Performance Considerations

### Backdrop Blur Cost

`backdrop-filter: blur()` triggers a GPU-composited layer. On low-end devices:

- **Limit concurrent glass surfaces** to ~10-15 on a single viewport
- **Avoid glass on scrolling lists** — each row as glass would be too expensive
- **Reduce blur radius** on mobile: use `backdrop-blur-sm` (8px) instead of `backdrop-blur-md` (16px)
- **Provide solid fallback** for browsers without `backdrop-filter` support

```css
/* Fallback for no backdrop-filter support */
@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: rgba(255, 255, 255, 0.95);  /* Nearly opaque fallback */
  }
}
```

### Reduced Motion

Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .glass-card {
    transition: none;
  }
  .glass-card:hover {
    transform: none;
  }
}
```

---

## Decision Tree: When to Use Glass

```
Is this a surface that floats above the page?
├── YES: Is it a dense data display (table rows, long lists)?
│   ├── YES → Use solid white surface (no glass)
│   └── NO: Is it interactive (form inputs, small controls)?
│       ├── YES → Use solid surface with standard border
│       └── NO → ✅ Use glass (cards, panels, modals, overlays)
└── NO → Use page background or solid surface
```

---

## What NOT To Do

- **Don't glass everything** — Reserve for primary surfaces. Data tables, form inputs, and dense text stay solid.
- **Don't use heavy blur on mobile** — Reduce to `backdrop-blur-sm` or use solid fallback.
- **Don't skip the border** — Glass without a border loses its edge definition. Always include `border-white/25` or equivalent.
- **Don't forget contrast** — Text on glass must meet WCAG AA (4.5:1 for body text). If background content bleeds through, increase background opacity.
- **Don't animate blur** — Transitioning `backdrop-filter` values causes jank. Animate `opacity` or `transform` instead.
- **Don't nest glass** — A glass card inside a glass modal creates compounding blur that's unreadable. Only the topmost surface should be glass.
