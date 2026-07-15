# Spec: Localization & Calendar

> **Number:** 020
> **Date:** 2026-07-12
> **Status:** `completed`
> **Milestone:** F6 — Admin, Org, Help, Onboarding
> **Depends on:** `001-core-shell`, `008-organization-structure`
> **Backend spec:** `../backend/specs/018-localization-calendar/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** Antigravity
> **Branch:** `feat/020-localization-calendar`
> **Base branch:** `main`

---

## Problem

Government organizations in GCC countries operate on the Hijri (Islamic) calendar for official correspondence, public holidays, task due dates, and delegation periods. Today, Momentum displays all dates in Gregorian format only. Users must mentally convert between calendars every time they enter a due date referenced in official Hijri correspondence, configure a public holiday, or read a task deadline in an official report.

This creates three concrete friction points:

1. **Date entry errors** — Users copy Hijri dates from official letters, must convert manually before entering in Momentum, and frequently introduce off-by-one or off-by-a-month errors because Hijri months shift each year.
2. **Ambiguous date display** — Staff reading task deadlines see "July 26, 2025" but the official SLA letter says "1 محرم 1447" — they cannot confirm at a glance whether they are the same date.
3. **SLA miscalculations** — Departments that follow a different working schedule than the tenant default (e.g., a department with Friday–Saturday weekend vs. the tenant's Thursday–Friday weekend) currently have their SLA timers computed against the wrong calendar, causing deadlines to appear breached when they are actually on track.

The backend (Spec 018) now provides stable APIs for: Hijri ↔ Gregorian conversion, a localization context endpoint, additive `*_hijri` companion fields on all major date resources, and optional `calendar_system` parameters on every form and filter that accepts dates. The frontend needs a complete UI layer to expose these capabilities.

---

## Goal

Deliver a platform-wide localization layer that makes Momentum bilingual in both language _and_ calendar. Specifically:

1. **Dual date display** — every date field shown to the user renders both the Gregorian value (existing) and its Hijri equivalent (new) using the `*_hijri` companion fields returned by the API.
2. **Hijri date input** — forms that accept dates (task due date, delegation dates, public holiday date, confidential access expiry) support Hijri entry via a `calendar_system` toggle, converting to Gregorian before submitting.
3. **Calendar system filter** — all list screens with a date range filter (task board, global search, follow-up, analytics reports, audit trail) expose a `calendar_system` toggle so users can type Hijri range boundaries.
4. **Department calendar assignment** — the Organization screen's existing department create/edit dialogs gain a working calendar picker, and the departments table gains a calendar column.
5. **Date conversion widget** — a compact "Date Converter" utility in the header lets users perform ad-hoc Gregorian ↔ Hijri conversions on demand.
6. **Localization context indicator** — the user menu / preferences area surfaces the resolved locale, timezone, and calendar variant so users can verify their context.

---

## User Stories

### All Authenticated Users

- As an **internal user**, I want every task due date, stage entered-at date, and SLA deadline displayed with its Hijri equivalent, so that I can read the date in the calendar used in official government correspondence without converting manually.
- As an **internal user**, I want a "Date Converter" widget that converts any date between Gregorian and Hijri on demand, so that I can quickly resolve date references from official letters.
- As an **internal user**, I want the UI to show my resolved locale, direction, and timezone in my preferences panel, so that I can confirm the platform is configured correctly for my organization.

### Task Creators & Editors

- As a **task creator**, I want to enter a task due date in Hijri format, so that I can copy the deadline directly from an official Hijri letter without converting it first.
- As an **internal user creating a delegation**, I want to enter delegation start/end dates in Hijri, so that official delegation orders (which use Hijri dates) can be entered accurately.
- As a **tenant admin managing public holidays**, I want to enter a holiday date in Hijri, so that religious holidays declared in Hijri can be configured without manual conversion.
- As a **tenant admin managing confidential access**, I want to set an access expiry date in Hijri, so that access grants tied to an official Hijri date are set correctly.

### Follow-up Specialists & Analytics Users

- As a **follow-up specialist**, I want to filter the task board or follow-up center by a Hijri date range (e.g., all tasks due in Ramadan 1447), so that I can manage tasks referenced in official Hijri correspondence.
- As an **analytics user**, I want to filter executive summary, aging report, and department dashboard by a Hijri date range, so that I can generate reports aligned to fiscal/Hijri quarters.
- As an **audit reviewer**, I want to filter the audit trail by a Hijri date range, so that I can find events tied to a specific Hijri date referenced in official records.

### Tenant Admins

- As a **tenant admin**, I want to assign a specific working calendar to a department, so that SLA timers for tasks in that department use the correct working schedule.
- As a **tenant admin**, I want to clear a department's direct calendar assignment so it falls back to the tenant default, so that I do not need to maintain redundant calendar configurations.
- As a **tenant admin**, I want to see which working calendar is currently assigned to each department in the organization screen, so that I can audit the calendar configuration at a glance.

### System

- As the **system**, I want all Hijri date input submitted to the API with `calendar_system=hijri` so the backend converts it to Gregorian before validation or persistence.
- As the **system**, I want the existing Gregorian date fields to remain the primary date format, with Hijri displayed as additive companion text only, so backward compatibility with existing integrations is preserved.

---

## Acceptance Criteria

### Dual Date Display (Hijri Companion Rendering)

- [x] Task due date on task board rows, task detail page, and task cards displays as dual format: e.g. `٢٦ يوليو ٢٠٢٥ • ١ محرم ١٤٤٧` (Arabic locale) or `Jul 26, 2025 · 1 Muh 1447` (English locale).
- [x] Stage `entered_at` / `exited_at` dates in the stage timeline display their Hijri companion in `text-muted-foreground text-xs` style on a secondary line beneath the primary Gregorian date.
- [x] SLA `warning_at` and `deadline_at` dates in SLA badges and inline timers display the Hijri equivalent on hover (Tooltip), rather than inline, to avoid visual clutter.
- [x] Delegation `starts_at` / `ends_at` in delegation indicators show dual date format.
- [x] Public holiday dates in the Working Calendars tab holiday list show dual format.
- [x] Notification creation timestamps include a Hijri companion rendered in `text-xs text-muted-foreground`.
- [x] Audit event timestamps display dual format (when the audit screen exists).
- [x] When `*_hijri` field is `null` (conversion unavailable), only the Gregorian date is shown — no fallback or error text displayed.
- [x] Dual date display renders correctly in both AR (RTL) and EN (LTR) locales.

### Hijri Date Input — Forms

- [x] The task creation/edit form's due date field shows a `CalendarSystemToggle` (`هجري / ميلادي` — `Hijri / Gregorian`) adjacent to the date input.
- [x] When `calendar_system=hijri` is selected, the date input placeholder changes to `"YYYY-MM-DD (هـ)"` and a hint text `"مثال: ١٤٤٧-٠٢-١٥"` / `"e.g. 1447-02-15"` appears below the input.
- [x] Submitting with `calendar_system=hijri` sends `calendar_system: "hijri"` and the entered Hijri `due_date` in the request body.
- [x] If the backend returns 422 (invalid Hijri date), `toast.error(error.message)` displays the localized backend error.
- [x] The delegation creation/edit form has the same `CalendarSystemToggle` on `starts_at` and `ends_at` fields.
- [x] The public holiday creation/edit form (Organization → Working Calendars tab) has the same toggle on the `holiday_date` field.
- [x] The confidential access override form has the same toggle on the `expires_at` field.
- [x] Switching `calendar_system` clears the date field value to prevent mixed-calendar submissions.
- [x] When toggled back to Gregorian, the date field clears and the placeholder reverts to the standard Gregorian placeholder.

### Calendar System Filter — List Screens

- [x] The Advanced Filters Sheet on the task board includes a `CalendarSystemToggle` that, when set to `hijri`, sends `calendar_system=hijri` in filter params.
- [x] The follow-up board filters have the same `CalendarSystemToggle` for `date_from` / `date_to`.
- [x] The global search task date filters support `calendar_system=hijri`.
- [x] The analytics screens (executive summary, aging report, department dashboard) have the `CalendarSystemToggle` on their date range filters.
- [x] `calendar_system` filter state is stored in URL search params (e.g. `?calendarSystem=hijri`), making it bookmarkable and shareable.
- [x] When `calendarSystem=hijri` is in the URL, the date range inputs display with Hijri placeholders (`1447-01-01`).
- [x] Switching `calendar_system` in a filter clears the date range values to prevent mixed-calendar API submissions.

### Department Calendar Assignment

- [x] The department create/edit dialog (Departments tab in Organization screen) has a new `working_calendar_id` field rendered as a `RtlSelect` populated with active working calendars from `GET /v1/organization/working-calendars`.
- [x] The select includes a sentinel option "تقويم الإيجار الافتراضي" / "Use Tenant Default" (sentinel value `'default'`) that sends `working_calendar_id: null` to the API.
- [x] Saving a department with a direct calendar assignment calls `PUT /v1/organization/departments/{department}` with `working_calendar_id` set to the calendar's `public_id`.
- [x] Saving with "Use Tenant Default" sends `working_calendar_id: null`.
- [x] The Departments tab list table has a new "Working Calendar" column showing the assigned calendar name, or a `"Default"` badge (muted) when no direct assignment exists.
- [x] The Departments tab table column uses data from the `working_calendar` object in the `DepartmentResource` response (populated after backend spec 018).
- [x] Attempting to delete a working calendar that is assigned to a department shows `toast.error(error.message)` with the localized 422 backend message.
- [x] On successful department update, `queryKeys.organization.departments()` and `queryKeys.organization.workingCalendars()` are invalidated.

### Date Conversion Widget

- [x] A "Date Converter" icon button appears in the top bar (between search trigger and notification bell) with `aria-label="Date Converter"` (icon: `CalendarSearch` or `ArrowLeftRight`).
- [x] Clicking opens a shadcn `Dialog` (lazy-loaded via `next/dynamic`) with: source calendar `RtlSelect` (`gregorian` / `hijri`), a date text input (`YYYY-MM-DD`), a "Convert" `Button`, and a result area.
- [x] The result area shows: Gregorian date (primary `text-base font-medium`), Hijri date (secondary `text-sm text-muted-foreground`), and the timezone used (`text-xs`).
- [x] While converting (loading state), a `Skeleton` replaces the result area.
- [x] If an invalid date or out-of-range Hijri date is entered, an inline error message is shown within the dialog (`text-sm text-destructive`) — not a toast, since the dialog is the active context.
- [x] The dialog calls `GET /v1/localization/date-conversion?date={date}&from_calendar={calendar}` via `useDateConversion()`.
- [x] The dialog closes on `Escape` or clicking the backdrop.
- [x] Pressing `Enter` in the date input triggers conversion (same as clicking "Convert").

### Localization Context Indicator

- [x] The user menu dropdown (NavUser → Preferences submenu) shows a "Localization" section with: Resolved Locale (e.g. `ar`), Text Direction (`RTL` / `LTR`), Timezone (e.g. `Asia/Riyadh`), and Hijri Calendar Variant (`islamic-umalqura`).
- [x] This data is fetched from `GET /v1/localization/context` using `useLocalizationContext()` query with `staleTime: 300_000`.
- [x] Rendered as read-only `text-sm` label-value pairs — no editable fields.
- [x] If the fetch fails (network error or non-200), the section is hidden entirely — no error is shown to the user (non-critical metadata).
- [x] The section shows a skeleton during loading (3 short lines matching the shape of label-value pairs).

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] New hook file: `lib/api/hooks/use-localization.ts`:
  - `useLocalizationContext()` — `useQuery` with key `queryKeys.localization.context()`, fetches `GET /v1/localization/context`, `staleTime: 300_000`.
  - `useDateConversion(params, enabled)` — `useQuery` with key `queryKeys.localization.dateConversion(params)`, fetches `GET /v1/localization/date-conversion`, `enabled: !!params?.date && enabled`, `staleTime: Infinity` (deterministic conversion).
- [x] New query key namespace in `lib/api/query-keys.ts`:
  ```ts
  localization: {
    all: ['localization'] as const,
    context: () => [...queryKeys.localization.all, 'context'] as const,
    dateConversion: (params: Record<string, string>) =>
      [...queryKeys.localization.all, 'date-conversion', params] as const,
  }
  ```
- [x] Extend `useUpdateDepartment()` in `lib/api/hooks/use-organization.ts` to accept optional `working_calendar_id: string | null` field. Invalidate `queryKeys.organization.departments()` and `queryKeys.organization.workingCalendars()` on success.
- [x] All existing filter hooks (task board, follow-up, analytics) already forward `filters` as URL params via `apiClient`. No hook changes needed — just pass `calendarSystem` in the filter object when present in `useSearchParams()`.
- [x] No new hooks are needed for form mutations — existing `useCreateTask()`, `useUpdateTask()`, `useCreateDelegation()` etc. will pass `calendar_system` in the body when provided by the form.

### State Management

- [x] `calendarSystem` filter → **URL search params** (`?calendarSystem=hijri`). Bookmarkable, shareable. Use `useSearchParams()` + `router.replace()` pattern.
- [x] `calendar_system` form toggle → **local `useState`** inside the form component. Reset on dialog close.
- [x] Date Converter dialog open/closed → **local `useState`** in the top-bar component (or a minimal Zustand store if the trigger needs to be driven from a keyboard shortcut captured globally).
- [x] Localization context data → **TanStack Query** (server state — never Zustand).

### Query Key Structure

```ts
queryKeys.localization.context()
// → ['localization', 'context']

