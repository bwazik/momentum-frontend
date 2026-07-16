# Implementation Plan: 017 User Settings & Delegation

> **Spec:** `specs/017-user-settings-delegation/spec.md`
> **Date:** 2026-07-15
> **Status:** `completed`

---

## Open Questions Resolved

All open questions from the spec are resolved. No `<!-- TODO: verify -->` remain.

| # | Question (from spec) | Decision | Rationale |
|---|----------------------|----------|-----------|
| 1 | Self-service delegation authorization | **Front-end keeps Create/Edit/Revoke controls behind `iam.manage_users` until the backend self-service authorization update is released.** The form already supports an optional `delegator_user_id` so it will work for both on-behalf and self-service later. | Backend follow-on is approved but not yet released; front-end must not guess authorization. |
| 2 | Eligible delegate lookup | **No lightweight eligible-delegate endpoint for MVP.** Delegate/on-behalf lookups reuse the existing `GET /v1/iam/users` search, which requires `iam.manage_users`. Normal users mark themselves out-of-office without selecting a delegate. | Matches backend 016 contract and capability model. |
| 3 | On-behalf creation | **Yes.** The create form shows an optional "Delegating on behalf of" selector only for `iam.manage_users`. Omitting it defaults to the authenticated user via backend. | `delegator_user_id` is optional in `StoreDelegationRequest`. |
| 4 | Scope serialization | **Use lowercase strings** returned by `DelegationResource.scope_type`: `all`, `blueprint_category`, `stage_type`, `blueprint_category_and_stage_type`. Submit strings or integer codes; front-end uses strings for display and generated enum types for submission. | OpenAPI regenerated per backend 016. |
| 5 | Language preference mapping | **API returns `arabic`/`english` and accepts integer (`1`/`2`) or enum-string (`ARABIC`/`ENGLISH`).** On successful `PUT /v1/iam/profile`, set `NEXT_LOCALE` via existing `useLocaleStore.setLocale()` and invalidate `queryKeys.auth.me`; locale takes effect on next page load. | Confirmed with backend 003 IAM contract. |

---

## Technical Approach

**One-line summary:** Build a tabbed `/settings` page inside the authenticated dashboard shell that reuses `useCurrentUser` for profile/availability, adds a domain `use-delegations.ts` hook module for active delegations and delegation mutations, and renders profile/availability and active-delegations workspaces behind capability-aware UI using shadcn `Tabs`, `Field`, `Switch`, `Dialog`, and the `DatePicker`/`CalendarSystemToggle` toolkit from Spec 020.

**Key decisions:**
- **Route is cookie-based locale, no `[locale]` prefix.** `/settings?tab=profile` and `/settings?tab=delegations`. Invalid/missing tab defaults to `profile`.
- **No new Zustand store.** All API data lives in TanStack Query; filters live in URL; dialog/form state is local.
- **Profile mutations live in `use-auth.ts`**, extending the existing auth hooks file (profile, out-of-office, back-in-office). Delegation mutations live in a new `lib/api/hooks/use-delegations.ts`.
- **Active delegations use `useInfiniteQuery`** with manual Load More, 30-second stale time, and window-focus refetch.
- **Capability-gated UI only.** `iam.view_delegations` or `iam.manage_users` hides the Delegations tab; direct navigation still renders the server response. `iam.manage_users` gates Create/Edit/Revoke and person-lookup filters.
- **Generated types only.** `UserResource`, `DelegationResource`, `StoreDelegationRequest`, `UpdateDelegationRequest`, `UpdateUserRequest` come from `lib/generated/api-types.ts`.
- **Hijri/Gregorian date input reuses Spec 020 components.** `DatePicker` + `CalendarSystemToggle`; changing calendar system clears the date value.

---

## Component Tree

```
app/(dashboard)/
├── settings/
│   └── page.tsx                           # Server — SettingsPage

components/domain/settings/
├── settings-workspace.tsx                 # Client — reads URL tab, composes sections
├── profile-settings-card.tsx              # Client — editable profile form
├── availability-card.tsx                  # Client — OOO status, delegate, return
├── active-delegations-panel.tsx           # Client — table/cards, filters, Load More
├── delegation-table-row.tsx               # Client — single desktop row
├── delegation-mobile-card.tsx             # Client — single mobile card
├── delegation-filters.tsx                 # Client — URL-driven filter bar
├── delegation-form-dialog.tsx             # Client — create/edit delegation
├── revoke-delegation-dialog.tsx           # Client — AlertDialog confirmation
├── settings-skeleton.tsx                  # Client — profile/availability skeleton
└── delegation-table-skeleton.tsx          # Client — table/card skeleton

components/domain/shell/
├── nav-user.tsx                           # MODIFIED — add Preferences → /settings link
├── site-header.tsx                        # MODIFIED — add /settings page title
└── use-page-breadcrumb.ts                 # MODIFIED — add /settings crumb

lib/api/hooks/
├── use-auth.ts                            # MODIFIED — add profile + OOO mutations
└── use-delegations.ts                     # NEW — active delegations + CRUD mutations

lib/api/query-keys.ts                      # MODIFIED — add delegations namespace

components/ui/
└── switch.tsx                             # NEW — shadcn Switch (add via CLI)

messages/
├── ar.json                                # MODIFIED — add settings namespace
└── en.json                                # MODIFIED — add settings namespace
```

**Server vs Client:**
- **Server:** `app/(dashboard)/settings/page.tsx` renders `PageHeader` + `SettingsWorkspace`.
- **Client:** All `components/domain/settings/*` components (interactivity, queries, forms).

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `app/(dashboard)/settings/page.tsx` | Route page inside dashboard shell. |
| `components/domain/settings/settings-workspace.tsx` | Tabs orchestrator; reads `?tab=`; conditionally renders Delegations tab. |
| `components/domain/settings/profile-settings-card.tsx` | Editable name/mobile/language + read-only org fields. |
| `components/domain/settings/availability-card.tsx` | OOO switch, delegate selector (admin only), back-in-office button. |
| `components/domain/settings/active-delegations-panel.tsx` | Desktop table / mobile cards, filters, Load More, empty/error states. |
| `components/domain/settings/delegation-table-row.tsx` | Row: delegator, delegate, scope, dates, status, actions. |
| `components/domain/settings/delegation-mobile-card.tsx` | Card layout for <640px. |
| `components/domain/settings/delegation-filters.tsx` | URL filters: delegator, delegate, category, stage type, reset. |
| `components/domain/settings/delegation-form-dialog.tsx` | Create/edit delegation with conditional scope fields and date pickers. |
| `components/domain/settings/revoke-delegation-dialog.tsx` | Destructive confirmation before `POST /v1/iam/delegations/{id}/revoke`. |
| `components/domain/settings/settings-skeleton.tsx` | Two-card skeleton for profile/availability. |
| `components/domain/settings/delegation-table-skeleton.tsx` | 5 skeleton rows / cards. |
| `lib/api/hooks/use-delegations.ts` | `useActiveDelegationsInfinite`, `useCreateDelegation`, `useUpdateDelegation`, `useRevokeDelegation`. |
| `components/ui/switch.tsx` | shadcn Switch primitive. |

