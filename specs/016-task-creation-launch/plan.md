# Plan: Task Creation & Launch

> **Spec:** 016-task-creation-launch
> **Date:** 2026-06-28
> **Status:** `completed`

---

## Open Questions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Unsaved-changes guard | Controlled `AlertDialog` "Discard changes?" only when form is dirty | Matches the existing `ConfirmDeleteDialog` pattern; consistent focus mgmt; no native browser dialog |
| Launch one click vs two-step | Single click = `useCreateTask()` → `useLaunchTask()` sequentially with shared loading state | Single user intent; backend supports both; save-draft path remains available separately |
| `manual_assignments` payload shape | Stage entry `{ blueprint_stage_id, user_ids[] }` (omit `blueprint_sub_stage_id`); sub-stage entry `{ blueprint_sub_stage_id, user_ids[] }` (omit `blueprint_stage_id`) | Confirmed in `StoreTaskRequest`/`LaunchTaskRequest` validation rules + `AssignmentResolutionService::resolveManualUsers`/`resolveManualUsersFromSubStage` lookups |
| StoreTaskBody workaround | Not needed, generated types use `string` correctly, alias removed | Backend uses `Rule::exists('blueprints', 'public_id')` expecting UUID strings; generated `StoreTaskRequest` uses `string` for `blueprint_id`/`priority_id` |
| Blueprint list endpoint — search & stage embedding | `useBlueprintsInfinite({ is_active: true, per_page: 50 })` + client-side `Command` filter over loaded pages; **second fetch `useBlueprint(publicId)` after selection** to read Stage 1 stages + sub-stages | Confirmed `BlueprintController::index` supports only `is_active/scope/category_id/per_page`; list `BlueprintResource` omits `stages` |
| Edit-route deletion ownership | Delete Draft button visible only when `initiator_id === currentUser.public_id`; `task.manage` allows edit but not delete | `TaskService::delete` throws 403 for non-initiators regardless of capability |
| `assignment_type` comparison | Uses `'manual_at_launch'` (string name from backend `apiValue()`), not `'3'` (integer) | Backend serializes `AssignmentType` enum via `apiValue()` → `Str::snake($this->name)`, producing `"manual_at_launch"` |
| Cancel/Delete Draft placement | Cancel in PageHeader via `TaskCancelButton`/`TaskEditActions`, dirty-check via `CancelDiscardDialog`. Delete Draft in edit page header via `TaskEditActions`, not in form footer | Footer only has primary actions (Save Draft, Launch); cancel/delete moved to PageHeader client components |
| Edit page title | Uses `EditPageTitle` client component reading `useTaskDisplayStore` for `display_id` | Matches existing breadcrumb display_id pattern from spec 004; avoids passing display_id through server component props |
| `draft_manual_assignments` persistence | Backend stores in `tasks.draft_manual_assignments` JSON column, `TaskDetailResource` exposes it. Frontend parses on edit and pre-fills `manualAssignments` in store | Launch endpoint falls back to saved data when body omits `manual_assignments`, so the frontend only needs to send changes |

---

## Technical Approach

Build the create/edit task flow as a single multi-step form page (`/tasks/new`, `/tasks/[publicId]/edit`) rendered inside the existing dashboard shell, backed by a **non-persisted Zustand form store** (mirrors `useBlueprintBuilderStore`) that holds **UI/selection state only** (no API data). A single `TaskCreationForm` orchestrator component handles both modes via a `mode: 'create' | 'edit'` prop, sharing a presentational `TaskFormFields` component. Mutations live in a thin `use-task-create.ts` hook file consuming existing query keys — no `StoreTaskBody` alias needed (generated types now use `string` for `blueprint_id`). Manual-at-launch support uses a new multi-select `MultiUserCombobox` (domain-local; reuses `useUsersSearch`). Cancel and Delete Draft are rendered in the `PageHeader` actions slot as client components (`TaskCancelButton`, `TaskEditActions`), not in the form footer. On launch, the orchestrator awaits `useCreateTask()` then `useLaunchTask()` in one user click; navigation lands on `/tasks/[publicId]` (task details page).

**Key decisions:**
- **Single orchestrator with an `mode: 'create' | 'edit'` prop** avoids duplicating logic between create and edit routes — `TaskCreationForm` is instantiated with `mode="edit"` and a `publicId` on the edit route
- **Zustand store for the form (not React state)** because the form spans 2 logical steps + a footer + 2 routes and benefits from a single source of truth without prop drilling; follows `useBlueprintBuilderStore` precedent
- **Multi-select combobox as a new domain component** (`MultiUserCombobox`) extracted beside the existing single-select `UserSearchCombobox` — they share `useUsersSearch` but have different chip/selection rendered UI
- **Client-side blueprint filtering** because the API lacks server-side search; tenant blueprint counts are small and the infinite-query "Load more" covers long lists
- **Two sequential mutations on Launch in one click**; we do not add a compound endpoint — backend `POST /v1/tasks/{task}/launch` is authoritative for assignment resolution + blueprint lock

---

## Component Tree

