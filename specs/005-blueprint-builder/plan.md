# Plan: Blueprint Builder

> **Spec:** `specs/005-blueprint-builder/spec.md`
> **Date:** 2026-06-20
> **Status:** `completed`

---

## Open Questions Resolved

All open questions from the spec are approved by the user. Decisions:

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Granular mutations vs "save in one API call" | **Granular immediate mutations.** Stage/sub-stage/transition CRUD = immediate API call + invalidate `detail(publicId)`; blueprint metadata = separate `PUT`; Zustand holds only selection/UI state. | The stable backend 004 contract is granular (per-entity CRUD, lock enforced per mutation) with no batch endpoint. Respects "Backend leads" (critical rule #1); avoids duplicating API data in Zustand. `architecture.md`'s "save in one API call" anticipated a batch endpoint that wasn't built. |
| 2 | Stage reorder interaction | **MVP ships up/down controls** (immediate reorder via `POST .../stages/reorder`). | Endpoint exists; drafts need reordering. Drag-and-drop is V2 #57. |
| 3 | Stage delete | **Include delete for draft (unlocked) blueprints** with `AlertDialog` confirm; locked blueprints hide it. | `DELETE .../stages/{stage}` exists and is safe for drafts; locked blueprints reject via 422 automatically. Feature #58 is V2 but the endpoint is MVP. |
| 4 | Exit requirements not in contract | **Omit the exit-requirements checkbox section.** Expose only `completion_rule`, `assignment_cardinality`, and required sub-stages (`is_required`). | "Attach document" depends on backend 012 (deferred); "Record decision" depends on V2 Stage Forms. Not in stable 004 contract. |
| 5 | SLA warning threshold location | **Stage panel shows the selected SLA policy's warning threshold as read-only text with a "manage" link to the catalog.** Threshold is edited in the SLA Policies catalog tab. | `warning_threshold_percentage` is a field of `SlaPolicy`, not the stage. The stage only references `sla_policy_id`. |
| 6 | Positions endpoint for assignment/escalation Selects | **Add a minimal `usePositions()` hook** in `use-blueprints.ts` querying `GET /v1/organization/positions` (cursor-paginated `PositionResource`). Add `positions` to the `organization` query-key namespace. | No positions hook exists yet. Backend 002 exposes the endpoint. Primary consumer is the builder; if a future org-spec needs it, it can be moved to `use-organization.ts`. |
| 7 | Catalog as a separate route vs inline dialogs | **Dedicated `/blueprints/catalog` route** with URL tab param + "Manage" links from builder/library Selects. | Cleaner for admin reference data; matches List/Form page templates; shareable via URL. |

---

## Technical Approach

**One-line summary:** Build three routes (`/blueprints` library, `/blueprints/[publicId]` builder, `/blueprints/catalog` catalog) using TanStack Query hooks against the stable backend 004 contract, a Zustand store for builder UI/selection state only, granular per-entity mutations with `detail(publicId)` invalidation, and the established split-view/table/dialog patterns from specs 003/004 — all using generated OpenAPI types.

**Key decisions:**
- **Granular mutations, not batch.** Each stage/sub-stage/transition CRUD is an immediate API call; invalidate `queryKeys.blueprints.detail(publicId)` after each. Blueprint metadata is a separate `PUT`. The canvas is always server truth.
- **Single source of truth for the builder.** `useBlueprint(publicId)` returns `BlueprintResource` with embedded `stages` (each with `sub_stages`) and `transitions`. No separate stages/transitions list queries needed — derive everything from the detail response.
- **Zustand for UI/selection state only.** `useBlueprintBuilderStore` holds `selectedStageId`, `panelOpen`, `metadataDirty`, `blueprintName`. Never API data. `blueprintName` is synced from the detail query for breadcrumb display in `SiteHeader`.
- **URL state for filters + catalog tab.** Library filters (`search`, `category_id`, `scope`, `is_active`) and catalog `tab` are URL search params (shareable).
- **Reuse existing catalog hooks.** `useBlueprintCategories` and `useBlueprintStageTypes` are defined in `use-blueprints.ts`; `use-task-board.ts` re-exports `useBlueprintStageTypes as useStageTypes` for backward compatibility.
- **No new shadcn components.** All needed components already exist in `components/ui/`.
- **Up/down controls for reorder** (not drag-and-drop) — calls the existing reorder endpoint.
- **Locked = read-only UI.** When `is_locked = true`, disable all editing; show lock banner; offer duplicate. Deactivate stays available (backend allows it on locked).
- **Prefetch builder on library row hover** — `queryClient.prefetchQuery` with `queryKeys.blueprints.detail(publicId)`.
- **Canvas sub-stage expand/collapse.** Stage cards show up to 2 sub-stage names inline; clicking the expand chevron reveals up to 5 sub-stages under the stage card in the canvas. Sub-stage editing is done inline in the properties panel via `subStageEditId` state (not a dialog), with a back button to return to the stage view.
- **Stage form state lifted to panel.** `StagePropertiesPanel` owns the form state (via `useState` + `useEffect` reset on stage change) and passes it down to `StageForm` as controlled props. This allows the panel to switch between stage editing, sub-stage editing, and idle modes.
- **Builder top bar is action-only.** The breadcrumb is rendered in `SiteHeader` (reads `blueprintName` from store). The builder top bar only shows the action buttons (Settings, Activate/Deactivate, Duplicate), right-aligned.

---

## Component Tree

```
app/(dashboard)/blueprints/
├── page.tsx                          # Server — BlueprintLibraryPage (REPLACES placeholder)
├── catalog/
│   └── page.tsx                      # Server — CatalogPage (delegates entirely to BlueprintCatalog)
├── [publicId]/
│   └── page.tsx                      # Server — BlueprintBuilderPage

components/domain/blueprints/
├── blueprint-library.tsx             # Client — orchestrates useBlueprintsInfinite, filters, table, states
├── blueprint-filters.tsx             # Client — URL-driven filter bar (uses RtlSelect for RTL compliance)
├── blueprint-library-skeleton.tsx    # Client — skeleton rows
├── blueprint-row-actions.tsx         # Client — Open/Duplicate/Activate/Deactivate/Delete dropdown (Trash2, uses ConfirmDeleteDialog)
├── create-blueprint-dialog.tsx       # Client — create form dialog (uses BilingualNameFields, BilingualDescriptionFields, RtlSelect)
├── blueprint-table.tsx               # Client — desktop table (Name, Scope, Status, Lock, Stages, Actions); uses localizeName from lib/utils/localize
├── blueprint-card-list.tsx           # Client — mobile card list
├── blueprint-badges.tsx              # Client — LockBadge, ScopeBadge (dark mode support)
├── blueprint-types.ts                # colocated type re-exports from generated
├── blueprint-utils.ts                # pure utils: getStagesCount, formatSlaSummary, deriveTargets, enum maps, buildAssignmentFields
├── blueprint-builder.tsx             # Client — orchestrates useBlueprint, top bar + split view, states, lock, mobile panel via matchMedia
├── blueprint-builder-skeleton.tsx    # Client — skeleton split view
├── builder-top-bar.tsx               # Client — action buttons only (Settings + Activate/Deactivate + Duplicate); uses getStagesCount
├── stage-canvas.tsx                  # Client — blueprint header + vertical stage list + flow connectors + sub-stage expand/collapse + CanvasSubStageCard (uses ConfirmDeleteDialog)
├── stage-card.tsx                    # Client — single stage card (select, reorder, expand sub-stages, delete with AlertDialog)
├── stage-properties-panel.tsx        # Client — owns form state, toggles between stage form / sub-stage form / idle / add; uses localizeName/lib/utils/localize
├── stage-form.tsx                    # Client — controlled form fields (name, description, type/SLA, assignment, escalation, cardinality, completion); uses RtlSelect, BilingualNameFields, BilingualDescriptionFields
├── transition-editor.tsx             # Client — advance/return target checkboxes; uses integer codes (1=advance, 2=return)
├── sub-stage-list.tsx                # Client — ordered sub-stages with add/edit/delete/reorder, uses ConfirmDeleteDialog (not dialog wrapper)
├── sub-stage-form.tsx                # Client — sub-stage fields (inline in panel, not a dialog); full 11 fields: name, description, SLA, assignment, position/dept, completion, cardinality, is_required
├── blueprint-settings-dialog.tsx     # Client — edit blueprint metadata (name, description, category, scope, department); uses BilingualNameFields, BilingualDescriptionFields, RtlSelect
├── blueprint-catalog.tsx             # Client — Tabs (Categories / Stage Types / SLA Policies) with URL tab param
├── category-manager.tsx              # Client — categories tab list + create/edit/delete dialog; uses RtlTable, CatalogSkeleton, BilingualNameFields, ConfirmDeleteDialog, ActionsDropdown
├── stage-type-manager.tsx            # Client — stage types tab list + create/edit/delete dialog; system default: name fields disabled, delete disabled
├── sla-policy-manager.tsx            # Client — SLA policies tab list + create/edit/delete dialog; uses slaUnitMap, RtlSelect, RtlTable, BilingualNameFields

components/shared/
├── bilingual-name-fields.tsx         # NEW — reusable AR/EN name inputs
├── bilingual-description-fields.tsx  # NEW — reusable AR/EN description textareas
├── rtl-select.tsx                    # NEW — Select with automatic dir per locale
├── rtl-table.tsx                     # NEW — Table with automatic dir per locale
├── confirm-delete-dialog.tsx         # NEW — reusable AlertDialog for delete confirmations
├── catalog-table.tsx                 # NEW — CatalogSkeleton, ActionsDropdown (with factory helpers), FormDialog (includes CatalogSkeleton, RtlTable, editAction/deleteAction helpers)
├── active-badge.tsx                  # NEW — dark-mode-aware ActiveBadge (text-emerald-600/dark:text-emerald-400)

components/domain/shell/
├── app-sidebar.tsx                   # MODIFIED — add Catalog nav item under Blueprints (gated by blueprint.manage)
├── site-header.tsx                   # MODIFIED — extend breadcrumb for /blueprints routes, reads blueprintName from store

lib/api/hooks/
├── use-blueprints.ts                 # NEW — all blueprint query + mutation hooks + usePositions
├── use-task-board.ts                 # MODIFIED — re-export useBlueprintCategories, useBlueprintStageTypes as useStageTypes

lib/api/query-keys.ts                 # MODIFIED — add blueprints.slaPolicies, blueprints.stages, blueprints.subStages, organization.positions

lib/stores/
└── use-blueprint-builder-store.ts     # NEW — Zustand: selectedStageId, panelOpen, metadataDirty, blueprintName

messages/en.json                      # MODIFIED — add `blueprints` namespace

__tests__/mocks/handlers.ts           # MODIFIED — add blueprint MSW handlers
```

**Server vs Client:**
- **Server:** `app/(dashboard)/blueprints/page.tsx`, `app/(dashboard)/blueprints/catalog/page.tsx`, `app/(dashboard)/blueprints/[publicId]/page.tsx` — use `getTranslations` for server-side i18n, render `PageHeader` + the client orchestrator. Catalog page delegates entirely to `BlueprintCatalog` (which renders its own `PageHeader` internally).
- **Client:** All `components/domain/blueprints/*` — use TanStack Query hooks, `useTranslations`, interactivity.

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| **Routes** | |
| `app/(dashboard)/blueprints/[publicId]/page.tsx` | Server — builder page: renders `BlueprintBuilder` |
| `app/(dashboard)/blueprints/catalog/page.tsx` | Server — catalog page: renders `BlueprintCatalog` |
| **Domain components** | |
| `components/domain/blueprints/blueprint-types.ts` | Colocated type re-exports from generated |
| `components/domain/blueprints/blueprint-utils.ts` | Pure utils |
| `components/domain/blueprints/blueprint-badges.tsx` | LockBadge, ScopeBadge |
| `components/domain/blueprints/blueprint-library.tsx` | Library orchestrator |
| `components/domain/blueprints/blueprint-filters.tsx` | URL-driven filter bar |
| `components/domain/blueprints/blueprint-library-skeleton.tsx` | Skeleton rows |
| `components/domain/blueprints/blueprint-table.tsx` | Desktop table |
| `components/domain/blueprints/blueprint-card-list.tsx` | Mobile card list |
| `components/domain/blueprints/blueprint-row-actions.tsx` | Row actions dropdown |
| `components/domain/blueprints/create-blueprint-dialog.tsx` | Create blueprint form dialog |
| `components/domain/blueprints/blueprint-builder.tsx` | Builder orchestrator |
| `components/domain/blueprints/blueprint-builder-skeleton.tsx` | Skeleton split view |
| `components/domain/blueprints/builder-top-bar.tsx` | Top bar: action buttons only |
| `components/domain/blueprints/stage-canvas.tsx` | Canvas with inline sub-stage cards |
| `components/domain/blueprints/stage-card.tsx` | Single stage card with sub-stage preview/expand |
| `components/domain/blueprints/stage-properties-panel.tsx` | Right pane — owns form state, toggles modes |
| `components/domain/blueprints/stage-form.tsx` | Controlled stage form fields |
| `components/domain/blueprints/transition-editor.tsx` | Advance/return target checkboxes |
| `components/domain/blueprints/sub-stage-list.tsx` | Sub-stage list with inline edit/add/delete/reorder |
| `components/domain/blueprints/sub-stage-form.tsx` | Sub-stage fields (inline in panel) |
| `components/domain/blueprints/blueprint-settings-dialog.tsx` | Edit blueprint metadata (uses BilingualNameFields, BilingualDescriptionFields) |
| `components/domain/blueprints/blueprint-catalog.tsx` | Catalog orchestrator with Tabs |
| `components/domain/blueprints/category-manager.tsx` | Categories tab (uses RtlTable, ConfirmDeleteDialog, ActionsDropdown from shared) |
| `components/domain/blueprints/stage-type-manager.tsx` | Stage types tab |
| `components/domain/blueprints/sla-policy-manager.tsx` | SLA policies tab |
| **Hooks** | |
| `lib/api/hooks/use-blueprints.ts` | All blueprint query + mutation hooks + `usePositions` |
| **Store** | |
| `lib/stores/use-blueprint-builder-store.ts` | Zustand: selectedStageId, panelOpen, metadataDirty, blueprintName |
| **Shared components** | |
| `components/shared/bilingual-name-fields.tsx` | Reusable AR (required) / EN (optional) name inputs with `dir` per locale |
| `components/shared/bilingual-description-fields.tsx` | Reusable AR/EN description textareas with `dir` per locale |
| `components/shared/rtl-select.tsx` | Wraps shadcn Select with automatic `dir` per locale |
| `components/shared/rtl-table.tsx` | Wraps shadcn Table with automatic `dir` per locale |
| `components/shared/confirm-delete-dialog.tsx` | Reusable AlertDialog wrapper with configurable title/description/labels |
| `components/shared/catalog-table.tsx` | CatalogSkeleton, ActionsDropdown (with factory helpers), FormDialog |
| `components/shared/active-badge.tsx` | Dark-mode-aware ActiveBadge |
| `lib/utils/localize.ts` | `localizeName` / `localizeTitle` utility functions (moved from blueprint-utils.ts) |

### Modified Files

| File | Change |
|------|--------|
| `app/(dashboard)/blueprints/page.tsx` | **REPLACED** — placeholder → real library page |
| `lib/api/query-keys.ts` | Add `blueprints.slaPolicies`, `blueprints.stages`, `blueprints.subStages`, `organization.positions` |
| `lib/api/hooks/use-task-board.ts` | Remove `useBlueprintCategories`/`useStageTypes` definitions; re-export from `use-blueprints.ts` |
| `components/domain/shell/app-sidebar.tsx` | Add "Blueprint Catalog" nav item after Blueprints (capability-gated by `blueprint.manage`) |
| `components/domain/shell/site-header.tsx` | Extend `usePageBreadcrumb()` for `/blueprints`, `/blueprints/catalog`, `/blueprints/[publicId]`; reads `blueprintName` from `useBlueprintBuilderStore` |
| `messages/en.json` | Add `blueprints` namespace (~285 keys) + `nav.blueprint_catalog` |
| `__tests__/mocks/handlers.ts` | Add MSW handlers for all blueprint endpoints |

### shadcn Components to Add

**None.** All required components already exist in `components/ui/`.

---

## Implementation Notes

### 1. Query Keys — `lib/api/query-keys.ts`

**Summary:** Extend the existing `blueprints` namespace with `slaPolicies`, `stages`, `subStages`; add `positions` to the `organization` namespace.

**Rules applied:** `coding-standards.md` — Query key factory usage (no hardcoded strings).

```ts
// Add to existing blueprints namespace (after stageTypes):
slaPolicies: () => [...queryKeys.blueprints.all, 'sla-policies'] as const,
stages: (blueprintId: string) => [...queryKeys.blueprints.detail(blueprintId), 'stages'] as const,
subStages: (blueprintId: string, stageId: string) =>
  [...queryKeys.blueprints.stages(blueprintId), stageId, 'sub-stages'] as const,

// Add to existing organization namespace:
organization: {
  // ... existing departments ...
  positions: (filters?: Record<string, unknown>) =>
    [...queryKeys.organization.all, 'positions', filters] as const,
},
```

> **Note:** In practice the builder mostly invalidates `detail(publicId)` (the show embeds stages + sub_stages + transitions) after any stage/sub-stage/transition mutation. The `stages`/`subStages` keys exist for granular invalidation if needed later.

---

### 2. Hooks — `lib/api/hooks/use-blueprints.ts`

**Summary:** All blueprint query + mutation hooks in one file, matching the `use-task-detail.ts` pattern. Also includes `usePositions` (organization endpoint) and the moved `useBlueprintCategories`/`useBlueprintStageTypes`.

**Rules applied:** Generated types only, query key factory, mutation invalidation, cursor pagination via `useInfiniteQuery`.

```ts
'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { components } from '@/lib/generated/api-types';

type BlueprintResource = components['schemas']['BlueprintResource'];
type BlueprintCategoryResource = components['schemas']['BlueprintCategoryResource'];
type StageTypeResource = components['schemas']['StageTypeResource'];
type SlaPolicyResource = components['schemas']['SlaPolicyResource'];
type BlueprintStageResource = components['schemas']['BlueprintStageResource'];
type BlueprintSubStageResource = components['schemas']['BlueprintSubStageResource'];
type BlueprintTransitionResource = components['schemas']['BlueprintTransitionResource'];
type PositionResource = components['schemas']['PositionResource'];
type StoreBlueprintRequest = components['schemas']['StoreBlueprintRequest'];
type UpdateBlueprintRequest = components['schemas']['UpdateBlueprintRequest'];
type StoreBlueprintStageRequest = components['schemas']['StoreBlueprintStageRequest'];
type StoreBlueprintSubStageRequest = components['schemas']['StoreBlueprintSubStageRequest'];
type StoreBlueprintTransitionRequest = components['schemas']['StoreBlueprintTransitionRequest'];

interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

// --- Catalog reference data ---

export function useBlueprintCategories() {
  return useQuery({
    queryKey: queryKeys.blueprints.categories(),
    queryFn: () => apiClient.get<BlueprintCategoryResource[]>('/v1/blueprints/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlueprintStageTypes() {
  return useQuery({
    queryKey: queryKeys.blueprints.stageTypes(),
    queryFn: () => apiClient.get<StageTypeResource[]>('/v1/blueprints/stage-types'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlueprintSlaPolicies() {
  return useQuery({
    queryKey: queryKeys.blueprints.slaPolicies(),
    queryFn: () => apiClient.get<SlaPolicyResource[]>('/v1/blueprints/sla-policies'),
    staleTime: 5 * 60 * 1000,
  });
}

// --- Positions ---

export function usePositions(filters?: { is_active?: boolean; per_page?: number }) {
  return useInfiniteQuery({
    queryKey: queryKeys.organization.positions(filters ?? {}),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<PositionResource>>('/v1/organization/positions', {
        params: { is_active: true, per_page: 100, ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 5 * 60 * 1000,
  });
}

// --- Blueprint library ---

export interface BlueprintListFilters {
  search?: string;
  category_id?: string;
  scope?: number;
  is_active?: boolean;
  per_page?: number;
}

export function useBlueprintsInfinite(filters: BlueprintListFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.blueprints.list(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BlueprintResource>>('/v1/blueprints', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });
}

// --- Blueprint detail ---

export function useBlueprint(publicId: string) {
  return useQuery({
    queryKey: queryKeys.blueprints.detail(publicId),
    queryFn: () => apiClient.get<BlueprintResource>(`/v1/blueprints/${publicId}`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

// --- Blueprint mutations ---

function useInvalidateBlueprint(publicId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.detail(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
  };
}

export function useCreateBlueprint() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: StoreBlueprintRequest) =>
      apiClient.post<BlueprintResource>('/v1/blueprints', body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      toast.success(t('blueprint_created'));
      return data;
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateBlueprint(publicId: string) {
  const invalidate = useInvalidateBlueprint(publicId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: UpdateBlueprintRequest) =>
      apiClient.put<BlueprintResource>(`/v1/blueprints/${publicId}`, body),
    onSuccess: () => { invalidate(); toast.success(t('blueprint_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useActivateBlueprint(publicId: string) {
  const invalidate = useInvalidateBlueprint(publicId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: () => apiClient.post<BlueprintResource>(`/v1/blueprints/${publicId}/activate`),
    onSuccess: () => { invalidate(); toast.success(t('blueprint_activated')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeactivateBlueprint(publicId: string) {
  const invalidate = useInvalidateBlueprint(publicId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: () => apiClient.post<BlueprintResource>(`/v1/blueprints/${publicId}/deactivate`),
    onSuccess: () => { invalidate(); toast.success(t('blueprint_deactivated')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDuplicateBlueprint() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<BlueprintResource>(`/v1/blueprints/${publicId}/duplicate`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      toast.success(t('blueprint_duplicated'));
      return data;
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/blueprints/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      toast.success(t('blueprint_deleted'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// --- Stage mutations ---

export function useCreateStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: StoreBlueprintStageRequest) =>
      apiClient.post<BlueprintStageResource>(`/v1/blueprints/${blueprintId}/stages`, body),
    onSuccess: () => { invalidate(); toast.success(t('stage_added')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageId: string; body: Partial<StoreBlueprintStageRequest> }) =>
      apiClient.put<BlueprintStageResource>(`/v1/blueprints/${blueprintId}/stages/${vars.stageId}`, vars.body),
    onSuccess: () => { invalidate(); toast.success(t('stage_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (stageId: string) =>
      apiClient.delete(`/v1/blueprints/${blueprintId}/stages/${stageId}`),
    onSuccess: () => { invalidate(); toast.success(t('stage_deleted')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReorderStages(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (stages: { public_id: string; sequence_order: number }[]) =>
      apiClient.post(`/v1/blueprints/${blueprintId}/stages/reorder`, { stages }),
    onSuccess: () => { invalidate(); toast.success(t('stages_reordered')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

// --- Sub-stage mutations ---

export function useReorderSubStages(blueprintId: string, stageId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (subStages: { public_id: string; sequence_order: number }[]) =>
      apiClient.post(`/v1/blueprints/${blueprintId}/stages/${stageId}/sub-stages/reorder`, { sub_stages: subStages }),
    onSuccess: () => { invalidate(); toast.success(t('sub_stages_reordered')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateSubStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageId: string; body: StoreBlueprintSubStageRequest }) =>
      apiClient.post<BlueprintSubStageResource>(`/v1/blueprints/${blueprintId}/stages/${vars.stageId}/sub-stages`, vars.body),
    onSuccess: () => { invalidate(); toast.success(t('sub_stage_added')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateSubStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageId: string; subStageId: string; body: Partial<StoreBlueprintSubStageRequest> }) =>
      apiClient.put<BlueprintSubStageResource>(`/v1/blueprints/${blueprintId}/stages/${vars.stageId}/sub-stages/${vars.subStageId}`, vars.body),
    onSuccess: () => { invalidate(); toast.success(t('sub_stage_saved')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteSubStage(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (vars: { stageId: string; subStageId: string }) =>
      apiClient.delete(`/v1/blueprints/${blueprintId}/stages/${vars.stageId}/sub-stages/${vars.subStageId}`),
    onSuccess: () => { invalidate(); toast.success(t('sub_stage_deleted')); },
    onError: (error: Error) => toast.error(error.message),
  });
}

// --- Transition mutations ---

export function useCreateTransition(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (body: StoreBlueprintTransitionRequest) =>
      apiClient.post<BlueprintTransitionResource>(`/v1/blueprints/${blueprintId}/transitions`, body),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.transitions(blueprintId) });
      toast.success(t('transition_added'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTransition(blueprintId: string) {
  const invalidate = useInvalidateBlueprint(blueprintId);
  const queryClient = useQueryClient();
  const t = useTranslations('blueprints.toast');
  return useMutation({
    mutationFn: (transitionId: string) =>
      apiClient.delete(`/v1/blueprints/${blueprintId}/transitions/${transitionId}`),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.transitions(blueprintId) });
      toast.success(t('transition_deleted'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// --- Catalog mutations ---

export function useCreateCategory() { /* ... POST /v1/blueprints/categories ... */ }
export function useUpdateCategory() { /* ... PUT /v1/blueprints/categories/:id ... */ }
export function useDeactivateCategory() { /* ... POST .../deactivate ... */ }
export function useReactivateCategory() { /* ... POST .../reactivate ... */ }
export function useDeleteCategory() { /* ... DELETE /v1/blueprints/categories/:id ... */ }
export function useCreateStageType() { /* ... POST /v1/blueprints/stage-types ... */ }
export function useUpdateStageType() { /* ... PUT /v1/blueprints/stage-types/:id ... */ }
export function useDeleteStageType() { /* ... DELETE /v1/blueprints/stage-types/:id ... */ }
export function useCreateSlaPolicy() { /* ... POST /v1/blueprints/sla-policies ... */ }
export function useUpdateSlaPolicy() { /* ... PUT /v1/blueprints/sla-policies/:id ... */ }
export function useDeleteSlaPolicy() { /* ... DELETE /v1/blueprints/sla-policies/:id ... */ }
```

> For the full catalog mutation implementations (each follows the same pattern: queryClient.invalidateQueries + toast), see the actual `use-blueprints.ts` file.

**Update `use-task-board.ts`:** Remove the `useBlueprintCategories` and `useStageTypes` definitions and replace with:
```ts
export { useBlueprintCategories, useBlueprintStageTypes as useStageTypes } from './use-blueprints';
```

**State management summary:**
- **TanStack Query:** blueprint list, blueprint detail (with stages/sub-stages/transitions), catalog reference data, positions.
- **URL state:** library filters (`search`, `category_id`, `scope`, `is_active`); catalog `tab`; builder route param `publicId`.
- **Zustand (`useBlueprintBuilderStore`):** `selectedStageId`, `panelOpen` (mobile Sheet), `metadataDirty`, `blueprintName`. Never API data. `setSelectedStage` does NOT auto-set `panelOpen` — the builder manually opens the panel on mobile via `handleSelectStage`.
- **Local component state:** form field values (stage form owned by panel, settings dialog, create dialog, sub-stage form), dialog open/close, `expandedStageId` (canvas sub-stage expand/collapse), `subStageEditId` (panel inline sub-stage editing, passed from builder to both canvas and panel), `isMobile` (matchMedia listener at 1023px).

---

### 3. Types — `components/domain/blueprints/blueprint-types.ts`

**Summary:** Re-export generated types for colocated use.

```ts
import type { components } from '@/lib/generated/api-types';

export type BlueprintResource = components['schemas']['BlueprintResource'];
export type BlueprintCategoryResource = components['schemas']['BlueprintCategoryResource'];
export type StageTypeResource = components['schemas']['StageTypeResource'];
export type SlaPolicyResource = components['schemas']['SlaPolicyResource'];
export type BlueprintStageResource = components['schemas']['BlueprintStageResource'];
export type BlueprintSubStageResource = components['schemas']['BlueprintSubStageResource'];
export type BlueprintTransitionResource = components['schemas']['BlueprintTransitionResource'];
export type PositionResource = components['schemas']['PositionResource'];
export type DepartmentResource = components['schemas']['DepartmentResource'];
```

---

### 4. Utils — `components/domain/blueprints/blueprint-utils.ts` + `lib/utils/localize.ts`

**Summary:** Utility functions are split across two files. Localization helpers (`localizeName`, `localizeTitle`) live in `lib/utils/localize.ts` and are imported by components as `@/lib/utils/localize`. Blueprint-domain utilities live in `blueprint-utils.ts`. `formatSlaSummary` takes a `t` function (from `useTranslations`) instead of a `locale` string — uses i18n keys `no_sla`, `sla_unit_hours`, `sla_unit_days`.

> **Key addition:** `getStagesCount(bp)` replaces inline fallback `bp.stages?.length ?? (bp as { stages_count?: number }).stages_count ?? 0` in both table and card list components.
> **Key addition:** `buildAssignmentFields(form)` maps form string values to API integer codes and conditionally sets position/department fields based on assignment_type.
> **Key addition:** Enum maps (`ASSIGNMENT_TYPE_MAP`, `CARDINALITY_MAP`, `COMPLETION_RULE_MAP`, `SLA_UNIT_MAP`) convert form string values to API integer codes for mutations. Used by both `StageForm` (via panel) and `SubStageForm`.
> **Note:** The `ASSIGNMENT_TYPE_LABELS`, `CARDINALITY_LABELS`, `COMPLETION_RULE_LABELS`, and `SLA_UNIT_LABELS` constants exist in the file but are unused by components (display uses i18n keys directly).

```ts
import type {
  BlueprintStageResource,
  SlaPolicyResource,
  BlueprintTransitionResource,
} from './blueprint-types';

export function formatSlaSummary(policy: SlaPolicyResource | null | undefined, t: (key: string) => string): string {
  if (!policy) return t('no_sla');
  const isHours = policy.sla_unit === 'hours' || policy.sla_unit === '1';
  const unit = t(isHours ? 'sla_unit_hours' : 'sla_unit_days');
  return `${policy.sla_value} ${unit}`;
}

export function formatSlaThreshold(policy: SlaPolicyResource | null | undefined): string {
  if (!policy) return '';
  return `${policy.warning_threshold_percentage}%`;
}

// Enum label maps (unused by components — i18n keys used instead)
export const ASSIGNMENT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  specific_position: { ar: 'منصب محدد', en: 'Specific Position' },
  department_head: { ar: 'رئيس الإدارة', en: 'Department Head' },
  manual_at_launch: { ar: 'يدوي عند الإطلاق', en: 'Manual at Launch' },
};

export const CARDINALITY_LABELS: Record<string, { ar: string; en: string }> = {
  single: { ar: 'مكلف واحد', en: 'Single' },
  multiple: { ar: 'عدة مكلفين', en: 'Multiple' },
};

export const COMPLETION_RULE_LABELS: Record<string, { ar: string; en: string }> = {
  any_assignee: { ar: 'أي مكلف', en: 'Any assignee' },
  all_assignees: { ar: 'جميع المكلفين', en: 'All assignees' },
  lead_assignee: { ar: 'المكلف الرئيسي', en: 'Lead assignee' },
};

export const SLA_UNIT_LABELS: Record<string, { ar: string; en: string }> = {
  hours: { ar: 'ساعات', en: 'Hours' },
  days: { ar: 'أيام', en: 'Days' },
};

// Enum maps for API serialization (string → integer)
export const ASSIGNMENT_TYPE_MAP: Record<string, 1 | 2 | 3> = { specific_position: 1, department_head: 2, manual_at_launch: 3 };
export const CARDINALITY_MAP: Record<string, 1 | 2> = { single: 1, multiple: 2 };
export const COMPLETION_RULE_MAP: Record<string, 1 | 2 | 3> = { any_assignee: 1, all_assignees: 2, lead_assignee: 3 };
export const SLA_UNIT_MAP: Record<string, 1 | 2> = { hours: 1, days: 2 };

export function getStagesCount(bp: { stages?: unknown[]; stages_count?: number | string }): number {
  return bp.stages?.length ?? (Number(bp.stages_count) || 0);
}

// Builds stage/sub-stage API payload from form state, handling sentinels and conditional fields
export function buildAssignmentFields(form: Record<string, unknown>) {
  return {
    sla_policy_id: form.sla_policy_id === 'no-sla' ? null : String(form.sla_policy_id),
    assignment_type: ASSIGNMENT_TYPE_MAP[String(form.assignment_type)],
    assigned_position_id: form.assignment_type === 'specific_position' ? String(form.assigned_position_id) : null,
    assigned_department_id: form.assignment_type === 'department_head' ? String(form.assigned_department_id) : null,
    assignment_cardinality: CARDINALITY_MAP[String(form.assignment_cardinality)],
    completion_rule: COMPLETION_RULE_MAP[String(form.completion_rule)],
  };
}

export function deriveAdvanceTargets(stages: BlueprintStageResource[], currentStagePublicId: string): BlueprintStageResource[] {
  const current = stages.find((s) => s.public_id === currentStagePublicId);
  if (!current) return [];
  return stages.filter((s) => Number(s.sequence_order) > Number(current.sequence_order));
}

export function deriveReturnTargets(stages: BlueprintStageResource[], currentStagePublicId: string): BlueprintStageResource[] {
  const current = stages.find((s) => s.public_id === currentStagePublicId);
  if (!current) return [];
  return stages.filter((s) => Number(s.sequence_order) < Number(current.sequence_order));
}

export function getStageTransitions(transitions: BlueprintTransitionResource[] | undefined, stagePublicId: string) {
  return (transitions ?? []).filter((t) => t.from_stage_id === stagePublicId);
}
```

> `localizeName` and `localizeTitle` are imported from `@/lib/utils/localize` by all components — they are NOT in this file.

---

### 5. Store — `lib/stores/use-blueprint-builder-store.ts`

**Summary:** Zustand store for builder UI/selection state only — never API data. Adds `blueprintName` for breadcrumb display in `SiteHeader`.

```ts
import { create } from 'zustand';

interface BlueprintBuilderState {
  selectedStageId: string | null;
  panelOpen: boolean;
  metadataDirty: boolean;
  blueprintName: string;
  setSelectedStage: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  setMetadataDirty: (dirty: boolean) => void;
  setBlueprintName: (name: string) => void;
  reset: () => void;
}

export const useBlueprintBuilderStore = create<BlueprintBuilderState>((set) => ({
  selectedStageId: null,
  panelOpen: false,
  metadataDirty: false,
  blueprintName: '',
  setSelectedStage: (id) => set({ selectedStageId: id }),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setMetadataDirty: (dirty) => set({ metadataDirty: dirty }),
  setBlueprintName: (name) => set({ blueprintName: name }),
  reset: () => set({ selectedStageId: null, panelOpen: false, metadataDirty: false, blueprintName: '' }),
}));
```

> **Note:** `setSelectedStage` does NOT auto-set `panelOpen`. The builder manually opens the panel on mobile. The `blueprintName` field is synced from the detail query and consumed by `SiteHeader` for breadcrumb display.

---

### 6. Blueprint Library Page — `app/(dashboard)/blueprints/page.tsx`

**Summary:** Server component replacing the placeholder. Renders `PageHeader` (title + "New Blueprint" action + "Manage Catalog" link) + `BlueprintLibrary`.

```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { BlueprintLibrary } from '@/components/domain/blueprints/blueprint-library';
import { CreateBlueprintDialog } from '@/components/domain/blueprints/create-blueprint-dialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default async function BlueprintsPage() {
  const t = await getTranslations('blueprints.library');
  return (
    <main className="flex flex-col gap-4 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/blueprints/catalog"><Settings className="size-4" /> {t('manage_catalog')}</Link>
            </Button>
            <CreateBlueprintDialog />
          </>
        }
      />
      <BlueprintLibrary />
    </main>
  );
}
```

> **Note:** `CreateBlueprintDialog` renders its own trigger button (capability-gated internally) so it can manage its own open state and the post-create navigation.

---

### 7. Blueprint Library — `components/domain/blueprints/blueprint-library.tsx`

**Summary:** Client orchestrator — reads URL filters, calls `useBlueprintsInfinite`, renders filter bar + table (desktop) / card list (mobile) + Load More. Handles all 4 states. Prefetches detail on row hover.

```tsx
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { apiClient } from '@/lib/api/client';
import { useBlueprintsInfinite, type BlueprintListFilters } from '@/lib/api/hooks/use-blueprints';
import { BlueprintFilters } from './blueprint-filters';
import { BlueprintLibrarySkeleton } from './blueprint-library-skeleton';
import { BlueprintTable } from './blueprint-table';
import { BlueprintCardList } from './blueprint-card-list';

function readFilters(searchParams: URLSearchParams): BlueprintListFilters {
  return {
    search: searchParams.get('search') ?? undefined,
    category_id: searchParams.get('category_id') ?? undefined,
    scope: searchParams.get('scope') ? Number(searchParams.get('scope')) : undefined,
    is_active: searchParams.get('is_active') === 'active' ? true : searchParams.get('is_active') === 'inactive' ? false : undefined,
  };
}

export function BlueprintLibrary() {
  const t = useTranslations('blueprints.library');
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const query = useBlueprintsInfinite(filters);
  const queryClient = useQueryClient();

  const allBlueprints = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((p) => p.data) ?? []).filter((b) => {
      if (seen.has(b.public_id)) return false;
      seen.add(b.public_id);
      return true;
    });
  }, [query.data]);

  if (query.isLoading) return <BlueprintLibrarySkeleton />;
  if (query.isError) {
    const error = query.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <BlueprintFilters filters={filters} />
      {allBlueprints.length === 0 ? (
        <EmptyState title={t('empty_title')} description={t('empty_description')} />
      ) : (
        <>
          <div className="hidden md:block">
            <BlueprintTable blueprints={allBlueprints} onHover={(id) => {
              queryClient.prefetchQuery({
                queryKey: queryKeys.blueprints.detail(id),
                queryFn: () => apiClient.get(`/v1/blueprints/${id}`),
              });
            }} />
          </div>
          <div className="md:hidden">
            <BlueprintCardList blueprints={allBlueprints} />
          </div>
          {query.hasNextPage && (
            <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
              {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
```

---

### 8. Blueprint Filters — `components/domain/blueprints/blueprint-filters.tsx`

**Summary:** URL-driven filter bar: search input (300ms debounce), category Select, scope Select, active ToggleGroup, reset button. Uses `tb` (badges translations) for scope labels.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RtlSelect } from '@/components/shared/rtl-select';
import { useBlueprintCategories } from '@/lib/api/hooks/use-blueprints';
import type { BlueprintListFilters } from '@/lib/api/hooks/use-blueprints';

