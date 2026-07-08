# Plan: External References

> **Spec:** `specs/025-external-references/spec.md`
> **Date:** 2026-07-08
> **Status:** `completed`

---

## Open Questions Resolved

| # | Open Question | Decision | Rationale |
|---|---------------|----------|-----------|
| 1 | OpenAPI path params typed as `integer` | Treat path params as `string` in implementation. Cast to `string` when interpolating URLs. | Backend uses `public_id` (UUID) route-model binding; Scramble emitted `integer` by mistake. `apiClient` paths are string templates. |
| 2 | Enum string values from API | Backend serializes `reference_type`/`entity_type` via `apiValue()` → lowercase snake-case strings (`correspondence`, `governmentministry`, etc.). Frontend stores and compares these strings directly (as it does for `transition_type === 'return'`). For mutating requests, map the string to the integer code via forward maps (`EXTERNAL_REFERENCE_TYPE_MAP`, `EXTERNAL_ENTITY_TYPE_MAP`) — same pattern as `ASSIGNMENT_TYPE_MAP` in `lib/utils/blueprint-utils.ts`. | Treat the API value as it comes; do not convert responses to integers. Label maps keyed by API string value. Request bodies are integer codes per the OpenAPI contract. |
| 3 | Entity catalog route location | `/admin/external-entities` (admin-adjacent). | Moved during implementation to avoid sidebar conflicts and better reflect the management nature of the page. Sidebar link under admin group, gated by `task.manage_external_entities`. |
| 4 | Deactivate/reactivate confirmation | No extra confirmation dialog. | Follows blueprint catalog pattern established by spec 005; destructive delete still uses `ConfirmDeleteDialog`. Server is source of truth and action is reversible. |
| 5 | Board filter placement | Compact external-reference input in the main filter bar, next to the search input. | Primary lookup path for follow-up specialists; debounced 300ms. Can be moved to advanced sheet later if product prefers. |
| 6 | Global search result metadata display | Extend search result rendering to show matched `external_references` (type + number) when the `external_reference` filter is used. | `SearchTaskResource` includes `external_references` array when filter is present; reuse existing `SearchResultItem` with a small metadata row. |
| 7 | Reference card order in sidebar | Between `DetailsCard` and `TaskDocumentsCard`. | Follows conceptual flow: metadata → formal references → files → activity. |

---

## Technical Approach

Add an **External References** card to the task-detail sidebar, an **External Entity Catalog** page under `/admin/external-entities`, and wire the existing `external_reference` filter into the task board and global search. All API consumption uses generated OpenAPI types and TanStack Query; no API data in Zustand.

**Key decisions:**
- **Single hook file** — `lib/api/hooks/use-external-references.ts` owns all reference + entity queries/mutations.
- **Query key invalidation uses prefix matching** — `[...queryKeys.tasks.detail(publicId), 'external-references']` instead of `queryKeys.tasks.externalReferences(publicId)` to match any filter variant.
- **Catalog reuses blueprint catalog pattern** — `ExternalEntityManager` mirrors `CategoryManager`, using `ActionsDropdown`, `FormDialog`, `CatalogSkeleton`, `RtlTable`, `BilingualNameFields`, and `ActiveBadge`.
- **Reference form select** — active entities only; inline creator opens a secondary `FormDialog` and auto-selects the new entity on success.
- **Board filter URL-driven** — `externalReference` lives in URL params and maps to `external_reference` in the `followUpBoard.board` query.
- **No optimistic updates** — mutations invalidate queries and rely on server response; toast feedback via sonner.
- **Entity catalog requests `?all=true`** — backend returns all entities (active + inactive) for the management page; `useActiveExternalEntities` filters for the reference picker.
- **Dialog form initialization uses `useEffect` + `setTimeout`** — same pattern as `CategoryManager`; avoids `react-hooks/set-state-in-effect` lint rule while correctly pre-filling form on edit.
- **Reference items use `Attachment` component** — matches `TaskDocumentItem` visual pattern (icon + title/description + action buttons) for consistency in adjacent sidebar cards.
- **Dynamic icons per reference type** — `EXTERNAL_REFERENCE_TYPE_ICONS` maps each type to a distinct Lucide icon (Mail, FileSignature, ScrollText, etc.).
- **Global search passes `external_reference` alongside `q`** — single call to `/v1/search?q=...&external_reference=...` avoids redundant second request.
- **Sidebar nav** — external entities link under admin group, gated by `task.manage_external_entities`, points to `/admin/external-entities`.

---

## Component Tree

```text
app/(dashboard)/tasks/[publicId]/page.tsx                Server
  TaskDetail (Client)
    ├── TitleMetaCard
    ├── StageTimeline
    ├── TaskCommentsCard
    └── Sidebar
        ├── DetailsCard
        ├── TaskExternalReferencesCard (NEW)             Client
        │   ├── TaskExternalReferencesSkeleton
        │   ├── TaskExternalReferencesList (NEW)         Client
        │   │   └── TaskExternalReferenceItem[] (NEW)
        │   ├── TaskExternalReferenceDialog (NEW)        Client
        │   ├── TaskExternalReferenceDeleteDialog (NEW)
        │   └── InlineExternalEntityCreator (NEW)
        ├── TaskDocumentsCard
        └── RecentActivityCard

app/(dashboard)/tasks/external-entities/page.tsx (NEW)   Server
  ExternalEntitiesPage (NEW)                             Server
    └── ExternalEntityManager (NEW)                      Client
        ├── CatalogSkeleton / EmptyState / ErrorState
        ├── RtlTable + ActionsDropdown
        ├── FormDialog (create/edit)
        └── ExternalEntityTypeSelect (NEW)

components/domain/tasks/task-board.tsx                   Client
  └── BoardFilters
      └── ExternalReferenceFilterInput (NEW)             Client

components/domain/search/global-search.tsx               Client
  └── SearchResultItem (modified)
      └── external_reference metadata row (NEW)
```

**Server components:**
- `TaskDetailPage`, `ExternalEntitiesPage` — only read translations and render shell/client children.