```
app/(dashboard)/tasks/new/page.tsx                       [Server]  TaskNewPage
  └─ <PageHeader title + actions={TaskCancelButton} />   [Client]  shared + domain actions
       └─ <TaskCancelButton href="/tasks" />              [Client]  domain  (Cancel X button + CancelDiscardDialog)
  └─ <TaskCreationForm mode="create" />                  [Client]  domain

app/(dashboard)/tasks/[publicId]/edit/page.tsx           [Server]  TaskEditPage
  └─ <PageHeader title={EditPageTitle} actions={TaskEditActions} />  [Client]  shared + domain
       ├─ <EditPageTitle />                              [Client]  domain  (reads useTaskDisplayStore)
       └─ <TaskEditActions publicId />                   [Client]  domain  (Delete Draft + Cancel + dialogs)
            ├─ <Button: Delete Draft />                  [Client]  domain  (ghost/danger, initiator-only)
            ├─ <Button: Cancel />                        [Client]  domain  (with CancelDiscardDialog)
            ├─ <DeleteDraftDialog />                     [Client]  domain
            └─ <CancelDiscardDialog />                   [Client]  shared
  └─ <TaskCreationForm mode="edit" publicId />           [Client]  domain
       ├─ <TaskFormSkeleton />                           [Client]  domain   (during edit prefetch)
       ├─ <TaskFormFields />                              [Client]  domain   (shared presentational form)
       │    ├─ <BlueprintCombobox />                      [Client]  domain
       │    ├─ <BilingualNameFields t namespace="tasks.new" />          shared
       │    ├─ <BilingualDescriptionFields ... />         [Client]  shared
       │    ├─ <PrioritySelect />                         [Client]  domain   (wraps RtlSelect)
       │    ├─ <ClassificationSelect />                  [Client]  domain   (wraps RtlSelect, capability-gated)
       │    ├─ <DueDateField />                          [Client]  domain   (native date input + Hijri display)
       │    └─ <ManualAssignmentBlock * />               [Client]  domain   (Stage 1 manual stages + sub-stages)
       │         └─ <MultiUserCombobox />                [Client]  domain   (new multi-select variant)
       ├─ <TaskFormFooter />                             [Client]  domain
       │    ├─ summary row (blueprint, title, priority, classification, due, assignee counts)
       │    ├─ <Button: Save Draft /> / <Button: Launch />
       └─ <EmptyState|ErrorState>                         [Client]  shared   (for 403/404/error states)
```

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `app/(dashboard)/tasks/new/page.tsx` | Server page — `TaskNewPage` (PageHeader with `TaskCancelButton` → `TaskCreationForm mode="create"`) |
| `app/(dashboard)/tasks/[publicId]/edit/page.tsx` | Server page — `TaskEditPage` (PageHeader with `EditPageTitle` + `TaskEditActions` → `TaskCreationForm mode="edit"`) |
| `components/domain/tasks/task-creation-form.tsx` | Client orchestrator — owns the Zustand form store, handles all 4 states; renders `TaskFormFields` + `TaskFormFooter`; Cancel/Delete Draft have moved to PageHeader |
| `components/domain/tasks/task-form-fields.tsx` | Client presentational form (Step 1 + Step 2 sections) |
| `components/domain/tasks/task-form-footer.tsx` | Client summary + action buttons (Save Draft / Launch only — Cancel and Delete Draft moved to PageHeader) |
| `components/domain/tasks/blueprint-combobox.tsx` | Client combobox over active blueprints (`useBlueprintsInfinite` + client-side `Command` filter + Load more); uses `key={open ? 'open' : 'closed'}` to force fresh mount; search resets on open; handles `isError` state |
| `components/domain/tasks/manual-assignment-block.tsx` | Client block per Stage 1 manual stage/sub-stage; embeds `MultiUserCombobox` + chips |
| `components/domain/tasks/multi-user-combobox.tsx` | Client multi-select users combobox; debounced `useUsersSearch`; batch-resolve `useQuery` with `public_ids[]` param for pre-filled draft IDs; handles `isError` state |
| `components/domain/tasks/priority-select.tsx` | Client wrapper around `RtlSelect` reading `useTaskPriorities()` |
| `components/domain/tasks/classification-select.tsx` | Client `RtlSelect` with Public/Internal/Confidential; Confidential disabled without `task.classify.confidential` capability + tooltip |
| `components/domain/tasks/due-date-field.tsx` | Client shadcn `Field` with date input; Hijri display via `Intl.DateTimeFormat` |  <!-- nosonar -->
| `components/domain/tasks/task-form-skeleton.tsx` | Client form-shaped skeleton (header + 5 skeleton sections + footer) |
| `components/domain/tasks/task-cancel-button.tsx` | Client component for PageHeader actions slot (create route); renders Cancel with X icon + `CancelDiscardDialog` for dirty-state guard |
| `components/domain/tasks/task-edit-actions.tsx` | Client component for PageHeader actions slot (edit route); renders Delete Draft (initiator-only) + Cancel + `DeleteDraftDialog` + `CancelDiscardDialog` |
| `components/domain/tasks/edit-page-title.tsx` | Client component for PageHeader title (edit route); reads `displayId` from `useTaskDisplayStore`; renders localized "Edit Draft — {id}" |
| `components/domain/tasks/cancel-discard-dialog.tsx` | Client controlled `AlertDialog` "Discard changes?" shown on Cancel when dirty |
| `components/domain/tasks/delete-draft-dialog.tsx` | Client wrapper over `ConfirmDeleteDialog` with task-specific copy + 204 toast |
| `lib/stores/use-task-form-store.ts` | Zustand non-persisted: `{ mode, publicId, blueprintId, blueprintName, title_ar, title_en, description_ar, description_en, priorityId, classificationLevel, dueDate, manualAssignments, touched, set..., reset }` |
| `lib/api/hooks/use-task-create.ts` | `useCreateTask()`, `useUpdateTask()`, `useLaunchTask()`, `useDeleteTask()` mutation hooks — no `StoreTaskBody` alias needed |
| `__tests__/components/domain/tasks/task-creation-form.test.tsx` | Render + interaction tests for create/edit + 422 handling |
| `__tests__/components/domain/tasks/manual-assignment-block.test.tsx` | Block renders only for assignment_type='manual_at_launch'; multi-select chips; required validation |
| `__tests__/components/domain/tasks/blueprint-combobox.test.tsx` | client-side filter, Load more, no results empty hint |
| `__tests__/mocks/task-create-handlers.ts` | MSW handlers for `POST /v1/tasks`, `PUT /v1/tasks/{task}`, `POST /v1/tasks/{task}/launch`, `DELETE /v1/tasks/{task}`, and 422 variants |

### Modified Files

| File | Change |
|------|--------|
| `lib/api/query-keys.ts` | No new keys (reuses `tasks.detail`, `tasks.lists()`, `taskBoard.lists()`, `blueprints.list`, `blueprints.detail`, `tasks.priorities`, `users.list`). If `tasks.lists()` is missing for the basic task list, confirm against the file — already present. |
| `components/domain/tasks/task-board.tsx` | Add a **"Create Task"** `<Button asChild><Link href="/tasks/new">…</Link></Button>` in the `TaskBoard` actions slot (passes the button to `PageHeader.actions`). Capability-gated to authenticated internal_user/tenant_admin (no specific cap required — any authenticated user can create per backend §005 open-question resolution; classify.confidential is the only cap). |
| `components/domain/tasks/task-detail.tsx` | When `task.status === 'draft'` and current user is initiator OR has `task.manage`, render **"Edit Draft"** (link to `/tasks/[publicId]/edit`) and **"Launch"** affordances (Launch already noted in spec 004 open questions but not implemented — adds a Launch button that calls `useLaunchTask` and redirects to `/tasks/[publicId]` on success). If spec 004 already has these, no change. <!-- verify --> |
| `components/domain/tasks/user-search-combobox.tsx` | Keep as-is (single-select); `MultiUserCombobox` is a new sibling component that imports `useUsersSearch` separately. (No edit required unless `localizeName` import path needs to be exported.) |
| `components/domain/shell/app-sidebar.tsx` | Change the Quick Create `Link href="#"` to `href="/tasks/new"` so the shell's Quick Create button routes to the new task page. |
| `messages/ar.json` | Add `tasks.new` and `tasks.create.toast` namespaces (title/description, field labels, step 1 + step 2 + footer, toasts, 422 messages, dialog copy). Also rename `tasks.board.filters.drafts` → `tasks.board.filters.draft` and `followUp.filters.drafts` → `followUp.filters.draft` for consistency with URL param and ToggleGroup values |
| `messages/en.json` | Mirror `tasks.new`/`tasks.create.toast` keys in English. Same `drafts` → `draft` rename for board filters and follow-up filters |
| `__tests__/mocks/handlers.ts` | Append `...taskCreateHandlers` to the exported `handlers` array |

---

## Implementation Notes

### 1. `useTaskFormStore` (Zustand form state)

**One-line summary:** Non-persisted Zustand store mirroring `useBlueprintBuilderStore`, holding all form inputs and the `manual_assignments` map; never holds API-fetched reference data.

**Key decisions:**
- Non-persisted (Zustand `create(...)` with no `persist` middleware) — draft data must not live in localStorage (security policy: no localStorage beyond `useBrandColorStore`)
- Holds only the entering values, not derived reference data (priorities, blueprints, users live in TanStack Query)
- Single `manualAssignments` record keyed by `blueprint_stage_id` OR `blueprint_sub_stage_id`, value is `string[]` of user public_ids
- `reset()` clears the store so the route page can call it on mount/unmount

**File:** `lib/stores/use-task-form-store.ts`

