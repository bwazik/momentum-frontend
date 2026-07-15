# Implementation Plan: 020 Localization & Calendar

> **Spec:** `specs/020-localization-calendar/spec.md`
> **Date:** 2026-07-13
> **Status:** `completed`

---

## Open Questions Resolved

All open questions from the spec are resolved. No `<!-- TODO: verify -->` remain.

| # | Question (from spec) | Decision | Rationale |
|---|----------------------|----------|-----------|
| 1 | Date Converter placement | Top-bar icon button between search trigger and notification bell. | More discoverable for Arabic-first users than a command-palette special. |
| 2 | `DualDateDisplay` format | Translate backend `*_hijri` ISO string to localized month names (`1 Muh 1447` / `١ محرم ١٤٤٧`) via `Intl.DateTimeFormat`. | Matches acceptance-criteria examples. |
| 3 | OpenAPI endpoints | `GET /v1/localization/context` and `GET /v1/localization/date-conversion` are present in `openapi.json` and `lib/generated/api-types.ts`. | No redeploy needed; run `npm run generate:api` if stale. |
| 4 | `useWorkingCalendars()` reuse | Reuse the existing bounded-list hook in `lib/api/hooks/use-organization.ts` for `DepartmentCalendarSelect`. | Already returns `WorkingCalendarResource[]` without pagination. |
| 5 | Audit trail route | `/admin/audit` does not exist (Spec 010 is pending). | Calendar-system filter for audit is deferred until Spec 010. |
| 6 | `calendarSystem` in `AdvancedFiltersSheet` | Add it as a new top-level field inside the sheet, consistent with existing filter fields. | Keeps filter reset/grouping logic in one place. |

---

## Technical Approach

**One-line:** Add `DatePicker`, `DateRangePicker`, `DualDateDisplay`, `CalendarSystemToggle` — a unified localization toolkit — wire two localization endpoints, expose a top-bar Date Converter and a preferences Localization Context section, and roll out Hijri input/output across task forms, filters, organization departments, and public holidays.

### Key Decisions

- **Display layer only for Hijri dates.** The backend stores Gregorian and returns additive `*_hijri` companions. The frontend never computes Hijri; it only formats the companion string via `formatHijriIso`.
- **Single shared `DualDateDisplay`.** Replaces inline `formatDualDate(...)` calls. Uses `formatGregorianDate` for timezone-safe Gregorian and `formatHijriIso` for API `*_hijri` fields.
- **Unified `DatePicker` + `DateRangePicker`.** Both use the same shadcn `Calendar` component for Gregorian and Hijri modes. Only formatters differ: Gregorian uses `captionLayout="dropdown"` + `locale={arSA}`, Hijri uses `formatCaption`/`formatDay` via `Intl.DateTimeFormat('...-u-ca-islamic-umalqura')`.
- **`CalendarSystemToggle`.** `flex` + `flex-1` for 50:50 split. Order: `[hijri, gregorian]`. Built into `DatePicker`, standalone for `DateRangePicker`.
- **Timezone-safe date conversion.** `dateToLocalIso()` uses `getFullYear/getMonth/getDate` (local timezone) instead of `toISOString()` (UTC). Eliminates off-by-one errors.
- **URL-driven `calendarSystem` filter.** Stored as `?calendarSystem=hijri` (camelCase) → `calendar_system` (snake_case) in query builders.
- **Batched URL params.** `onBatchParams` added to `AdvancedFiltersSheet` and parents — batches multiple `router.replace` calls into one to prevent stale `searchParams` overwrites.
- **No client-side Hijri computation library.** `Intl.DateTimeFormat` with `islamic-umalqura` for formatting; conversions through `GET /v1/localization/date-conversion`.
- **Department calendar assignment reuses existing org hooks.** `DepartmentCalendarSelect` with "Default Calendar" sentinel sends `working_calendar_id: null`. `useUpdateDepartment` invalidates `workingCalendars` on success.
- **Locale sync on first load.** `LocalizationContextSection` syncs backend `locale` → `NEXT_LOCALE` cookie only when no cookie exists (fresh login). Manual toggles are preserved.

---

## Component Tree

```
app/(dashboard)/
├── layout.tsx                               [Server — unchanged]
├── page.tsx                                 [Server — unchanged]
├── tasks/
│   ├── page.tsx                             [Server — TaskBoard page]
│   ├── [publicId]/                          [Server — task detail]
│   └── create/
│       └── page.tsx                         [Server — task create]
├── organization/
│   └── page.tsx                             [Server — OrganizationWorkspace]
└── ...

components/
├── shared/
│   ├── dual-date-display.tsx                [Client — NEW]
│   ├── calendar-system-toggle.tsx           [Client — NEW]
│   ├── date-picker.tsx                      [Client — NEW (was hijri-date-input.tsx)]
│   └── date-range-picker.tsx                [Client — NEW]
├── domain/
│   ├── shell/
│   │   ├── site-header.tsx                  [Client — MODIFIED: add DateConverterDialog trigger]
│   │   ├── nav-user.tsx                     [Client — MODIFIED: add LocalizationContextSection]
│   │   ├── date-converter-dialog.tsx        [Client — NEW]
│   │   └── localization-context-section.tsx [Client — NEW]
│   ├── organization/
│   │   ├── department-form-dialog.tsx       [Client — MODIFIED: add working_calendar_id select]
│   │   ├── departments-table.tsx            [Client — MODIFIED: add Working Calendar column]
│   │   ├── department-calendar-select.tsx   [Client — NEW]
│   │   ├── working-calendar-badge.tsx       [Client — NEW]
│   │   └── public-holiday-form-dialog.tsx   [Client — MODIFIED: use DatePicker]
│   ├── tasks/
│   │   ├── advanced-filters-sheet.tsx       [Client — MODIFIED: add CalendarSystemToggle + DateRangePicker]
│   │   ├── due-date-field.tsx               [Client — MODIFIED: use DatePicker]
│   │   ├── task-form-fields.tsx             [Client — MODIFIED: thread dueDateCalendarSystem]
│   │   ├── task-creation-form.tsx           [Client — MODIFIED: include calendar_system in body]
│   │   ├── details-card.tsx                 [Client — MODIFIED: use DualDateDisplay]
│   │   ├── board-table.tsx                  [Client — MODIFIED: dual due date subtext]
│   │   ├── board-task-card.tsx              [Client — MODIFIED: dual due date subtext]
│   │   └── stage-timeline-node.tsx          [Client — MODIFIED: dual entered_at/exited_at]
│   ├── shell/
│   │   └── notification-item.tsx            [Client — MODIFIED: dual created_at]
│   ├── follow-up/
│   │   └── ...                              [Client — MODIFIED: pass calendar_system when present]
│   └── analytics/
│       └── ...                              [Client — MODIFIED: pass calendar_system when present]
└── ui/                                      [shadcn — no new primitives]

lib/
├── api/
│   ├── query-keys.ts                        [MODIFIED: add localization namespace]
│   └── hooks/
│       ├── use-localization.ts              [NEW]
│       └── use-organization.ts              [MODIFIED: no signature change needed]
└── utils/
    └── date-utils.ts                        [MODIFIED: keep formatHijriDate; DualDateDisplay becomes canonical]

messages/
├── ar.json                                  [MODIFIED: add localization namespace]
└── en.json                                  [MODIFIED: add localization namespace]
```

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `components/shared/dual-date-display.tsx` | Renders Gregorian + Hijri companion with null/loading states and responsive variants. |
| `components/shared/calendar-system-toggle.tsx` | Two-button toggle (`Gregorian`/`Hijri`) with ARIA. |
| `components/shared/date-picker.tsx` | Unified single-date picker. `CalendarSystemToggle` + `Popover` + `Calendar`. Gregorian: native `Calendar` (`captionLayout="dropdown"`, `locale={arSA}`). Hijri: same `Calendar` with Islamic `Intl.DateTimeFormat` formatters. `dateToLocalIso()` for timezone-safe conversion. |
| `components/shared/date-range-picker.tsx` | Unified range picker. Gregorian: `Calendar mode="range"` (2 months, auto-close). Hijri: same `Calendar mode="range"` with Islamic formatters. Local `pending` state delays URL commit until both dates selected. |
| `components/domain/shell/date-converter-dialog.tsx` | Dialog for ad-hoc Gregorian ↔ Hijri conversion via `useDateConversion`. |
| `components/domain/shell/localization-context-section.tsx` | Read-only locale/timezone/dir/variant block for NavUser preferences. |
| `components/domain/organization/department-calendar-select.tsx` | `RtlSelect` populated from `useWorkingCalendars` with a `default` sentinel. |
| `components/domain/organization/working-calendar-badge.tsx` | Badge showing assigned calendar name or muted "Default". |
| `lib/api/hooks/use-localization.ts` | `useLocalizationContext` and `useDateConversion` hooks. |