queryKeys.localization.dateConversion({ date: '2025-07-26', from_calendar: 'gregorian' })
// → ['localization', 'date-conversion', { date: '2025-07-26', from_calendar: 'gregorian' }]
```

### Mutation Patterns

- [x] Department update: **no optimistic update** — calendar changes trigger async SLA recalculation on the backend; showing stale calendar assignment until refetch is safer. Invalidate `queryKeys.organization.departments()` on success.
- [x] Task/delegation/holiday form mutations: no optimistic update — pass `calendar_system` in the request body. Existing `onSuccess` and `onError` handlers handle cache invalidation.
- [x] Date conversion: uses `useQuery` (not `useMutation`) since it is a read operation. The "Convert" button sets a controlled `params` state that `enabled` the query.

### Error Handling

- [x] 401 → handled globally.
- [x] 403 → show `PermissionDenied` inline (for department management — same pattern as org structure).
- [x] 422 (invalid Hijri date) from form mutations → `toast.error(error.message)`.
- [x] 422 (out-of-range / invalid) from date conversion → inline error text in dialog.
- [x] 500 / network on localization context → fail silently (hide the section).
- [x] 500 / network on date conversion → `ErrorState` with retry inside dialog.

---

## UI Requirements

> Reference: `docs/design-system/`

### Component Breakdown

| Component | Type | Location | Notes |
|-----------|------|----------|-------|
| `DualDateDisplay` | Client | `components/shared/` | Renders Gregorian + Hijri companion. Reusable across all date fields. Props: `gregorian: string`, `hijri: string \| null`, `variant?: 'inline' \| 'stacked'`. |
| `CalendarSystemToggle` | Client | `components/shared/` | Two-button toggle group (`هجري / ميلادي`). Props: `value`, `onChange`. `flex` layout with `flex-1` children for 50:50 split. `aria-pressed` + `role="group"` for accessibility. |
| `DatePicker` | Client | `components/shared/` | Unified single-date picker. Built-in `CalendarSystemToggle` + shadcn `Popover` + `Calendar`. Gregorian: native `Calendar` with `captionLayout="dropdown"` + `arSA` locale. Hijri: same `Calendar` with `formatCaption`/`formatDay`/`formatWeekdayName` formatters via `Intl.DateTimeFormat('...-u-ca-islamic-umalqura')`. On select, converts Date → local ISO via `dateToLocalIso()`. |
| `DateRangePicker` | Client | `components/shared/` | Unified range picker. Receives `calendarSystem` prop. Gregorian: single `Calendar mode="range"` with `numberOfMonths=2`, `captionLayout="dropdown"`, auto-closes on both selected. Hijri: same `Calendar mode="range"` with Hijri formatters. Local `pending` state delays URL update until both dates chosen. |
| `DateConverterDialog` | Client | `components/domain/shell/` | Lazy-loaded Dialog. Date conversion UI. |
| `LocalizationContextSection` | Client | `components/domain/shell/` | Read-only locale/timezone section inside NavUser preferences. |
| `DepartmentCalendarSelect` | Client | `components/domain/organization/` | `RtlSelect` populated from `useWorkingCalendars()`. Used inside department form dialog. |
| `WorkingCalendarBadge` | Client | `components/domain/organization/` | Badge showing assigned calendar name or "Default" muted label in departments table. |
| `Skeleton` | Client | shadcn/ui | Used in `DualDateDisplay`, `LocalizationContextSection`, `DateConverterDialog`. |
| `Dialog` | Client | shadcn/ui | Wraps `DateConverterDialog`. |
| `RtlSelect` | Client | Shared | Used in `DepartmentCalendarSelect` and date converter `from_calendar` selector. |
| `Tooltip` | Client | shadcn/ui | Wraps SLA deadline dates to show Hijri companion on hover. |
| `Button` | Client | shadcn/ui | Used in `CalendarSystemToggle` and date converter trigger + convert button. |

### States

| Component | Loading | Empty / Null | Error | Success |
|-----------|---------|-------------|-------|---------|
| `DualDateDisplay` | Gregorian shown, Hijri skeleton `text-xs` pulse | Gregorian only (hijri null) | Gregorian only | Both dates |
| `DateConverterDialog` | Skeleton in result area | Empty result (awaiting input) | Inline `text-destructive` + retry | Gregorian + Hijri result |
| `LocalizationContextSection` | 3-line skeleton block | — | Section hidden | Locale, dir, timezone, variant |
| `DepartmentCalendarSelect` | Disabled select with trigger skeleton | Empty list (no calendars) | Toast on calendar list fetch fail | Calendar list |
| `WorkingCalendarBadge` | Skeleton `text-xs` | "Default" muted badge | — | Calendar name badge |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | `DualDateDisplay`: Hijri companion on new line (stacked variant). `CalendarSystemToggle`: full-width button group stacking above input. `DateConverterDialog`: full-screen dialog. Calendar system filter: icon-only toggle. |
| Tablet (640–1024px) | `DualDateDisplay`: Hijri inline with `·` separator. `DateConverterDialog`: centered `max-w-md`. Full filter toggle visible. |
| Desktop (≥1024px) | `DualDateDisplay`: Hijri in parentheses `(١ محرم ١٤٤٧)` inline. Full dialog and filter UI. |

### RTL Considerations

- [x] `DualDateDisplay`: the Hijri date string is wrapped in `<span dir="ltr">` when displaying ISO-format Hijri (`YYYY-MM-DD`) since numerals are LTR in both locales; or `<span dir="auto">` if month name translations are used.
- [x] `DatePicker`: uses shadcn `Calendar` for both modes — Gregorian `captionLayout="dropdown"`, Hijri with Islamic `Intl.DateTimeFormat` formatters.
- [x] `CalendarSystemToggle`: in RTL layout, "هجري" (Hijri) appears on the **start** (right) edge, "ميلادي" (Gregorian) on the **end** (left). Order controlled by `flex-row-reverse` in RTL context or logical `flex-start` ordering.
- [x] `DateConverterDialog`: uses `RtlSelect` for `from_calendar`; result layout uses logical `text-start` alignment.
- [x] `DepartmentCalendarSelect`: uses `RtlSelect`.
- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`).
- [x] Arrow icon in date converter flow (Gregorian → Hijri) uses `rtl:rotate-180` if a directional `ArrowRight` icon is used.

