# Design System — Momentum Frontend

> Inspired by Apple's macOS / visionOS Liquid Glass aesthetic.

---

## Reading Order

| # | File | When to Read |
|---|------|-------------|
| 01 | [01-tokens.md](01-tokens.md) | Any UI work — colors, typography, spacing, motion |
| 02 | [02-glassmorphism.md](02-glassmorphism.md) | Building cards, surfaces, overlays, modals |
| 03 | [03-components.md](03-components.md) | Using or creating components |
| 04 | [04-layout-patterns.md](04-layout-patterns.md) | Page layouts, grids, responsive, navigation |
| 05 | [05-accessibility.md](05-accessibility.md) | Any interactive element, forms, data display |
| 06 | [06-anti-patterns.md](06-anti-patterns.md) | Code review, before PR submission |

---

## Philosophy

- **Liquid Glass clarity** — Transparent, layered surfaces inspired by Apple's visionOS and macOS Liquid Glass. Depth through blur, light refraction, and subtle borders.
- **Government-grade legibility** — Despite glass effects, text contrast meets WCAG AA. Data density for enterprise users.
- **Consistency** — Reuse sidebar + header shell across all screens. Never invent one-off patterns.
- **RTL-first** — Arabic is the primary locale. Every layout uses logical properties. English has full feature parity.
- **Token-driven** — All visual values derive from design tokens. No hardcoded hex colors or arbitrary spacing.

---

## Design Inspirations

| Source | What We Take |
|--------|-------------|
| Apple visionOS / macOS Liquid Glass | Frosted glass surfaces, depth layering, luminance borders |
| Linear | Clean navigation, keyboard-first, fast interactions |
| Jira | Dense data tables, board views, workflow visualization |
| Notion | Bilingual content handling, clean typography |

---

## Quick Reference

### SLA Health Colors

| Status | Background | Text | Dot | Label (AR) | Label (EN) |
|--------|------------|------|-----|-----------|-----------|
| On Track | `bg-emerald-50` | `text-emerald-600` | `bg-emerald-500` | في الموعد | On Track |
| At Risk | `bg-amber-50` | `text-amber-600` | `bg-amber-500` | قريب من الموعد | At Risk |
| Overdue | `bg-red-50` | `text-red-600` | `bg-red-500` | متأخر | Overdue |
| Suspended | `bg-slate-50` | `text-slate-500` | `bg-slate-400` | معلق | Suspended |

### Key Dimensions

| Element | Value |
|---------|-------|
| Sidebar width | 256px (`w-64`) |
| Content padding | `p-6` (24px) |
| Card radius | `rounded-xl` (12px) |
| Button radius | `rounded-lg` (8px) |
| Avatar radius | `rounded-full` |
| Gap between cards | `gap-4` (16px) |
| Section gap | `gap-6` (24px) |

---

## Relationship to Code

Design system documentation describes the **intended design language**. Implementation uses:

- **Tailwind CSS v4** `@theme` directive for design tokens
- **shadcn/ui** components customized via CSS variables
- **CSS custom properties** for tenant-overridable values (`--color-primary`)
- **`cn()` utility** for conditional class merging