```ts
import { create } from 'zustand';

export type ManualAssignments = Record<string, string[]>;

interface TaskFormState {
  mode: 'create' | 'edit';
  publicId: string | null;
  // Step 1
  blueprintId: string | null;
  blueprintName: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  priorityId: string | null;
  classificationLevel: 1 | 2 | 3;            // 1=Public 2=Internal 3=Confidential
  dueDate: string | null;                     // Gregorian ISO date
  // Step 2 (Stage 1 manual key -> user public_ids)
  manualAssignments: ManualAssignments;
  // UX
  touched: boolean;
  initEdit: (publicId: string, data: { title_ar: string; title_en: string; description_ar: string; description_en: string; priorityId: string | null; classificationLevel: 1|2|3; dueDate: string | null; blueprintId: string; blueprintName: string }) => void;
  set: <K extends keyof TaskFormState>(k: K, v: TaskFormState[K]) => void;
  setManual: (key: string, user_ids: string[]) => void;
  reset: () => void;
}

const INITIAL = {
  mode: 'create' as const,
  publicId: null,
  blueprintId: null,
  blueprintName: '',
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  priorityId: null,
  classificationLevel: 1 as const,
  dueDate: null,
  manualAssignments: {},
  touched: false,
};

export const useTaskFormStore = create<TaskFormState>((set) => ({
  ...INITIAL,
  initEdit: (publicId, data) => set({ ...INITIAL, mode: 'edit', publicId, touched: false, ...data }),
  set: (k, v) => set((s) => ({ ...s, [k]: v, touched: true })),
  setManual: (key, user_ids) => set((s) => ({ ...s, manualAssignments: { ...s.manualAssignments, [key]: user_ids }, touched: true })),
  reset: () => set({ ...INITIAL }),
}));
```

**Rules:** `coding-standards.md` — Store query key extensions in `lib/api/query-keys.ts`; Zustand for UI-only state. No API data in Zustand.

---

### 2. Mutation hooks (`use-task-create.ts`)

**One-line summary:** Four mutations — create, update, launch, delete — calling the existing endpoints; no optimistic updates; cache invalidation per `coding-standards.md`.

**Key decisions:**
- Each mutation invalidates the broad set of task-related queries so the board + details reflect the new/launched/edited/deleted task immediately
- No optimistic updates for state-machine transitions (server response determines next state)
- No `StoreTaskBody` type alias needed — generated types now correctly use `string` for `blueprint_id`/`priority_id` (see Open Questions Resolved)
- Toasts localized via `useTranslations('tasks.create.toast')`; `useCreateTask` does not call toast (used as intermediate step in the launch chain)

**File:** `lib/api/hooks/use-task-create.ts`

```ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

type TaskResource = components['schemas']['TaskResource'];
type TaskDetailResource = components['schemas']['TaskDetailResource'];
type StoreTaskRequest = components['schemas']['StoreTaskRequest'];
type UpdateTaskRequest = components['schemas']['UpdateTaskRequest'];
type LaunchTaskRequest = components['schemas']['LaunchTaskRequest'];
type ApiManualAssignment = NonNullable<StoreTaskRequest['manual_assignments']>[number];

function toApiManual(map: Record<string, string[]>): ApiManualAssignment[] {
  return Object.entries(map)
    .filter(([, ids]) => ids.length > 0)
    .map(([key, user_ids]) =>
      key.startsWith('sub:')
        ? { blueprint_sub_stage_id: key.slice(4), user_ids }
        : { blueprint_stage_id: key, user_ids },
    );
}

function invalidateTaskCaches(qc: ReturnType<typeof useQueryClient>, publicId?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
  qc.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
  if (publicId) {
    qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(publicId) });
    qc.invalidateQueries({ queryKey: queryKeys.tasks.slaHealth(publicId) });
  }
}

export function useCreateTask() {
  const qc = useQueryClient();
  const t = useTranslations('tasks.create.toast');
  return useMutation({
    mutationFn: (body: StoreTaskRequest) =>
      apiClient.post<TaskResource>('/v1/tasks', body),
    onSuccess: (data) => {
      invalidateTaskCaches(qc, data.public_id);
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, body }: { publicId: string; body: UpdateTaskRequest }) =>
      apiClient.put<TaskResource>(`/v1/tasks/${publicId}`, body),
    onSuccess: (data) => {
      invalidateTaskCaches(qc, data.public_id);
      return data;
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLaunchTask() {
  const qc = useQueryClient();
  const t = useTranslations('tasks.create.toast');
  return useMutation({
    mutationFn: ({ publicId, manualAssignments }: { publicId: string; manualAssignments?: Record<string, string[]> }) =>
      apiClient.post<TaskDetailResource>(
        `/v1/tasks/${publicId}/launch`,
        manualAssignments && Object.keys(manualAssignments).length > 0
          ? { manual_assignments: toApiManual(manualAssignments) } as LaunchTaskRequest
          : {} as LaunchTaskRequest,
      ),
    onSuccess: (data) => {
      invalidateTaskCaches(qc, data.public_id);
      toast.success(t('launched'));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : String(error));
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const t = useTranslations('tasks.create.toast');
  return useMutation({
    mutationFn: (publicId: string) => apiClient.delete(`/v1/tasks/${publicId}`),
    onSuccess: (_data, publicId) => {
      qc.removeQueries({ queryKey: queryKeys.tasks.detail(publicId) });
      invalidateTaskCaches(qc);
      toast.success(t('deleted'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
```

No `StoreTaskBody` alias needed — `useCreateTask` directly uses `StoreTaskRequest`.

**Test cases:**
1. `useCreateTask` mutate `{ blueprint_id: 'bp-1', title_ar: 'مرحبا', description_ar: '...' }` → returns `{ public_id: 'task-new' }`; `taskBoard.lists()` invalidated.
2. `useDeleteTask('task-x')` → queryClient.removeQueries called on `tasks.detail('task-x')`.

**Rules:** `coding-standards.md` — Query key factory, mutation + invalidation, `toast.success`/`error`, no optimistic updates for state machines.

---

### 3. `BlueprintCombobox`

**One-line summary:** Combobox over active blueprints via `useBlueprintsInfinite` with `is_active=true` + client-side `Command` filter + Load more affordance.

**Key decisions:**
- Server-side `search` doesn't exist on `GET /blueprints`; client-side filtering via the `Command` `shouldFilter={false}` pattern; the `CommandInput` updates a local search string and we filter the loaded pages by `name_ar`/`name_en` match in `useMemo`
- `key={open ? 'open' : 'closed'}` on the `Command` component forces a fresh mount each time the popover opens, clearing the previous search state
- `handleOpenChange` resets the local `search` string to `''` when opening, so the previous search is cleared
- "Load more" button at the end of the dropdown `CommandList` triggers `fetchNextPage` when `hasNextPage` is true (cursor pagination)
- Empty state inside the dropdown when loaded pages empty and no more pages; `isError` check shows `CommandEmpty` with "no blueprints" when the query fails

**File:** `components/domain/tasks/blueprint-combobox.tsx`

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useBlueprintsInfinite } from '@/lib/api/hooks/use-blueprints';
import { localizeName } from '@/lib/utils/localize';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';