### Accessibility

- [x] `DualDateDisplay`: Hijri companion wrapped in `<span aria-label={t('hijri_date_label')}>` so screen readers announce "Hijri equivalent: 1447-01-01".
- [x] `CalendarSystemToggle` buttons have `aria-pressed` (`true`/`false`) and descriptive `aria-label` attributes.
- [x] The toggle group has `role="group"` and `aria-label={t('calendar_system_label')}`.
- [x] `DateConverterDialog` has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the dialog title, and focus is trapped inside (shadcn Dialog handles this).
- [x] The "Date Converter" top-bar button has `aria-label={t('date_converter_label')}` (icon-only button).
- [x] All form inputs have visible `FieldLabel` components; required fields have `aria-required="true"`.
- [x] Color is not the only differentiator: the Hijri companion always has a label suffix `"ه"` (Arabic) or `" AH"` (English) alongside the date value.
- [x] Focus management: when `DateConverterDialog` opens, focus moves to the `from_calendar` select; on close, focus returns to the trigger button.
- [x] `Enter` key in the date input triggers conversion (`onKeyDown` handler).
- [x] `Escape` closes the dialog (shadcn Dialog default behavior).

### Animation/Transition

- [x] `DualDateDisplay` Hijri companion fades in with `animate-in fade-in duration-200` when data is available (avoids layout shift by reserving space via `min-h` when hijri is expected).
- [x] `DateConverterDialog` uses shadcn default Dialog animations (`animate-in fade-in slide-in-from-bottom-2`).
- [x] `CalendarSystemToggle` active button transitions with `transition-colors duration-150`.
- [x] All animations respect `prefers-reduced-motion` via `motion-reduce:animate-none`.