### Modified Files

| File | Change |
|------|--------|
| `lib/api/query-keys.ts` | Add `localization` namespace with `context()` and `dateConversion(params)`. |
| `components/domain/shell/site-header.tsx` | Add `DateConverterDialog` trigger icon button between `GlobalSearch` and `NotificationBell`; lazy-load dialog. |
| `components/domain/shell/nav-user.tsx` | Add `LocalizationContextSection` inside Preferences submenu. |
| `components/domain/tasks/advanced-filters-sheet.tsx` | Add `CalendarSystemToggle`; clear `dateFrom`/`dateTo` on switch; include `calendarSystem` in sheet state. |
| `components/domain/tasks/due-date-field.tsx` | Replace plain `Input type="date"` with `HijriDateInput`; expose `calendarSystem` to parent. |
| `components/domain/tasks/task-form-fields.tsx` | Thread `dueDateCalendarSystem` prop down to `DueDateField`. |
| `components/domain/tasks/task-creation-form.tsx` | Track `dueDateCalendarSystem` in local state; include `calendar_system` in create/update body. |
| `components/domain/tasks/details-card.tsx` | Use `DualDateDisplay` for `created_at`, `due_date`, `suspended_at`, `cancelled_at`. |
| `components/domain/tasks/board-table.tsx` | Use `DualDateDisplay` for due-date subtext. |
| `components/domain/tasks/board-task-card.tsx` | Use `DualDateDisplay` for due-date subtext. |
| `components/domain/tasks/stage-timeline-node.tsx` | Show dual `entered_at`/`exited_at` beneath duration. |
| `components/domain/organization/department-form-dialog.tsx` | Add `working_calendar_id` select using `DepartmentCalendarSelect`. |
| `components/domain/organization/departments-table.tsx` | Add "Working Calendar" column with `WorkingCalendarBadge`. |
| `components/domain/organization/public-holiday-form-dialog.tsx` | Use `HijriDateInput` for `holiday_date`. |
| `components/domain/shell/notification-item.tsx` | Use `DualDateDisplay` for `created_at`. |
| `components/domain/tasks/task-board-types.ts` | Add `calendarSystem?: 'gregorian' \| 'hijri'` to `TaskBoardUrlFilters`. |
| `components/domain/tasks/task-board-utils.ts` | Map `calendarSystem` → `calendar_system` in `toBoardQuery`; clear dates on switch is UI-only. |
| `lib/utils/date-utils.ts` | Keep `formatHijriDate` helper; `formatDualDate` can stay as fallback but new code uses `DualDateDisplay`. |
| `messages/ar.json` | Add `localization` namespace. |
| `messages/en.json` | Add `localization` namespace. |

### Deferred / Conditional

| File | Reason |
|------|--------|
| Audit trail filters | `/admin/audit` route does not exist (Spec 010). Add `calendarSystem` to its filter builder when Spec 010 lands. |
| Delegation forms | Delegation UI not yet implemented (Spec 017). Reuse `DatePicker` when built. |
| Confidential access form | Confidential access UI not yet implemented (Spec 019). Reuse `DatePicker` when built. |

---

## Implementation Notes

> All snippets are copy-pasteable starting points. Match existing import style and run `npm run generate:api` before compiling.

### 0. Query Keys

**File:** `lib/api/query-keys.ts`

```ts
// Add inside `queryKeys` object, before the closing `as const`:
localization: {
  all: ['localization'] as const,
  context: () => [...queryKeys.localization.all, 'context'] as const,
  dateConversion: (params: Record<string, string>) =>
    [...queryKeys.localization.all, 'date-conversion', params] as const,
},
```

**Rules applied:** `coding-standards.md` § Query Key Factory — centralized, dot-namespaced arrays; no hardcoded strings.

---

### 1. Localization Hooks

**File:** `lib/api/hooks/use-localization.ts`

```ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';

type LocalizationContextResource = components['schemas']['LocalizationContextResource'];
type DateConversionResource = components['schemas']['DateConversionResource'];
type CalendarSystem = components['schemas']['CalendarSystem'];

export function useLocalizationContext() {
  return useQuery({
    queryKey: queryKeys.localization.context(),
    queryFn: () => apiClient.get<LocalizationContextResource>('/v1/localization/context'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

interface DateConversionParams {
  date: string;
  from_calendar: CalendarSystem;
}

export function useDateConversion(params: DateConversionParams | null) {
  return useQuery({
    queryKey: queryKeys.localization.dateConversion(params ?? { date: '', from_calendar: 'gregorian' }),
    queryFn: () =>
      apiClient.get<DateConversionResource>('/v1/localization/date-conversion', {
        params: params ?? undefined,
      }),
    enabled: !!params?.date,
    staleTime: Infinity,
    retry: 1,
  });
}
```

**Key decisions:**
- `useLocalizationContext` fails silently in the UI (the section is hidden on error, per spec).
- `useDateConversion` only runs when a non-empty `date` is provided; the "Convert" button sets the param state.
- `staleTime: Infinity` for conversion because the result is deterministic.

**Rules applied:** `coding-standards.md` § Data Fetching — TanStack Query, query key factory, generated types, no `useEffect`+`fetch`.

---

### 2. `DualDateDisplay`

**File:** `components/shared/dual-date-display.tsx`

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatHijriIso, formatGregorianDate } from '@/lib/utils/date-utils';

interface DualDateDisplayProps {
  gregorian: string | null | undefined;
  hijri?: string | null;
  variant?: 'inline' | 'stacked';
  isLoading?: boolean;
  className?: string;
}