**Client components:**
- Everything with TanStack Query, forms, dialogs, URL params, or event handlers.

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `components/domain/tasks/task-external-references-card.tsx` | Sidebar card: fetch references, show first 3, "View all", Add button. |
| `components/domain/tasks/task-external-references-list.tsx` | Full cursor-paginated list inside "View all" dialog. |
| `components/domain/tasks/task-external-reference-item.tsx` | Single reference row with type badge, number, entity, notes, actions. |
| `components/domain/tasks/task-external-reference-dialog.tsx` | Add/edit reference form dialog. |
| `components/domain/tasks/task-external-reference-delete-dialog.tsx` | Destructive delete confirmation. |
| `components/domain/tasks/task-external-references-skeleton.tsx` | Skeleton matching reference-row shape. |
| `components/domain/tasks/external-entity-select.tsx` | Select populated from active entities; includes "Add new entity" option. |
| `components/domain/tasks/reference-type-select.tsx` | Select using API string values (`correspondence`, `contract`, etc.). |
| `components/domain/tasks/external-entity-type-select.tsx` | Select using API string values (`governmentministry`, `vendor`, etc.). |
| `components/domain/tasks/inline-external-entity-creator.tsx` | Compact create-entity dialog from reference form. |
| `components/domain/tasks/external-entity-manager.tsx` | Catalog page table + CRUD dialog orchestrator. |
| `app/(dashboard)/admin/external-entities/page.tsx` | Client page for entity catalog with PageHeader actions slot. |
| `components/domain/tasks/external-reference-filter-input.tsx` | Debounced input for board filter bar. |
| `lib/api/hooks/use-external-references.ts` | All external-reference + entity query/mutation hooks. |
| `components/domain/tasks/task-external-reference-types.ts` | Colocated generated type aliases. |
| `__tests__/components/domain/tasks/task-external-references-card.test.tsx` | Card state + interaction tests. |
| `__tests__/components/domain/tasks/external-entity-manager.test.tsx` | Catalog state + CRUD tests. |

### Modified Files

| File | Change |
|------|--------|
| `lib/api/query-keys.ts` | Add `tasks.externalReferences`, `tasks.externalEntities`. |
| `components/domain/tasks/task-detail.tsx` | Insert `<TaskExternalReferencesCard publicId={publicId} />` between `<DetailsCard />` and `<TaskDocumentsCard />`. |
| `components/domain/tasks/task-board-types.ts` | Add `externalReference?: string` to `TaskBoardUrlFilters`. |
| `components/domain/tasks/task-board-utils.ts` | Read/write `externalReference` URL param; pass `external_reference` in `toBoardQuery`. |
| `components/domain/tasks/board-filters.tsx` | Add `<ExternalReferenceFilterInput />` in filter bar. |
| `lib/api/hooks/use-search.ts` | Add `external_reference` param to `useSearch`; update result type with optional `external_references`. |
| `components/domain/search/global-search.tsx` | Render matched reference metadata in result rows when present. |
| `messages/ar.json` | Add `tasks.references`, `tasks.entities` namespaces, board filter keys, nav.external_entities. |
| `messages/en.json` | Add `tasks.references`, `tasks.entities` namespaces, board filter keys, nav.external_entities. |
| `__tests__/mocks/handlers.ts` | Add MSW handlers for all new endpoints; external-entities returns all with `?all=true`. |
| `components/domain/shell/app-sidebar.tsx` | Add external entities nav item under admin group, gated by `task.manage_external_entities`. |
| `components/domain/shell/use-page-breadcrumb.ts` | Add breadcrumb for `/admin/external-entities`. |

---

## Implementation Notes

### 1. Query Keys

**One-line summary:** Extend the factory with two new namespaces for references and entities.

**Files:** `lib/api/query-keys.ts`

```ts
export const queryKeys = {
  // ... existing namespaces ...
  tasks: {
    // ... existing keys ...
    externalEntities: () => [...queryKeys.tasks.all, 'external-entities'] as const,
    externalReferences: (taskPublicId: string, filters?: { per_page?: number }) =>
      [...queryKeys.tasks.detail(taskPublicId), 'external-references', filters] as const,
  },
} as const;
```

**Rules applied:**
- `coding-standards.md` § Query key factory — no hardcoded strings.
- References nested under `tasks.detail(publicId)` for targeted invalidation.

**Test cases:**
1. `queryKeys.tasks.externalReferences('uuid')` → `['tasks', 'detail', 'uuid', 'external-references', {}]`.
2. `queryKeys.tasks.externalEntities()` → `['tasks', 'external-entities']`.

---

### 2. Hooks — `lib/api/hooks/use-external-references.ts`

**One-line summary:** All queries and mutations for task external references and external entities in one hook file.

**Files:** `lib/api/hooks/use-external-references.ts`

```ts
'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { CursorPage } from '@/lib/api/types';
import type {
  TaskExternalReferenceResource,
  ExternalEntityResource,
  StoreTaskExternalReferenceRequest,
  UpdateTaskExternalReferenceRequest,
  StoreExternalEntityRequest,
  UpdateExternalEntityRequest,
} from '@/components/domain/tasks/task-external-reference-types';

export function useTaskExternalReferences(taskPublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.externalReferences(taskPublicId, { per_page: 15 }),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<TaskExternalReferenceResource>>(
        `/v1/tasks/${taskPublicId}/external-references`,
        { params: { cursor: pageParam, per_page: 15 } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!taskPublicId,
  });
}

export function useExternalEntities() {
  return useQuery({
    queryKey: queryKeys.tasks.externalEntities(),
    queryFn: () => apiClient.get<ExternalEntityResource[]>('/v1/tasks/external-entities'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveExternalEntities() {
  const { data, ...rest } = useExternalEntities();
  const active = useMemo(() => (data ?? []).filter((e) => e.is_active), [data]);
  return { data: active, ...rest };
}

export function useCreateTaskExternalReference(taskPublicId: string) {
  const t = useTranslations('tasks.references');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StoreTaskExternalReferenceRequest) =>
      apiClient.post<TaskExternalReferenceResource>(
        `/v1/tasks/${taskPublicId}/external-references`,
        body,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalReferences(taskPublicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_created'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}

export function useUpdateTaskExternalReference(taskPublicId: string) {
  const t = useTranslations('tasks.references');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { referencePublicId: string; body: UpdateTaskExternalReferenceRequest }) =>
      apiClient.put<TaskExternalReferenceResource>(
        `/v1/tasks/${taskPublicId}/external-references/${vars.referencePublicId}`,
        vars.body,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalReferences(taskPublicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_updated'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}

export function useDeleteTaskExternalReference(taskPublicId: string) {
  const t = useTranslations('tasks.references');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (referencePublicId: string) =>
      apiClient.delete<void>(`/v1/tasks/${taskPublicId}/external-references/${referencePublicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalReferences(taskPublicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_deleted'));
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useCreateExternalEntity() {
  const t = useTranslations('tasks.entities');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StoreExternalEntityRequest) =>
      apiClient.post<ExternalEntityResource>('/v1/tasks/external-entities', body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalEntities() });
      toast.success(t('toast_created'));
      return data;
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateExternalEntity() {
  const t = useTranslations('tasks.entities');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { entityPublicId: string; body: UpdateExternalEntityRequest }) =>
      apiClient.put<ExternalEntityResource>(`/v1/tasks/external-entities/${vars.entityPublicId}`, vars.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalEntities() });
      toast.success(t('toast_updated'));
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeactivateExternalEntity() {
  const t = useTranslations('tasks.entities');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityPublicId: string) =>
      apiClient.post<ExternalEntityResource>(`/v1/tasks/external-entities/${entityPublicId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalEntities() });
      toast.success(t('toast_deactivated'));
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useReactivateExternalEntity() {
  const t = useTranslations('tasks.entities');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityPublicId: string) =>
      apiClient.post<ExternalEntityResource>(`/v1/tasks/external-entities/${entityPublicId}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalEntities() });
      toast.success(t('toast_reactivated'));
    },
    onError: (error) => toast.error(error.message),
  });
}
```

**Rules applied:**
- `coding-standards.md` § Query hooks, § Mutations with invalidation, § Toast feedback.
- 422 errors are swallowed in toast so dialogs can display inline validation; other errors toast.

**Test cases:**
1. Render `<TaskExternalReferencesCard />` → MSW returns cursor page; list renders reference number.
2. Click delete → MSW returns 204 → list refetches and item disappears.

---

### 3. Types — `components/domain/tasks/task-external-reference-types.ts`

**One-line summary:** Re-export generated types for colocated use.

**Files:** `components/domain/tasks/task-external-reference-types.ts`

```ts
import type { components } from '@/lib/generated/api-types';