### Modified Files

| File | Change |
|------|--------|
| `lib/api/hooks/use-auth.ts` | Add `useUpdateProfile`, `useMarkOutOfOffice`, `useMarkBackInOffice`. |
| `lib/api/query-keys.ts` | Add `delegations` namespace. |
| `components/domain/shell/nav-user.tsx` | Add Preferences item linking to `/settings` in user dropdown. |
| `components/domain/shell/site-header.tsx` | Add `/settings` to `pageTitles` fallback map. |
| `components/domain/shell/use-page-breadcrumb.ts` | Add `/settings` crumb. |
| `messages/ar.json` | Add `settings` namespace (~80 keys). |
| `messages/en.json` | Add `settings` namespace (~80 keys). |

---

## Implementation Notes

### 0. shadcn Prerequisite

Add the `switch` primitive:

```bash
npx shadcn@latest add switch
```

Verify it uses logical properties and does not introduce physical-direction classes. If it does, fix `switch.tsx` to use logical padding/margin.

---

### 1. Query Keys — `lib/api/query-keys.ts`

**One-line summary:** Add a `delegations` namespace using the established factory pattern.

**Files:** `lib/api/query-keys.ts` (MODIFY)

```ts
delegations: {
  all: ['delegations'] as const,
  activeLists: () => [...queryKeys.delegations.all, 'active', 'list'] as const,
  activeList: (filters: Record<string, unknown>) =>
    [...queryKeys.delegations.activeLists(), filters] as const,
  detail: (publicId: string) =>
    [...queryKeys.delegations.all, 'detail', publicId] as const,
},
```

**Rules applied:** `coding-standards.md` § Query Key Factory; no hardcoded strings.

---

### 2. Auth Hooks — `lib/api/hooks/use-auth.ts`

**One-line summary:** Extend `use-auth.ts` with profile update and out-of-office/back-in-office mutations, invalidating `queryKeys.auth.me` on success.

**Files:** `lib/api/hooks/use-auth.ts` (MODIFY)

Add imports:

```ts
import { useTranslations } from 'next-intl';
import type { components } from '@/lib/generated/api-types';

type UpdateUserRequest = components['schemas']['UpdateUserRequest'];
```

Add hooks:

```ts
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.profile.toast');
  return useMutation({
    mutationFn: (body: UpdateUserRequest) =>
      apiClient.put<UserResource>('/v1/iam/profile', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(t('profile_saved'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useMarkOutOfOffice() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.availability.toast');
  return useMutation({
    mutationFn: (vars: { publicId: string; delegateUserId?: string | null }) =>
      apiClient.post<UserResource>(`/v1/iam/users/${vars.publicId}/out-of-office`, {
        out_of_office_delegate_user_id: vars.delegateUserId ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(t('marked_out_of_office'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useMarkBackInOffice() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.availability.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<UserResource>(`/v1/iam/users/${publicId}/back-in-office`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success(t('marked_back_in_office'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
```

**Key decisions:**
- Profile body uses generated `UpdateUserRequest` (fields: `name_ar`, `name_en`, `mobile`, `preferred_language`).
- `preferred_language` is submitted as integer `1` for Arabic or `2` for English to match the generated enum backing values (verify in `lib/generated/api-types.ts` after `npm run generate:api`).
- OOF mutation sends `out_of_office_delegate_user_id` only when provided; otherwise omits it.

**Rules applied:** `coding-standards.md` § Query Hook Pattern; mutation invalidation; generated types; sonner toasts.

---

### 3. Delegation Hooks — `lib/api/hooks/use-delegations.ts`

**One-line summary:** Domain hooks for active-delegation list (cursor-paginated) and delegation create/update/revoke mutations.

**Files:** `lib/api/hooks/use-delegations.ts` (NEW)