---

## Non-Functional Requirements

### Performance

- [x] `DualDateDisplay` renders only from data already fetched in the parent query — **no additional API calls per date field**. All `*_hijri` companion values come from the existing resource response.
- [x] `DateConverterDialog` is lazy-loaded via `next/dynamic({ ssr: false })` — not bundled in the initial page load.
- [x] `useLocalizationContext()` uses `staleTime: 300_000` (5 min) — does not refetch on every navigation.
- [x] `useDateConversion()` uses `staleTime: Infinity` — deterministic conversion; cache hit for repeated identical inputs.
- [x] No new npm packages: Hijri display uses `*_hijri` API fields directly. No `moment-hijri`, ICU polyfill, or client-side Hijri computation library added.

### Security

- [x] Department calendar assignment actions are hidden/disabled when `!useCapability('organization.manage')`. Server returns 403 regardless.
- [x] No PII in URL params: `calendarSystem` is the only new URL param.
- [x] Hijri date strings are rendered via React JSX (not `dangerouslySetInnerHTML`) — XSS-safe.
- [x] Date conversion API call uses `apiClient` with `credentials: 'include'` — Sanctum cookies automatically applied.

---

## Out of Scope

- **Eastern Arabic-Indic numeral formatting** (`٠١٢٣٤٥٦٧٨٩`) — V2 per backend spec.
- **Visual Hijri date-picker calendar grid** — Implemented via shadcn `Calendar` + `Intl.DateTimeFormat` formatters. React-day-picker underlying grid is Gregorian but displays Hijri day numbers and month names via `formatCaption`/`formatDay` formatters.
- **User-selectable Hijri calculation variant** — `islamic-umalqura` (Umm al-Qura) is fixed per backend spec.
- **Per-user working calendars or shift scheduling** — departments only; personal overrides are V2.
- **Audit trail screen** — Spec 010 (system-administration) delivers the audit trail route. The `calendarSystem` filter is spec'd here but its implementation is conditional on the audit screen existing.
- **Rewriting historical SLA deadlines in the UI** — backend recalculates asynchronously; the UI reflects updated deadlines on next data refetch.
- **Third application language** — only `ar` and `en` are supported.
- **WASM-based client-side Hijri conversion** — all conversions go through `GET /v1/localization/date-conversion`.
- **Calendar view / team calendar screen** — Feature 218, V2 per backend spec.
- **Localization context editing** — `GET /v1/localization/context` is read-only in MVP. User language preference editing may be part of `017-user-settings-delegation`.
- **Dual date display on every date field everywhere** — only the fields explicitly listed in acceptance criteria are updated in MVP (task due date, stage dates, SLA deadlines, delegation dates, public holidays, notifications).