export type TaskExternalReferenceResource = components['schemas']['TaskExternalReferenceResource'];
export type ExternalEntityResource = components['schemas']['ExternalEntityResource'];
export type ExternalReferenceType = components['schemas']['ExternalReferenceType'];
export type ExternalEntityType = components['schemas']['ExternalEntityType'];
export type StoreTaskExternalReferenceRequest = components['schemas']['StoreTaskExternalReferenceRequest'];
export type UpdateTaskExternalReferenceRequest = components['schemas']['UpdateTaskExternalReferenceRequest'];
export type StoreExternalEntityRequest = components['schemas']['StoreExternalEntityRequest'];
export type UpdateExternalEntityRequest = components['schemas']['UpdateExternalEntityRequest'];
```

**Rules applied:** `coding-standards.md` § Generated types only — no hand-written API DTOs.

---

### 4. Enum Maps

**One-line summary:** Treat API string values as canonical; map them to i18n labels, and map them to integer codes only when sending to the API.

**Files:** `components/domain/tasks/task-external-reference-utils.ts`

```ts
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

// API response values from apiValue() — used for display and form state.
export const EXTERNAL_REFERENCE_TYPE_VALUES = [
  'correspondence',
  'contract',
  'ministerialdecision',
  'authoritydecision',
  'meetingminute',
  'externalorgrequest',
  'vendorreference',
  'other',
] as const;

export type ExternalReferenceTypeValue = typeof EXTERNAL_REFERENCE_TYPE_VALUES[number];

export const EXTERNAL_REFERENCE_TYPE_KEYS: Record<string, string> = {
  correspondence: 'reference_type_correspondence',
  contract: 'reference_type_contract',
  ministerialdecision: 'reference_type_ministerial_decision',
  authoritydecision: 'reference_type_authority_decision',
  meetingminute: 'reference_type_meeting_minute',
  externalorgrequest: 'reference_type_external_org_request',
  vendorreference: 'reference_type_vendor_reference',
  other: 'reference_type_other',
};

// Forward map: API string value → integer code for request bodies.
export const EXTERNAL_REFERENCE_TYPE_MAP: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8> = {
  correspondence: 1,
  contract: 2,
  ministerialdecision: 3,
  authoritydecision: 4,
  meetingminute: 5,
  externalorgrequest: 6,
  vendorreference: 7,
  other: 8,
};

export const EXTERNAL_ENTITY_TYPE_VALUES = [
  'governmentministry',
  'governmentauthority',
  'semigovernment',
  'university',
  'hospital',
  'privatecompany',
  'vendor',
  'other',
] as const;

export type ExternalEntityTypeValue = typeof EXTERNAL_ENTITY_TYPE_VALUES[number];

export const EXTERNAL_ENTITY_TYPE_KEYS: Record<string, string> = {
  governmentministry: 'entity_type_government_ministry',
  governmentauthority: 'entity_type_government_authority',
  semigovernment: 'entity_type_semi_government',
  university: 'entity_type_university',
  hospital: 'entity_type_hospital',
  privatecompany: 'entity_type_private_company',
  vendor: 'entity_type_vendor',
  other: 'entity_type_other',
};

// Forward map: API string value → integer code for request bodies.
export const EXTERNAL_ENTITY_TYPE_MAP: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8> = {
  governmentministry: 1,
  governmentauthority: 2,
  semigovernment: 3,
  university: 4,
  hospital: 5,
  privatecompany: 6,
  vendor: 7,
  other: 8,
};

export function useReferenceTypeLabel(value?: string): string {
  const t = useTranslations('tasks.references');
  return useMemo(() => {
    if (!value) return t('reference_type_other');
    return t(EXTERNAL_REFERENCE_TYPE_KEYS[value] ?? 'reference_type_other');
  }, [value, t]);
}