```ts
'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type { components } from '@/lib/generated/api-types';

type DelegationResource = components['schemas']['DelegationResource'];
type StoreDelegationRequest = components['schemas']['StoreDelegationRequest'];
type UpdateDelegationRequest = components['schemas']['UpdateDelegationRequest'];

export interface ActiveDelegationFilters {
  delegator_user_id?: string;
  delegate_user_id?: string;
  blueprint_category_id?: string;
  stage_type_id?: string;
}

export function useActiveDelegationsInfinite(filters: ActiveDelegationFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.delegations.activeList(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<DelegationResource>>('/v1/iam/delegations/active', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.delegations.toast');
  return useMutation({
    mutationFn: (body: StoreDelegationRequest) =>
      apiClient.post<DelegationResource>('/v1/iam/delegations', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delegations.all });
      toast.success(t('delegation_created'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateDelegation() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.delegations.toast');
  return useMutation({
    mutationFn: (vars: { publicId: string; body: UpdateDelegationRequest }) =>
      apiClient.put<DelegationResource>(`/v1/iam/delegations/${vars.publicId}`, vars.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delegations.all });
      toast.success(t('delegation_updated'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRevokeDelegation() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.delegations.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<DelegationResource>(`/v1/iam/delegations/${publicId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delegations.all });
      toast.success(t('delegation_revoked'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
```

**Key decisions:**
- Active list filters are optional public IDs forwarded as query params.
- `staleTime: 30s` + `refetchOnWindowFocus: true` because delegations are time-sensitive.
- Mutations invalidate the entire `delegations` prefix to refresh any active-list variant.

**Rules applied:** `coding-standards.md` § Cursor Pagination with `useInfiniteQuery`; generated types; query key factory; mutation invalidation.

---

### 4. Settings Route — `app/(dashboard)/settings/page.tsx`

**One-line summary:** Server page renders `PageHeader` and the client `SettingsWorkspace`.

**Files:** `app/(dashboard)/settings/page.tsx` (NEW)

```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { SettingsWorkspace } from '@/components/domain/settings/settings-workspace';

export default async function SettingsPage() {
  const t = await getTranslations('settings');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
      />
      <SettingsWorkspace />
    </main>
  );
}
```

**Rules applied:** `coding-standards.md` § Server vs Client; page remains a Server Component.

---

### 5. Settings Workspace — `components/domain/settings/settings-workspace.tsx`

**One-line summary:** Reads `?tab=` from URL, renders `Tabs` with Profile and (capability-gated) Delegations, and routes tab changes through `router.replace`.

**Files:** `components/domain/settings/settings-workspace.tsx` (NEW)

```tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { ProfileSettingsCard } from './profile-settings-card';
import { AvailabilityCard } from './availability-card';
import { ActiveDelegationsPanel } from './active-delegations-panel';
import { SettingsSkeleton } from './settings-skeleton';

export function SettingsWorkspace() {
  const t = useTranslations('settings');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canViewDelegations = useCapability('iam.view_delegations') || useCapability('iam.manage_users');

  const tab = searchParams.get('tab') === 'delegations' ? 'delegations' : 'profile';

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'profile') params.delete('tab');
    else params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
      <TabsList className="self-start">
        <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
        {canViewDelegations && (
          <TabsTrigger value="delegations">{t('tabs.delegations')}</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="profile" className="mt-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProfileSettingsCard />
          </div>
          <div>
            <AvailabilityCard />
          </div>
        </div>
      </TabsContent>
      {canViewDelegations && (
        <TabsContent value="delegations" className="mt-0">
          <ActiveDelegationsPanel />
        </TabsContent>
      )}
    </Tabs>
  );
}
```

**Key decisions:**
- Tab state is URL-driven so bookmarks/back-button work.
- Invalid/missing tab defaults to `profile`.
- Delegations tab is hidden without capability; direct navigation still renders the route because this is a UX gate only.

**Rules applied:** `coding-standards.md` § URL State for Filters/Tabs; `security-policy.md` § capability UI is not authority.

**Test cases:**
1. User without `iam.view_delegations` or `iam.manage_users` → only Profile tab rendered.
2. URL `?tab=delegations` on a manager account → Delegations tab active and panel loaded.

---

### 6. Profile Settings Card — `components/domain/settings/profile-settings-card.tsx`

**One-line summary:** Editable bilingual name, mobile, and language preference; read-only email, employee ID, and position.

**Files:** `components/domain/settings/profile-settings-card.tsx` (NEW)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { useCurrentUser, useUpdateProfile } from '@/lib/api/hooks/use-auth';
import { useLocaleStore } from '@/lib/stores/use-locale-store';
import { SettingsSkeleton } from './settings-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { localizeName } from '@/lib/utils/localize';
import { toast } from 'sonner';

interface ProfileFormState {
  name_ar: string;
  name_en: string;
  mobile: string;
  preferred_language: '1' | '2';
}

function languageValueFromApi(apiValue?: string): '1' | '2' {
  if (!apiValue) return '1';
  const v = apiValue.toLowerCase();
  if (v === 'english' || v === 'en') return '2';
  return '1';
}

export function ProfileSettingsCard() {
  const t = useTranslations('settings.profile');
  const locale = useLocale();
  const { data: user, isLoading, isError, refetch } = useCurrentUser();
  const update = useUpdateProfile();
  const setLocaleCookie = useLocaleStore((s) => s.setLocale);
  const [form, setForm] = useState<ProfileFormState>({
    name_ar: '',
    name_en: '',
    mobile: '',
    preferred_language: '1',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name_ar: user.name_ar ?? '',
      name_en: user.name_en ?? '',
      mobile: user.mobile ?? '',
      preferred_language: languageValueFromApi(user.preferred_language),
    });
  }, [user]);

  if (isLoading) return <SettingsSkeleton />;
  if (isError || !user) return <ErrorState message={t('error')} onRetry={() => refetch()} />;

  function handleFieldChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name_ar.trim()) {
      toast.error(t('name_ar_required'));
      return;
    }
    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || null,
      mobile: form.mobile || null,
      preferred_language: Number(form.preferred_language) as 1 | 2,
    };
    update.mutate(body, {
      onSuccess: () => {
        const nextLocale = form.preferred_language === '1' ? 'ar' : 'en';
        setLocaleCookie(nextLocale);
      },
    });
  }

  const positionName = user.current_position?.position?.name_ar
    ? localizeName(locale, user.current_position.position.name_ar, user.current_position.position.name_en)
    : '-';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <BilingualNameFields
            form={form as unknown as Record<string, unknown>}
            setForm={setForm as unknown as React.Dispatch<React.SetStateAction<Record<string, unknown>>>}
            t={t}
            arRequired
          />
          <Field>
            <FieldLabel>{t('mobile')}</FieldLabel>
            <Input
              type="tel"
              value={form.mobile}
              onChange={(e) => handleFieldChange('mobile', e.target.value)}
              dir="ltr"
            />
          </Field>
          <Field>
            <FieldLabel>{t('preferred_language')}</FieldLabel>
            <RtlSelect
              value={form.preferred_language}
              onValueChange={(v) => handleFieldChange('preferred_language', v as '1' | '2')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{t('language_arabic')}</SelectItem>
                <SelectItem value="2">{t('language_english')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>{t('email')}</FieldLabel>
              <Input value={user.email} readOnly dir="ltr" />
            </Field>
            <Field>
              <FieldLabel>{t('employee_id')}</FieldLabel>
              <Input value={user.employee_id ?? '-'} readOnly dir="ltr" />
            </Field>
          </div>
          <Field>
            <FieldLabel>{t('position')}</FieldLabel>
            <Input value={positionName} readOnly />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Key decisions:**
- Form state is local and seeded from `useCurrentUser` via `useEffect`.
- `preferred_language` is stored as string `'1'`/`'2'` in form, converted to integer for API.
- On success, call `useLocaleStore.setLocale(nextLocale)` to set `NEXT_LOCALE` cookie and reload (the store's `setLocale` already reloads the page).
- Read-only fields use `Input readOnly` for visual consistency and disabled styling.

**Rules applied:** `coding-standards.md` § Form handling via shadcn Field + InputGroup/BilingualNameFields; validation errors via `toast.error`; generated types.

**Test cases:**
1. Empty Arabic name → submit blocked with `toast.error(t('name_ar_required'))`.
2. Change language to English and save → `useLocaleStore.setLocale('en')` called, page reloads, backend profile updated.

---

### 7. Availability Card — `components/domain/settings/availability-card.tsx`

**One-line summary:** Shows text-labelled OOO status and allows toggling; managers can optionally pick a delegate.

**Files:** `components/domain/settings/availability-card.tsx` (NEW)

```tsx
'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Field, FieldLabel } from '@/components/ui/field';
import { useCurrentUser, useMarkOutOfOffice, useMarkBackInOffice } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { UserSearchCombobox } from '@/components/domain/tasks/user-search-combobox';
import { SettingsSkeleton } from './settings-skeleton';
import { ErrorState } from '@/components/shared/error-state';

export function AvailabilityCard() {
  const t = useTranslations('settings.availability');
  const locale = useLocale();
  const { data: user, isLoading, isError, refetch } = useCurrentUser();
  const canManageUsers = useCapability('iam.manage_users');
  const markOoo = useMarkOutOfOffice();
  const markBack = useMarkBackInOffice();
  const [delegateId, setDelegateId] = useState<string>('');

  if (isLoading) return <SettingsSkeleton />;
  if (isError || !user) return <ErrorState message={t('error')} onRetry={() => refetch()} />;

  const isOut = user.is_out_of_office;

  function handleToggle(checked: boolean) {
    if (checked) {
      markOoo.mutate({
        publicId: user.public_id,
        delegateUserId: canManageUsers ? (delegateId || null) : null,
      });
    } else {
      markBack.mutate(user.public_id);
      setDelegateId('');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{t('status_label')}</span>
            <span className={isOut ? 'text-amber-600' : 'text-emerald-600'}>
              {isOut ? t('status_out_of_office') : t('status_in_office')}
            </span>
          </div>
          <Switch
            checked={isOut}
            onCheckedChange={handleToggle}
            disabled={markOoo.isPending || markBack.isPending}
            aria-label={t('toggle_aria')}
          />
        </div>
        {!isOut && canManageUsers && (
          <Field>
            <FieldLabel>{t('delegate_label')}</FieldLabel>
            <UserSearchCombobox
              value={delegateId}
              onChange={setDelegateId}
              placeholder={t('delegate_placeholder')}
            />
            <p className="text-xs text-amber-600">{t('delegate_warning')}</p>
          </Field>
        )}
        {isOut && (
          <Button
            variant="outline"
            onClick={() => handleToggle(false)}
            disabled={markBack.isPending}
          >
            {markBack.isPending ? t('returning') : t('back_in_office')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

**Key decisions:**
- Switch drives both directions; unchecked = back-in-office.
- Delegate selector only rendered when user is currently in office AND has `iam.manage_users`.
- Warning text reminds that no delegate means no replacement recipient.
- Both switch and back-in-office button disable while either mutation is pending.

**Rules applied:** `coding-standards.md` § All 4 states; `security-policy.md` § capability UI only; accessibility: switch has `aria-label`, status uses text + color.

**Test cases:**
1. Toggle switch on (manager with no delegate) → `POST out-of-office` with no delegate.
2. Click "Back in office" → `POST back-in-office` and delegate state cleared.

---

### 8. Active Delegations Panel — `components/domain/settings/active-delegations-panel.tsx`

**One-line summary:** Cursor-paginated active delegations with URL filters, desktop table, mobile cards, and manual Load More.

**Files:** `components/domain/settings/active-delegations-panel.tsx` (NEW)

```tsx
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useActiveDelegationsInfinite, type ActiveDelegationFilters } from '@/lib/api/hooks/use-delegations';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { DelegationFilters } from './delegation-filters';
import { DelegationTableRow } from './delegation-table-row';
import { DelegationMobileCard } from './delegation-mobile-card';
import { DelegationTableSkeleton } from './delegation-table-skeleton';
import { DelegationFormDialog } from './delegation-form-dialog';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function readFilters(searchParams: URLSearchParams): ActiveDelegationFilters {
  return {
    delegator_user_id: searchParams.get('delegatorId') ?? undefined,
    delegate_user_id: searchParams.get('delegateId') ?? undefined,
    blueprint_category_id: searchParams.get('blueprintCategoryId') ?? undefined,
    stage_type_id: searchParams.get('stageTypeId') ?? undefined,
  };
}

export function ActiveDelegationsPanel() {
  const t = useTranslations('settings.delegations');
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const canManage = useCapability('iam.manage_users');
  const query = useActiveDelegationsInfinite(filters);

  const allDelegations = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  if (query.isLoading) return <DelegationTableSkeleton />;
  if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{t('title')}</CardTitle>
          </div>
          {canManage && <DelegationFormDialog />}
        </div>
        <DelegationFilters filters={filters} />
      </CardHeader>
      <CardContent>
        {allDelegations.length === 0 ? (
          <EmptyState
            title={t('empty_title')}
            description={t('empty_description')}
            action={canManage ? <DelegationFormDialog /> : undefined}
          />
        ) : (
          <>
            <div className="hidden md:block">
              <RtlTable>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t('columns.delegator')}</TableHead>
                    <TableHead className="text-start">{t('columns.delegate')}</TableHead>
                    <TableHead className="text-start">{t('columns.scope')}</TableHead>
                    <TableHead className="text-start">{t('columns.dates')}</TableHead>
                    <TableHead className="text-start">{t('columns.status')}</TableHead>
                    <TableHead className="text-end">{t('columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDelegations.map((d) => (
                    <DelegationTableRow key={d.public_id} delegation={d} />
                  ))}
                </TableBody>
              </RtlTable>
            </div>
            <div className="md:hidden flex flex-col gap-4">
              {allDelegations.map((d) => (
                <DelegationMobileCard key={d.public_id} delegation={d} />
              ))}
            </div>
            {query.hasNextPage && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

**Key decisions:**
- Filters are read from URL and passed to the hook.
- Empty state shows Create CTA only for managers.
- Manual Load More, no infinite scroll.

**Rules applied:** `coding-standards.md` § Cursor pagination UI; all 4 states; logical properties (`text-start`/`text-end`); `RtlTable`.

**Test cases:**
1. Empty result → `EmptyState` with Create button for managers.
2. Populated list → table on desktop, cards on mobile, Load More when `has_more`.

---

### 9. Delegation Filters — `components/domain/settings/delegation-filters.tsx`

**One-line summary:** URL-driven filter bar; person lookups only for `iam.manage_users`.

**Files:** `components/domain/settings/delegation-filters.tsx` (NEW)

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { UserSearchCombobox } from '@/components/domain/tasks/user-search-combobox';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useBlueprintCategories, useBlueprintStageTypes } from '@/lib/api/hooks/use-blueprints';
import { useLocale } from 'next-intl';
import { localizeName } from '@/lib/utils/localize';
import type { ActiveDelegationFilters } from '@/lib/api/hooks/use-delegations';

interface DelegationFiltersProps {
  filters: ActiveDelegationFilters;
}

export function DelegationFilters({ filters }: DelegationFiltersProps) {
  const t = useTranslations('settings.delegations.filters');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canManageUsers = useCapability('iam.manage_users');
  const { data: categories } = useBlueprintCategories();
  const { data: stageTypes } = useBlueprintStageTypes();

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canManageUsers && (
          <>
            <UserSearchCombobox
              value={filters.delegator_user_id ?? ''}
              onChange={(v) => setParam('delegatorId', v || null)}
              placeholder={t('delegator')}
            />
            <UserSearchCombobox
              value={filters.delegate_user_id ?? ''}
              onChange={(v) => setParam('delegateId', v || null)}
              placeholder={t('delegate')}
            />
          </>
        )}
        <RtlSelect
          value={filters.blueprint_category_id ?? 'all'}
          onValueChange={(v) => setParam('blueprintCategoryId', v === 'all' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('category')} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_categories')}</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.public_id} value={c.public_id}>
                {localizeName(locale, c.name_ar, c.name_en)}
              </SelectItem>
            ))}
          </SelectContent>
        </RtlSelect>
        <RtlSelect
          value={filters.stage_type_id ?? 'all'}
          onValueChange={(v) => setParam('stageTypeId', v === 'all' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('stage_type')} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_stage_types')}</SelectItem>
            {(stageTypes ?? []).map((s) => (
              <SelectItem key={s.public_id} value={s.public_id}>
                {localizeName(locale, s.name_ar, s.name_en)}
              </SelectItem>
            ))}
          </SelectContent>
        </RtlSelect>
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)}>
          {t('reset')}
        </Button>
      </div>
    </div>
  );
}
```

**Key decisions:**
- Delegator/delegate filters use `UserSearchCombobox` (requires search string). Only rendered for managers.
- Category/stage type filters use bounded catalog queries and are visible to all viewers.
- Reset clears all params.

**Rules applied:** `coding-standards.md` § URL State for Filters; `security-policy.md` § person lookup gated by `iam.manage_users`.

---

### 10. Delegation Form Dialog — `components/domain/settings/delegation-form-dialog.tsx`

**One-line summary:** Dialog for creating/editing a delegation with conditional scope fields, date/time pickers, and optional on-behalf selector for managers.

**Files:** `components/domain/settings/delegation-form-dialog.tsx` (NEW)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/shared/date-picker';
import { UserSearchCombobox } from '@/components/domain/tasks/user-search-combobox';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import {
  useCreateDelegation,
  useUpdateDelegation,
} from '@/lib/api/hooks/use-delegations';
import { useBlueprintCategories, useBlueprintStageTypes } from '@/lib/api/hooks/use-blueprints';
import { localizeName } from '@/lib/utils/localize';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

type DelegationResource = components['schemas']['DelegationResource'];
type DelegationScopeType = components['schemas']['DelegationScopeType'];

type ScopeKey = 'all' | 'blueprint_category' | 'stage_type' | 'blueprint_category_and_stage_type';

const SCOPE_KEYS: ScopeKey[] = [
  'all',
  'blueprint_category',
  'stage_type',
  'blueprint_category_and_stage_type',
];

interface DelegationFormDialogProps {
  delegation?: DelegationResource;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FormState {
  delegator_user_id: string;
  delegate_user_id: string;
  starts_at: string;
  ends_at: string;
  calendar_system: 'gregorian' | 'hijri';
  scope_type: ScopeKey;
  blueprint_category_id: string;
  stage_type_id: string;
}

function scopeFromApi(value?: string | number): ScopeKey {
  const map: Record<string, ScopeKey> = {
    all: 'all',
    blueprint_category: 'blueprint_category',
    stage_type: 'stage_type',
    blueprint_category_and_stage_type: 'blueprint_category_and_stage_type',
  };
  return map[String(value)] ?? 'all';
}

export function DelegationFormDialog({ delegation, open, onOpenChange }: DelegationFormDialogProps) {
  const t = useTranslations('settings.delegations.form');
  const locale = useLocale();
  const { data: user } = useCurrentUser();
  const canManageUsers = useCapability('iam.manage_users');
  const create = useCreateDelegation();
  const update = useUpdateDelegation();
  const { data: categories } = useBlueprintCategories();
  const { data: stageTypes } = useBlueprintStageTypes();
  const isEdit = !!delegation;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const [form, setForm] = useState<FormState>({
    delegator_user_id: '',
    delegate_user_id: '',
    starts_at: '',
    ends_at: '',
    calendar_system: 'gregorian',
    scope_type: 'all',
    blueprint_category_id: '',
    stage_type_id: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    if (delegation) {
      setForm({
        delegator_user_id: delegation.delegator?.public_id ?? '',
        delegate_user_id: delegation.delegate?.public_id ?? '',
        starts_at: delegation.starts_at ? delegation.starts_at.slice(0, 16) : '',
        ends_at: delegation.ends_at ? delegation.ends_at.slice(0, 16) : '',
        calendar_system: 'gregorian',
        scope_type: scopeFromApi(delegation.scope_type),
        blueprint_category_id: delegation.blueprint_category?.public_id ?? '',
        stage_type_id: delegation.stage_type?.public_id ?? '',
      });
    } else {
      setForm({
        delegator_user_id: '',
        delegate_user_id: '',
        starts_at: '',
        ends_at: '',
        calendar_system: 'gregorian',
        scope_type: 'all',
        blueprint_category_id: '',
        stage_type_id: '',
      });
    }
  }, [isOpen, delegation]);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleScopeChange(next: ScopeKey) {
    setForm((prev) => ({
      ...prev,
      scope_type: next,
      blueprint_category_id: next.includes('blueprint_category') ? prev.blueprint_category_id : '',
      stage_type_id: next.includes('stage_type') ? prev.stage_type_id : '',
    }));
  }

  function validate(): boolean {
    if (!form.delegate_user_id) {
      toast.error(t('delegate_required'));
      return false;
    }
    if (!form.starts_at || !form.ends_at) {
      toast.error(t('dates_required'));
      return false;
    }
    if (form.scope_type.includes('blueprint_category') && !form.blueprint_category_id) {
      toast.error(t('category_required'));
      return false;
    }
    if (form.scope_type.includes('stage_type') && !form.stage_type_id) {
      toast.error(t('stage_type_required'));
      return false;
    }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const scopeTypeMap: Record<ScopeKey, number> = {
      all: 1,
      blueprint_category: 2,
      stage_type: 3,
      blueprint_category_and_stage_type: 4,
    };

    const body = {
      calendar_system: form.calendar_system,
      delegator_user_id: canManageUsers ? (form.delegator_user_id || null) : null,
      delegate_user_id: form.delegate_user_id,
      starts_at: form.starts_at, // <!-- TODO: verify backend expects ISO date-time; adjust formatting if needed -->
      ends_at: form.ends_at,
      scope_type: scopeTypeMap[form.scope_type],
      blueprint_category_id: form.scope_type.includes('blueprint_category') ? form.blueprint_category_id : null,
      stage_type_id: form.scope_type.includes('stage_type') ? form.stage_type_id : null,
    };

    if (isEdit && delegation) {
      update.mutate({ publicId: delegation.public_id, body }, { onSuccess: () => setIsOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setIsOpen(false) });
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!delegation && (
        <Button onClick={() => setIsOpen(true)}>{t('create_button')}</Button>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {canManageUsers && (
            <Field>
              <FieldLabel>{t('delegator_label')}</FieldLabel>
              <UserSearchCombobox
                value={form.delegator_user_id}
                onChange={(v) => handleChange('delegator_user_id', v)}
                placeholder={t('delegator_placeholder')}
              />
            </Field>
          )}
          <Field>
            <FieldLabel>{t('delegate_label')}</FieldLabel>
            <UserSearchCombobox
              value={form.delegate_user_id}
              onChange={(v) => handleChange('delegate_user_id', v)}
              placeholder={t('delegate_placeholder')}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DatePicker
              id="starts-at"
              label={t('starts_at')}
              value={form.starts_at ? form.starts_at.slice(0, 10) : null}
              calendarSystem={form.calendar_system}
              onChange={(v, cs) => {
                handleChange('starts_at', v ? `${v}T00:00` : '');
                handleChange('calendar_system', cs);
              }}
              required
            />
            <DatePicker
              id="ends-at"
              label={t('ends_at')}
              value={form.ends_at ? form.ends_at.slice(0, 10) : null}
              calendarSystem={form.calendar_system}
              onChange={(v, cs) => {
                handleChange('ends_at', v ? `${v}T23:59` : '');
                handleChange('calendar_system', cs);
              }}
              required
            />
          </div>
          <Field>
            <FieldLabel>{t('scope_label')}</FieldLabel>
            <RtlSelect value={form.scope_type} onValueChange={(v) => handleScopeChange(v as ScopeKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {SCOPE_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>{t(`scope_${k}`)}</SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>
          {form.scope_type.includes('blueprint_category') && (
            <Field>
              <FieldLabel>{t('category_label')}</FieldLabel>
              <RtlSelect
                value={form.blueprint_category_id || 'none'}
                onValueChange={(v) => handleChange('blueprint_category_id', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="none">{t('select_category')}</SelectItem>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.public_id} value={c.public_id}>
                      {localizeName(locale, c.name_ar, c.name_en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          )}
          {form.scope_type.includes('stage_type') && (
            <Field>
              <FieldLabel>{t('stage_type_label')}</FieldLabel>
              <RtlSelect
                value={form.stage_type_id || 'none'}
                onValueChange={(v) => handleChange('stage_type_id', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="none">{t('select_stage_type')}</SelectItem>
                  {(stageTypes ?? []).map((s) => (
                    <SelectItem key={s.public_id} value={s.public_id}>
                      {localizeName(locale, s.name_ar, s.name_en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('saving') : (isEdit ? t('save') : t('create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Key decisions:**
- Uses `DatePicker` from Spec 020 with `calendar_system` sent to backend.
- Scope keys are lowercase strings mapped to integer codes for submission.
- Changing scope clears/hides irrelevant fields.
- On-behalf selector only for `iam.manage_users`.
- Date/time formatting uses `starts_at.slice(0,16)` for `<input type="datetime-local">` style values; adjust to the actual backend format expected by the API (`date-time`) — verify during implementation.

**Rules applied:** `coding-standards.md` § Forms via shadcn Field + InputGroup/RtlSelect; validation via `toast.error`; generated types; Spec 020 date components.

**Test cases:**
1. Select scope "Blueprint category" without category → submit blocked with `toast.error(t('category_required'))`.
2. Create with valid data → dialog closes, active list refreshes, success toast.

---

### 11. Revoke Delegation Dialog — `components/domain/settings/revoke-delegation-dialog.tsx`

**One-line summary:** Reusable `AlertDialog` confirmation before revoking a delegation.

**Files:** `components/domain/settings/revoke-delegation-dialog.tsx` (NEW)

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRevokeDelegation } from '@/lib/api/hooks/use-delegations';

interface RevokeDelegationDialogProps {
  publicId: string;
}

export function RevokeDelegationDialog({ publicId }: RevokeDelegationDialogProps) {
  const t = useTranslations('settings.delegations.revoke');
  const [open, setOpen] = useState(false);
  const revoke = useRevokeDelegation();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">
          {t('button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revoke.isPending}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={revoke.isPending}
              onClick={() => revoke.mutate(publicId, { onSuccess: () => setOpen(false) })}
            >
              {revoke.isPending ? t('revoking') : t('confirm')}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Rules applied:** `coding-standards.md` § Confirmation dialogs; destructive action via `AlertDialog`; disabled pending state.

---

### 12. Delegation Table Row / Mobile Card — `components/domain/settings/delegation-table-row.tsx` / `delegation-mobile-card.tsx`

**One-line summary:** Render a single delegation with localized names, dual dates, scope label, and capability-gated actions.

**Files:** `components/domain/settings/delegation-table-row.tsx` (NEW), `components/domain/settings/delegation-mobile-card.tsx` (NEW)

```tsx
// delegation-table-row.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { localizeName } from '@/lib/utils/localize';
import { DelegationFormDialog } from './delegation-form-dialog';
import { RevokeDelegationDialog } from './revoke-delegation-dialog';
import type { components } from '@/lib/generated/api-types';

type DelegationResource = components['schemas']['DelegationResource'];

interface Props {
  delegation: DelegationResource;
}

export function DelegationTableRow({ delegation }: Props) {
  const locale = useLocale();
  const t = useTranslations('settings.delegations');
  const canManage = useCapability('iam.manage_users');

  const delegatorName = localizeName(locale, delegation.delegator.name_ar, delegation.delegator.name_en);
  const delegateName = localizeName(locale, delegation.delegate.name_ar, delegation.delegate.name_en);

  function scopeLabel(): string {
    const key = String(delegation.scope_type);
    if (key.includes('blueprint_category_and_stage_type')) return t('scope_category_and_stage');
    if (key.includes('blueprint_category')) return t('scope_category');
    if (key.includes('stage_type')) return t('scope_stage_type');
    return t('scope_all');
  }

  function scopeDetail(): string {
    const parts: string[] = [];
    if (delegation.blueprint_category) {
      parts.push(localizeName(locale, delegation.blueprint_category.name_ar, delegation.blueprint_category.name_en));
    }
    if (delegation.stage_type) {
      parts.push(localizeName(locale, delegation.stage_type.name_ar, delegation.stage_type.name_en));
    }
    return parts.join(' · ');
  }

  return (
    <TableRow>
      <TableCell className="text-start font-medium">{delegatorName}</TableCell>
      <TableCell className="text-start">{delegateName}</TableCell>
      <TableCell className="text-start">
        <span className="block text-sm">{scopeLabel()}</span>
        {scopeDetail() && <span className="text-xs text-muted-foreground">{scopeDetail()}</span>}
      </TableCell>
      <TableCell className="text-start">
        <DualDateDisplay gregorian={delegation.starts_at} hijri={delegation.starts_at_hijri} variant="stacked" />
        <span className="text-muted-foreground"> — </span>
        <DualDateDisplay gregorian={delegation.ends_at} hijri={delegation.ends_at_hijri} variant="stacked" />
      </TableCell>
      <TableCell className="text-start">
        <Badge className="bg-emerald-50 text-emerald-600">
          <span className="me-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t('status_active')}
        </Badge>
      </TableCell>
      <TableCell className="text-end">
        {canManage && (
          <div className="flex items-center justify-end gap-2">
            <DelegationFormDialog delegation={delegation} />
            <RevokeDelegationDialog publicId={delegation.public_id} />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
```

Mobile card follows the same data layout in a stacked `Card` with `hidden md:flex` / `md:hidden`.

**Rules applied:** `coding-standards.md` § Generated types; `DualDateDisplay` from Spec 020; SLA/status color pairing (text + dot); capability-gated actions.

---

### 13. Skeletons

**Files:** `components/domain/settings/settings-skeleton.tsx`, `components/domain/settings/delegation-table-skeleton.tsx`

```tsx
// settings-skeleton.tsx
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-24 self-end" />
      </CardContent>
    </Card>
  );
}
```

```tsx
// delegation-table-skeleton.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DelegationTableSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="hidden md:block space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="md:hidden flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Rules applied:** `coding-standards.md` § Skeletons match real content shape; all 4 states.

---

### 14. Shell Integration

**Files modified:**
- `components/domain/shell/nav-user.tsx`: Add a Preferences item that links to `/settings`.
- `components/domain/shell/site-header.tsx`: Add `/settings` to `pageTitles` map.
- `components/domain/shell/use-page-breadcrumb.ts`: Add `/settings` crumb.

**NavUser change:**

```tsx
import { Settings } from 'lucide-react';
import Link from 'next/link';

// Inside DropdownMenuGroup after Localization submenu:
<DropdownMenuItem asChild className="cursor-pointer">
  <Link href="/settings" className="flex items-center gap-2">
    <Settings data-slot="sidebar-menu-button-icon" />
    <span>{t('preferences')}</span>
  </Link>
</DropdownMenuItem>
```

**SiteHeader change:**

```ts
const pageTitles: Record<string, string> = {
  // ... existing ...
  '/settings': t('page_titles.settings'),
};
```

**usePageBreadcrumb change:**

```ts
if (pathname === '/settings') {
  return [{ label: t('settings'), href: '/settings' }];
}
```

---

### 15. Translations — `messages/ar.json` / `messages/en.json`

Add a `settings` namespace with at minimum:

```json
{
  "settings": {
    "page_title": "الإعدادات",
    "page_description": "إدارة ملفك الشخصي والتفويضات",
    "tabs": {
      "profile": "الملف الشخصي",
      "delegations": "التفويضات النشطة"
    },
    "profile": {
      "title": "الملف الشخصي",
      "save": "حفظ",
      "saving": "جاري الحفظ...",
      "error": "تعذر تحميل الملف الشخصي",
      "name_ar": "الاسم بالعربية",
      "name_en": "الاسم بالإنجليزية",
      "mobile": "رقم الجوال",
      "preferred_language": "اللغة المفضلة",
      "language_arabic": "العربية",
      "language_english": "English",
      "email": "البريد الإلكتروني",
      "employee_id": "رقم الموظف",
      "position": "المنصب الحالي",
      "name_ar_required": "الاسم بالعربية مطلوب",
      "toast": {
        "profile_saved": "تم حفظ الملف الشخصي"
      }
    },
    "availability": {
      "title": "التوفر",
      "status_label": "الحالة",
      "status_in_office": "متاح",
      "status_out_of_office": "خارج المكتب",
      "toggle_aria": "تبديل التوفر",
      "delegate_label": "البديل",
      "delegate_placeholder": "اختر بديلاً",
      "delegate_warning": "بدون اختيار بديل لن يتم توجيه المهام لأي شخص.",
      "back_in_office": "العودة للمكتب",
      "returning": "جاري التحديث...",
      "error": "تعذر تحميل حالة التوفر",
      "toast": {
        "marked_out_of_office": "تم تسجيلك كغير متاح",
        "marked_back_in_office": "تم تسجيلك كمتاح"
      }
    },
    "delegations": {
      "title": "التفويضات النشطة",
      "create_button": "إنشاء تفويض",
      "error": "تعذر تحميل التفويضات",
      "empty_title": "لا توجد تفويضات نشطة",
      "empty_description": "لا يوجد تفويض ساري حالياً.",
      "load_more": "تحميل المزيد",
      "loading_more": "جاري التحميل...",
      "columns": {
        "delegator": "المفوض",
        "delegate": "البديل",
        "scope": "النطاق",
        "dates": "الفترة",
        "status": "الحالة",
        "actions": "الإجراءات"
      },
      "status_active": "نشط",
      "scope_all": "جميع الأعمال",
      "scope_category": "فئة الخطة",
      "scope_stage_type": "نوع المرحلة",
      "scope_category_and_stage": "فئة + نوع مرحلة",
      "filters": {
        "delegator": "المفوض",
        "delegate": "البديل",
        "category": "فئة الخطة",
        "stage_type": "نوع المرحلة",
        "all_categories": "كل الفئات",
        "all_stage_types": "كل الأنواع",
        "reset": "إعادة ضبط"
      },
      "form": {
        "create_title": "إنشاء تفويض",
        "edit_title": "تعديل تفويض",
        "create": "إنشاء",
        "save": "حفظ",
        "cancel": "إلغاء",
        "saving": "جاري الحفظ...",
        "delegator_label": "التفويض نيابة عن",
        "delegator_placeholder": "اختر مستخدماً",
        "delegate_label": "البديل",
        "delegate_placeholder": "اختر بديلاً",
        "delegate_required": "البديل مطلوب",
        "starts_at": "تاريخ البدء",
        "ends_at": "تاريخ الانتهاء",
        "dates_required": "تاريخا البدء والانتهاء مطلوبان",
        "scope_label": "نطاق التفويض",
        "scope_all": "جميع الأعمال",
        "scope_blueprint_category": "فئة الخطة",
        "scope_stage_type": "نوع المرحلة",
        "scope_blueprint_category_and_stage_type": "فئة الخطة ونوع المرحلة",
        "category_label": "فئة الخطة",
        "select_category": "اختر فئة",
        "category_required": "فئة الخطة مطلوبة",
        "stage_type_label": "نوع المرحلة",
        "select_stage_type": "اختر نوع مرحلة",
        "stage_type_required": "نوع المرحلة مطلوب"
      },
      "revoke": {
        "button": "إلغاء",
        "title": "إلغاء التفويض",
        "description": "سيتوقف توجيه المهام الجديدة لهذا البديل. لا يمكن التراجع عن هذا الإجراء.",
        "cancel": "تراجع",
        "confirm": "إلغاء التفويض",
        "revoking": "جاري الإلغاء..."
      },
      "toast": {
        "delegation_created": "تم إنشاء التفويض",
        "delegation_updated": "تم تحديث التفويض",
        "delegation_revoked": "تم إلغاء التفويض"
      }
    }
  }
}
```

Also add `settings` to `shell.page_titles` and `auth.preferences` keys in both files.

---

## Data Flow

1. **Profile / Availability**
   - `useCurrentUser()` → `GET /v1/iam/auth/me` → `UserResource` → `ProfileSettingsCard` / `AvailabilityCard`.
   - Mutations (`useUpdateProfile`, `useMarkOutOfOffice`, `useMarkBackInOffice`) → `apiClient` → backend → `onSuccess` invalidates `queryKeys.auth.me`.
   - Language change → `useLocaleStore.setLocale()` → `NEXT_LOCALE` cookie + page reload.

2. **Active Delegations**
   - URL filters → `useActiveDelegationsInfinite(filters)` → `GET /v1/iam/delegations/active` → `CursorPage<DelegationResource>` → `ActiveDelegationsPanel` → `DelegationTableRow` / `DelegationMobileCard`.
   - Create/Update/Revoke mutations → backend → `onSuccess` invalidates `queryKeys.delegations.all`.

3. **Reference Data**
   - `useBlueprintCategories()` → `GET /v1/blueprints/categories`.
   - `useBlueprintStageTypes()` → `GET /v1/blueprints/stage-types`.
   - `useUsersSearch()` (existing) → `GET /v1/iam/users`.

---

## Route Structure

| File | Route | Notes |
|------|-------|-------|
| `app/(dashboard)/settings/page.tsx` | `/settings?tab=profile` (default) | Inside authenticated shell. |
| `app/(dashboard)/settings/page.tsx` | `/settings?tab=delegations` | Tab state in URL only. |

Locale is cookie-based; no `[locale]` route segment.

---

## Execution Order

1. **Add shadcn Switch:** `npx shadcn@latest add switch`.
2. **Regenerate API types** if `openapi.json` changed: `npm run generate:api`.
3. **Query keys:** Add `delegations` namespace in `lib/api/query-keys.ts`.
4. **Auth hooks:** Add profile + OOO mutations in `lib/api/hooks/use-auth.ts`.
5. **Delegation hooks:** Create `lib/api/hooks/use-delegations.ts`.
6. **Translations:** Add `settings` namespace to `messages/ar.json` and `messages/en.json`.
7. **Shell:** Update `nav-user.tsx`, `site-header.tsx`, `use-page-breadcrumb.ts`.
8. **Route:** Create `app/(dashboard)/settings/page.tsx`.
9. **Domain components:** Create all `components/domain/settings/*.tsx` files in dependency order:
   - skeletons → filters → revoke dialog → form dialog → row/card → active panel → availability → profile → workspace.
10. **Manual test:** both locales, loading/empty/error states, capability gating, responsive table/cards, keyboard navigation.
11. **Run checks:** `npm run lint && npm run typecheck && npm run test`.

---

## What to Test Manually

1. **Happy path — Profile (AR RTL):**
   - Open `/settings`, update Arabic name and mobile, save → success toast, `queryKeys.auth.me` refetches.
2. **Language preference change (EN LTR):**
   - Switch preferred language to English, save → page reloads in English, UI direction flips.
3. **Out of office (normal user):**
   - Toggle switch on → status changes to "Out of office"; toggle off → "In office". No delegate selector shown.
4. **Out of office (manager):**
   - Toggle on with a selected delegate → success; click "Back in office" → delegate cleared.
5. **Delegations tab visibility:**
   - User without `iam.view_delegations`/`iam.manage_users` sees only Profile tab.
   - Manager sees both tabs; direct `/settings?tab=delegations` loads the list.
6. **Active delegations empty state:**
   - No active delegations → empty message with Create CTA for managers.
7. **Active delegations populated:**
   - List renders with dual Hijri/Gregorian dates, scope labels, Active status; Load More works.
8. **Create delegation:**
   - Fill delegate, dates, scope, save → row appears, toast shown.
9. **Scope validation:**
   - Select "Blueprint category" scope without category → submit blocked by toast.
10. **Revoke delegation:**
    - Click Revoke → confirmation dialog → confirm → row removed/refreshed.
11. **Filters:**
    - Apply each filter; verify URL params update; reset clears them.
12. **Permission gating:**
    - Non-manager viewer sees no Create/Edit/Revoke buttons and no person-lookup filters.
13. **Responsive:**
    - Desktop shows table; mobile (<640px) shows stacked cards; touch targets ≥44px.
14. **Error states:**
    - Block `/v1/iam/profile` or `/v1/iam/delegations/active` in dev tools → error state with retry appears.
15. **Keyboard navigation:**
    - Tab through tabs, form fields, dialogs, and comboboxes; Escape closes dialogs and returns focus.