export function BlueprintCombobox({ disabled }: { disabled?: boolean }) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const blueprintId = useTaskFormStore((s) => s.blueprintId);
  const set = useTaskFormStore((s) => s.set);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) setSearch('');
  };

  const blueprintFilters = useMemo(() => ({ is_active: true as const, per_page: 50 as const }), []);
  const query = useBlueprintsInfinite(blueprintFilters);
  const allBps = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allBps;
    return allBps.filter((bp) =>
      (bp.name_ar || '').toLowerCase().includes(q) || (bp.name_en || '').toLowerCase().includes(q),
    );
  }, [allBps, search]);

  const selected = allBps.find((bp) => bp.public_id === blueprintId);
  const label = selected ? localizeName(locale, selected.name_ar, selected.name_en) : '';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between" disabled={disabled}>
          <span className="truncate">{label || t('select_blueprint')}</span>
          <ChevronsUpDown className="ms-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command key={open ? 'open' : 'closed'} shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={t('search_blueprint')} />
          <CommandList>
            {query.isError ? (
              <CommandEmpty>{t('no_blueprints')}</CommandEmpty>
            ) : query.isLoading ? (
              <div className="p-2"><Skeleton className="h-6 w-full" /></div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>{t('no_blueprints')}</CommandEmpty>
            ) : (
              <>
                {filtered.map((bp) => (
                  <CommandItem
                    key={bp.public_id}
                    value={bp.public_id}
                    onSelect={() => {
                      set('blueprintId', bp.public_id);
                      set('blueprintName', localizeName(locale, bp.name_ar, bp.name_en));
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('me-2 size-4', blueprintId === bp.public_id ? 'opacity-100' : 'opacity-0')} />
                    {localizeName(locale, bp.name_ar, bp.name_en)}
                  </CommandItem>
                ))}
                {query.hasNextPage && (
                  <button
                    type="button"
                    className="w-full p-2 text-center text-sm text-muted-foreground hover:bg-accent"
                    onClick={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                  >
                    {query.isFetchingNextPage ? <Loader2 className="mx-auto size-4 animate-spin" /> : t('load_more')}
                  </button>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Test cases:**
1. Renders "Select blueprint" placeholder; opening dropdown lists active blueprints. Clicking an item sets `blueprintId` and `blueprintName` in the store and closes.
2. Typing "free" into the search filters results client-side by `name_en` containing "free"; "Load more" calls `fetchNextPage` when `hasNextPage` is true.

**Rules:** `coding-standards.md` — query key factory via `queryKeys.blueprints.list`; memoized filter with `useMemo`; no `useEffect`+fetch.

---

### 4. `MultiUserCombobox`

**One-line summary:** Multi-select variant of the existing `UserSearchCombobox` — debounced `useUsersSearch`, chips with remove, 300ms debounce, minimum 2-char search. Includes a batch-resolve `useQuery` with `public_ids[]` param to resolve user names for pre-filled IDs from `draft_manual_assignments`.

**File:** `components/domain/tasks/multi-user-combobox.tsx`

```tsx
'use client';

import { useState, useEffect, useMemo, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { useUsersSearch } from '@/lib/api/hooks/use-task-detail';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

interface MultiUserComboboxProps {
  value: string[];
  onChange: (userPublicIds: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export function MultiUserCombobox({ value, onChange, placeholder, ariaLabel }: MultiUserComboboxProps) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const id = useId();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    const tm = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(tm);
  }, [search]);

  const { data, isFetching, isError } = useUsersSearch(debounced);
  const users = data?.data ?? [];

  // Batch-resolve user names for pre-filled IDs from draft_manual_assignments
  const unknownIds = useMemo(
    () => value.filter((uid) => !labels[uid]),
    [value, labels],
  );
  const sortedIds = useMemo(() => [...unknownIds].sort(), [unknownIds]);
  const { data: resolvedData } = useQuery({
    queryKey: ['users', 'by-ids', sortedIds],
    queryFn: () => {
      const qs = unknownIds.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join('&');
      return apiClient.get<{ data: components['schemas']['UserResource'][] }>(
        `/v1/iam/users?${qs}&per_page=${unknownIds.length}`,
      );
    },
    enabled: unknownIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  const resolvedUsers = resolvedData?.data ?? [];

  useEffect(() => {
    if (resolvedUsers.length === 0) return;
    setLabels((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const user of resolvedUsers) {
        if (next[user.public_id]) continue;
        next[user.public_id] = localizeName(locale, user.name_ar, user.name_en);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [resolvedUsers, locale]);

  useEffect(() => {
    if (users.length === 0) return;
    setLabels((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const uid of value) {
        if (next[uid]) continue;
        const user = users.find((u) => u.public_id === uid);
        if (user) {
          next[uid] = localizeName(locale, user.name_ar, user.name_en);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [users, value, locale]);

  const toggle = (uid: string) => {
    const user = users.find((u) => u.public_id === uid);
    if (user) {
      setLabels((prev) => ({ ...prev, [uid]: localizeName(locale, user.name_ar, user.name_en) }));
    }
    onChange(value.includes(uid) ? value.filter((v) => v !== uid) : [...value, uid]);
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" id={id} aria-label={ariaLabel ?? placeholder} className="w-full justify-between">
            <span className="truncate">{placeholder || t('select_users')}</span>
            <ChevronsUpDown className="ms-2 size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command shouldFilter={false}>
            <CommandInput value={search} onValueChange={setSearch} placeholder={t('search_users')} />
            <CommandList>
              {isError ? (
                <CommandEmpty>{t('no_users')}</CommandEmpty>
              ) : isFetching ? (
                <CommandEmpty><Loader2 className="mx-auto size-4 animate-spin" /></CommandEmpty>
              ) : debounced.length < 2 ? (
                <CommandEmpty>{t('search_min_chars')}</CommandEmpty>
              ) : users.length === 0 ? (
                <CommandEmpty>{t('no_users')}</CommandEmpty>
              ) : (
                users.map((u) => {
                  const name = localizeName(locale, u.name_ar, u.name_en);
                  return (
                    <CommandItem key={u.public_id} value={u.public_id} onSelect={() => toggle(u.public_id)}>
                      <Check className={cn('me-2 size-4', value.includes(u.public_id) ? 'opacity-100' : 'opacity-0')} />
                      {name}
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((uid) => (
            <Badge key={uid} variant="secondary" className="gap-1">
              {labels[uid] || <span className="size-4 animate-pulse rounded bg-muted-foreground/20" />}
              {labels[uid] && (
                <button
                  type="button"
                  className="rounded-full p-1.5 hover:bg-background cursor-pointer"
                  aria-label={t('remove_user', { name: labels[uid] })}
                  onClick={() => onChange(value.filter((v) => v !== uid))}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Test cases:**
1. Renders placeholder when empty; opening dropdown, typing "Ahmed" (≥2 chars), selects first user → chip shows with name; clicking chip × removes user.
2. Toggle logic: clicking an unselected user adds; clicking a selected user removes.

**Rules:** `coding-standards.md` — query key factory via `queryKeys.users.list`; debounce via `setTimeout`; chip remove buttons have `aria-label`; touch target ≥44px (`p-0.5` plus `X` icon yields borderline — confirm; bump to `p-1.5` if needed).

---

### 5. `ManualAssignmentBlock`

**One-line summary:** For each Stage 1 stage or sub-stage with `assignment_type === 'manual_at_launch'`, render a labeled block with a `MultiUserCombobox` + helper text.

**Key decisions:**
- Form reads `BlueprintResource.stages`, picks Stage 1 = min `sequence_order`, then Stage 1 stage + its `sub_stages`
- Key for manual store: stage uses `stage.public_id`; sub-stage uses `'sub:' + subStage.public_id` (avoids collisions; matches `toApiManual` in the mutation hook which strips the `sub:` prefix)
- Required: at least one user per manual block, enforced by the orchestrator's `validateManuals()` helper before launch

**File:** `components/domain/tasks/manual-assignment-block.tsx`

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Field, FieldLabel } from '@/components/ui/field';
import { MultiUserCombobox } from './multi-user-combobox';
import { localizeName } from '@/lib/utils/localize';

interface ManualStage {
  kind: 'stage' | 'sub';
  public_id: string;
  name_ar: string;
  name_en: string;
}

export function ManualAssignmentBlock({ item }: { item: ManualStage }) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const manualAssignments = useTaskFormStore((s) => s.manualAssignments);
  const setManual = useTaskFormStore((s) => s.setManual);
  const key = item.kind === 'sub' ? `sub:${item.public_id}` : item.public_id;
  const value = manualAssignments[key] ?? [];
  const name = localizeName(locale, item.name_ar, item.name_en);

  return (
    <Field>
      <FieldLabel>{t('assign_for', { name })}</FieldLabel>
      <p className="text-xs text-muted-foreground">{t('manual_helper')}</p>
      <MultiUserCombobox
        ariaLabel={t('assign_for', { name })}
        value={value}
        onChange={(ids) => setManual(key, ids)}
        placeholder={t('select_users')}
      />
    </Field>
  );
}
```

(`useTaskFormStore` import omitted for brevity — add `import { useTaskFormStore } from '@/lib/stores/use-task-form-store';`.)

**Test cases:**
1. Block with `assignment_type='manual_at_launch'` stage renders label + helper + combobox; toggling users updates the store entry keyed by stage `public_id`.
2. Sub-stage block uses `sub:<public_id>` keying.

**Rules:** `coding-standards.md` — domain components self-contained; no cross-domain imports beyond reusable shared.

---

### 6. `TaskCreationForm` (orchestrator)

**One-line summary:** Client orchestrator wiring the form store, reads `useBlueprint(publicId)` for selected blueprint stage inspecting, runs the create-or-update-then-launch chain, handles all 4 states and 403/404.

**Key decisions:**
- `mode="create"` → blank store; `mode="edit" publicId` → wait for `useTaskDetail` then `initEdit(publicId, data)`
- After blueprint selection, `useBlueprint(blueprintId)` runs to read Stage 1 stages + sub-stages; mapped to `ManualStage[]` via `useMemo`. Only items with `assignment_type === 'manual_at_launch'` (string name from API) end up as `ManualStage`
- `validateManuals()` returns `{ ok: boolean, message: string }` per required block; first failure toasts the error
- On **Launch**: build `manualAssignments` from store; await `useCreateTask().mutateAsync` (or `useUpdateTask`); on success call `useLaunchTask().mutateAsync({ publicId, manualAssignments })`; on success `router.push('/tasks/' + newTask.public_id)`
- On **Save Draft**: same create/update call, toast.success, then navigate to `/tasks/[publicId]`
- **Delete Draft** and **Cancel** are rendered in the PageHeader via `TaskEditActions`/`TaskCancelButton`, not in the form — the orchestrator no longer owns delete/cancel dialogs

**File:** `components/domain/tasks/task-creation-form.tsx`

```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, FileQuestion, Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useTaskFormStore, ManualAssignments } from '@/lib/stores/use-task-form-store';
import { useTaskDisplayStore } from '@/lib/stores/use-task-display-store';
import { useTaskDetail } from '@/lib/api/hooks/use-task-detail';
import { useBlueprint } from '@/lib/api/hooks/use-blueprints';
import { useTaskPriorities } from '@/lib/api/hooks/use-task-board';
import { useCreateTask, useUpdateTask, useLaunchTask } from '@/lib/api/hooks/use-task-create';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { ApiRequestError } from '@/lib/api/client';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { TaskFormSkeleton } from './task-form-skeleton';
import { TaskFormFields } from './task-form-fields';
import { TaskFormFooter } from './task-form-footer';
import { CancelDiscardDialog } from './cancel-discard-dialog';

interface Props {
  mode: 'create' | 'edit';
  publicId?: string;
}

export function TaskCreationForm({ mode, publicId }: Props) {
  const t = useTranslations('tasks.new');
  const tt = useTranslations('tasks.create.toast');
  const locale = useLocale();
  const router = useRouter();
  const priorityId = useTaskFormStore((s) => s.priorityId);
  const blueprintId = useTaskFormStore((s) => s.blueprintId);
  const manualAssignments = useTaskFormStore((s) => s.manualAssignments);
  const touched = useTaskFormStore((s) => s.touched);
  const titleAr = useTaskFormStore((s) => s.title_ar);
  const titleEn = useTaskFormStore((s) => s.title_en);
  const descAr = useTaskFormStore((s) => s.description_ar);
  const descEn = useTaskFormStore((s) => s.description_en);
  const dueDate = useTaskFormStore((s) => s.dueDate);
  const classificationLevel = useTaskFormStore((s) => s.classificationLevel);
  const storeSet = useTaskFormStore((s) => s.set);
  const storeSetManual = useTaskFormStore((s) => s.setManual);
  const storeInitEdit = useTaskFormStore((s) => s.initEdit);
  const storeReset = useTaskFormStore((s) => s.reset);
  const setDisplayId = useTaskDisplayStore((s) => s.setDisplayId);
  const { data: user } = useCurrentUser();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const launchTask = useLaunchTask();
  const canManage = useCapability('task.manage');
  const canClassifyConfidential = useCapability('task.classify.confidential');
  const [discardOpen, setDiscardOpen] = useState(false);

  const detail = useTaskDetail(publicId ?? '');
  const { data: prioritiesData } = useTaskPriorities();
  const priorityInitRef = useRef(false);

  useEffect(() => {
    if (priorityInitRef.current || mode === 'edit' || !prioritiesData) return;
    priorityInitRef.current = true;
    const defaultPriority = prioritiesData.find((p) => String(p.is_default) === '1');
    if (defaultPriority && !priorityId) {
      storeSet('priorityId', defaultPriority.public_id);
    }
  }, [mode, prioritiesData, priorityId, storeSet]);

  useEffect(() => {
    if (mode === 'edit' && publicId && detail.data) {
      const d = detail.data;
      if (d.status !== 'draft') {
        router.replace(`/tasks/${publicId}`);
        return;
      }
      const isInitiator = d.initiator_id === user?.public_id;
      if (!isInitiator && !canManage) {
        return;
      }
      if (d.display_id) setDisplayId(d.display_id);
      const bpName = d.blueprint
        ? localizeName(locale, d.blueprint.name_ar, d.blueprint.name_en)
        : '';
      storeInitEdit(publicId, {
        title_ar: d.title_ar,
        title_en: d.title_en,
        description_ar: d.description_ar,
        description_en: d.description_en,
        priorityId: d.priority?.public_id ?? null,
        classificationLevel: (Number(d.classification_level) || 1) as 1 | 2 | 3,
        dueDate: d.due_date ?? null,
        blueprintId: d.blueprint?.public_id ?? '',
        blueprintName: bpName,
      });
      if (d.draft_manual_assignments) {
        const raw = typeof d.draft_manual_assignments === 'string'
          ? JSON.parse(d.draft_manual_assignments)
          : d.draft_manual_assignments;
        const entries = Array.isArray(raw) ? raw : [];
        for (const entry of entries) {
          const key = entry.blueprint_sub_stage_id
            ? `sub:${entry.blueprint_sub_stage_id}`
            : entry.blueprint_stage_id;
          if (key) storeSetManual(key, entry.user_ids);
        }
      }
    }
    return () => {
      if (mode === 'create') storeReset();
    };
  }, [mode, publicId, detail.data, canManage, user, locale, router, setDisplayId, storeInitEdit, storeReset, storeSetManual]);

  const selectedBlueprint = useBlueprint(blueprintId ?? '');

  const manualItems = useMemo(() => {
    const stages = selectedBlueprint.data?.stages ?? [];
    if (stages.length === 0) return [];
    const first = [...stages].sort((a, b) => Number(a.sequence_order) - Number(b.sequence_order))[0];
    const items: { kind: 'stage' | 'sub'; public_id: string; name_ar: string; name_en: string }[] = [];
    if (first.assignment_type === 'manual_at_launch') {
      items.push({ kind: 'stage', public_id: first.public_id, name_ar: first.name_ar, name_en: first.name_en });
    }
    for (const sub of first.sub_stages ?? []) {
      if (sub.assignment_type === 'manual_at_launch') {
        items.push({ kind: 'sub', public_id: sub.public_id, name_ar: sub.name_ar, name_en: sub.name_en });
      }
    }
    return items;
  }, [selectedBlueprint.data]);

  if (mode === 'edit') {
    if (detail.error instanceof ApiRequestError) {
      if (detail.error.status === 403) {
        return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_desc')} />;
      }
      if (detail.error.status === 404) {
        return (
          <EmptyState
            icon={FileQuestion}
            title={t('not_found_title')}
            action={<Link href="/tasks">{t('back_to_tasks')}</Link>}
          />
        );
      }
      return <ErrorState message={detail.error.message} onRetry={() => detail.refetch()} />;
    }
    if (detail.isLoading) return <TaskFormSkeleton />;
  }

  const validateManuals = (): { ok: true } | { ok: false; message: string } => {
    for (const item of manualItems) {
      const key = item.kind === 'sub' ? `sub:${item.public_id}` : item.public_id;
      const ids = manualAssignments[key] ?? [];
      if (ids.length === 0) {
        const name = localizeName(locale, item.name_ar, item.name_en);
        return { ok: false, message: t('manual_required', { name }) };
      }
    }
    return { ok: true };
  };

  const persist = async (): Promise<string | null> => {
    const manualBody: ManualAssignments = Object.fromEntries(
      Object.entries(manualAssignments).filter(([, ids]) => ids.length > 0),
    );
    try {
      if (mode === 'create') {
        const created = await createTask.mutateAsync({
          blueprint_id: blueprintId as string,
          priority_id: priorityId ?? undefined,
          title_ar: titleAr,
          title_en: titleEn || undefined,
          description_ar: descAr,
          description_en: descEn || undefined,
          classification_level: classificationLevel,
          due_date: dueDate ?? undefined,
          manual_assignments: Object.keys(manualBody).length > 0
            ? Object.entries(manualBody).map(([key, uids]) =>
                key.startsWith('sub:')
                  ? { blueprint_sub_stage_id: key.slice(4), user_ids: uids }
                  : { blueprint_stage_id: key, user_ids: uids },
              )
            : undefined,
        });
        return created.public_id;
      } else {
        await updateTask.mutateAsync({
          publicId: publicId!,
          body: {
            title_ar: titleAr,
            title_en: titleEn || undefined,
            description_ar: descAr,
            description_en: descEn || undefined,
            classification_level: classificationLevel,
            due_date: dueDate ?? undefined,
          } as components['schemas']['UpdateTaskRequest'],
        });
        return publicId!;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return null;
    }
  };

  const onSaveDraft = async () => {
    const pid = await persist();
    if (pid) {
      toast.success(tt('saved'));
      router.push(`/tasks/${pid}`);
    }
  };

  const onLaunch = async () => {
    const v = validateManuals();
    if (!v.ok) { toast.error(v.message); return; }
    const pid = await persist();
    if (!pid) return;
    try {
      await launchTask.mutateAsync({ publicId: pid, manualAssignments });
      router.push(`/tasks/${pid}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const isInitiator =
    mode === 'edit' && detail.data ? detail.data.initiator_id === user?.public_id : false;

  const handleCancel = () => {
    if (touched) {
      setDiscardOpen(true);
    } else {
      router.push(mode === 'create' ? '/tasks' : `/tasks/${publicId}`);
    }
  };

  return (
    <>
      <Card className="flex flex-col gap-6 p-6">
        <FieldGroup>
          <TaskFormFields
            mode={mode}
            manualItems={manualItems}
            canClassifyConfidential={canClassifyConfidential}
          />
        </FieldGroup>

        <TaskFormFooter
          mode={mode}
          priorities={prioritiesData ?? []}
          hasManualItems={manualItems.length > 0}
          isSaving={createTask.isPending || updateTask.isPending}
          isLaunching={createTask.isPending || updateTask.isPending || launchTask.isPending}
          onSaveDraft={onSaveDraft}
          onLaunch={onLaunch}
        />
      </Card>

      <CancelDiscardDialog open={discardOpen} onOpenChange={setDiscardOpen} onConfirm={() => { setDiscardOpen(false); router.push(mode === 'create' ? '/tasks' : `/tasks/${publicId}`); }} />
    </>
  );
}
```

**Test cases:**
1. Create mode renders blank form; typing Arabic title and submitting via Save Draft navigates to `/tasks/<returned publicId>`; board list is invalidated (verify via the mocked POST handler returning `publicId: 'task-new'`).
2. Edit-mode, draft task not authored by user and no `task.manage` → renders 403 `EmptyState` (lock icon); user has `task.manage` but is not initiator → form renders, but Delete Draft button is hidden.

**Rules:** `coding-standards.md` — All 4 states handled; capability checks via `useCapability`; mutations use query key factory; generated types; no `any` (replace `as any` with a typed body alias).

---

### 7. `TaskFormFooter`

**One-line summary:** Summary row + Save Draft / Launch only — Cancel and Delete Draft have moved to PageHeader.

**File:** `components/domain/tasks/task-form-footer.tsx`

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { localizeName } from '@/lib/utils/localize';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';

interface PriorityItem {
  public_id: string;
  name_ar: string;
  name_en: string;
}

interface Props {
  mode: 'create' | 'edit';
  priorities?: PriorityItem[];
  hasManualItems?: boolean;
  isSaving: boolean;
  isLaunching: boolean;
  onSaveDraft: () => void;
  onLaunch: () => void;
}

export function TaskFormFooter({ mode, priorities = [], hasManualItems = false, isSaving, isLaunching, onSaveDraft, onLaunch }: Props) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const { blueprintName, title_ar, priorityId, classificationLevel, dueDate, manualAssignments } = useTaskFormStore();

  const classificationLabel =
    classificationLevel === 3 ? t('classification_confidential')
    : classificationLevel === 2 ? t('classification_internal')
    : t('classification_public');

  const priorityLabel = priorityId
    ? priorities.find((p) => p.public_id === priorityId)
    : null;
  const priorityName = priorityLabel
    ? localizeName(locale, priorityLabel.name_ar, priorityLabel.name_en)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_blueprint')}</p>
          <p className="truncate text-sm text-muted-foreground">{blueprintName || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_title')}</p>
          <p className="truncate text-sm text-muted-foreground">{title_ar || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_priority')}</p>
          <p className="truncate text-sm text-muted-foreground">{priorityName || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_classification')}</p>
          <p className="text-sm text-muted-foreground">{classificationLabel}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_due')}</p>
          <p className="truncate text-sm text-muted-foreground">{dueDate ? new Date(dueDate).toLocaleDateString() : '—'}</p>
        </div>
        {hasManualItems && (
          <div>
            <p className="text-xs font-medium text-foreground">{t('summary_assignees')}</p>
            <p className="text-sm text-muted-foreground">{Object.values(manualAssignments).reduce((n, ids) => n + ids.length, 0)}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" disabled={isSaving || isLaunching} onClick={onSaveDraft}>
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {t('save_draft')}
        </Button>
        <Button disabled={isLaunching} onClick={onLaunch}>
          {isLaunching && <Loader2 className="size-4 animate-spin" />}
          {t('launch')}
        </Button>
      </div>
    </div>
  );
}
```

**Test cases:**
1. Both modes render Save Draft + Launch buttons; no Cancel or Delete Draft in footer (both moved to PageHeader).
2. Summary shows localized priority name and classification label, not raw IDs.

**Rules:** `coding-standards.md` — logical Tailwind properties (footer uses `flex-row-reverse` on mobile so the primary action stays visually dominant in RTL without reversing text direction), `aria-live` on the form error in the orchestrator.

---

### 8. Delete draft + Cancel-discard dialogs

**Files:**
- `components/domain/tasks/delete-draft-dialog.tsx` — wraps `ConfirmDeleteDialog` with `title = t('delete_title')`, `description = t('delete_desc')`, `confirmLabel = t('delete_confirm')` (specific, e.g. "Delete Draft"), `cancelLabel = t('cancel')`. Used by `TaskEditActions` (PageHeader, edit route only).
- `components/domain/tasks/cancel-discard-dialog.tsx` — wraps `ConfirmDeleteDialog` similarly; used by `TaskCancelButton` (PageHeader, create route) and `TaskEditActions` (PageHeader, edit route). The dirty-state check (`useTaskFormStore((s) => s.touched)`) lives in those client components, not in `TaskCreationForm` or `TaskFormFooter`.

Both use the existing `ConfirmDeleteDialog` shared component (`components/shared/confirm-delete-dialog.tsx`).

---

### 9. Task board "Create Task" button

**File:** `components/domain/tasks/task-board.tsx` (modified)

```tsx
// existing imports
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
// ...
return (
  <main className="flex flex-col gap-6">
    <PageHeader title={t('title')} description={t('description')} actions={
      <Button asChild>
        <Link href="/tasks/new"><Plus data-icon="inline-start" />{t('create_task')}</Link>
      </Button>
    } />
    {/* ... existing filters, table, etc. */}
  </main>
);
```

(`tasks.board.create_task` is a new translation key — add it to both `messages/{ar,en}.json`.)

---

### 10. Shell Quick Create link

**File:** `components/domain/shell/app-sidebar.tsx` (modified)

Change line 64 `<Link href="#">` to `<Link href="/tasks/new">` so the "Quick Create" button navigates to the new task form.

---

### 11. i18n keys to add

Add new namespaces `tasks.new` and `tasks.create.toast` to `messages/ar.json` + `messages/en.json`. Also rename the `drafts` filter key to `draft` (remove trailing 's') in both `tasks.board.filters` and `followUp.filters` to match URL param and ToggleGroup values. Minimum set:

```json
"tasks": {
  "new": {
    "title": "إنشاء مهمة",
    "edit_title_draft": "تعديل المسودة — {id}",
    "description": "ابدأ مهمة جديدة من مخطط نشط. الحقول المطلوبة بالعربية فقط.",
    "select_blueprint": "اختر المخطط",
    "search_blueprint": "ابحث عن مخطط...",
    "load_more": "تحميل المزيد",
    "no_blueprints": "لا توجد مخططات نشطة",
    "title_ar": "العنوان (عربي)",
    "title_en": "العنوان (إنجليزي - اختياري)",
    "description_ar": "الوصف (عربي)",
    "description_en": "الوصف (إنجليزي - اختياري)",
    "priority": "الأولوية",
    "classification": "مستوى السرية",
    "classification_public": "عام",
    "classification_internal": "داخلي",
    "classification_confidential": "سري",
    "classification_confidential_lock": "تحتاج صلاحية task.classify.confidential",
    "due_date": "تاريخ الاستحقاق (اختياري)",
    "select_users": "اختر المستخدمين",
    "search_users": "ابحث عن مستخدم...",
    "search_min_chars": "اكتب حرفين على الأقل",
    "no_users": "لا نتائج",
    "remove_user": "إزالة {name}",
    "assign_for": "تعيين المسؤولين لـ {name}",
    "manual_helper": "هذه المرحلة تتطلب تعيين يدوي عند الإطلاق",
    "manual_required": "المرحلة '{name}' تتطلب على الأقل مسؤولًا واحدًا",
    "summary_blueprint": "المخطط",
    "summary_title": "العنوان",
    "summary_priority": "الأولوية",
    "summary_classification": "السرية",
    "summary_due": "الاستحقاق",
    "summary_assignees": "المسؤولون",
    "cancel": "إلغاء",
    "save_draft": "حفظ المسودة",
    "launch": "إطلاق",
    "delete_draft": "حذف المسودة",
    "delete_title": "حذف هذه المسودة؟",
    "delete_desc": "لا يمكن التراجع عن هذا الإجراء.",
    "delete_confirm": "حذف المسودة",
    "discard_title": "تجاهل التغييرات؟",
    "discard_desc": "ستفقد كل ما أدخلته.",
    "discard_confirm": "تجاهل",
    "no_permission_title": "لا تملك صلاحية",
    "no_permission_desc": "لا يمكنك تعديل هذه المسودة.",
    "not_found_title": "المهمة غير موجودة",
    "back_to_tasks": "العودة إلى قائمة المهام"
  },
  "create": {
    "toast": {
      "launched": "تم إطلاق المهمة",
      "saved": "تم حفظ المسودة",
      "deleted": "تم حذف المسودة"
    }
  }
}
```

(English mirror omitted for brevity.)

---

### 12. MSW handlers (`task-create-handlers.ts`)

**File:** `__tests__/mocks/task-create-handlers.ts`

```ts
import { http, HttpResponse } from 'msw';

const TASK_URL = 'https://api.momentum.test/v1';

export const taskCreateHandlers = [
  http.post(`${TASK_URL}/tasks`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      public_id: 'task-new',
      display_id: 'T-2026-0007',
      blueprint_id: body.blueprint_id,
      priority: null,
      title_ar: body.title_ar,
      title_en: body.title_en || body.title_ar,
      description_ar: body.description_ar,
      description_en: body.description_en || body.description_ar,
      classification_level: body.classification_level ?? 1,
      status: 'draft',
      initiator_id: 'user-1',
      due_date: body.due_date || null,
      created_at: new Date().toISOString(),
      launched_at: null, suspended_at: null, resumed_at: null,
      completed_at: null, cancelled_at: null,
      suspension_reason: null, cancellation_reason: null,
    });
  }),
  http.put(`${TASK_URL}/tasks/:publicId`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ public_id: params.publicId, status: 'draft', ...body });
  }),
  http.post(`${TASK_URL}/tasks/:publicId/launch`, async ({ params }) => {
    return HttpResponse.json({
      public_id: params.publicId,
      status: 'active',
      stages: [],
      launched_at: new Date().toISOString(),
    });
  }),
  http.delete(`${TASK_URL}/tasks/:publicId`, () => new HttpResponse(null, { status: 204 })),
  // 422 manual-assignment-missing variant — toggle on demand in tests
];
```

Then `__tests__/mocks/handlers.ts` appends `...taskCreateHandlers`.

---

## Data Flow

```
Route (/tasks/new or /tasks/[publicId]/edit)
  → Page (Server Component)
    → prefetch task detail (edit route)
  → TaskCreationForm (client)
    ↳ reads Zustand store (form inputs, manual_assignments)
    ↳ reads TanStack Query:
        · useTaskPriorities()   → priorities select
        · useBlueprintsInfinite → blueprint combobox
        · useBlueprint(id)       → selected blueprint stages (Stage 1 inspection)
        · useUsersSearch(search) → manual-at-launch combobox
        · useTaskDetail(publicId) (edit) → prefill + permission/auth check
        · useCurrentUser()       → initiator comparison (delete button vis)
        · useCapability(...)     → classification_confidential lock, task.manage check
    ↳ user fills form, selects blueprint, picks manual assignees
    ↳ clicks Launch:
        useCreateTask().mutateAsync(body)  → POST /v1/tasks         → Response<TaskResource>
        useLaunchTask().mutateAsync(...)  → POST /v1/tasks/{pid}/launch → Response<TaskDetailResource>
          → invalidate taskBoard.lists(), tasks.lists(), tasks.detail(publicId), tasks.slaHealth(publicId)
        router.push('/tasks/<publicId>')   → task details page (re-render with active state)
    ↳ clicks Save Draft:
        useCreateTask().mutateAsync(body)  → POST /v1/tasks         → landing on draft details
    ↳ clicks Delete Draft in PageHeader TaskEditActions (edit + initiator)
        useDeleteTask().mutateAsync(publicId) → DELETE → removeQueries(detail) → toast → navigate /tasks
```

---

## Route Structure

```
app/
└── (dashboard)/
    └── tasks/
        ├── page.tsx                              [existing] TasksPage (spec 003)
        ├── new/
        │   └── page.tsx                          [NEW] TaskNewPage
        └── [publicId]/
            ├── page.tsx                          [existing] TaskDetailPage (spec 004)
            └── edit/
                └── page.tsx                      [NEW] TaskEditPage (edit draft, draft-only)
            └── workflow/page.tsx                 [existing] workflow (spec 006)
```

Locale is cookie-based (`NEXT_LOCALE`) so no locale prefix. Routes use `publicId` route param for the edit route. Per `glossary.md`, `publicId` is the task's `public_id`, never the internal `id`.

---

## Execution Order

1. **i18n key additions** — add `tasks.new` and `tasks.create.toast` namespaces to both `messages/ar.json` and `messages/en.json`. Label every new field and toast.
2. **Query keys / no-op** — confirm `lib/api/query-keys.ts` has the entries the plan uses. The list already has `tasks.lists()`, `tasks.detail`, `taskBoard.lists`, `blueprints.list`, `blueprints.detail`, `tasks.priorities`, `users.list`.
3. **Store** — create `lib/stores/use-task-form-store.ts`.
4. **Mutation hooks** — create `lib/api/hooks/use-task-create.ts` (create/update/launch/delete).
5. **Domain components** — `BlueprintCombobox`, `MultiUserCombobox`, `ManualAssignmentBlock`, `PrioritySelect`, `ClassificationSelect`, `DueDateField`, `TaskFormSkeleton`, `CancelDiscardDialog`, `DeleteDraftDialog`, `TaskFormFields`, `TaskFormFooter`, `TaskCreationForm`.
6. **Routes** — `app/(dashboard)/tasks/new/page.tsx` and `app/(dashboard)/tasks/[publicId]/edit/page.tsx` (Server Components using `getTranslations('tasks.new')`).
7. **Route pages + PageHeader actions** — create `TaskNewPage` (PageHeader with `TaskCancelButton`), `TaskEditPage` (PageHeader with `EditPageTitle` + `TaskEditActions`). Add "Create Task" `Button` to `task-board.tsx` PageHeader. Change Quick Create `Link href` in `app-sidebar.tsx`. Create `TaskCancelButton`, `TaskEditActions`, `EditPageTitle` client components. (Verify task details page's edit/launch affordances — add if missing.)
8. **MSW handlers** — `__tests__/mocks/task-create-handlers.ts`; append to `__tests__/mocks/handlers.ts`.
9. **Tests** — `task-creation-form` (create/edit/422), `manual-assignment-block` (renders/validate), `blueprint-combobox` (filter + load more).
10. **Lint + typecheck + build** — `npm run lint && npm run typecheck && npm run build`.

---

## What to Test Manually

### Happy paths in both locales (AR RTL + EN LTR)
1. From `/tasks`, click **Create Task** → form renders RTL in AR, LTR in EN; all labels translated.
2. Pick an active blueprint from the combobox — verify Stage 1 manual stages appear below; other stages are hidden.
3. Fill Arabic title + description, leave English blank; pick priority (default pre-selected); pick classification (Public).
4. Skip Step 2 selection and click **Launch** → inline error "Stage '{name}' requires at least one assignee" is shown; the form does not submit.
5. Select at least one user per manual block → **Launch** → spinner → success toast → navigate to `/tasks/<publicId>` with status `active`; the board refreshes and shows the new task.
6. Click **Save Draft** instead → toast "Draft saved" → land on `/tasks/<publicId>` in `draft` state. Reopen via `/tasks/<publicId>/edit` → all fields prefilled; blueprint combobox disabled.
7. On the edit page (you are initiator) click **Delete Draft** → confirm dialog opens → confirm → toast "Draft deleted" → land on `/tasks`; the draft no longer appears.
8. Confirm the Hijri date appears beneath the Gregorian due date pick (presentation only).

### Loading, empty, error states
9. Slow the network; confirm the form skeleton appears on the edit route while the task detail resolves.
10. Select an inactive blueprint list results scenario (e.g. toggle the MSW mock to return no active blueprints) — combobox shows "No active blueprints"; Save/Launch disabled.
11. Simulate a 500 on `POST /v1/tasks` — the form shows the toast error and the user retains the entered data (no navigation).
12. Simulate a 422 `MissingManualAssignmentException` on launch — inline error appears beside the Launch button (or in the `aria-live` region); form stays open.
13. Simulate a 403 on the edit route as a non-initiator without `task.manage` — lock-icon `EmptyState` renders.

### Permission-gated UI
14. Without `task.classify.confidential`, the Confidential option is disabled with a tooltip "need task.classify.confidential".
15. As `tenant_admin` with `task.manage` (not the initiator) opening another user's draft — form renders, **Delete Draft** button is hidden (initiator-only delete).

### Responsive behavior
16. Resize below 640px — bilingual fields stack (AR above EN); footer buttons reverse-stack (primary on top via `flex-col-reverse`); dropdowns full-width.
17. Resize to tablet — bilingual fields side-by-side; footer inline.

### Keyboard navigation
18. From the first form field, Tab forward through all inputs; reach Save Draft → Launch in the footer; also verify Tab reaches the Cancel and Delete Draft buttons in the PageHeader actions slot.
19. Open the blueprint combobox with Enter; use arrow keys to navigate the dropdown; Enter to select; Escape to close without selecting.
20. Open the MultiUserCombobox; type ≥2 chars; arrow to a user; Enter to toggle; Tab away → chips preserve selection; focus chip × and press Enter to remove.
21. With an invalid launch (missing manual user), Tab to the Launch button → press Enter → focus moves to the inline error (announced by NVDA/JAWS).