export function useEntityTypeLabel(value?: string): string {
  const t = useTranslations('tasks.entities');
  return useMemo(() => {
    if (!value) return '';
    return t(EXTERNAL_ENTITY_TYPE_KEYS[value] ?? 'entity_type_other');
  }, [value, t]);
}
```

**Rules applied:**
- `coding-standards.md` § No hardcoded strings; i18n for all user-facing labels.
- Mirrors `ASSIGNMENT_TYPE_MAP` / `CARDINALITY_MAP` pattern in `lib/utils/blueprint-utils.ts`.

**Test cases:**
1. `useReferenceTypeLabel('contract')` in English → `"Contract"`; in Arabic → `"عقد"`.
2. `EXTERNAL_REFERENCE_TYPE_MAP['contract']` → `2`.
3. Unknown value falls back to `reference_type_other`.

---

### 5. Task External References Card

**One-line summary:** Sidebar card showing up to 3 references, with Add button, "View all", and per-row actions.

**Files:**
- `components/domain/tasks/task-external-references-card.tsx`
- `components/domain/tasks/task-external-references-list.tsx`
- `components/domain/tasks/task-external-reference-item.tsx`
- `components/domain/tasks/task-external-references-skeleton.tsx`

**Key decisions:**
- Mirrors `TaskDocumentsCard` two-tier pattern: inline preview of first 3 + Dialog for full cursor-paginated list.
- Permission: `useCapability('task.manage')` gates Add/Edit/Delete UX; server enforces initiator/`task.manage`.
- Uses `useLocale()` and `localizeName()` for bilingual entity names.
- Reference rows align content to start, actions to end.

**Snippet — `TaskExternalReferencesCard`:**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Link2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useTaskExternalReferences } from '@/lib/api/hooks/use-external-references';
import { TaskExternalReferencesSkeleton } from './task-external-references-skeleton';
import { TaskExternalReferenceItem } from './task-external-reference-item';
import { TaskExternalReferenceDialog } from './task-external-reference-dialog';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

const MAX_VISIBLE = 3;

interface TaskExternalReferencesCardProps {
  publicId: string;
}

export function TaskExternalReferencesCard({ publicId }: TaskExternalReferencesCardProps) {
  const t = useTranslations('tasks.references');
  const locale = useLocale();
  const canManage = useCapability('task.manage');
  const referencesQuery = useTaskExternalReferences(publicId);
  const [showAll, setShowAll] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReference, setEditReference] = useState<TaskExternalReferenceResource | null>(null);

  const allReferences = useMemo(
    () => referencesQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [referencesQuery.data],
  );
  const preview = useMemo(() => allReferences.slice(0, MAX_VISIBLE), [allReferences]);
  const totalCount = allReferences.length;

  if (referencesQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent><TaskExternalReferencesSkeleton /></CardContent>
      </Card>
    );
  }

  if (referencesQuery.isError) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('title')}</CardTitle></CardHeader>
        <CardContent><ErrorState message={t('error')} onRetry={() => referencesQuery.refetch()} /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('title')}</CardTitle>
          {canManage && (
            <Button size="sm" onClick={() => { setEditReference(null); setDialogOpen(true); }}>
              <Plus className="me-1 size-4" /> {t('add')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {allReferences.length === 0 ? (
            <EmptyState
              icon={Link2}
              title={t('empty_title')}
              description={t('empty_description')}
              action={canManage ? (
                <Button size="sm" variant="outline" onClick={() => { setEditReference(null); setDialogOpen(true); }}>
                  <Plus className="me-1 size-4" /> {t('add')}
                </Button>
              ) : undefined}
            />
          ) : (
            <>
              <ul className="flex flex-col gap-2" aria-label={t('title')}>
                {preview.map((ref) => (
                  <TaskExternalReferenceItem
                    key={ref.public_id}
                    reference={ref}
                    canManage={canManage}
                    onEdit={() => { setEditReference(ref); setDialogOpen(true); }}
                  />
                ))}
              </ul>
              {totalCount > MAX_VISIBLE && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-1 block cursor-pointer text-xs font-medium text-primary hover:underline text-start"
                >
                  {t('view_all', { count: totalCount })} <ArrowRight className="inline size-3 rtl:rotate-180" />
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TaskExternalReferenceDialog
        taskPublicId={publicId}
        reference={editReference}
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditReference(null); }}
      />

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-2xl text-start">
          <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <TaskExternalReferencesList
              references={allReferences}
              taskPublicId={publicId}
              fetchNextPage={referencesQuery.fetchNextPage}
              hasNextPage={referencesQuery.hasNextPage}
              isFetchingNextPage={referencesQuery.isFetchingNextPage}
              canManage={canManage}
              onEdit={(ref) => { setEditReference(ref); setDialogOpen(true); }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Snippet — `TaskExternalReferenceItem`:**

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReferenceTypeLabel } from './task-external-reference-utils';
import { localizeName } from './task-detail-utils';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

interface TaskExternalReferenceItemProps {
  reference: TaskExternalReferenceResource;
  canManage: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

export function TaskExternalReferenceItem({ reference, canManage, onEdit, onDelete }: TaskExternalReferenceItemProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.references');
  const typeLabel = useReferenceTypeLabel(reference.reference_type);
  const entityName = reference.external_entity
    ? localizeName(locale, reference.external_entity.name_ar, reference.external_entity.name_en)
    : null;

  return (
    <li className="flex items-start justify-between gap-2 rounded-lg border p-3 hover:bg-muted/40 transition-colors duration-200">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
          <span className="text-sm font-medium truncate">{reference.reference_number}</span>
        </div>
        {entityName && <span className="text-xs text-muted-foreground truncate">{entityName}</span>}
        {reference.notes && <span className="text-xs text-muted-foreground truncate">{reference.notes}</span>}
      </div>
      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="size-8" aria-label={t('edit_reference', { number: reference.reference_number })} onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" aria-label={t('delete_reference', { number: reference.reference_number })} onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </li>
  );
}
```

**Snippet — `TaskExternalReferencesList`:**

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { TaskExternalReferenceItem } from './task-external-reference-item';
import { TaskExternalReferenceDeleteDialog } from './task-external-reference-delete-dialog';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

interface TaskExternalReferencesListProps {
  references: TaskExternalReferenceResource[];
  taskPublicId: string;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  canManage: boolean;
  onEdit: (ref: TaskExternalReferenceResource) => void;
}