interface BlueprintFiltersProps {
  filters: BlueprintListFilters;
}

export function BlueprintFilters({ filters }: BlueprintFiltersProps) {
  const t = useTranslations('blueprints.library.filters');
  const tb = useTranslations('blueprints.badges');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: categories } = useBlueprintCategories();
  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = filters.search ?? '';
      if (searchInput !== current) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput) params.set('search', searchInput);
        else params.delete('search');
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, pathname, router, filters.search]);

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup type="single" value={filters.is_active === false ? 'inactive' : filters.is_active === true ? 'active' : 'all'}
          onValueChange={(v) => { if (!v) return; setParam('is_active', v === 'all' ? null : v); }}>
          <ToggleGroupItem value="active" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('active')}</ToggleGroupItem>
          <ToggleGroupItem value="inactive" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('inactive')}</ToggleGroupItem>
          <ToggleGroupItem value="all" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('all')}</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" onClick={() => router.replace(pathname)}>{t('reset')}</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field>
          <FieldLabel className="sr-only">{t('search')}</FieldLabel>
          <InputGroup>
            <InputGroupInput value={searchInput} placeholder={t('search_placeholder')} onChange={(e) => setSearchInput(e.target.value)} />
            <InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon>
          </InputGroup>
        </Field>
        <RtlSelect value={filters.category_id ?? 'all'} onValueChange={(v) => setParam('category_id', v === 'all' ? null : v)}>
          <SelectTrigger className="w-full" aria-label={t('category')}><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_categories')}</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.public_id} value={c.public_id}>{locale === 'ar' ? c.name_ar : c.name_en}</SelectItem>
            ))}
          </SelectContent>
        </RtlSelect>
        <RtlSelect value={filters.scope ? String(filters.scope) : 'all'} onValueChange={(v) => setParam('scope', v === 'all' ? null : v)}>
          <SelectTrigger className="w-full" aria-label={t('scope')}><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_scopes')}</SelectItem>
            <SelectItem value="1">{tb('scope_organization')}</SelectItem>
            <SelectItem value="2">{tb('scope_department')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </div>
    </div>
  );
}
```

> **Note:** Scope filter uses number strings (`'1'`/`'2'`) for URL serialization. Scope display uses `tb('scope_organization')`/`tb('scope_department')` from `blueprints.badges`.

---

### 9. Blueprint Table — `components/domain/blueprints/blueprint-table.tsx`

**Summary:** Desktop table with columns: Name + category, Scope badge, Status, Stages count, Actions. Row click → builder. Row hover → prefetch.

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LockBadge, ScopeBadge } from './blueprint-badges';
import { ActiveBadge } from '@/components/shared/active-badge';
import { BlueprintRowActions } from './blueprint-row-actions';
import { localizeName } from '@/lib/utils/localize';
import { getStagesCount } from './blueprint-utils';
import type { BlueprintResource } from './blueprint-types';

interface BlueprintTableProps {
  blueprints: BlueprintResource[];
  onHover: (publicId: string) => void;
}

export function BlueprintTable({ blueprints, onHover }: BlueprintTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('blueprints.library.columns');

  function open(id: string) { router.push(`/blueprints/${id}`); }

  return (
    <Table aria-label={t('table_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-50 text-start">{t('name')}</TableHead>
          <TableHead className="w-32 text-start">{t('scope')}</TableHead>
          <TableHead className="w-28 text-start">{t('status')}</TableHead>
          <TableHead className="w-20 text-start">{t('stages')}</TableHead>
          <TableHead className="w-12 text-end">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last-child]:border-b-0">
        {blueprints.map((bp) => {
          const name = localizeName(locale, bp.name_ar, bp.name_en);
          const stagesCount = getStagesCount(bp);
          return (
            <TableRow key={bp.public_id} tabIndex={0} className="cursor-pointer"
              onClick={() => open(bp.public_id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(bp.public_id); } }}
              onMouseEnter={() => onHover(bp.public_id)}>
              <TableCell className="text-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-tight">{name}</span>
                  {bp.category && (
                    <span className="text-xs text-muted-foreground">
                      {localizeName(locale, bp.category.name_ar, bp.category.name_en)}
                    </span>
                  )}
                  {bp.is_locked && <LockBadge />}
                </div>
              </TableCell>
              <TableCell className="text-start"><ScopeBadge scope={bp.scope} /></TableCell>
              <TableCell className="text-start">
                <ActiveBadge isActive={!!bp.is_active} activeLabel={t('active')} inactiveLabel={t('inactive')} />
              </TableCell>
              <TableCell className="text-start text-sm text-muted-foreground">{stagesCount}</TableCell>
              <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                <BlueprintRowActions blueprint={bp} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

---

### 10. Blueprint Card List — `components/domain/blueprints/blueprint-card-list.tsx`

**Summary:** Mobile card list. Each card shows name, category, scope badge, active status, stages count, lock badge.

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { LockBadge, ScopeBadge } from './blueprint-badges';
import { ActiveBadge } from '@/components/shared/active-badge';
import { localizeName } from '@/lib/utils/localize';
import { getStagesCount } from './blueprint-utils';
import type { BlueprintResource } from './blueprint-types';

interface BlueprintCardListProps {
  blueprints: BlueprintResource[];
}

export function BlueprintCardList({ blueprints }: BlueprintCardListProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('blueprints.library.columns');

  return (
    <div className="flex flex-col gap-3">
      {blueprints.map((bp) => {
        const name = localizeName(locale, bp.name_ar, bp.name_en);
        const stagesCount = getStagesCount(bp);
        return (
          <Card key={bp.public_id} className="cursor-pointer p-4" tabIndex={0} role="button"
            onClick={() => router.push(`/blueprints/${bp.public_id}`)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/blueprints/${bp.public_id}`); } }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{name}</span>
                {bp.category && (
                  <span className="text-xs text-muted-foreground">
                    {localizeName(locale, bp.category.name_ar, bp.category.name_en)}
                  </span>
                )}
              </div>
              <ScopeBadge scope={bp.scope} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ActiveBadge isActive={!!bp.is_active} activeLabel={t('active')} inactiveLabel={t('inactive')} />
              <span className="text-xs text-muted-foreground">{t('stages_count', { count: stagesCount })}</span>
              {bp.is_locked && <LockBadge />}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

