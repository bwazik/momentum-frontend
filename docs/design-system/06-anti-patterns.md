# 06 — Anti-Patterns

> What NOT to do. Check this list before submitting a PR.
> Violations caught in code review must be fixed before merge.

---

## Color Anti-Patterns

### ❌ Hardcoded hex colors instead of tokens

Use Tailwind semantic utilities (`bg-primary`, `text-muted-foreground`) instead of raw hex values. See `docs/design-system/01-tokens.md` for available tokens.

### ❌ Color-only status indicators

Always pair color with a text label. A colored dot alone is not accessible.

### ❌ Wrong SLA colors

Use correct Tailwind semantic colors: `emerald` for on track, `amber` for at risk, `red` for overdue, `slate` for suspended. Never use generic color names like `green`, `yellow`, or `orange`.

### ❌ Arbitrary opacity values

Use standard opacity values (`/50`, `/20`, `/10`). Avoid random numbers like `/37`.

---

## Layout Anti-Patterns

### ❌ Physical direction properties

Use CSS logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `border-s`, `float-start`) instead of physical ones (`ml-`, `pr-`, `text-left`, `border-l`). Breaks RTL otherwise.

### ❌ Fixed widths that break responsiveness

Use responsive utilities (`w-full max-w-4xl`) instead of fixed pixel widths (`w-[800px]`).

### ❌ Missing responsive breakpoints

Always include responsive variants: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` instead of a single `grid-cols-5`.

### ❌ Inline styles for layout

Use Tailwind classes instead of inline `style={{}}` for layout properties.

### ❌ Missing page padding

Main content areas need `p-6` standard page padding.

---

## Component Anti-Patterns

### ❌ Reinventing shadcn components

Check `components/ui/` before building custom. Use shadcn primitives (Button, Card, Badge, etc.) directly.

### ❌ Hand-editing shadcn ui/ files

Never edit files in `components/ui/` — they're CLI-managed. Customize via CSS variables in `globals.css` or wrapper components in `components/domain/`.

### ❌ Domain imports in shared components

Shared components (`components/shared/`) must not import domain types. Use generic props or generics instead.

### ❌ Cross-domain component imports

Domain components should not import from other domain folders. Extract shared UI to `components/shared/`.

### ❌ God components (>200 lines)

Split components by responsibility. Extract sub-components, hooks, and types into separate files.

---

## Typography Anti-Patterns

### ❌ Arbitrary font sizes

Use the design system scale (`text-xs`, `text-sm`, `text-base`, etc.) instead of arbitrary values like `text-[13px]`.

### ❌ Wrong font weight

Use `font-medium` for labels, `font-semibold` for headings, `font-bold` for KPI numbers. Avoid generic `font-bold` on labels.

### ❌ Missing uppercase-tracking on table headers

Table column headers use `text-xs uppercase tracking-wider font-semibold`.

---

## RTL Anti-Patterns

### ❌ Directional icons that don't flip

Add `rtl:rotate-180` to chevrons, arrows, and other directional icons.

### ❌ Hardcoded text alignment

Use logical alignment (`text-start`, `text-end`) instead of `text-left`/`text-right`.

### ❌ English-only (or Arabic-only) strings in user-facing code

Use translation keys via `next-intl` (`useTranslations()` / `getTranslations()`) instead of hardcoded strings. Translation files are in `messages/{locale}.json`.

---

## Data Fetching Anti-Patterns

### ❌ useEffect + fetch

Use TanStack Query hooks (`useQuery`, `useMutation`) instead of manual `useEffect` + `fetch`.

### ❌ Hardcoded query keys

Use the centralized query key factory from `lib/api/query-keys.ts` instead of string literals.

### ❌ API data in Zustand

Server state belongs in TanStack Query cache, not in Zustand. Zustand is for UI-only state.

### ❌ Hand-written API types

Import types from `lib/generated/api-types.ts` — never hand-write API response interfaces.

### ❌ Missing mutation invalidation

Always call `queryClient.invalidateQueries()` in `onSuccess` to keep related lists fresh.

---

## State Anti-Patterns

### ❌ Missing states (loading/empty/error)

Every data-fetching component must handle all 4 states: loading (skeleton), error (message + retry), empty (icon + headline + CTA), success (data).

### ❌ `console.log` in committed code

Remove all `console.log` before committing. Use error boundaries and structured error handling instead.

---

## Performance Anti-Patterns

### ❌ Heavy animations on scrolling elements

Avoid backdrop-blur or GPU-heavy effects on individual list rows. Apply to the container instead.

### ❌ Animating expensive properties

Prefer `transform` and `opacity` over `width`, `height`, or `top`/`left` — the former are GPU-composited, the latter trigger layout recalculation.

### ❌ Missing dynamic imports for heavy components

Use `next/dynamic` for chart libraries, canvas-based components, and other heavy modules not needed on initial render.

---

## Security Anti-Patterns

### ❌ localStorage for auth

Never store tokens in localStorage. Sanctum HttpOnly cookies handle auth automatically via `credentials: 'include'`.

### ❌ dangerouslySetInnerHTML without sanitization

Avoid `dangerouslySetInnerHTML`. If absolutely required, sanitize with DOMPurify first.

### ❌ Trusting client-side permission checks

Hide/disable UI based on capabilities for UX, but never block access client-side — the server enforces permissions and returns 403.