export function TaskExternalReferencesList({
  references, taskPublicId, fetchNextPage, hasNextPage, isFetchingNextPage, canManage, onEdit,
}: TaskExternalReferencesListProps) {
  const t = useTranslations('tasks.references');
  const [deleteReference, setDeleteReference] = useState<TaskExternalReferenceResource | null>(null);
  const deleteMutation = useDeleteTaskExternalReference(taskPublicId);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2" aria-label={t('title')}>
        {references.map((ref) => (
          <TaskExternalReferenceItem
            key={ref.public_id}
            reference={ref}
            canManage={canManage}
            onEdit={() => onEdit(ref)}
            onDelete={() => setDeleteReference(ref)}
          />
        ))}
      </ul>
      {hasNextPage && (
        <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="mt-2 w-full">
          {isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
      <TaskExternalReferenceDeleteDialog
        reference={deleteReference}
        open={!!deleteReference}
        onOpenChange={(open) => { if (!open) setDeleteReference(null); }}
        onConfirm={() => {
          if (deleteReference) {
            deleteMutation.mutate(deleteReference.public_id, { onSuccess: () => setDeleteReference(null) });
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
```

**Rules applied:**
- `coding-standards.md` § All 4 states (loading skeleton, error inline, empty with CTA, success list).
- `coding-standards.md` § Cursor pagination with manual "Load more".
- `coding-standards.md` § Permission checks via `useCapability()`.
- `design-system/04-layout-patterns.md` § Two-tier card pattern.
- `design-system/05-accessibility.md` § `aria-label` on icon-only buttons, list `aria-label`.
- Logical properties only (`me-`, `ms-`, `text-start`, `text-end`); directional icon `rtl:rotate-180`.

**Test cases:**
1. Render with no references → empty state with "Add Reference" button (if capability present).
2. Render with 4 references → first 3 shown + "View all (4)" link; click link opens dialog with all 4.

---

### 6. Add / Edit Reference Dialog

**One-line summary:** Dialog form with reference type, number, issuing entity select, and notes.

**Files:**
- `components/domain/tasks/task-external-reference-dialog.tsx`
- `components/domain/tasks/reference-type-select.tsx`
- `components/domain/tasks/external-entity-select.tsx`
- `components/domain/tasks/inline-external-entity-creator.tsx`

**Key decisions:**
- Form state is local `useState`; no Zustand.
- Entity select shows active entities only; includes an "Add new entity" option.
- 422 errors displayed inline in the dialog; dialog stays open.
- On success, close dialog and reset form.

**Snippet — `TaskExternalReferenceDialog`:**

```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiRequestError } from '@/lib/api/client';
import {
  useCreateTaskExternalReference,
  useUpdateTaskExternalReference,
} from '@/lib/api/hooks/use-external-references';
import { ReferenceTypeSelect } from './reference-type-select';
import { ExternalEntitySelect } from './external-entity-select';
import { InlineExternalEntityCreator } from './inline-external-entity-creator';
import { EXTERNAL_REFERENCE_TYPE_MAP } from './task-external-reference-utils';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

interface TaskExternalReferenceDialogProps {
  taskPublicId: string;
  reference: TaskExternalReferenceResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskExternalReferenceDialog({ taskPublicId, reference, open, onOpenChange }: TaskExternalReferenceDialogProps) {
  const t = useTranslations('tasks.references');
  const create = useCreateTaskExternalReference(taskPublicId);
  const update = useUpdateTaskExternalReference(taskPublicId);
  const isEdit = !!reference;

  const [referenceType, setReferenceType] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inlineCreatorOpen, setInlineCreatorOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (reference) {
        setReferenceType(reference.reference_type ?? '');
        setReferenceNumber(reference.reference_number);
        setEntityId(reference.external_entity?.public_id ?? null);
        setNotes(reference.notes ?? '');
      } else {
        setReferenceType('');
        setReferenceNumber('');
        setEntityId(null);
        setNotes('');
      }
      setErrors({});
    }
  }, [open, reference]);

  const mutationError = create.error || update.error;
  const inlineError = mutationError instanceof ApiRequestError && mutationError.status === 422
    ? mutationError.error.message
    : null;

  function validate() {
    const next: Record<string, string> = {};
    if (referenceType === '') next.referenceType = t('reference_type_required');
    if (!referenceNumber.trim()) next.referenceNumber = t('reference_number_required');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const body = {
      reference_type: EXTERNAL_REFERENCE_TYPE_MAP[referenceType],
      reference_number: referenceNumber.trim(),
      external_entity_id: entityId,
      notes: notes.trim() || null,
    };
    if (reference) {
      update.mutate({ referencePublicId: reference.public_id, body }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="text-start">
          <DialogHeader><DialogTitle>{isEdit ? t('edit_reference') : t('add_reference')}</DialogTitle></DialogHeader>
          <div className="space-y-4" dir="auto">
            <Field>
              <FieldLabel>{t('reference_type')} <span className="text-destructive">*</span></FieldLabel>
              <ReferenceTypeSelect value={referenceType} onValueChange={setReferenceType} />
              {errors.referenceType && <FieldError>{errors.referenceType}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>{t('reference_number')} <span className="text-destructive">*</span></FieldLabel>
              <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} maxLength={100} />
              {errors.referenceNumber && <FieldError>{errors.referenceNumber}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>{t('issuing_entity')}</FieldLabel>
              <ExternalEntitySelect
                value={entityId}
                onValueChange={(value) => {
                  if (value === '__create__') setInlineCreatorOpen(true);
                  else setEntityId(value);
                }}
                onCreateNew={() => setInlineCreatorOpen(true)}
              />
            </Field>
            <Field>
              <FieldLabel>{t('notes')}</FieldLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} />
            </Field>
            {inlineError && <p className="text-sm text-destructive">{inlineError}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? t('saving') : (isEdit ? t('save') : t('add'))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <InlineExternalEntityCreator
        open={inlineCreatorOpen}
        onOpenChange={setInlineCreatorOpen}
        onCreated={(newEntity) => setEntityId(newEntity.public_id)}
      />
    </>
  );
}
```

**Snippet — `ReferenceTypeSelect`:**

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { EXTERNAL_REFERENCE_TYPE_VALUES } from './task-external-reference-utils';

interface ReferenceTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ReferenceTypeSelect({ value, onValueChange }: ReferenceTypeSelectProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.references');
  return (
    <Select dir={locale === 'ar' ? 'rtl' : 'ltr'} value={value} onValueChange={(v) => onValueChange(v)}>
      <SelectTrigger aria-label={t('reference_type')}>
        <SelectValue placeholder={t('select_reference_type')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {EXTERNAL_REFERENCE_TYPE_VALUES.map((type) => (
            <SelectItem key={type} value={type}>{t(`reference_type_${type}`)}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

**Snippet — `ExternalEntityTypeSelect`:**

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EXTERNAL_ENTITY_TYPE_VALUES } from './task-external-reference-utils';

interface ExternalEntityTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ExternalEntityTypeSelect({ value, onValueChange }: ExternalEntityTypeSelectProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.entities');
  return (
    <Select dir={locale === 'ar' ? 'rtl' : 'ltr'} value={value} onValueChange={(v) => onValueChange(v)}>
      <SelectTrigger aria-label={t('entity_type')}>
        <SelectValue placeholder={t('select_entity_type')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {EXTERNAL_ENTITY_TYPE_VALUES.map((type) => (
            <SelectItem key={type} value={type}>{t(`entity_type_${type}`)}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

**Snippet — `ExternalEntitySelect`:**

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useActiveExternalEntities } from '@/lib/api/hooks/use-external-references';
import { localizeName } from './task-detail-utils';

interface ExternalEntitySelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  onCreateNew: () => void;
}

export function ExternalEntitySelect({ value, onValueChange, onCreateNew }: ExternalEntitySelectProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.references');
  const { data: entities, isLoading } = useActiveExternalEntities();

  return (
    <Select dir={locale === 'ar' ? 'rtl' : 'ltr'} value={value ?? ''} onValueChange={(v) => onValueChange(v || null)}>
      <SelectTrigger aria-label={t('issuing_entity')}>
        <SelectValue placeholder={isLoading ? t('loading_entities') : t('select_entity')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectItem value="__create__" className="text-primary">
            <span className="flex items-center gap-1"><Plus className="size-3" /> {t('create_new_entity')}</span>
          </SelectItem>
          {entities?.map((entity) => (
            <SelectItem key={entity.public_id} value={entity.public_id}>
              {localizeName(locale, entity.name_ar, entity.name_en)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

**Rules applied:**
- `coding-standards.md` § Form handling via shadcn `Field` + `Input`/`Textarea`; no hand-written API types.
- `coding-standards.md` § Logical properties; `dir` on Select/Dialog per locale.
- `security-policy.md` § 422 inline error; no stack traces or internal IDs.

**Test cases:**
1. Open add dialog → select type, enter number, submit → MSW returns created reference → dialog closes → list refreshes.
2. Submit with inactive entity → MSW returns 422 → inline error shown, dialog stays open.

---

### 7. Inline External Entity Creator

**One-line summary:** Compact dialog to create an entity from inside the reference form, then auto-select it.

**Files:** `components/domain/tasks/inline-external-entity-creator.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { ExternalEntityTypeSelect } from './external-entity-type-select';
import { useCreateExternalEntity } from '@/lib/api/hooks/use-external-references';
import { ApiRequestError } from '@/lib/api/client';
import { EXTERNAL_ENTITY_TYPE_MAP } from './task-external-reference-utils';
import type { ExternalEntityResource } from './task-external-reference-types';

interface InlineExternalEntityCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (entity: ExternalEntityResource) => void;
}

export function InlineExternalEntityCreator({ open, onOpenChange, onCreated }: InlineExternalEntityCreatorProps) {
  const t = useTranslations('tasks.entities');
  const create = useCreateExternalEntity();
  const [form, setForm] = useState({ name_ar: '', name_en: '', entity_type: 'governmentministry' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const next: Record<string, string> = {};
    if (!form.name_ar.trim()) next.name_ar = t('name_ar_required');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    create.mutate(
      {
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim() || undefined,
        entity_type: EXTERNAL_ENTITY_TYPE_MAP[form.entity_type],
      },
      {
        onSuccess: (data) => {
          onCreated(data);
          onOpenChange(false);
          setForm({ name_ar: '', name_en: '', entity_type: 'governmentministry' });
        },
      },
    );
  }

  const inlineError = create.error instanceof ApiRequestError && create.error.status === 422
    ? create.error.error.message
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-start">
        <DialogHeader><DialogTitle>{t('create_entity')}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <BilingualNameFields form={form} setForm={setForm} errors={errors} t={t} />
          <Field>
            <FieldLabel>{t('entity_type')} <span className="text-destructive">*</span></FieldLabel>
            <ExternalEntityTypeSelect value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })} />
          </Field>
          {inlineError && <p className="text-sm text-destructive">{inlineError}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={create.isPending}>{create.isPending ? t('saving') : t('create')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Rules applied:**
- `coding-standards.md` § Reuse `BilingualNameFields` for entity names.
- `coding-standards.md` § Mutation invalidates `externalEntities` query so select options refresh.

**Test cases:**
1. Open reference form → click "Add new entity" → fill name + type → submit → new entity auto-selected in reference form.

---

### 8. External Entity Catalog Page

**One-line summary:** List page for tenant external entities with CRUD + activate/deactivate.

**Files:**
- `app/(dashboard)/tasks/external-entities/page.tsx`
- `components/domain/tasks/external-entity-manager.tsx`
- `components/domain/tasks/external-entity-type-select.tsx`

**Key decisions:**
- Mirrors `blueprints/catalog` page pattern: `PageHeader` + create button + manager component.
- Route is `/tasks/external-entities`.
- Uses `CatalogSkeleton`, `RtlTable`, `ActionsDropdown`, `FormDialog`, `BilingualNameFields`, `ActiveBadge`.
- Deactivate/reactivate direct from dropdown; no confirmation.

**Snippet — `app/(dashboard)/tasks/external-entities/page.tsx`:**

```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { ExternalEntityManager } from '@/components/domain/tasks/external-entity-manager';

export default async function ExternalEntitiesPage() {
  const t = await getTranslations('tasks.entities');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('page_title')} description={t('page_description')} />
      <ExternalEntityManager />
    </main>
  );
}
```

**Snippet — `ExternalEntityManager` (excerpt):**

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { RtlTable } from '@/components/shared/rtl-table';
import {
  ActionsDropdown, FormDialog, CatalogSkeleton, editAction, deactivateAction, reactivateAction,
} from '@/components/shared/catalog-table';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import {
  useExternalEntities, useCreateExternalEntity, useUpdateExternalEntity,
  useDeactivateExternalEntity, useReactivateExternalEntity,
} from '@/lib/api/hooks/use-external-references';
import { ExternalEntityTypeSelect } from './external-entity-type-select';
import { EXTERNAL_ENTITY_TYPE_MAP, useEntityTypeLabel } from './task-external-reference-utils';
import type { ExternalEntityResource } from './task-external-reference-types';

function EntityTypeCell({ value }: { value?: string }) {
  const label = useEntityTypeLabel(value);
  return <span className="text-sm">{label}</span>;
}

export function ExternalEntityManager() {
  const t = useTranslations('tasks.entities');
  const { data, isLoading, isError, error, refetch } = useExternalEntities();
  const canManage = useCapability('task.manage_external_entities');
  const create = useCreateExternalEntity();
  const update = useUpdateExternalEntity();
  const deactivate = useDeactivateExternalEntity();
  const reactivate = useReactivateExternalEntity();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExternalEntityResource | null>(null);
  const [form, setForm] = useState({ name_ar: '', name_en: '', entity_type: 'governmentministry' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openCreateDialog() {
    setEditItem(null);
    setForm({ name_ar: '', name_en: '', entity_type: 'governmentministry' });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(entity: ExternalEntityResource) {
    setEditItem(entity);
    setForm({ name_ar: entity.name_ar, name_en: entity.name_en ?? '', entity_type: entity.entity_type });
    setErrors({});
    setDialogOpen(true);
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!form.name_ar.trim()) next.name_ar = t('name_ar_required');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const body = {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim() || undefined,
      entity_type: EXTERNAL_ENTITY_TYPE_MAP[form.entity_type],
    };
    if (editItem) {
      update.mutate({ entityPublicId: editItem.public_id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setDialogOpen(false) });
    }
  }

  if (isLoading) return <CatalogSkeleton />;
  if (isError) return <ErrorState message={t('error')} onRetry={() => refetch()} />;

  const entities = data ?? [];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => openCreateDialog()}>{t('create_entity')}</Button>
        </div>
      )}
      {entities.length === 0 ? (
        <EmptyState title={t('empty_title')} description={t('empty_description')} />
      ) : (
        <RtlTable>
          <TableHeader>
            <TableRow>
              <TableHead className="w-50 text-start">{t('name_ar')}</TableHead>
              <TableHead className="w-50 text-start">{t('name_en')}</TableHead>
              <TableHead className="w-32 text-start">{t('entity_type')}</TableHead>
              <TableHead className="w-20 text-start">{t('status')}</TableHead>
              <TableHead className="w-12 text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => (
              <TableRow key={entity.public_id}>
                <TableCell className="text-start text-sm">{entity.name_ar}</TableCell>
                <TableCell className="text-start text-sm">{entity.name_en}</TableCell>
                <TableCell className="text-start text-sm"><EntityTypeCell value={entity.entity_type} /></TableCell>
                <TableCell className="text-start text-sm">
                  <ActiveBadge isActive={entity.is_active} activeLabel={t('active')} inactiveLabel={t('inactive')} />
                </TableCell>
                <TableCell className="text-end">
                  {canManage && (
                    <ActionsDropdown actions={[
                      editAction(t('edit'), () => openEdit(entity)),
                      ...(entity.is_active
                        ? [deactivateAction(t('deactivate'), () => deactivate.mutate(entity.public_id))]
                        : [reactivateAction(t('reactivate'), () => reactivate.mutate(entity.public_id))]),
                    ]} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </RtlTable>
      )}
      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editItem ? t('edit_entity') : t('create_entity')}
        onConfirm={submit}
        isPending={create.isPending || update.isPending}
        confirmLabel={editItem ? t('save') : t('create')}
      >
        <div className="space-y-3">
          <BilingualNameFields form={form} setForm={setForm} errors={errors} t={t} />
          <Field>
            <FieldLabel>{t('entity_type')} <span className="text-destructive">*</span></FieldLabel>
            <ExternalEntityTypeSelect value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })} />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
```

**Rules applied:**
- `coding-standards.md` § Capability check `task.manage_external_entities`.
- `coding-standards.md` § Reuse `CatalogSkeleton`, `RtlTable`, `ActionsDropdown`, `FormDialog`.
- `design-system/04-layout-patterns.md` § List page template.

**Test cases:**
1. Catalog loads → table shows active + inactive entities with correct `ActiveBadge`.
2. Click Deactivate → row updates to inactive badge without page reload.

---

### 9. Board Filter for External Reference

**One-line summary:** Add a debounced reference-number input to the task board filter bar.

**Files:**
- `components/domain/tasks/external-reference-filter-input.tsx`
- `components/domain/tasks/board-filters.tsx`
- `components/domain/tasks/task-board-types.ts`
- `components/domain/tasks/task-board-utils.ts`

**Snippet — `task-board-types.ts` additions:**

```ts
export interface TaskBoardUrlFilters {
  // ... existing fields ...
  externalReference?: string;
}
```

**Snippet — `task-board-utils.ts` additions:**

```ts
export function readBoardFilters(params: URLSearchParams): TaskBoardUrlFilters {
  return {
    // ... existing fields ...
    externalReference: params.get('externalReference') ?? undefined,
  };
}

export function toBoardQuery(filters: TaskBoardUrlFilters, currentUserPublicId?: string): BoardQuery {
  return {
    // ... existing fields ...
    external_reference: filters.externalReference ?? null,
  };
}
```

**Snippet — `ExternalReferenceFilterInput`:**

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileSearch } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

interface ExternalReferenceFilterInputProps {
  value?: string;
}

export function ExternalReferenceFilterInput({ value }: ExternalReferenceFilterInputProps) {
  const t = useTranslations('tasks.board.filters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(value ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const current = searchParams.get('externalReference') ?? '';
      if (input !== current) {
        const params = new URLSearchParams(searchParams.toString());
        if (input.trim()) params.set('externalReference', input.trim());
        else params.delete('externalReference');
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [input, pathname, router, searchParams]);

  return (
    <Field>
      <FieldLabel className="sr-only">{t('external_reference')}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          value={input}
          placeholder={t('external_reference_placeholder')}
          onChange={(e) => setInput(e.target.value)}
        />
        <InputGroupAddon><FileSearch aria-hidden="true" className="size-4" /></InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
```

**Integration in `BoardFilters`:**

```tsx
<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
  <Field>
    <FieldLabel className="sr-only">{t('search')}</FieldLabel>
    <InputGroup> ... search input ... </InputGroup>
  </Field>
  <ExternalReferenceFilterInput value={filters.externalReference} />
  {/* sort select + direction toggle */}
</div>
```

**Rules applied:**
- `architecture.md` § Filter state in URL search params.
- `coding-standards.md` § Debounce 300ms; `Field` + `InputGroup`.

**Test cases:**
1. Type "وارد-2026-00412" → after 300ms URL has `externalReference=...` and board refetches with `external_reference` param.
2. Click Reset → `externalReference` cleared from URL.

---

### 10. Global Search by External Reference

**One-line summary:** Extend search hook and result UI to support `external_reference` filter and surface matched reference metadata.

**Files:**
- `lib/api/hooks/use-search.ts`
- `components/domain/search/global-search.tsx` (or equivalent result component)

**Snippet — `use-search.ts`:**

```ts
interface SearchResult {
  public_id: string;
  title_ar?: string;
  title_en?: string;
  status?: string;
  snippet_ar?: string;
  snippet_en?: string;
  external_references?: Array<{
    public_id: string;
    reference_type: string;
    reference_number: string;
    external_entity?: { public_id: string; name_ar: string; name_en: string };
  }>;
}

export function useSearch(query: string, externalReference?: string) {
  return useQuery({
    queryKey: extraQueryKeys.search.list({ q: query, external_reference: externalReference }),
    queryFn: () =>
      apiClient.get<{ data: SearchResult[] }>('/v1/search/tasks', {
        params: { q: query, external_reference: externalReference, per_page: 10 },
      }),
    enabled: query.length >= 2 || !!externalReference,
  });
}
```

**Rules applied:**
- `coding-standards.md` § Generated types preferred; result type is a display adapter only.
- Search only uses `external_reference` exact match per backend spec; `q` does not match reference numbers.

**Test cases:**
1. Enter reference number in global search → MSW returns tasks with `external_references` metadata → result row shows matching reference number.

---

## Data Flow

1. **Task detail sidebar**
   - `TaskDetail` renders `<TaskExternalReferencesCard publicId={publicId} />`.
   - Card calls `useTaskExternalReferences(publicId)` → `GET /v1/tasks/{task}/external-references`.
   - `apiClient` sends credentials, `X-Tenant`, `X-Locale`; backend returns `{ data, next_cursor, has_more }`.
   - Card renders first 3 items; "View all" opens Dialog with `TaskExternalReferencesList` + cursor pagination.
2. **Add/edit reference**
   - `TaskExternalReferenceDialog` uses `useCreateTaskExternalReference` / `useUpdateTaskExternalReference`.
   - `ExternalEntitySelect` uses `useActiveExternalEntities` (derived from `useExternalEntities`).
   - Inline creator uses `useCreateExternalEntity` and invalidates `queryKeys.tasks.externalEntities()`.
3. **Entity catalog**
   - `ExternalEntitiesPage` renders `ExternalEntityManager`.
   - Manager uses `useExternalEntities()` → `GET /v1/tasks/external-entities`.
   - Mutations invalidate `queryKeys.tasks.externalEntities()`.
4. **Board filter**
   - `ExternalReferenceFilterInput` writes `externalReference` to URL.
   - `TaskBoard` reads URL, `toBoardQuery` maps to `external_reference`.
   - `useTaskBoardInfinite` already passes it to `GET /v1/follow-up/board`.
5. **Global search**
   - Search command palette passes the query to `useSearch(query)`.
   - If user enters what looks like a reference number, the existing UI can call `useSearch('', referenceNumber)`; result items render `external_references` metadata when present.

---

## Route Structure

```text
app/
  (dashboard)/
    tasks/
      page.tsx                              # existing board
      external-entities/
        page.tsx                            # NEW entity catalog
      [publicId]/
        page.tsx                            # existing detail; insert card
```

Locale remains cookie-based (`NEXT_LOCALE`); no `[locale]` route segment.

---

## Execution Order

1. Extend `lib/api/query-keys.ts` with `tasks.externalReferences` and `tasks.externalEntities`.
2. Add `components/domain/tasks/task-external-reference-types.ts`.
3. Add `components/domain/tasks/task-external-reference-utils.ts` (enum label maps).
4. Add `lib/api/hooks/use-external-references.ts`.
5. Build reference type + entity type selects.
6. Build `ExternalEntitySelect` and `InlineExternalEntityCreator`.
7. Build `TaskExternalReferenceDialog` + `TaskExternalReferenceDeleteDialog`.
8. Build `TaskExternalReferenceItem`, `TaskExternalReferencesList`, `TaskExternalReferencesSkeleton`.
9. Build `TaskExternalReferencesCard` and insert into `task-detail.tsx` sidebar.
10. Build `ExternalEntityTypeSelect` and `ExternalEntityManager`.
11. Add `app/(dashboard)/tasks/external-entities/page.tsx`.
12. Extend `task-board-types.ts`, `task-board-utils.ts`, and `BoardFilters` with external-reference input.
13. Extend `use-search.ts` and global search result UI for `external_reference` metadata.
14. Add translations to `messages/ar.json` and `messages/en.json`.
15. Add MSW handlers for all new endpoints.
16. Write component tests.
17. Run `npm run lint`, `npm run typecheck`, `npm run test`.

---

## What to Test Manually

1. **Arabic happy path (RTL)** — Open a task detail, verify External References card title, rows, and action buttons align right; add a reference; verify dialog text and select direction are RTL.
2. **English happy path (LTR)** — Switch locale; verify layout flips; "View all" arrow points right in LTR and rotates in RTL.
3. **Loading state** — Throttle network; verify skeleton rows match reference shape inside the card.
4. **Empty state** — Task with no references shows empty state with icon + "Add Reference" CTA for authorized users; no CTA for viewers.
5. **Error state** — Simulate 500 on reference list; inline `ErrorState` with retry appears; rest of page usable.
6. **Permission gating** — User without `task.manage` sees no Add/Edit/Delete buttons; with capability sees all actions.
7. **Add reference** — Fill form, select entity, save; toast appears; new reference appears in card and timeline invalidates.
8. **Edit reference** — Click Edit, change number, save; list updates.
9. **Delete reference** — Click Delete, confirm in AlertDialog; reference removed; toast appears.
10. **Inline entity creation** — In add dialog, choose "Add new entity", fill bilingual name + type, save; new entity auto-selected.
11. **Entity catalog CRUD** — Navigate to `/tasks/external-entities`; create, edit, deactivate, reactivate entities; verify `ActiveBadge` updates.
12. **Inactive entity rejection** — Try to use inactive entity in reference form (MSW/edge) → inline 422 error shown.
13. **Board filter** — On `/tasks`, type a reference number, wait 300ms, verify URL param and board results; click Reset clears it.
14. **Global search** — Enter a reference number in search palette; verify matching tasks shown with reference metadata.
15. **Responsive** — Desktop sidebar card; tablet/mobile stacks full-width; action buttons remain reachable; dialog usable on small screens.
16. **Keyboard navigation** — Tab through Add, Edit, Delete, Load more; Enter activates; Escape closes dialogs.