---

## Open Questions — All Resolved

- [x] **Date Converter placement:** Should the widget live as a top-bar icon button (always visible) or as a special command in the existing `CommandDialog` global search (`/convert` or pressing `=`)? — **Resolved.** Place it as a top-bar icon button. It is more discoverable for Arabic-first users.
- [x] **`DualDateDisplay` format string:** The backend returns `*_hijri` as ISO `YYYY-MM-DD` (e.g. `"1447-01-01"`). Should the frontend display this numeric string directly, or translate it to month names (e.g. `"1 محرم 1447"`)? — **Resolved.** Translate it to month names (e.g., "1 محرم 1447").
- [x] **OpenAPI regeneration:** `GET /v1/localization/context` and `GET /v1/localization/date-conversion` may not appear in the current `openapi.json` (backend may need a redeploy). — **Resolved.** The endpoints are already in `openapi.json` at lines 8585 and 8619. No redeploy needed. Run `npm run generate:api` to regenerate types and the resources will be available in `api-types.ts`.
- [x] **`useWorkingCalendars()` reuse:** The existing `use-organization.ts` fetches working calendars without pagination. Reused directly for `DepartmentCalendarSelect` — no new hook needed.
- [x] **Audit trail route:** Does `/admin/audit` or a comparable audit trail page currently exist (Spec 010)? The `calendarSystem` filter for audit is conditional on that route existing. — **Resolved.** The `/admin/audit` route does not currently exist. Mark this specific filter as a deferred dependency on Spec 010.
- [x] **`calendarSystem` in `AdvancedFiltersSheet`:** The existing `AdvancedFiltersSheet` in `components/domain/tasks/` accepts a `hideFields` prop to suppress unsupported fields. The `calendarSystem` toggle needs to be added — should it live inside `AdvancedFiltersSheet` as a new field (same pattern as existing fields) or as a separate standalone toggle outside the sheet? — **Resolved.** Place it inside `AdvancedFiltersSheet` as a new top-level field, consistent with the existing pattern.

---

→ **Next:** Resolve open questions above, confirm OpenAPI types are generated, then create `plan.md`.