---

### 11. Blueprint Row Actions — `components/domain/blueprints/blueprint-row-actions.tsx`

**Summary:** Dropdown with Open / Duplicate / Activate / Deactivate / **Delete**, capability-gated by `blueprint.manage`. Uses `AlertDialog` for confirmations. The delete action calls `useDeleteBlueprint()` (`DELETE /v1/blueprints/{blueprint}`) and uses a destructive confirm dialog. Uses `Trash2` icon for delete, `getStagesCount` for the zero-stages check on activate. Matches the spec snippet exactly — see the actual file for the full implementation.

---

### 12. Create Blueprint Dialog — `components/domain/blueprints/create-blueprint-dialog.tsx`

**Summary:** Dialog with create form (name AR/EN, description AR/EN, category, scope, department conditional). Uses `BilingualNameFields` and `BilingualDescriptionFields` shared components. On success, navigate to the new blueprint's builder. `useEffect` resets form when dialog closes. Scope dropdown only shows Department option when user has `blueprint.create.department` capability. Trigger capability-gated. Matches the previous plan snippet exactly — see actual file.

---

### 13. Blueprint Builder Page — `app/(dashboard)/blueprints/[publicId]/page.tsx`

**Summary:** Server component — reads route param, renders `BlueprintBuilder`.

