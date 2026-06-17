# 02 — Glassmorphism & Liquid Glass (Deferred)

> ⏱ **This feature is deferred.** Glass effects are not yet implemented. CSS variables, components, and utility classes documented below do not exist in the current codebase. This file serves as a design reference for future implementation.

---

## Concept

Liquid Glass creates a sense of **depth and spatial hierarchy** through translucent surfaces, blur, and luminance borders. The effect would be inspired by Apple's visionOS Liquid Glass aesthetic.

**When to use glass:** Cards, panels, modals, sidebars, stat cards — surfaces that float above the page background.

**When NOT to use glass:** Dense data tables, form inputs, small badges, text-heavy content areas where blur reduces readability.

---

## Implementation Plan

When this feature is picked up:

1. Add CSS variables to `app/globals.css` (`:root` and `.dark`):
   - `--color-surface-glass`, `--color-border-glass`
   - `--shadow-glass`, `--blur-glass`
2. Register them in `@theme inline`
3. Create a `.glass` utility class via `@utility`
4. Apply to shadcn `Card` components via `className`

See [01-tokens.md](01-tokens.md) for token conventions and `02-glassmorphism.md` in the deferred spec for the full GlassCard component and usage examples.

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