export function DualDateDisplay({
  gregorian,
  hijri,
  variant = 'inline',
  isLoading,
  className,
}: DualDateDisplayProps) {
  const locale = useLocale();
  const t = useTranslations('localization');

  if (isLoading) {
    return (
      <span className={cn('inline-flex flex-col gap-0.5', className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-20" />
      </span>
    );
  }

  if (!gregorian) return <span className="text-muted-foreground">-</span>;

  let primary = '';
  try {
    primary = formatGregorianDate(gregorian, locale);
  } catch {
    primary = gregorian;
  }

  const companion = hijri ? formatHijriIso(hijri, locale) : null;

  const separator = locale === 'ar' ? ' • ' : ' · ';

  return (
    <span
      className={cn(
        'inline-flex',
        variant === 'stacked' ? 'flex-col' : 'items-center gap-1',
        className,
      )}
    >
      <span>{primary}</span>
      {companion && (
        <span
          className="text-xs text-muted-foreground"
          aria-label={`${t('hijri_date_label')}: ${companion}`}
        >
          {variant === 'inline' && separator}
          {companion}{t('hijri_suffix')}
        </span>
      )}
    </span>
  );
}
```

**Key decisions:**
- Uses `formatGregorianDate(gregorian, locale)` with try/catch for timezone-safe formatting.
- `companion` = `hijri ? formatHijriIso(hijri, locale) : null` — no client-side Hijri fallback.
- Uses suffix `{companion}{t('hijri_suffix')}` not prefix.
- `variant='inline'` uses a middle dot separator; `variant='stacked'` puts Hijri on its own line for mobile or timeline.
- Hijri span has `aria-label` for screen readers.

**Rules applied:** `coding-standards.md` § i18n & RTL — logical properties; `design-system/05-accessibility.md` — color not sole indicator, aria-label on Hijri companion.

**Test cases:**
1. Render with `gregorian="2025-07-26"` `hijri="1447-01-01"` in AR → expect Arabic month names and `هـ` suffix.
2. Render with `hijri={null}` → expect Gregorian only, no error text.

---

### 3. `CalendarSystemToggle`

**File:** `components/shared/calendar-system-toggle.tsx`

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarSystemToggleProps {
  value: 'gregorian' | 'hijri';
  onChange: (value: 'gregorian' | 'hijri') => void;
  className?: string;
}

export function CalendarSystemToggle({ value, onChange, className }: CalendarSystemToggleProps) {
  const t = useTranslations('localization');
  const options: Array<{ key: 'gregorian' | 'hijri'; label: string }> = [
    { key: 'hijri', label: t('hijri') },
    { key: 'gregorian', label: t('gregorian') },
  ];

  return (
    <div
      role="group"
      aria-label={t('calendar_system_label')}
      className={cn('flex rounded-lg border p-1', className)}
    >
      {options.map((opt) => (
        <Button
          key={opt.key}
          type="button"
          variant={value === opt.key ? 'default' : 'ghost'}
          size="sm"
          aria-pressed={value === opt.key}
          onClick={() => onChange(opt.key)}
          className="flex-1 transition-colors duration-150"
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
```

**Key decisions:**
- Button order is `[hijri, gregorian]` — RTL puts Hijri on the start edge.
- Container uses `flex` (not `inline-flex`), caller controls width via className.
- Children use `flex-1` for 50:50 split.
- `aria-pressed` + `role="group"` for accessibility.

**Rules applied:** `design-system/05-accessibility.md` — ARIA pressed, group label; `coding-standards.md` — no `any`.

**Test cases:**
1. Click Hijri button → `onChange('hijri')` called.
2. Active button has `aria-pressed="true"`.

---

### 4. `DatePicker`

**File:** `components/shared/date-picker.tsx`

```tsx
'use client';

import { useId, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { Locale } from 'react-day-picker';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarSystemToggle } from './calendar-system-toggle';
import { cn } from '@/lib/utils';
import { formatHijriIso, dateToLocalIso } from '@/lib/utils/date-utils';

interface DatePickerProps {
  id?: string;
  label: string;
  value: string | null;
  calendarSystem: 'gregorian' | 'hijri';
  onChange: (value: string | null, calendarSystem: 'gregorian' | 'hijri') => void;
  required?: boolean;
  className?: string;
  hideToggle?: boolean;
  hideLabel?: boolean;
}

function formatHijriCaption(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

function formatHijriDayNumber(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    day: 'numeric',
  }).format(date);
}

function toHijriIsoFromDate(date: Date, locale: string): string {
  const parts = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '0';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function shortWeekday(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: locale === 'ar' ? 'narrow' : 'short' }).format(date);
}

export function DatePicker({
  id,
  label,
  value,
  calendarSystem,
  onChange,
  required,
  className,
  hideToggle,
}: DatePickerProps) {
  const t = useTranslations('localization');
  const locale = useLocale();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [popoverOpen, setPopoverOpen] = useState(false);

  function handleCalendarSystemChange(next: 'gregorian' | 'hijri') {
    if (next === calendarSystem) return;
    onChange(null, next);
  }

  const gregorianDate = value && calendarSystem === 'gregorian' ? new Date(value + 'T00:00:00') : undefined;

  const hijriFormatters = {
    formatCaption: (date: Date) => formatHijriCaption(date, locale),
    formatDay: (date: Date) => formatHijriDayNumber(date, locale),
    formatWeekdayName: (date: Date) => shortWeekday(date, locale),
  };

  const longMonth = (date: Date) =>
    date.toLocaleString(locale === 'ar' ? 'ar' : 'en', { month: 'long' });

  const commonFormatters = {
    formatMonthDropdown: (date: Date) => longMonth(date),
    formatYearDropdown: (date: Date) => String(date.getFullYear()),
    formatWeekdayName: (date: Date) => shortWeekday(date, locale),
  };

  const picker = (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-start font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="me-2 size-4" />
            {calendarSystem === 'gregorian'
              ? (value ? format(gregorianDate!, 'MMMM dd, y', { locale: locale === 'ar' ? arSA : undefined }) : t('gregorian_placeholder'))
              : (value ? formatHijriIso(value, locale) : t('hijri_placeholder'))}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {calendarSystem === 'gregorian' ? (
            <Calendar
              mode="single"
              selected={gregorianDate}
              locale={locale === 'ar' ? arSA as unknown as Locale : undefined}
              captionLayout="dropdown"
              formatters={commonFormatters}
              onSelect={(date) => {
                if (date) {
                  const iso = dateToLocalIso(date);
                  onChange(iso, 'gregorian');
                }
                setPopoverOpen(false);
              }}
            />
          ) : (
            <Calendar
              mode="single"
              locale={locale === 'ar' ? arSA as unknown as Locale : undefined}
              formatters={hijriFormatters}
              onSelect={(date) => {
                if (date) {
                  onChange(toHijriIsoFromDate(date, locale), 'hijri');
                }
                setPopoverOpen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
      {!hideToggle && calendarSystem === 'hijri' && (
        <FieldDescription id={`${inputId}-hint`}>{t('hijri_hint')}</FieldDescription>
      )}
    </>
  );

  if (hideToggle) return picker;

  return (
    <Field className={cn('flex flex-col gap-2', className)}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <CalendarSystemToggle
        value={calendarSystem}
        onChange={handleCalendarSystemChange}
        className="self-start"
      />
      {picker}
    </Field>
  );
}
```

**Key decisions:**
- Renamed from `HijriDateInput` to `DatePicker`, file moved to `components/shared/date-picker.tsx`.
- Gregorian mode uses `Calendar` + `captionLayout="dropdown"` + `locale={arSA}` popover (not `<input type="text">`).
- Hijri mode uses same `Calendar` with `formatCaption`/`formatDay`/`formatWeekdayName` via `Intl.DateTimeFormat('...-u-ca-islamic-umalqura')`.
- Added `hideToggle` prop to skip the built-in toggle (used standalone in `DateConverterDialog`).
- Uses `dateToLocalIso(date)` instead of `date.toISOString().split('T')[0]` for timezone safety.
- Gregorian: `format(..., 'MMMM dd, y')` for display; Hijri: `formatHijriIso(value, locale)`.

**Rules applied:** `coding-standards.md` § i18n & RTL — logical properties; `design-system/05-accessibility.md` — label, described-by hint.

**Test cases:**
1. Gregorian mode → select a date from popover calendar → `onChange('2025-07-26', 'gregorian')`.
2. Hijri mode → select a date → `onChange('1447-01-01', 'hijri')`.
3. `hideToggle` → no `CalendarSystemToggle` rendered, only the popover picker.

---

### 5. `DateConverterDialog`

**File:** `components/domain/shell/date-converter-dialog.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarSearch } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FieldLabel } from '@/components/ui/field';
import { CalendarSystemToggle } from '@/components/shared/calendar-system-toggle';
import { DatePicker } from '@/components/shared/date-picker';
import { ErrorState } from '@/components/shared/error-state';
import { formatGregorianDate, formatHijriIso } from '@/lib/utils/date-utils';
import { useDateConversion } from '@/lib/api/hooks/use-localization';
import type { components } from '@/lib/generated/api-types';

type CalendarSystem = components['schemas']['CalendarSystem'];

interface DateConverterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DateConverterDialog({ open, onOpenChange }: DateConverterDialogProps) {
  const t = useTranslations('localization');
  const locale = useLocale();
  const [fromCalendar, setFromCalendar] = useState<CalendarSystem>('gregorian');
  const [date, setDate] = useState('');
  const [params, setParams] = useState<{ date: string; from_calendar: CalendarSystem } | null>(null);

  const { data, isLoading, isError, error, refetch } = useDateConversion(params);

  function handleConvert() {
    if (!date.trim()) return;
    setParams({ date: date.trim(), from_calendar: fromCalendar });
  }

  const timezoneFallback = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarSearch className="size-5" />
            {t('date_converter_title')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('from_calendar')}</FieldLabel>
            <CalendarSystemToggle
              value={fromCalendar}
              onChange={(v) => setFromCalendar(v)}
              className="w-full"
            />
          </Field>

          <Field>
            <FieldLabel>{t('date_label')}</FieldLabel>
            <DatePicker
              label=""
              value={date || null}
              calendarSystem={fromCalendar}
              onChange={(v) => setDate(v || '')}
              hideToggle
            />
          </Field>

          <Button onClick={handleConvert} disabled={!date.trim()}>
            {t('convert')}
          </Button>

          <div className="min-h-[4rem] rounded-lg border p-3">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
            {isError && <ErrorState message={error?.message} onRetry={() => refetch()} className="py-0" />}
            {!isLoading && !isError && data && (
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium">{formatGregorianDate(data.gregorian_date, locale)}</span>
                <span className="text-sm text-muted-foreground">
                  {formatHijriIso(data.hijri_date, locale)}{t('hijri_suffix')}
                </span>
                <span className="text-xs text-muted-foreground">{data.timezone || timezoneFallback}</span>
              </div>
            )}
            {!isLoading && !isError && !data && (
              <span className="text-sm text-muted-foreground">{t('converter_empty')}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Key decisions:**
- Uses `CalendarSystemToggle` component (not `RtlSelect`) for calendar selection.
- Date input uses `DatePicker hideToggle` (not raw `<Input>`).
- Result uses `formatGregorianDate(data.gregorian_date, locale)` and `formatHijriIso(data.hijri_date, locale)` + `t('hijri_suffix')`.
- Uses controlled `params` state to enable the query on demand.
- Inline error inside the dialog (not toast) because the dialog is the active context.

**Rules applied:** `coding-standards.md` § Error Handling — inline error in dialog context; `design-system/05-accessibility.md` — dialog focus trap, labelled inputs.

**Test cases:**
1. Enter `1447-01-01`, select Hijri, click Convert → result shows `2025-06-26` + `1447-01-01`.
2. Empty input → Convert button disabled.

---

### 6. `LocalizationContextSection`

**File:** `components/domain/shell/localization-context-section.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalizationContext } from '@/lib/api/hooks/use-localization';
import { useLocaleStore } from '@/lib/stores/use-locale-store';

export function LocalizationContextSection() {
  const t = useTranslations('localization');
  const { data, isLoading, isError } = useLocalizationContext();

  useEffect(() => {
    if (!data) return;
    const cookie = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    if (cookie) return;
    const l = data.locale;
    if (l !== 'ar' && l !== 'en') return;
    useLocaleStore.getState().setLocale(l);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-2 px-2 py-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  if (isError || !data) return null;

  const items = [
    { label: t('context.locale'), value: data.locale },
    { label: t('context.direction'), value: data.text_direction.toUpperCase() },
    { label: t('context.timezone'), value: data.timezone },
    { label: t('context.variant'), value: data.hijri_calendar_variant },
  ];

  return (
    <div className="px-2 py-1.5">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{t('context.title')}</p>
      <dl className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-2 text-sm">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

**Key decisions:**
- Added `useEffect` that syncs `data.locale` → `NEXT_LOCALE` cookie when no cookie exists (fresh login), preserving manual locale toggles.
- Hidden on error (non-critical metadata, per spec).
- 3-line skeleton matches the final label-value shape.

**Rules applied:** `coding-standards.md` § Loading States — all 4 states; `design-system/05-accessibility.md` — semantic `dl`/`dt`/`dd`.

**Test cases:**
1. Loading → 3 skeleton lines rendered.
2. Success → locale, direction, timezone, variant labels shown.

---

### 7. Top-Bar Trigger + NavUser Integration

**File:** `components/domain/shell/site-header.tsx`

```tsx
import { useState } from 'react';
import { CalendarSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DateConverterDialog = dynamic(
  () => import('@/components/domain/shell/date-converter-dialog').then((m) => m.DateConverterDialog),
  { ssr: false },
);

export function SiteHeader() {
  const [converterOpen, setConverterOpen] = useState(false);
  // ... existing code ...

  return (
    <header /* ... */>
      <div className="ms-auto flex items-center gap-2">
        <GlobalSearch />
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('date_converter_label')}
          onClick={() => setConverterOpen(true)}
        >
          <CalendarSearch className="size-5" />
        </Button>
        <NotificationBell />
        <LocaleToggle />
      </div>
      <DateConverterDialog open={converterOpen} onOpenChange={setConverterOpen} />
    </header>
  );
}
```

**File:** `components/domain/shell/nav-user.tsx`

Insert inside `DropdownMenuGroup` (after Brand Color submenu):

```tsx
import { LocalizationContextSection } from './localization-context-section';

<DropdownMenuSub>
  <DropdownMenuSubTrigger className="cursor-pointer">
    <Globe data-slot="sidebar-menu-button-icon" />
    <span>{t('localization')}</span>
  </DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <LocalizationContextSection />
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

Add `Globe` icon import from `lucide-react` and a translation key `auth.localization` (or reuse a new `localization.context.title` key).

**Rules applied:** `coding-standards.md` § Performance — dynamic import for heavy dialog; `design-system/05-accessibility.md` — icon-only button has `aria-label`.

---

### 8. Department Calendar Assignment

**File:** `components/domain/organization/department-calendar-select.tsx`

```tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkingCalendars } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';

const DEFAULT_SENTINEL = 'default';

interface DepartmentCalendarSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function DepartmentCalendarSelect({ value, onChange }: DepartmentCalendarSelectProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const { data: calendars, isLoading } = useWorkingCalendars();

  const selectValue = value ?? DEFAULT_SENTINEL;

  return (
    <RtlSelect
      value={selectValue}
      onValueChange={(v) => onChange(v === DEFAULT_SENTINEL ? null : v)}
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('departments.calendar_placeholder')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={DEFAULT_SENTINEL}>{t('departments.default_calendar')}</SelectItem>
        {(calendars ?? []).map((c) => (
            <SelectItem key={c.public_id} value={c.public_id}>
              {localizeName(locale, c.name_ar, c.name_en)}
            </SelectItem>
          ))}
      </SelectContent>
    </RtlSelect>
  );
}
```

**File:** `components/domain/organization/working-calendar-badge.tsx`

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

type WorkingCalendarResource = components['schemas']['WorkingCalendarResource'];

interface WorkingCalendarBadgeProps {
  calendar?: WorkingCalendarResource;
}

export function WorkingCalendarBadge({ calendar }: WorkingCalendarBadgeProps) {
  const t = useTranslations('organization');
  const locale = useLocale();

  if (!calendar) {
    return <span className="text-sm text-muted-foreground">{t('departments.default_calendar')}</span>;
  }

  return (
    <Badge variant="outline">
      {localizeName(locale, calendar.name_ar, calendar.name_en)}
    </Badge>
  );
}
```

**File:** `components/domain/organization/department-form-dialog.tsx`

Add to `DeptFormState`:

```ts
interface DeptFormState {
  name_ar: string;
  name_en: string;
  parent_department_id: string;
  working_calendar_id: string;
}
```

Initialize:

```ts
const [form, setForm] = useState<DeptFormState>(() => ({
  name_ar: department?.name_ar ?? '',
  name_en: department?.name_en ?? '',
  parent_department_id: department?.parent_department_id ?? NONE_SENTINEL,
  working_calendar_id: department?.working_calendar?.public_id ?? DEFAULT_SENTINEL,
}));
```

Build body:

```ts
const body = {
  name_ar: form.name_ar,
  name_en: form.name_en || undefined,
  parent_department_id:
    form.parent_department_id === NONE_SENTINEL ? null : form.parent_department_id,
  working_calendar_id:
    form.working_calendar_id === DEFAULT_SENTINEL ? null : form.working_calendar_id,
};
```

Render field:

```tsx
<Field>
  <FieldLabel>{t('departments.calendar')}</FieldLabel>
  <DepartmentCalendarSelect
    value={form.working_calendar_id === DEFAULT_SENTINEL ? null : form.working_calendar_id}
    onChange={(v) => setForm((prev) => ({ ...prev, working_calendar_id: v ?? DEFAULT_SENTINEL }))}
  />
</Field>
```

**File:** `components/domain/organization/departments-table.tsx`

Add header column before actions:

```tsx
<TableHead className="text-start">{t('departments.columns.calendar')}</TableHead>
```

Add cell:

```tsx
<TableCell className="text-start">
  <WorkingCalendarBadge calendar={dept.working_calendar} />
</TableCell>
```

**Key decisions:**
- Sentinel `'default'` is converted to `null` before sending to API, matching backend contract.
- `useUpdateDepartment` already accepts `working_calendar_id?: string | null` via generated `UpdateDepartmentRequest`; no hook signature change needed.
- On success, existing invalidation already covers `queryKeys.organization.departments()` and `queryKeys.organization.workingCalendars()` (calendar list is stale after delete protection).

**Rules applied:** `coding-standards.md` § Forms — shadcn Field + RtlSelect; § Permission UI — `organization.manage` gates existing Add/Edit buttons; § Generated types — no hand-written interfaces.

**Test cases:**
1. Edit department → select a calendar → save → API body has `working_calendar_id: <public_id>`.
2. Select "Use Tenant Default" → API body has `working_calendar_id: null`.

---

### 9. Task Due Date Hijri Input

**File:** `components/domain/tasks/due-date-field.tsx`

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { DatePicker } from '@/components/shared/date-picker';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';

interface DueDateFieldProps {
  calendarSystem: 'gregorian' | 'hijri';
  onCalendarSystemChange: (value: 'gregorian' | 'hijri') => void;
}

export function DueDateField({ calendarSystem, onCalendarSystemChange }: DueDateFieldProps) {
  const t = useTranslations('tasks.new');
  const dueDate = useTaskFormStore((s) => s.dueDate);
  const set = useTaskFormStore((s) => s.set);

  function handleChange(value: string | null, nextCalendar: 'gregorian' | 'hijri') {
    set('dueDate', value);
    if (nextCalendar !== calendarSystem) onCalendarSystemChange(nextCalendar);
  }

  return (
    <DatePicker
      id="due-date"
      label={t('due_date')}
      value={dueDate}
      calendarSystem={calendarSystem}
      onChange={handleChange}
      required
    />
  );
}
```

**File:** `components/domain/tasks/task-form-fields.tsx`

```tsx
interface Props {
  mode: 'create' | 'edit';
  manualItems: ManualItem[];
  canClassifyConfidential: boolean;
  dueDateCalendarSystem: 'gregorian' | 'hijri';
  onDueDateCalendarSystemChange: (value: 'gregorian' | 'hijri') => void;
}

// pass to DueDateField:
<DueDateField
  calendarSystem={dueDateCalendarSystem}
  onCalendarSystemChange={onDueDateCalendarSystemChange}
/>
```

**File:** `components/domain/tasks/task-creation-form.tsx`

```tsx
const [dueDateCalendarSystem, setDueDateCalendarSystem] = useState<'gregorian' | 'hijri'>('gregorian');

// in persist() body builder:
const body: components['schemas']['StoreTaskRequest'] = {
  blueprint_id: blueprintId as string,
  priority_id: priorityId ?? undefined,
  title_ar: titleAr,
  title_en: titleEn || undefined,
  description_ar: descAr,
  description_en: descEn || undefined,
  classification_level: classificationLevel,
  due_date: dueDate ?? undefined,
  calendar_system: dueDateCalendarSystem === 'hijri' ? 'hijri' : undefined,
  manual_assignments: Object.keys(manualBody).length > 0 ? toApiManual(manualBody) : undefined,
};

// updateTask body builder:
{
  title_ar: titleAr,
  title_en: titleEn || undefined,
  description_ar: descAr,
  description_en: descEn || undefined,
  classification_level: classificationLevel,
  due_date: dueDate ?? undefined,
  calendar_system: dueDateCalendarSystem === 'hijri' ? 'hijri' : undefined,
}
```

Pass props to `TaskFormFields`:

```tsx
<TaskFormFields
  mode={mode}
  manualItems={manualItems}
  canClassifyConfidential={canClassifyConfidential}
  dueDateCalendarSystem={dueDateCalendarSystem}
  onDueDateCalendarSystemChange={setDueDateCalendarSystem}
/>
```

**Key decisions:**
- Uses `DatePicker` (not `HijriDateInput`), imported from `@/components/shared/date-picker`.
- `onChange` receives `(value, nextCalendar)` — threads both value and calendar system change.
- `calendar_system` is omitted when Gregorian to preserve backward compatibility.
- `dueDateCalendarSystem` is local state in the form orchestrator, not in Zustand.

**Rules applied:** `coding-standards.md` § State Management — form values in local state; § Generated types — `StoreTaskRequest` from generated types.

**Test cases:**
1. Select Hijri, enter `1447-02-15`, save draft → `createTask` body includes `calendar_system: 'hijri'` and `due_date: '1447-02-15'`.
2. Switch calendar system → date input clears and `dueDate` becomes `null`.

---

### 10. Public Holiday Hijri Input

**File:** `components/domain/organization/public-holiday-form-dialog.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCreatePublicHoliday, useUpdatePublicHoliday } from '@/lib/api/hooks/use-organization';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { DatePicker } from '@/components/shared/date-picker';
import { asBool } from './organization-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { components } from '@/lib/generated/api-types';

type PublicHolidayResource = components['schemas']['PublicHolidayResource'];
type StorePublicHolidayRequest = components['schemas']['StorePublicHolidayRequest'];

interface PublicHolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarPublicId: string;
  holiday?: PublicHolidayResource;
}

interface HolidayFormState {
  name_ar: string;
  name_en: string;
  holiday_date: string;
  is_recurring: boolean;
  [key: string]: unknown;
}

export function PublicHolidayFormDialog({
  open,
  onOpenChange,
  calendarPublicId,
  holiday,
}: PublicHolidayFormDialogProps) {
  const t = useTranslations('organization');
  const isEdit = !!holiday;

  const [form, setForm] = useState<HolidayFormState>(() => ({
    name_ar: holiday?.name_ar ?? '',
    name_en: holiday?.name_en ?? '',
    holiday_date: holiday?.holiday_date ? holiday.holiday_date.split('T')[0] : '',
    is_recurring: asBool(holiday?.is_recurring),
  }));
  const [calendarSystem, setCalendarSystem] = useState<'gregorian' | 'hijri'>('gregorian');
  const createMutation = useCreatePublicHoliday(calendarPublicId);
  const updateMutation = useUpdatePublicHoliday(calendarPublicId, holiday?.public_id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  function validate(): boolean {
    if (!form.name_ar.trim()) { toast.error(t('dialogs.name_ar_required')); return false; }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      holiday_date: form.holiday_date,
      is_recurring: form.is_recurring,
      calendar_system: calendarSystem === 'hijri' ? 'hijri' : undefined,
    } as unknown as StorePublicHolidayRequest;

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(body, {
      onSuccess: () => onOpenChange(false),
      onError: () => {},
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('dialogs.edit_holiday') : t('dialogs.add_holiday')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('dialogs.edit_holiday') : t('dialogs.add_holiday')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <BilingualNameFields
            form={form as unknown as Record<string, unknown>}
            setForm={setForm as unknown as React.Dispatch<React.SetStateAction<Record<string, unknown>>>}
            t={t}
            nameArKey="name_ar"
          />

          <DatePicker
            id="holiday-date"
            label={t('dialogs.date')}
            value={form.holiday_date}
            calendarSystem={calendarSystem}
            onChange={(value, nextCalendar) => {
              setForm((prev) => ({ ...prev, holiday_date: value ?? '' }));
              if (nextCalendar !== calendarSystem) setCalendarSystem(nextCalendar);
            }}
            required
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_recurring"
              checked={form.is_recurring}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_recurring: checked === true }))}
            />
            <label htmlFor="is_recurring" className="text-sm font-medium">
              {t('dialogs.is_recurring')}
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('actions.saving') : isEdit ? t('actions.save') : t('actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Key decisions:**
- Uses `DatePicker` (not `HijriDateInput`), imported from `@/components/shared/date-picker`.
- Same clearing-on-switch behavior as task due date (handled inside `DatePicker`).
- `calendar_system` optional; omitted for Gregorian.

---



### 11. Advanced Filters `calendarSystem` + `DateRangePicker`

**File:** `components/domain/tasks/task-board-types.ts`

```ts
export interface TaskBoardUrlFilters {
  // ... existing fields ...
  calendarSystem?: 'gregorian' | 'hijri';
}
```

**File:** `components/domain/tasks/task-board-utils.ts`

In `readBoardFilters`:

```ts
calendarSystem: (params.get('calendarSystem') as TaskBoardUrlFilters['calendarSystem']) ?? undefined,
```

In `toBoardQuery`:

```ts
calendar_system: filters.calendarSystem === 'hijri' ? 'hijri' : null,
```

**File:** `components/shared/date-range-picker.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { Locale, DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatHijriIso, dateToLocalIso } from '@/lib/utils/date-utils';

interface DateRangePickerProps {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
  calendarSystem: 'gregorian' | 'hijri';
}

function formatHijriCaption(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

function formatHijriDayNumber(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    day: 'numeric',
  }).format(date);
}

function toHijriIsoFromDate(date: Date, locale: string): string {
  const parts = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '0';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function shortWeekday(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: locale === 'ar' ? 'narrow' : 'short' }).format(date);
}

export function DateRangePicker({ from, to, onChange, calendarSystem }: DateRangePickerProps) {
  const t = useTranslations('localization');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const fromDate = from ? new Date(from + 'T00:00:00') : undefined;
  const toDate = to ? new Date(to + 'T00:00:00') : undefined;
  const committed: DateRange | undefined = fromDate
    ? { from: fromDate, to: toDate }
    : undefined;

  const [pending, setPending] = useState<DateRange | undefined>(committed);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setPending(committed);
  }

  const isHijri = calendarSystem === 'hijri';

  const formatters = {
    formatWeekdayName: (date: Date) => shortWeekday(date, locale),
    ...(isHijri
      ? {
          formatCaption: (date: Date) => formatHijriCaption(date, locale),
          formatDay: (date: Date) => formatHijriDayNumber(date, locale),
        }
      : {
          formatMonthDropdown: (date: Date) =>
            date.toLocaleString(locale === 'ar' ? 'ar' : 'en', { month: 'long' }),
          formatYearDropdown: (date: Date) => String(date.getFullYear()),
        }),
  };

  const triggerLabel = (() => {
    if (isHijri) {
      return from || to
        ? `${from ? formatHijriIso(from, locale) : '…'} – ${to ? formatHijriIso(to, locale) : '…'}`
        : t('hijri_range_placeholder');
    }
    if (!committed?.from) return t('gregorian_range_placeholder');
    const fmt = (d: Date) => format(d, 'MMMM dd, y', { locale: locale === 'ar' ? arSA : undefined });
    return committed.to ? `${fmt(committed.from)} - ${fmt(committed.to)}` : fmt(committed.from);
  })();

  return (
    <Field>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-range"
            className={cn(
              'w-full justify-start text-start font-normal',
              !from && !to && 'text-muted-foreground',
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {triggerLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={pending?.from ? new Date(pending.from.getFullYear(), pending.from.getMonth(), 1) : undefined}
            selected={pending}
            locale={!isHijri && locale === 'ar' ? arSA as unknown as Locale : undefined}
            captionLayout={isHijri ? 'label' : 'dropdown'}
            formatters={formatters}
            numberOfMonths={2}
            onSelect={(nextDate) => {
              if (!nextDate || !nextDate.from) return;
              if (nextDate.to && nextDate.to.getTime() !== nextDate.from.getTime()) {
                const f = isHijri ? toHijriIsoFromDate(nextDate.from, locale) : dateToLocalIso(nextDate.from);
                const t = isHijri ? toHijriIsoFromDate(nextDate.to, locale) : dateToLocalIso(nextDate.to);
                onChange(f, t);
                setOpen(false);
              } else {
                setPending({ from: nextDate.from, to: undefined });
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
```

**File:** `components/domain/tasks/advanced-filters-sheet.tsx`

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RtlSelect } from '@/components/shared/rtl-select';
import { CalendarSystemToggle } from '@/components/shared/calendar-system-toggle';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { useTaskPriorities } from '@/lib/api/hooks/use-task-board';
import { useBlueprintCategories, useStageTypes } from '@/lib/api/hooks/use-task-board';
import { useDepartmentsInfinite } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';
import type { TaskBoardUrlFilters } from '@/components/domain/tasks/task-board-types';

interface AdvancedFiltersSheetProps {
  t: ReturnType<typeof useTranslations>;
  filters: TaskBoardUrlFilters;
  onParam: (key: string, value?: string | null) => void;
  onBatchParams?: (updates: Record<string, string | null>) => void;
  hideFields?: ('stageType' | 'assignee')[];
}

export function AdvancedFiltersSheet({ t, filters, onParam, onBatchParams, hideFields }: AdvancedFiltersSheetProps) {
  const locale = useLocale();
  const side = locale === 'ar' ? 'left' : 'right';
  const { data: departmentsData } = useDepartmentsInfinite();
  const { data: stageTypes } = useStageTypes();
  const { data: priorities } = useTaskPriorities();
  const { data: categories } = useBlueprintCategories();

  const departments = departmentsData?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="size-4" />
          {t('advanced')}
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('advanced')}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          {/* department, stageType, priority, blueprintCategory selects – unchanged */}

          <Field>
            <FieldLabel>{t('calendar_system')}</FieldLabel>
            <CalendarSystemToggle
              value={filters.calendarSystem ?? 'gregorian'}
              onChange={(v) => {
                if (onBatchParams) {
                  onBatchParams({
                    calendarSystem: v === 'gregorian' ? null : v,
                    dateFrom: null,
                    dateTo: null,
                  });
                } else {
                  onParam('calendarSystem', v === 'gregorian' ? null : v);
                  onParam('dateFrom', null);
                  onParam('dateTo', null);
                }
              }}
              className="w-full"
            />
          </Field>

          <DateRangePicker
            from={filters.dateFrom ?? null}
            to={filters.dateTo ?? null}
            onChange={(from, to) => {
              if (onBatchParams) {
                onBatchParams({ dateFrom: from, dateTo: to });
              } else {
                onParam('dateFrom', from);
                onParam('dateTo', to);
              }
            }}
            calendarSystem={filters.calendarSystem ?? 'gregorian'}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Key decisions:**
- No longer uses raw `<input type="text">`. Uses `DateRangePicker` component.
- Added `onBatchParams` prop to batch URL param updates (fixes stale searchParams bug).
- `DateRangePicker` handles both Gregorian (`Calendar mode="range"` with `numberOfMonths=2`) and Hijri (same Calendar with Islamic formatters).
- `CalendarSystemToggle onChange` now uses `onBatchParams` to clear `calendarSystem`/`dateFrom`/`dateTo` in one `router.replace`.
- Switching calendar clears date range to prevent mixed-calendar API submissions.
- `calendarSystem` is camelCase in URL, `calendar_system` snake_case in API query.

**Rules applied:** `coding-standards.md` § URL State for Filters — shareable, bookmarkable; § Query Key Factory — filters feed into `taskBoard.list(filters)` automatically.

**Test cases:**
1. Select Hijri in sheet → URL updates to `?calendarSystem=hijri` and `dateFrom`/`dateTo` cleared.
2. `toBoardQuery` maps `calendarSystem: 'hijri'` to `calendar_system: 'hijri'`.

---

### 12. Dual Date Display Integration

**File:** `components/domain/tasks/details-card.tsx`

```tsx
import { DualDateDisplay } from '@/components/shared/dual-date-display';

<DetailRow
  label={t('created')}
  value={<DualDateDisplay gregorian={task.created_at} hijri={task.created_at_hijri} />}
/>
<DetailRow
  label={t('due_date')}
  value={task.due_date ? <DualDateDisplay gregorian={task.due_date} hijri={task.due_date_hijri} /> : '-'}
/>
{task.suspended_at && (
  <DetailRow label={t('suspended_at')} value={<DualDateDisplay gregorian={task.suspended_at} />} />
)}
{task.cancelled_at && (
  <DetailRow label={t('cancelled_at')} value={<DualDateDisplay gregorian={task.cancelled_at} />} />
)}
```

Note: `suspended_at_hijri`/`cancelled_at_hijri` are not in the type — only Gregorian shown.

**File:** `components/domain/tasks/board-table.tsx`

```tsx
import { DualDateDisplay } from '@/components/shared/dual-date-display';

{task.due_date && (
  <div className="flex flex-col gap-0.5">
    <span className={cn(
      'text-xs text-muted-foreground',
      formatDueDate(task.due_date, locale).includes('overdue') && 'font-semibold text-red-600',
    )}>
      {formatDueDate(task.due_date, locale)}
    </span>
    <DualDateDisplay
      gregorian={task.due_date}
      hijri={task.due_date_hijri}
      variant="stacked"
      className="text-xs text-muted-foreground"
    />
  </div>
)}
```

Shows both `formatDueDate` (relative timing) AND `DualDateDisplay` stacked.

**File:** `components/domain/tasks/board-task-card.tsx`

```tsx
{task.due_date && (
  <div className="text-xs text-muted-foreground">
    <DualDateDisplay gregorian={task.due_date} hijri={task.due_date_hijri} variant="stacked" />
  </div>
)}
```

**File:** `components/domain/tasks/stage-timeline-node.tsx`

```tsx
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { formatHijriIso, formatGregorianDate } from '@/lib/utils/date-utils';

{stage.entered_at && (
  <div className="mt-0.5 text-xs text-muted-foreground">
    <p>
      {tw('tooltip_duration')}: {formatDuration(stage.entered_at, stage.exited_at || null, timeFmt)}
    </p>
    {(() => {
      const gStart = formatGregorianDate(stage.entered_at, locale);
      const hStart = stage.entered_at_hijri ? formatHijriIso(stage.entered_at_hijri, locale) : null;
      if (stage.exited_at) {
        const gEnd = formatGregorianDate(stage.exited_at, locale);
        const hEnd = stage.exited_at_hijri ? formatHijriIso(stage.exited_at_hijri, locale) : null;
        return (
          <div className="flex flex-col gap-0.5">
            <span>{gStart} {locale === 'ar' ? '←' : '→'} {gEnd}</span>
            {hStart && hEnd && <span className="text-muted-foreground">{hStart} {locale === 'ar' ? '←' : '→'} {hEnd}</span>}
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-0.5">
          <span>{gStart}</span>
          {hStart && <span className="text-muted-foreground">{hStart}</span>}
        </div>
      );
    })()}
  </div>
)}
```

Uses inline `formatGregorianDate` + `formatHijriIso` with `→`/`←` between entered/exited (no `DualDateDisplay` — timeline is a special layout).

**File:** `components/domain/shell/notification-item.tsx`

```tsx
import { DualDateDisplay } from '@/components/shared/dual-date-display';

<span className="text-[10px] text-muted-foreground/60">
  <DualDateDisplay gregorian={notification.created_at} hijri={notification.created_at_hijri} />
</span>
```

**File:** `components/domain/organization/public-holidays-sub-view.tsx`

Replace `formatDualDate(holiday.holiday_date, locale)` with:

```tsx
<DualDateDisplay gregorian={holiday.holiday_date} hijri={holiday.holiday_date_hijri} variant="stacked" />
```

**Key decisions:**
- Use API `*_hijri` companions wherever the resource provides them.
- `variant="stacked"` in dense contexts (table subtext, timeline, cards); `variant="inline"` in detail cards.
- `stage-timeline-node.tsx` uses inline formatting with arrow separators (special layout — not using `DualDateDisplay`).
- `details-card.tsx` has no `suspended_at_hijri`/`cancelled_at_hijri` (type lacks them) — Gregorian only.

**Rules applied:** `coding-standards.md` § Generated types — use `created_at_hijri`, `due_date_hijri`, etc.; § i18n — `DualDateDisplay` uses `useLocale` internally.

---

### 13. Follow-Up, Analytics, Global Search

These already pass the `filters` object to their hooks, which forward it as query params via `apiClient`. Only the query builders need the new key.

**Follow-up board** (`components/domain/follow-up/follow-up-board.tsx` or equivalent):

- Add `calendarSystem` to follow-up URL filter state.
- In the query builder, map `calendarSystem === 'hijri'` → `calendar_system: 'hijri'`.
- Reuse `AdvancedFiltersSheet` if follow-up uses it; otherwise add `CalendarSystemToggle` to the follow-up filter bar.

**Analytics** (`components/domain/analytics/*-filters.tsx`):

- The filters already pass `dateFrom`/`dateTo` to `AdvancedFiltersSheet`.
- Add `calendarSystem` to `mappedFilters` and to `activeCount`.
- The underlying analytics hook's query builder maps to `calendar_system`.

**Global Search** (`components/domain/search/global-search.tsx`):

- The current global search has no date filters. Defer date-filter Hijri support until search UI adds date range controls; the backend already supports `calendar_system=hijri` on `GET /v1/search/tasks`.

**Rules applied:** `coding-standards.md` § Cursor Pagination — filter state in URL, hooks use `useInfiniteQuery` already; no hook signature changes beyond forwarding the new key.

---

### 14. Messages

Add to `messages/en.json` under a new `localization` namespace:

```json
{
  "localization": {
    "gregorian": "Gregorian",
    "hijri": "Hijri",
    "hijri_prefix": "",
    "hijri_suffix": " AH",
    "hijri_date_label": "Hijri date",
    "calendar_system_label": "Calendar system",
    "date_converter_label": "Date Converter",
    "date_converter_title": "Date Converter",
    "from_calendar": "From calendar",
    "date_label": "Date",
    "convert": "Convert",
    "converter_empty": "Enter a date and press Convert",
    "gregorian_placeholder": "YYYY-MM-DD",
    "gregorian_range_placeholder": "YYYY-MM-DD – YYYY-MM-DD",
    "hijri_placeholder": "1447-02-15",
    "hijri_range_placeholder": "1447-01-01 – 1447-01-30",
    "hijri_hint": "e.g. 1447-02-15",
    "context": {
      "title": "Localization",
      "locale": "Locale",
      "direction": "Direction",
      "timezone": "Timezone",
      "variant": "Hijri Calendar"
    }
  }
}
```

Add to `messages/ar.json` — Arabic mirror with RTL strings. Key changes: `hijri_prefix: "هـ"`, `hijri_suffix: "ه"`, `gregorian: "ميلادي"`, `hijri: "هجري"`, etc. with Arabic translations.

Also add to `organization` namespace (both locales):

```json
{
  "departments": {
    "columns": {
      "calendar": "Working Calendar"
    },
    "calendar": "Working Calendar",
    "calendar_placeholder": "Select a working calendar",
    "default_calendar": "Default Calendar"
  }
}
```

Arabic mirror: `calendar_placeholder: "اختر تقويم عمل"`, `default_calendar: "التقويم الافتراضي"`.

---

## Data Flow

```
1. Localization Context
GET /v1/localization/context
  → useLocalizationContext()
  → LocalizationContextSection
  → NavUser preferences submenu

2. Date Conversion
User enters date + from_calendar in DateConverterDialog
  → setParams() state
  → useDateConversion(params)
  → GET /v1/localization/date-conversion?date=...&from_calendar=...
  → DateConversionResource
  → Dialog result area

3. Hijri Date Input (Task Due Date / Public Holiday)
User selects Hijri + types ISO Hijri date
  → HijriDateInput onChange(null on switch, then string)
  → Parent form state
  → Submit body includes calendar_system: 'hijri' + date string
  → Backend normalizes to Gregorian
  → Response includes *_hijri companion

4. Calendar System Filter
User toggles calendarSystem in AdvancedFiltersSheet
  → URL param ?calendarSystem=hijri
  → readBoardFilters() / analytics equivalent
  → toBoardQuery() maps to calendar_system: 'hijri'
  → apiClient.get('/v1/...', { params })
  → Backend normalizes date range bounds

5. Department Calendar Assignment
User selects calendar in DepartmentFormDialog
  → form.working_calendar_id
  → body.working_calendar_id (null for default sentinel)
  → useUpdateDepartment.mutate(body)
  → PUT /v1/organization/departments/{publicId}
  → qiDepartments() invalidates lists + tree
  → DepartmentsTable re-renders with WorkingCalendarBadge

6. Dual Date Display
Resource response includes Gregorian + *_hijri
  → DualDateDisplay formats both via Intl.DateTimeFormat
  → Renders primary Gregorian + companion Hijri
```

---

## Route Structure

No new routes. Locale remains cookie-based (`NEXT_LOCALE`).

- `/tasks` — Task board; reads `?calendarSystem=` and date range from URL.
- `/tasks/[publicId]` — Task detail; dual dates via API companions.
- `/tasks/create` — Task creation; Hijri due date input.
- `/organization` — Departments tab; calendar column + form select.
- `/organization?tab=calendars` — Working calendars + public holidays; Hijri holiday date input.
- `/follow-up` — Follow-up board; calendar system filter when implemented.
- `/analytics` — Executive/aging/department dashboards; calendar system filter.

---

## Execution Order

1. **Regenerate types** — `npm run generate:api` (verify `localization.context`, `localization.dateConversion`, `*_hijri` fields, `working_calendar_id`).
2. **Query keys + hooks** — Add `localization` namespace and `lib/api/hooks/use-localization.ts`.
3. **Shared components** — Build `DualDateDisplay`, `CalendarSystemToggle`, `HijriDateInput`.
4. **Shell components** — Build `DateConverterDialog` + `LocalizationContextSection`; wire into `site-header.tsx` and `nav-user.tsx`.
5. **Organization calendar assignment** — `DepartmentCalendarSelect`, `WorkingCalendarBadge`, update `department-form-dialog.tsx`, `departments-table.tsx`.
6. **Hijri input on forms** — Update `due-date-field.tsx`, `task-form-fields.tsx`, `task-creation-form.tsx`; update `public-holiday-form-dialog.tsx`.
7. **Filter integration** — Update `task-board-types.ts`, `task-board-utils.ts`, `advanced-filters-sheet.tsx`; mirror in follow-up and analytics filter builders.
8. **Dual date rollout** — Update `details-card.tsx`, `board-table.tsx`, `board-task-card.tsx`, `stage-timeline-node.tsx`, `notification-item.tsx`, `public-holidays-sub-view.tsx`.
9. **Messages** — Add `localization` and `organization.departments.*` keys to both locales.
10. **Tests** — Add/extend component tests for `DualDateDisplay`, `CalendarSystemToggle`, `HijriDateInput`, `DateConverterDialog`, `LocalizationContextSection`, and integration tests for task create/org department flows.
11. **Manual QA** — Test AR RTL and EN LTR, loading/empty/error states, permission gating, responsive breakpoints, keyboard navigation.

---

## What to Test Manually

1. **Dual date display (AR + EN)**
   - Open task detail in Arabic → see `٢٦ يوليو ٢٠٢٥ • ١ محرم ١٤٤٧` style.
   - Switch to English → see `Jul 26, 2025 · 1 Muh 1447` style.
   - Verify stage timeline, board table subtext, notification item, and public holiday list all show dual dates.
2. **Hijri date input — task create**
   - Select Hijri, type `1447-02-15`, save draft.
   - Inspect network tab: body contains `calendar_system: 'hijri'`, `due_date: '1447-02-15'`.
   - Backend returns `due_date_hijri: '1447-02-15'` on detail load.
3. **Calendar switch clears value**
   - Type a date, switch to Hijri → input empties.
   - Type a Hijri date, switch to Gregorian → input empties.
4. **Invalid Hijri date**
   - Submit impossible Hijri date (e.g. `1447-02-30`) → `toast.error()` shows backend 422 message in active locale.
5. **Advanced filter calendar system**
   - Open filters, set calendar to Hijri, pick date range, apply.
   - URL shows `?calendarSystem=hijri&dateFrom=...&dateTo=...`.
   - Switch back to Gregorian → `dateFrom`/`dateTo` removed from URL.
6. **Date Converter**
   - Click top-bar icon, enter `1447-01-01`, select Hijri, press Enter → result shows Gregorian + Hijri + timezone.
   - Enter invalid/out-of-range date → inline error in dialog.
7. **Localization Context**
   - Open user menu → Preferences → Localization → verify locale, direction, timezone, Hijri variant displayed.
   - Simulate network failure → section hidden, no error toast.
8. **Department calendar assignment**
   - As user with `organization.manage`, edit a department, assign a working calendar, save.
   - Departments table shows calendar badge.
   - Select "Use Tenant Default", save → badge shows "Default".
   - Try to delete a calendar assigned to a department → toast error from backend.
9. **Permission gating**
   - Remove `organization.manage` → Add/Edit department buttons and calendar column hidden/disabled.
   - Task create remains available per existing `task.manage`.
10. **Loading / empty / error states**
    - Throttle network → verify skeletons in `DualDateDisplay`, `LocalizationContextSection`, `DateConverterDialog`.
    - Block `/v1/localization/context` → preferences section hides silently.
    - Block `/v1/organization/working-calendars` → department select disabled with loading state.
11. **Responsive behavior**
    - Mobile (<640px): `DualDateDisplay` stacks Hijri on new line; Date Converter dialog is full-screen (shadcn default on mobile); filter toggle stacks.
    - Desktop: Hijri inline in tables, side-by-side in detail cards.
12. **Keyboard navigation**
    - Tab through Date Converter dialog fields; Enter converts; Escape closes.
    - Tab through `CalendarSystemToggle` buttons; Space/Enter activate.
    - Screen reader announces Hijri companion via `aria-label`.