```tsx
import { BlueprintBuilder } from '@/components/domain/blueprints/blueprint-builder';

export default async function BlueprintBuilderPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return (
    <main className="flex flex-col p-6">
      <BlueprintBuilder publicId={publicId} />
    </main>
  );
}
```

---

### 14. Blueprint Builder — `components/domain/blueprints/blueprint-builder.tsx`

**Summary:** Client orchestrator — fetches `useBlueprint(publicId)`, renders top bar + split view (canvas + panel), handles all 4 states + lock + read-only. Manages mobile detection via `matchMedia`, sub-stage editing via `subStageEditId` state, and syncs blueprint name to store for breadcrumb.

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FileQuestion, Lock } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useBlueprint } from '@/lib/api/hooks/use-blueprints';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useBlueprintBuilderStore } from '@/lib/stores/use-blueprint-builder-store';
import { BuilderTopBar } from './builder-top-bar';
import { StageCanvas } from './stage-canvas';
import { StagePropertiesPanel } from './stage-properties-panel';
import { BlueprintBuilderSkeleton } from './blueprint-builder-skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { localizeName } from './blueprint-utils';

interface BlueprintBuilderProps {
  publicId: string;
}

export function BlueprintBuilder({ publicId }: BlueprintBuilderProps) {
  const t = useTranslations('blueprints.builder');
  const locale = useLocale();
  const query = useBlueprint(publicId);
  const canManage = useCapability('blueprint.manage');
  const { selectedStageId, setSelectedStage, panelOpen, setPanelOpen, setBlueprintName, reset } = useBlueprintBuilderStore();
  const [isMobile, setIsMobile] = useState(false);
  const [subStageEditId, setSubStageEditId] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function handleSelectStage(id: string | null) {
    setSelectedStage(id);
    if (id && isMobile) setPanelOpen(true);
  }

  useEffect(() => () => reset(), [reset]);

  const bpData = query.data;
  useEffect(() => {
    setBlueprintName(bpData ? localizeName(locale, bpData.name_ar, bpData.name_en) : '');
  }, [bpData, locale, setBlueprintName]);

  if (query.isLoading) return <BlueprintBuilderSkeleton />;
  if (query.isError) {
    const error = query.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    if (error instanceof ApiRequestError && error.status === 404) {
      return <EmptyState icon={FileQuestion} title={t('not_found_title')} description={t('not_found_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  }

  const blueprint = query.data;
  if (!blueprint) return <BlueprintBuilderSkeleton />;

  const isLocked = !!blueprint.is_locked;
  const readOnly = isLocked || !canManage;
  const stages = blueprint.stages ?? [];
  const panelMode = selectedStageId === 'new' ? 'add' : selectedStageId ? 'edit' : 'idle';
  const selectedStage = panelMode === 'edit' ? stages.find((s) => s.public_id === selectedStageId) ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      <BuilderTopBar blueprint={blueprint} readOnly={readOnly} canManage={canManage} />
      {isLocked && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {t('locked_banner')}
        </div>
      )}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <StageCanvas
            blueprint={blueprint} stages={stages}
            transitions={blueprint.transitions} readOnly={readOnly}
            selectedStageId={selectedStageId} onSelectStage={handleSelectStage}
            subStageEditId={subStageEditId} onEditSubStage={setSubStageEditId}
          />
        </div>
        <aside className="hidden w-96 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto border-s p-5">
            <StagePropertiesPanel
              blueprint={blueprint} stage={selectedStage} mode={panelMode}
              readOnly={readOnly} subStageEditId={subStageEditId}
              onEditSubStage={setSubStageEditId} onSubStageBack={() => setSubStageEditId(null)}
            />
          </div>
        </aside>
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent side={locale === 'ar' ? 'left' : 'right'} className="w-96 overflow-y-auto p-5 pt-10">
            <StagePropertiesPanel
              blueprint={blueprint} stage={selectedStage} mode={panelMode}
              readOnly={readOnly} subStageEditId={subStageEditId}
              onEditSubStage={setSubStageEditId} onSubStageBack={() => setSubStageEditId(null)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
```

> **Key differences from earlier plan:** Builder detects mobile via `matchMedia` and opens the Sheet on stage selection only on mobile. `panelMode` is a derived value (`'add'`/`'edit'`/`'idle'`). Sub-stage editing uses `subStageEditId` state passed to both canvas and panel. Blueprint name synced to store for breadcrumb.

---

### 15. Builder Top Bar — `components/domain/blueprints/builder-top-bar.tsx`

**Summary:** Action buttons only (no breadcrumb). Right-aligned with Settings, Activate, Deactivate, Duplicate. Duplicate uses a confirm dialog.

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Save, Copy, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BlueprintSettingsDialog } from './blueprint-settings-dialog';
import { useActivateBlueprint, useDeactivateBlueprint, useDuplicateBlueprint } from '@/lib/api/hooks/use-blueprints';
import { useBlueprintBuilderStore } from '@/lib/stores/use-blueprint-builder-store';
import { getStagesCount } from './blueprint-utils';
import type { BlueprintResource } from './blueprint-types';

interface BuilderTopBarProps {
  blueprint: BlueprintResource;
  readOnly: boolean;
  canManage: boolean;
}

export function BuilderTopBar({ blueprint, readOnly, canManage }: BuilderTopBarProps) {
  const t = useTranslations('blueprints.builder.top_bar');
  const ta = useTranslations('blueprints.library.actions');
  const router = useRouter();
  const activate = useActivateBlueprint(blueprint.public_id);
  const deactivate = useDeactivateBlueprint(blueprint.public_id);
  const duplicate = useDuplicateBlueprint();
  const { metadataDirty } = useBlueprintBuilderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | 'activate' | 'deactivate' | 'duplicate'>(null);

  const isLocked = !!blueprint.is_locked;
  const isActive = !!blueprint.is_active;
  const stagesCount = getStagesCount(blueprint);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-b pb-3">
      <div className="flex items-center gap-2">
        {!readOnly && canManage && (
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Save className="size-4" /> {metadataDirty ? t('save') + ' *' : t('settings')}
          </Button>
        )}
        {canManage && !isActive && !isLocked && (
          <Button variant="outline" size="sm" disabled={stagesCount === 0} onClick={() => setConfirm('activate')}
            title={stagesCount === 0 ? t('activate_no_stages_tooltip') : undefined}>
            <CheckCircle className="size-4" /> {t('activate')}
          </Button>
        )}
        {canManage && isActive && (
          <Button variant="outline" size="sm" className="border-destructive/30 text-destructive" onClick={() => setConfirm('deactivate')}>
            <XCircle className="size-4" /> {t('deactivate')}
          </Button>
        )}
        {canManage && (
          <Button variant="ghost" size="sm" onClick={() => setConfirm('duplicate')}>
            <Copy className="size-4" /> {t('duplicate')}
          </Button>
        )}
      </div>
      <BlueprintSettingsDialog blueprint={blueprint} open={settingsOpen} onOpenChange={setSettingsOpen} />
      {/* AlertDialogs for activate/deactivate/duplicate */}
    </div>
  );
}
```

> **Note:** No breadcrumb — `SiteHeader` handles it. Actions are `justify-end`. Deactivate uses `border-destructive/30 text-destructive`. Duplicate uses a confirm dialog (translations from `blueprints.library.actions`). Uses `getStagesCount(blueprint)` (imported from `./blueprint-utils`) for the zero-stages check on activate.

---

### 16. Stage Canvas — `components/domain/blueprints/stage-canvas.tsx`

**Summary:** Blueprint header + dashed canvas with vertical stage list + flow connectors + inline sub-stage cards when expanded + "Add Stage" button. Key additions vs earlier plan:
- `CanvasSubStageCard` renders inline sub-stage rows (click to edit, reorder, delete)
- `expandedStageId` state toggles inline sub-stage display (max 5, "+N more")
- Connectors use vertical line + `ChevronDown` pattern
- Last stage has styled checkmark icon
- Status badge + lock icon in blueprint header

See the actual `stage-canvas.tsx` file for the full implementation (~262 lines). The component exposes `subStageEditId` and `onEditSubStage` props for inline sub-stage editing.

---

### 17. Stage Card — `components/domain/blueprints/stage-card.tsx`

**Summary:** Width `w-80`. Sequence badge, name, type + SLA summary, up to 2 inline sub-stage name pills (+ remaining count badge), return-path badge, reorder at bottom, expand chevron for sub-stages. Exposes `isExpanded`, `hasSubStages`, `onToggleExpand` props. See actual file for full implementation.

---

### 18. Stage Properties Panel — `components/domain/blueprints/stage-properties-panel.tsx`

**Summary:** Owns form state and mode-switching. Delegates to `StageForm`, `SubStageForm` (inline), `TransitionEditor`, `SubStageList`. Three modes: `'idle'` (hint text), `'add'` (stage form for creation), `'edit'` (stage form + transitions + sub-stages). Sub-stage editing (when `subStageEditId` is set) swaps to `SubStageForm` with a back button.

Key details:
- `getInitialForm()` returns default form state with `'no-sla'` sentinel for SLA and `'none'` for escalation
- `useEffect` resets form on `stage?.public_id` or `mode` change
- Fields: `description_ar`/`description_en` included in stage form
- SLA policy sentinel `'no-sla'` → sends `null` to API
- Escalation position sentinel `'none'` → sends `null` to API
- Assignment type enum mapping: `specific_position: 1, department_head: 2, manual_at_launch: 3`
- Cardinality mapping: `single: 1, multiple: 2`
- Completion rule mapping: `any_assignee: 1, all_assignees: 2, lead_assignee: 3`

---

### 19. Stage Form — `components/domain/blueprints/stage-form.tsx`

**Summary:** Presentational controlled component. Gets form state, errors, data arrays, and callbacks as props from `StagePropertiesPanel`. Fields: name (AR/EN), description (AR/EN), stage type, assignment type (with conditional position/department), SLA policy (with threshold + manage link in new tab), assignment cardinality, completion rule, escalation position. Save button. See actual file for full ~146-line implementation.

---

### 20. Transition Editor — `components/domain/blueprints/transition-editor.tsx`

**Summary:** Advance/Return target checkboxes derived from blueprint stages. Adding a target creates a transition; removing deletes. Matches the earlier plan code exactly — see the actual `transition-editor.tsx`.

---

### 21. Sub-stage List — `components/domain/blueprints/sub-stage-list.tsx`

**Summary:** Ordered sub-stage list with add/edit/delete/reorder. Uses `DeleteSubStageDialog` component (not inline `AlertDialog`). Add/edit triggers `onEditSubStage` callback to navigate to inline sub-stage edit in the panel. See actual file for the full implementation.

---

### 22. Sub-stage Form — `components/domain/blueprints/sub-stage-form.tsx`

**Summary:** Inline sub-stage fields (not a dialog) — rendered inside `StagePropertiesPanel` when `subStageEditId` is set. Has back button and save/cancel. Fields: name (AR/EN), description (AR/EN), SLA policy, assignment type (with conditional position/department), completion rule, assignment cardinality, is_required checkbox. Calls `useCreateSubStage`/`useUpdateSubStage` directly. See actual file.

---

### 23. Delete Sub-stage Dialog — `components/domain/blueprints/delete-sub-stage-dialog.tsx`

**Summary:** Reusable `AlertDialog` wrapper for sub-stage delete confirmation. Accepts `open`, `onOpenChange`, `subStageName`, `onConfirm` props.

```tsx
'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteSubStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subStageName: string;
  onConfirm: () => void;
}

export function DeleteSubStageDialog({ open, onOpenChange, subStageName, onConfirm }: DeleteSubStageDialogProps) {
  const t = useTranslations('blueprints.builder.panel.sub_stages');
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_description', { name: subStageName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction className="text-destructive" onClick={onConfirm}>{t('delete')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### 24. Blueprint Settings Dialog — `components/domain/blueprints/blueprint-settings-dialog.tsx`

**Summary:** Dialog for editing blueprint metadata. Contains an internal `SettingsForm` component with local state. Fields: name (AR/EN), description (AR/EN), category, scope, department (conditional). Uses `BilingualNameFields` and `BilingualDescriptionFields` shared components. Uses `canCreateDept` capability for department scope option. Calls `setMetadataDirty(true)` on field change, `false` on save. Form rendered only when dialog is open (keyed by `blueprint.public_id`). The dialog title uses `blueprints.builder.top_bar.settings_title`. See actual file.

---

### 25. Blueprint Catalog — `components/domain/blueprints/blueprint-catalog.tsx`

**Summary:** Tabs (Categories / Stage Types / SLA Policies) with URL `tab` param. Renders its own `PageHeader` with a single Create button (action changes per active tab). Each tab renders a manager component. Matches the earlier plan code — see actual file.

---

### 26. Badges — `components/domain/blueprints/blueprint-badges.tsx`

**Summary:** `LockBadge` (amber-tinted lock icon with tooltip), `ScopeBadge` (Organization/Department with Globe/Building2 icon + i18n keys). Both have dark mode support. Active state uses shared `ActiveBadge` from `@/components/shared/active-badge`. Matches earlier plan with added dark mode classes.

---

### 27. Sidebar + Breadcrumb — `components/domain/shell/app-sidebar.tsx` + `site-header.tsx`

**Summary:**
- **`app-sidebar.tsx`**: Blueprints group renders two flat items via `<NavMain>`: "Blueprints" (`FolderKanban`, active for `/blueprints` or `/blueprints/[publicId]` but not `/blueprints/catalog`) and "Catalog" (`Settings2`, gated by `blueprint.manage`). Quick create button, inbox button, Workflow group, Admin group (`iam.manage_users`), `NavUser` footer.
- **`site-header.tsx`**: `usePageBreadcrumb()` recognizes `/blueprints`, `/blueprints/catalog`, `/blueprints/[publicId]`. For builder detail, reads `blueprintName` from `useBlueprintBuilderStore` for the breadcrumb label.

---

### 28. MSW Handlers — `__tests__/mocks/handlers.ts`

**Summary:** Full set of MSW handlers for all blueprint endpoints:
- `GET /v1/blueprints` — list with search/active filtering
- `GET /v1/blueprints/:publicId` — detail with special cases for `bp-locked`/`bp-full`
- `POST /v1/blueprints` — create (returns mock with new UUID)
- `PUT /v1/blueprints/:publicId` — update
- `DELETE /v1/blueprints/:publicId` — delete blueprint (204)
- `DELETE /v1/blueprints/categories/:categoryId` — delete category (204)
- `POST /v1/blueprints/:publicId/activate|deactivate|duplicate`
- `POST /v1/blueprints/:blueprintId/stages` — create stage
- `PUT /v1/blueprints/:blueprintId/stages/:stageId` — update stage
- `DELETE /v1/blueprints/:blueprintId/stages/:stageId` — delete stage (204)
- `POST /v1/blueprints/:blueprintId/stages/reorder` — reorder (204)
- `POST /v1/blueprints/:blueprintId/stages/:stageId/sub-stages` — create sub-stage
- `PUT /v1/blueprints/:blueprintId/stages/:stageId/sub-stages/:subStageId` — update sub-stage
- `DELETE /v1/blueprints/:blueprintId/stages/:stageId/sub-stages/:subStageId` — delete sub-stage (204)
- `POST /v1/blueprints/:blueprintId/stages/:stageId/sub-stages/reorder` — reorder (204)
- `POST /v1/blueprints/:blueprintId/transitions` — create transition
- `DELETE /v1/blueprints/:blueprintId/transitions/:transitionId` — delete transition (204)
- `GET /v1/organization/positions` — positions list

See actual `__tests__/mocks/handlers.ts` for mock data shapes and full handler implementations.

---

### 29. i18n — `messages/en.json`

**Summary:** `blueprints` namespace with sub-namespaces: `library` (page_title, filters, columns, actions, create, empty/error states), `builder` (no_permission, not_found, error, locked_banner, top_bar, canvas, panel with transitions/sub_stages), `catalog` (page_title, CRUD per tab), `badges` (locked, scope labels), `toast` (all mutation toast keys, ~25 keys). Approximate total: ~285 keys.

---

## Data Flow

```
Backend (004-blueprint-engine, stable)
  → OpenAPI → lib/generated/api-types.ts (generated)
  → apiClient (credentials, X-Tenant, X-Locale, CSRF)
  → TanStack Query hooks (use-blueprints.ts)
    → useBlueprintsInfinite(filters) → BlueprintLibrary → BlueprintTable / BlueprintCardList
    → useBlueprint(publicId) → BlueprintBuilder → StageCanvas + StagePropertiesPanel
    → useBlueprintCategories/StageTypes/SlaPolicies → BlueprintCatalog + Selects
    → usePositions → StagePropertiesPanel → StageForm (assignment/escalation Selects)
    → mutations → invalidate detail(publicId) + lists() → UI refreshes
    → useDeleteBlueprint → invalidate lists() only (no detail to invalidate)
    → useDeleteCategory → invalidate categories() only
  → Zustand (useBlueprintBuilderStore) → selectedStageId, panelOpen, metadataDirty, blueprintName (UI only)
  → URL params → library filters, catalog tab, route publicId
```

---

## Route Structure

```
app/(dashboard)/blueprints/
├── page.tsx                      # /blueprints — Library (REPLACES placeholder)
├── catalog/
│   └── page.tsx                  # /blueprints/catalog — Catalog (delegates entirely to BlueprintCatalog)
├── [publicId]/
│   └── page.tsx                  # /blueprints/{publicId} — Builder
```

> **Static vs dynamic precedence:** Next.js matches static segments (`catalog`) before dynamic (`[publicId]`), so `/blueprints/catalog` renders the catalog page, not the builder with `publicId="catalog"`. No extra configuration needed.

---

## Execution Order

1. **Query keys** — Extend `lib/api/query-keys.ts` with `blueprints.slaPolicies`, `blueprints.stages`, `blueprints.subStages`, `organization.positions`.
2. **Hooks** — Create `lib/api/hooks/use-blueprints.ts` with all query + mutation hooks + `usePositions`. Update `use-task-board.ts` to re-export.
3. **Store** — Create `lib/stores/use-blueprint-builder-store.ts`.
4. **Types + Utils + Badges** — Create `blueprint-types.ts`, `blueprint-utils.ts`, `blueprint-badges.tsx`.
5. **i18n** — Add `blueprints` namespace to `messages/en.json`; add `nav.blueprint_catalog`.
6. **Sidebar + SiteHeader** — Add Catalog nav item; extend breadcrumb for blueprint routes.
7. **Library route + components** — `blueprints/page.tsx`, `blueprint-library.tsx`, `blueprint-filters.tsx`, `blueprint-table.tsx`, `blueprint-card-list.tsx`, `blueprint-row-actions.tsx`, `create-blueprint-dialog.tsx`, `blueprint-library-skeleton.tsx`.
8. **Builder route + components** — `blueprints/[publicId]/page.tsx`, `blueprint-builder.tsx`, `blueprint-builder-skeleton.tsx`, `builder-top-bar.tsx`, `stage-canvas.tsx`, `stage-card.tsx`, `stage-properties-panel.tsx`, `stage-form.tsx`, `transition-editor.tsx`, `sub-stage-list.tsx`, `sub-stage-form.tsx`, `delete-sub-stage-dialog.tsx`, `blueprint-settings-dialog.tsx`.
9. **Catalog route + components** — `blueprints/catalog/page.tsx`, `blueprint-catalog.tsx`, `catalog-skeleton.tsx`, `category-manager.tsx`, `stage-type-manager.tsx`, `sla-policy-manager.tsx`.
10. **MSW handlers** — Add all blueprint handlers to `__tests__/mocks/handlers.ts`, including delete blueprint/category handlers.
11. **Shared components** — Create `bilingual-name-fields.tsx`, `bilingual-description-fields.tsx`, `rtl-select.tsx`, `rtl-table.tsx`, `confirm-delete-dialog.tsx`, `catalog-table.tsx`.
12. **Verify** — `npm run lint && npm run typecheck && npm run test`.

---

## What to Test Manually

### Happy Paths (both locales: AR RTL + EN LTR)

1. **Library**: Open `/blueprints` → see blueprint list → filter by category → filter by scope → filter by active status → search by name → click "Load More" → click a row → land in builder.
2. **Create blueprint**: Click "New Blueprint" → fill name AR + category + scope=Organization → submit → land in builder for the new blueprint → canvas shows "No stages yet".
3. **Add stages**: In builder → click "Add Stage" → fill name AR + stage type + assignment method + SLA policy → save → stage appears on canvas → select it → panel shows its fields.
4. **Edit stage**: Select a stage → change name → save → canvas updates.
5. **Reorder stages**: Use up/down controls → order changes on canvas → sequence badges update.
6. **Transitions**: Select a stage → in panel, check an advance target → transition created → check a return target → return transition created → uncheck → transition deleted.
7. **Sub-stages — panel**: Select a stage → expand sub-stages section → add sub-stage → fill name + SLA + is_required → save → sub-stage appears in list → reorder → delete.
8. **Sub-stages — canvas expand**: After adding sub-stages, click the expand chevron on the stage card → sub-stage list appears inline on canvas → click a sub-stage name → panel shows sub-stage edit form → reorder with up/down arrows → delete from context menu.
9. **Blueprint settings**: Click "Settings" → edit name + description → save → canvas header updates.
10. **Activate**: With at least 1 stage → click "Activate" → confirm → status badge becomes "Active".
11. **Deactivate**: Click "Deactivate" → confirm → status badge becomes "Inactive".
12. **Duplicate**: Click "Duplicate" → confirm → navigate to new blueprint builder → it's a copy with `is_active: false`, `is_locked: false`.
13. **Catalog**: Open `/blueprints/catalog` → Categories tab → create/edit/deactivate/reactivate → Stage Types tab → create custom/read-only system defaults → SLA Policies tab → create/edit/delete → verify they appear in builder Selects.

### Locked Blueprint

14. Open a locked blueprint (`is_locked: true`) → lock banner visible → all panel fields disabled → "Add Stage" hidden → reorder/delete hidden → "Deactivate" still works → "Duplicate" works.
15. **Delete blueprint**: In library row actions → click delete confirm → blueprint removed from list.
16. **Delete category**: In catalog → Categories tab → delete action on a category → confirm → category removed.

### Read-Only (view_library without manage)

17. Log in as a user with `blueprint.view_library` but not `blueprint.manage` → open builder → all fields read-only → no add/edit/delete/save actions → can still browse the canvas.

### Loading, Empty, Error States

18. Library loading → skeleton rows. Builder loading → skeleton split view. Catalog loading → skeleton rows (from `CatalogSkeleton` in shared `catalog-table.tsx`).
19. Library with zero blueprints → empty state with CTA. Builder canvas with zero stages → empty state with "Add Stage".
20. Network error → ErrorState with retry. 403 → "no permission" empty state. 404 (builder) → "blueprint not found" empty state.

### Permission-Gated UI

21. User without `blueprint.create.*` → "New Blueprint" button hidden.
22. User without `blueprint.manage` → row actions hidden; catalog mutations hidden; "Catalog" nav item hidden.

### Responsive

23. Mobile (<1024px): Library → card list. Builder → canvas stacks, panel in Sheet. Catalog → card lists.
24. Desktop (≥1024px): Library → full table. Builder → split view with sticky panel (w-96). Catalog → full tables.

### Keyboard Navigation

25. Tab through library table rows → Enter opens builder. Tab through stage cards → Enter/Space selects → panel loads. Tab through panel fields → all operable. Dialogs trap focus, Escape closes.

### Canvas Sub-stage Interactions

26. Stage card with sub-stages → click expand chevron → inline sub-stage list appears below the card (max 5 shown, "+N more" for overflow) → click a sub-stage name → panel switches to inline sub-stage edit form with back button → navigate back to stage panel.
27. Canvas sub-stage reorder → hover reveals up/down arrows → click to reorder → toast "Sub-stages reordered" → canvas updates (uses `apiClient.post` directly with `queryClient.invalidateQueries` for the canvas, not the hook).
28. Canvas sub-stage delete → hover reveals context menu → click delete → `ConfirmDeleteDialog` (shared component) confirms → on confirm → sub-stage removed.

---

→ **Next:** After implementation, run the review checklist (spec + plan) and generate an issues report.
