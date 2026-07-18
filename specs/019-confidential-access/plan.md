# Implementation Plan: 019 Confidential Access

> **Spec:** `specs/019-confidential-access/spec.md`
> **Date:** 2026-07-17
> **Status:** `completed`

---

## Open Questions Resolved

| # | Spec Open Question | Decision | Rationale |
|---|-------------------|----------|-----------|
| 1 | Metadata endpoint path: spec says `/confidential-metadata`; OpenAPI shows `/metadata`. | **Use `/v1/tasks/{task}/metadata` per OpenAPI.** The backend team initially said `/confidential-metadata` but the OpenAPI is the deployed contract. | The OpenAPI contract is the source of truth. The backend documentation was incorrect. |
| 2 | `ScopeType` serialization: spec says strings (`tenant`, `specific_department`, `department_tree`); OpenAPI request uses integer enum. | **Request sends integer codes (1, 3, 4); response returns strings.** Use a local `GOVERNANCE_SCOPE_KEY_MAP` for display/submission. | Generated `StoreConfidentialGovernanceParticipantRequest.scope_type` is `ScopeType` (`1 | 2 | 3 | 4 | 5 | 6`). The response resource returns `scope_type: string`. |
| 3 | Classification level values for governance form. | **Default to `3` (Confidential).** Use `ClassificationLevel` generated type (1\|2\|3). | Matches spec and OpenAPI. |
| 4 | `ClassificationBadge` confidential variant styling. | **Muted text style (same as internal), `LockKeyhole` icon.** Kept as muted `<span>` — no colored badge. | Per user request. Confidential uses same muted style as internal to avoid visual clutter. |
| 5 | Where to place the confidential participant card in task detail. | **Sidebar, below `DetailsCard`**, only when task is confidential AND user has management rights or is initiator. | Follows existing two-column stacked-card pattern; keeps confidential controls grouped. |
| 6 | Governance page sidebar placement. | **Top-level Admin group item "Governance Participants" (`/admin/confidential-governance`).** | Already resolved in spec; consistent with current admin group pattern. |
| 7 | Reuse `UserSearchCombobox` for participant add? | **Yes, reuse `components/domain/tasks/user-search-combobox.tsx` unchanged.** | It already supports single-select, debounce, label resolution, and generated types. |
| 8 | Override session persistence. | **Component `useState` only; no Zustand/localStorage.** Discarded on navigation per backend single-request semantics. | Matches security policy: no confidential task content stored client-side. |

---

## Technical Approach

**One-line summary:** Extend the task detail page to handle confidential metadata, participant management, and audited override sessions; add a confidential `ClassificationBadge` variant (muted style, same as internal) across the board and task-creation explainer; build a new `/admin/confidential-governance` catalog page for governance participant rules — all using generated OpenAPI types, the query-key factory, `useInfiniteQuery`, and capability-gated UI.

**Key decisions:**
- **Metadata-first fallback:** `TaskDetail` first calls `useTaskDetail`. On a 403, it attempts `useTaskMetadata`; success renders the metadata-only layout; 404 renders not-found; other errors render `ErrorState`.
- **No optimistic updates:** Participant add/remove and governance CRUD invalidate cache on success; the server is the source of truth for active/revoked state.
- **Single-request override:** `useAccessOverride` returns a full `TaskDetailResource`; the orchestrator swaps to normal detail view and shows a persistent amber banner. No cache write; session lives in React state.
- **Governance scope integer mapping:** Form displays string keys (`tenant`, `specific_department`, `department_tree`) with translations; submit converts to `ScopeType` integers 1, 3, 4. `own_department` (2) and `own_tasks` (5) are excluded from the select.
- **ClassificationBadge refactor:** Confidential variant uses muted `<span>` style (same as internal) with `LockKeyhole` icon. Appears first in badge rows. No colored `Badge` wrapper.
- **Capability UX gating only:** `task.confidential.manage_participants`, `task.confidential.view_metadata`, `task.confidential.view_override`, `iam.manage_capabilities` hide/disable UI; server still enforces ABAC.

---

## Component Tree

```
app/(dashboard)/
├── tasks/
│   └── [publicId]/
│       └── page.tsx                     [Server] TaskDetailPage (no change except metadata-capable title)
│       └── error.tsx                    [Client] Route error boundary (existing)
├── admin/
│   └── confidential-governance/
│       └── page.tsx                     [Client] (PageHeader + GovernanceParticipantsManager)

components/domain/tasks/
├── task-detail.tsx                      [Client] MODIFIED — orchestrates detail vs metadata vs override
├── title-meta-card.tsx                  [Client] MODIFIED — lock icon + classification badge ordering
├── task-badges.tsx                      [Client] MODIFIED — ClassificationBadge purple confidential variant
├── task-form-fields.tsx                 [Client] MODIFIED — confidential explainer Alert
├── confidential-participants-card.tsx   [Client] NEW — sidebar participant list + add/remove
├── confidential-participant-item.tsx    [Client] NEW — avatar + name + remove button
├── confidential-metadata-page.tsx       [Client] NEW — restricted metadata-only layout
├── task-override-session.tsx            [Client] NEW — wraps normal detail with override banner + dialog
├── access-override-dialog.tsx           [Client] NEW — AlertDialog with reason Textarea
├── confidential-participants-skeleton.tsx [Client] NEW
├── task-metadata-skeleton.tsx           [Client] NEW

components/domain/admin/
├── governance-participants-manager.tsx  [Client] NEW — table/list + filters + Load More
├── governance-rule-form-dialog.tsx      [Client] NEW — create/edit FormDialog
├── governance-participant-row.tsx       [Client] NEW — desktop row + actions
├── governance-participant-mobile-card.tsx [Client] NEW — mobile card
├── governance-table-skeleton.tsx        [Client] NEW

lib/api/hooks/
├── use-task-detail.ts                   [Client] MODIFIED — add participant + metadata + override hooks
├── use-confidential-governance.ts       [Client] NEW — governance CRUD + list

components/domain/shell/
├── app-sidebar.tsx                      [Client] MODIFIED — add "Governance Participants" admin item
├── use-page-breadcrumb.ts               [Client] MODIFIED — add /admin/confidential-governance crumb

messages/
├── ar.json                              [MODIFIED] — add `confidential.*` namespace
├── en.json                              [MODIFIED] — add `confidential.*` namespace
```

**Server vs Client:**
- **Server:** none new; task detail page remains a thin Server Component rendering client orchestrators.
- **Client:** all new/modified UI components above (queries, forms, dialogs, interactivity).

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `app/(dashboard)/admin/confidential-governance/page.tsx` | Admin route page: `PageHeader` + `GovernanceParticipantsManager`. |
| `components/domain/tasks/confidential-participants-card.tsx` | Sidebar card for confidential participant list + add UI. |
| `components/domain/tasks/confidential-participant-item.tsx` | Single participant row (avatar, name, position, remove). |
| `components/domain/tasks/confidential-metadata-page.tsx` | Full metadata-only restricted layout. |
| `components/domain/tasks/task-override-session.tsx` | Override state wrapper + amber banner + `AccessOverrideDialog`. |
| `components/domain/tasks/access-override-dialog.tsx` | AlertDialog with mandatory reason Textarea. |
| `components/domain/tasks/confidential-participants-skeleton.tsx` | 3-row skeleton for participant card. |
| `components/domain/tasks/task-metadata-skeleton.tsx` | Skeleton matching metadata layout. |
| `components/domain/admin/governance-participants-manager.tsx` | Cursor-paginated governance config table/list. |
| `components/domain/admin/governance-rule-form-dialog.tsx` | Create/edit governance rule FormDialog. |
| `components/domain/admin/governance-participant-row.tsx` | Desktop table row with actions. |
| `components/domain/admin/governance-participant-mobile-card.tsx` | Mobile card layout. |
| `components/domain/admin/governance-table-skeleton.tsx` | Skeleton for governance table. |
| `lib/api/hooks/use-confidential-governance.ts` | Governance participant query + mutation hooks. |

### Modified Files

| File | Change |
|------|--------|
| `lib/api/query-keys.ts` | Add `tasks.confidentialParticipants(publicId)` and `tasks.metadata(publicId)`. |
| `lib/api/query-keys-extra.ts` | Add `iam.governanceParticipants(filters)`. |
| `lib/api/hooks/use-task-detail.ts` | Add `useConfidentialParticipantsInfinite`, `useTaskMetadata`, `useAccessOverride`, `useAddConfidentialParticipant`, `useRemoveConfidentialParticipant`. |
| `components/domain/tasks/task-detail.tsx` | Handle 403 → metadata fallback; render participant card; support override session prop/state. |
| `components/domain/tasks/title-meta-card.tsx` | Add lock icon next to title; ensure `ClassificationBadge` confidential variant appears first. |
| `components/domain/tasks/task-badges.tsx` | Refactor `ClassificationBadge` to return a purple outlined `Badge` for confidential; keep public/internal muted. |
| `components/domain/tasks/task-form-fields.tsx` | Show confidential classification explainer `Alert` when `classificationLevel === 3`. |
| `components/domain/shell/app-sidebar.tsx` | Add "Governance Participants" admin nav item gated by `iam.manage_capabilities`. |
| `components/domain/shell/use-page-breadcrumb.ts` | Add `/admin/confidential-governance` crumb. |
| `messages/ar.json` | Add `confidential.*` namespace (~70 keys). |
| `messages/en.json` | Add `confidential.*` namespace (~70 keys). |

### shadcn Components (already installed)

- `alert` — info/amber explainer alerts.
- `alert-dialog` — override reason dialog.
- `dialog` — governance create/edit dialog.
- `textarea` — override reason input.
- `badge` — classification badge.

---

## Implementation Notes

### 0. Query Keys

**Files:** `lib/api/query-keys.ts`, `lib/api/query-keys-extra.ts`

**Summary:** Add namespaced query keys for confidential participants, metadata, and governance config using the factory pattern.

**Rules applied:** `coding-standards.md` § Query Key Factory (no hardcoded strings).

```ts
// lib/api/query-keys.ts — inside tasks namespace
confidentialParticipants: (publicId: string) =>
  [...queryKeys.tasks.detail(publicId), 'confidential-participants'] as const,
metadata: (publicId: string) =>
  [...queryKeys.tasks.detail(publicId), 'metadata'] as const,
```

```ts
// lib/api/query-keys-extra.ts — inside extraQueryKeys
iam: {
  governanceParticipants: (filters?: Record<string, unknown>) =>
    ['iam', 'governance-participants', filters] as const,
},
```

---

### 1. Task Detail Hooks — `lib/api/hooks/use-task-detail.ts`

**Summary:** Extend the existing hook file with participant, metadata, and override queries/mutations.

**Key decisions:**
- Participant list uses `useInfiniteQuery` with cursor pagination.
- Metadata uses `useQuery` with `enabled: !!publicId`; called only after a 403 from detail.
- Override uses `useMutation`; no cache invalidation — the response is consumed by the caller.
- Add/remove mutations invalidate `queryKeys.tasks.confidentialParticipants(publicId)`.
- All mutation errors use `toast.error()`.

**Rules applied:** `coding-standards.md` § Generated types only, query key factory, cursor pagination, mutation invalidation.

```ts
import type { CursorPage } from '@/lib/api/types';

// Add to existing type imports from components['schemas']
type ConfidentialParticipantResource = components['schemas']['ConfidentialParticipantResource'];
type StoreConfidentialParticipantRequest = components['schemas']['StoreConfidentialParticipantRequest'];
type AccessOverrideRequest = components['schemas']['AccessOverrideRequest'];
type TaskMetadataResource = {
  public_id: string;
  classification_level: string;
  title: string;
  owning_department: string;
  current_responsible_position: string;
  status: string;
  due_date: string;
  sla_health: string | null;
  metadata_only: boolean;
};

export function useConfidentialParticipantsInfinite(taskPublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.confidentialParticipants(taskPublicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<ConfidentialParticipantResource>>(
        `/v1/tasks/${taskPublicId}/confidential-participants`,
        { params: { cursor: pageParam, per_page: 15 } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    enabled: !!taskPublicId,
    staleTime: 30 * 1000,
  });
}

export function useTaskMetadata(taskPublicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.metadata(taskPublicId),
    queryFn: () => apiClient.get<TaskMetadataResource>(`/v1/tasks/${taskPublicId}/metadata`),
    enabled: !!taskPublicId,
    retry: (failureCount, error) => {
      if (error instanceof ApiRequestError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useAddConfidentialParticipant(taskPublicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('confidential.participants.toast');
  return useMutation({
    mutationFn: (body: StoreConfidentialParticipantRequest) =>
      apiClient.post<ConfidentialParticipantResource>(
        `/v1/tasks/${taskPublicId}/confidential-participants`,
        body,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.confidentialParticipants(taskPublicId) });
      toast.success(t('added'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemoveConfidentialParticipant(taskPublicId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('confidential.participants.toast');
  return useMutation({
    mutationFn: (userPublicId: string) =>
      apiClient.delete(`/v1/tasks/${taskPublicId}/confidential-participants/${userPublicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.confidentialParticipants(taskPublicId) });
      toast.success(t('removed'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAccessOverride(taskPublicId: string) {
  const t = useTranslations('confidential.override.toast');
  return useMutation({
    mutationFn: (body: AccessOverrideRequest) =>
      apiClient.post<TaskDetailResource>(`/v1/tasks/${taskPublicId}/access-override`, body),
    onSuccess: () => {
      toast.success(t('opened'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
```

**Test cases:**
1. `useConfidentialParticipantsInfinite('task-1')` calls `/v1/tasks/task-1/confidential-participants` and merges pages via `flatMap`.
2. `useAccessOverride('task-1').mutate({ reason: 'investigation required' })` POSTs to `/v1/tasks/task-1/access-override` and returns `TaskDetailResource`.

---

### 2. ClassificationBadge Confidential Variant — `components/domain/tasks/task-badges.tsx`

**Summary:** Refactor `ClassificationBadge` so confidential tasks render a prominent purple outlined badge; public/internal remain subtle.

**Key decisions:**
- Use `Badge variant="outline"` for confidential to satisfy "primary visual signal" requirement.
- Lock icon is non-directional and does NOT flip.
- Add `role="status"` and `aria-label`.
- Keep public/internal as plain text + icon to avoid visual noise on non-confidential tasks.

**Rules applied:** `coding-standards.md` § Generated types; `design-system/05-accessibility.md` § color + label, `aria-label`; `04-layout-patterns.md` § logical properties.

```tsx
export function ClassificationBadge({ level }: { level?: string | number | null }) {
  const t = useTranslations('tasks.board.classification');
  const key = level != null ? (CLASSIFICATION_MAP[String(level)] ?? String(level)) : null;
  const isPublic = !key || key === 'public';
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', isPublic ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
      {key === 'confidential' ? (
        <LockKeyhole className="size-3" aria-hidden="true" />
      ) : isPublic ? (
        <Globe className="size-3" aria-hidden="true" />
      ) : (
        <Shield className="size-3" aria-hidden="true" />
      )}
      {t(isPublic ? 'public' : key)}
    </span>
  );
}
```

**Test cases:**
1. `<ClassificationBadge level={3} />` renders muted text with ``LockKeyhole`` icon and "سري" / "Confidential" text.
2. `<ClassificationBadge level={1} />` renders muted text with globe icon and no border.

---

### 3. Title & Meta Card — `components/domain/tasks/title-meta-card.tsx`

**Summary:** Render a lock icon adjacent to the title for confidential tasks and ensure the confidential classification badge appears first in the badge row.

**Key decisions:**
- Lock icon is decorative (`aria-hidden="true"`) because the badge is the semantic indicator.
- Badge order: Classification → Priority → Status → SLA (confidential becomes primary signal).

**Rules applied:** `coding-standards.md` § Logical properties; `security-policy.md` § no PII logging; `05-accessibility.md` § decorative icon hidden.

```tsx
import { LockKeyhole } from 'lucide-react';

const isConfidential = String(task.classification_level) === '3';

// Inside CardHeader title area:
<div className="flex items-center gap-2">
  {isConfidential && <LockKeyhole className="size-5 text-purple-600" aria-hidden="true" />}
  <h1 className="text-xl font-bold text-foreground">{title}</h1>
</div>

// Badge row:
<div className="flex flex-wrap items-center gap-1.5">
  <ClassificationBadge level={task.classification_level} />
  <PriorityBadge priority={task.priority} />
  <TaskStatusBadge status={task.status} />
  <SlaBadge health={slaHealth} status={task.status} />
</div>
```

**Test cases:**
1. Confidential task renders `LockKeyhole` icon next to title and purple badge first.
2. Non-confidential task renders no lock icon and muted classification indicator.

---

### 4. Confidential Participants Card — `components/domain/tasks/confidential-participants-card.tsx`

**Summary:** Sidebar card listing active named participants with cursor pagination, add/remove UI, and capability/initiator gating.

**Key decisions:**
- Card is shown when `isConfidential && (isInitiator || canManageParticipants)`.
- List endpoint 403 hides the entire card (server enforces visibility).
- Add uses `UserSearchCombobox`; selecting a user immediately calls `useAddConfidentialParticipant`.
- Remove opens `ConfirmDeleteDialog`; confirm calls `useRemoveConfidentialParticipant`.
- Active participants only: filter out rows where `removed_at` is non-null (defensive; server should only return active).

**Rules applied:** `coding-standards.md` § All 4 states, cursor pagination, `useCapability`, `toast.error`, generated types; `05-accessibility.md` § `role="list"`/`listitem`, `aria-label` on remove button.

```tsx
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { UserX, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { UserSearchCombobox } from './user-search-combobox';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import {
  useConfidentialParticipantsInfinite,
  useAddConfidentialParticipant,
  useRemoveConfidentialParticipant,
} from '@/lib/api/hooks/use-task-detail';
import { ConfidentialParticipantsSkeleton } from './confidential-participants-skeleton';
import { localizeName } from '@/lib/utils/localize';
import type { ConfidentialParticipantResource } from '@/lib/generated/api-types';

interface Props {
  taskPublicId: string;
  initiatorId: string;
}

export function ConfidentialParticipantsCard({ taskPublicId, initiatorId }: Props) {
  const t = useTranslations('confidential.participants');
  const locale = useLocale();
  const { data: user } = useCurrentUser();
  const canManage = useCapability('task.confidential.manage_participants');
  const isInitiator = user?.public_id === initiatorId;
  const canManageHere = isInitiator || canManage;

  const query = useConfidentialParticipantsInfinite(taskPublicId);
  const add = useAddConfidentialParticipant(taskPublicId);
  const remove = useRemoveConfidentialParticipant(taskPublicId);
  const [removeTarget, setRemoveTarget] = useState<ConfidentialParticipantResource | null>(null);

  if (query.isError) return null; // Hide card if list is forbidden
  if (query.isLoading) return <ConfidentialParticipantsSkeleton />;

  const participants = query.data?.pages.flatMap((p) => p.data).filter((p) => !p.removed_at) ?? [];

  function handleAdd(userPublicId: string) {
    if (!userPublicId) return;
    add.mutate({ user_id: userPublicId });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManageHere && (
          <UserSearchCombobox
            value=""
            onChange={handleAdd}
            placeholder={t('add_placeholder')}
          />
        )}

        {participants.length === 0 ? (
          <EmptyState
            icon={UserX}
            title={t('empty_title')}
            description={t('empty_description')}
          />
        ) : (
          <ul className="space-y-3" role="list">
            {participants.map((p) => {
              const name = localizeName(locale, p.user.name_ar, p.user.name_en);
              return (
                <li key={p.user.public_id} className="flex items-center justify-between gap-2" role="listitem">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{name}</span>
                  </div>
                  {canManageHere && (
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="text-destructive"
                      aria-label={t('remove_aria', { name })}
                      onClick={() => setRemoveTarget(p)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {query.hasNextPage && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? t('loading') : t('load_more')}
          </Button>
        )}

        <ConfirmDeleteDialog
          open={!!removeTarget}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          title={t('remove_title')}
          description={t('remove_description', { name: removeTarget ? localizeName(locale, removeTarget.user.name_ar, removeTarget.user.name_en) : '' })}
          confirmLabel={t('remove_confirm')}
          cancelLabel={t('remove_cancel')}
          onConfirm={() => {
            if (removeTarget) remove.mutate(removeTarget.user.public_id);
            setRemoveTarget(null);
          }}
        />
      </CardContent>
    </Card>
  );
}
```

**Test cases:**
1. User is initiator, list returns 2 participants → card renders participants + add combobox + remove buttons.
2. User is not initiator and lacks `task.confidential.manage_participants` → card is not rendered (or rendered read-only without add/remove).

---

### 5. Metadata-Only Layout — `components/domain/tasks/confidential-metadata-page.tsx`

**Summary:** Restricted detail view shown when `useTaskDetail` returns 403 and `useTaskMetadata` succeeds.

**Key decisions:**
- No sidebar, no stage timeline, no lifecycle actions.
- Shows classification badge, lock icon, title, department, status, SLA health, due date, responsible position.
- Amber alert explains restricted metadata-only access.
- Override button shown only if user has `task.confidential.view_override`.

**Rules applied:** `coding-standards.md` § All 4 states, logical properties, `useCapability`; `05-accessibility.md` § alert role.

```tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SlaBadge, TaskStatusBadge, ClassificationBadge } from './task-badges';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import type { TaskMetadataResource } from './task-detail-types';

interface Props {
  metadata: TaskMetadataResource;
  taskPublicId: string;
  onRequestOverride: () => void;
}

export function ConfidentialMetadataPage({ metadata, onRequestOverride }: Props) {
  const t = useTranslations('confidential.metadata');
  const locale = useLocale();
  const canOverride = useCapability('task.confidential.view_override');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Alert variant="warning" role="alert">
        <AlertTitle>{t('alert_title')}</AlertTitle>
        <AlertDescription>{t('alert_description')}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <ClassificationBadge level={metadata.classification_level} />
          </div>
          <div className="flex items-center gap-2">
            <LockKeyhole className="size-5 text-purple-600" aria-hidden="true" />
            <h1 className="text-xl font-bold">{metadata.title}</h1>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetadataRow label={t('department')} value={metadata.owning_department} />
          <MetadataRow label={t('responsible_position')} value={metadata.current_responsible_position} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('status')}</span>
            <TaskStatusBadge status={metadata.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('sla_health')}</span>
            <SlaBadge health={metadata.sla_health ?? 'none'} status={metadata.status} />
          </div>
          <MetadataRow label={t('due_date')} value={metadata.due_date} />

          {canOverride && (
            <Button onClick={onRequestOverride} className="w-full sm:w-auto">
              {t('open_content')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
```

**Test cases:**
1. Renders metadata fields + amber alert; override button visible when capability present.
2. Does not render sidebar, timeline, or participant card.

---

### 6. Access Override Dialog — `components/domain/tasks/access-override-dialog.tsx`

**Summary:** AlertDialog collecting a mandatory reason (min 10 chars per OpenAPI; spec says 20 — follow generated contract and add client-side guard matching OpenAPI).

**Key decisions:**
- Use `AlertDialog` (not `Dialog`) for the audited-security pattern.
- Focus moves to Textarea on open via `useEffect` + ref.
- Escape closes without submitting (Radix default).
- Client validation: reason < 10 chars → `toast.error(t('reason_too_short'))`.

**Rules applied:** `coding-standards.md` § Form handling via shadcn Field/Textarea; validation via `toast.error`; `05-accessibility.md` § focus trap, `aria-required`, `aria-describedby`.

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export function AccessOverrideDialog({ open, onOpenChange, onConfirm, isPending }: Props) {
  const t = useTranslations('confidential.override');
  const [reason, setReason] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setTimeout(() => ref.current?.focus(), 0);
    }
  }, [open]);

  function handleConfirm() {
    if (reason.trim().length < 10) {
      toast.error(t('reason_too_short'));
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <Alert variant="warning">
          <AlertDescription>{t('audit_notice')}</AlertDescription>
        </Alert>
        <Field>
          <FieldLabel>{t('reason_label')}</FieldLabel>
          <Textarea
            ref={ref}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('reason_placeholder')}
            aria-required="true"
            aria-describedby="reason-hint"
            disabled={isPending}
          />
          <p id="reason-hint" className="text-xs text-muted-foreground">{t('reason_hint')}</p>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isPending}>{t('cancel')}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {t('confirm')}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Test cases:**
1. Clicking Confirm with reason "test" (4 chars) shows `toast.error(t('reason_too_short'))` and does not call `onConfirm`.
2. Typing a 15-character reason and confirming calls `onConfirm(reason)`.

---

### 7. Override Session Wrapper — `components/domain/tasks/task-override-session.tsx`

**Summary:** Renders the normal task detail inside an override session with a persistent amber banner showing the reason.

**Key decisions:**
- Receives `task` from `useAccessOverride` success response.
- Banner uses `role="alert"` and `animate-in slide-in-from-top`.
- Discards session when component unmounts (no persistence).

**Rules applied:** `coding-standards.md` § Local state for single-component toggle; `05-accessibility.md` § alert role; `01-tokens.md` § motion reduced.

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { TaskDetailResource } from '@/lib/generated/api-types';

interface Props {
  task: TaskDetailResource;
  reason: string;
  taskPublicId: string;
  children: React.ReactNode;
}

export function TaskOverrideSession({ reason, children }: Props) {
  const t = useTranslations('confidential.override');

  return (
    <div className="space-y-4">
      <Alert
        variant="warning"
        role="alert"
        className="animate-in slide-in-from-top duration-300 motion-reduce:animate-none"
      >
        <ShieldAlert className="size-4" aria-hidden="true" />
        <AlertTitle>{t('session_title')}</AlertTitle>
        <AlertDescription>{t('session_description', { reason })}</AlertDescription>
      </Alert>
      {children}
    </div>
  );
}
```

**Test cases:**
1. Renders amber banner with the override reason above the task detail content.
2. Banner does not flip icon in RTL (ShieldAlert is non-directional).

---

### 8. Task Detail Orchestrator — `components/domain/tasks/task-detail.tsx`

**Summary:** Add 403 → metadata fallback, participant card conditional rendering, and override session state management.

**Key decisions:**
- On 403 from detail, render metadata view using `useTaskMetadata`.
- On override success, swap to `TaskOverrideSession` wrapping the normal detail layout.
- Participant card receives `taskPublicId` and `task.initiator_id`.
- If metadata also 404, render not-found `EmptyState`.

**Rules applied:** `coding-standards.md` § All 4 states, `useCapability`, generated types, no API data in Zustand.

```tsx
// Add imports
import {
  useTaskMetadata,
  useAccessOverride,
} from '@/lib/api/hooks/use-task-detail';
import { ConfidentialParticipantsCard } from './confidential-participants-card';
import { ConfidentialMetadataPage } from './confidential-metadata-page';
import { TaskOverrideSession } from './task-override-session';
import { AccessOverrideDialog } from './access-override-dialog';

export function TaskDetail({ publicId }: TaskDetailProps) {
  // ... existing hooks ...
  const metadataQuery = useTaskMetadata(publicId);
  const override = useAccessOverride(publicId);
  const [overrideState, setOverrideState] = useState<{ active: boolean; reason: string; task: TaskDetailResource | null }>({ active: false, reason: '', task: null });
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  // ... existing loading/error handling ...

  if (detailQuery.isError && detailQuery.error instanceof ApiRequestError && detailQuery.error.status === 403) {
    if (metadataQuery.isLoading) return <TaskMetadataSkeleton />;
    if (metadataQuery.isError) {
      const err = metadataQuery.error;
      if (err instanceof ApiRequestError && err.status === 404) {
        return <EmptyState icon={FileQuestion} title={t('not_found_title')} description={t('not_found_description')} />;
      }
      return <ErrorState message={t('error')} onRetry={() => metadataQuery.refetch()} />;
    }
    if (!metadataQuery.data) return <TaskMetadataSkeleton />;
    return (
      <>
        <ConfidentialMetadataPage
          metadata={metadataQuery.data}
          taskPublicId={publicId}
          onRequestOverride={() => setOverrideDialogOpen(true)}
        />
        <AccessOverrideDialog
          open={overrideDialogOpen}
          onOpenChange={setOverrideDialogOpen}
          isPending={override.isPending}
          onConfirm={(reason) => {
            override.mutate({ reason }, {
              onSuccess: (data) => {
                setOverrideState({ active: true, reason, task: data });
                setOverrideDialogOpen(false);
              },
            });
          }}
        />
      </>
    );
  }

  const task = overrideState.active && overrideState.task ? overrideState.task : detailQuery.data;
  if (!task) return <TaskDetailSkeleton />;

  const isConfidential = String(task.classification_level) === '3';
  const detailContent = (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <TitleMetaCard task={task} slaHealth={slaHealth} publicId={publicId} />
        <StageTimeline stages={task.stages} ... />
        <TaskCommentsCard publicId={publicId} />
      </div>
      <div className="space-y-5 lg:col-span-1">
        <div className="space-y-5 lg:sticky lg:top-20">
          <DetailsCard task={task} />
          {isConfidential && (
            <ConfidentialParticipantsCard taskPublicId={publicId} initiatorId={task.initiator_id} />
          )}
          <TaskExternalReferencesCard publicId={publicId} />
          <TaskDocumentsCard publicId={publicId} />
          <RecentActivityCard ... />
        </div>
      </div>
    </div>
  );

  return overrideState.active ? (
    <TaskOverrideSession task={task} reason={overrideState.reason} taskPublicId={publicId}>
      {detailContent}
    </TaskOverrideSession>
  ) : detailContent;
}
```

**Test cases:**
1. `useTaskDetail` 403 + metadata success → renders `ConfidentialMetadataPage`.
2. Override confirmed → renders normal detail wrapped in `TaskOverrideSession` with amber banner.

---

### 9. Task Creation Confidential Explainer — `components/domain/tasks/task-form-fields.tsx`

**Summary:** Show an info `Alert` below the classification/due-date row when classification is confidential.

**Rules applied:** `coding-standards.md` § shadcn `Alert`; `05-accessibility.md` § info alert.

```tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const classificationLevel = useTaskFormStore((s) => s.classificationLevel);

{classificationLevel === 3 && (
  <Alert variant="info">
    <Info className="size-4" aria-hidden="true" />
    <AlertDescription>{t('confidential_explainer')}</AlertDescription>
  </Alert>
)}
```

**Test cases:**
1. Select "Confidential" → info alert appears.
2. Switch to "Public" → alert disappears.

---

### 10. Governance Participant Hooks — `lib/api/hooks/use-confidential-governance.ts`

**Summary:** New hook file for governance participant list and CRUD mutations.

**Key decisions:**
- List uses `useInfiniteQuery` with `staleTime: 30s`.
- Create/update/revoke invalidate `extraQueryKeys.iam.governanceParticipants()` prefix.
- Revoke is a POST, not DELETE.

**Rules applied:** `coding-standards.md` § Query key factory, cursor pagination, mutation invalidation, generated types.

```ts
'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { extraQueryKeys } from '@/lib/api/query-keys-extra';
import type { CursorPage } from '@/lib/api/types';
import type { components } from '@/lib/generated/api-types';

type GovernanceResource = components['schemas']['ConfidentialGovernanceParticipantResource'];
type StoreRequest = components['schemas']['StoreConfidentialGovernanceParticipantRequest'];
type UpdateRequest = components['schemas']['UpdateConfidentialGovernanceParticipantRequest'];

export interface GovernanceFilters {
  scope_type?: string;
  status?: 'active' | 'revoked';
}

export function useGovernanceParticipantsInfinite(filters: GovernanceFilters = {}) {
  return useInfiniteQuery({
    queryKey: extraQueryKeys.iam.governanceParticipants(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<GovernanceResource>>('/v1/iam/confidential-governance-participants', {
        params: { ...filters, cursor: pageParam, per_page: 15 },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 30 * 1000,
  });
}

export function useCreateGovernanceParticipant() {
  const qc = useQueryClient();
  const t = useTranslations('confidential.governance.toast');
  return useMutation({
    mutationFn: (body: StoreRequest) =>
      apiClient.post<GovernanceResource>('/v1/iam/confidential-governance-participants', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: extraQueryKeys.iam.governanceParticipants() });
      toast.success(t('created'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateGovernanceParticipant(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('confidential.governance.toast');
  return useMutation({
    mutationFn: (body: UpdateRequest) =>
      apiClient.put<GovernanceResource>(`/v1/iam/confidential-governance-participants/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: extraQueryKeys.iam.governanceParticipants() });
      toast.success(t('updated'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRevokeGovernanceParticipant(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('confidential.governance.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post<GovernanceResource>(`/v1/iam/confidential-governance-participants/${publicId}/revoke`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: extraQueryKeys.iam.governanceParticipants() });
      toast.success(t('revoked'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
```

**Test cases:**
1. `useGovernanceParticipantsInfinite({})` calls `/v1/iam/confidential-governance-participants` and exposes `hasNextPage`.
2. `useRevokeGovernanceParticipant('gp-1').mutate()` POSTs to `/v1/iam/confidential-governance-participants/gp-1/revoke` and invalidates the list.

---

### 11. Governance Form Dialog — `components/domain/admin/governance-rule-form-dialog.tsx`

**Summary:** Create/edit dialog with position picker, scope type select, conditional department select, optional blueprint category, and classification level.

**Key decisions:**
- Scope options limited to `tenant` (1), `specific_department` (3), `department_tree` (4).
- Department select hidden when scope is `tenant`.
- Position select uses `usePositionsInfinite` or `useOrganization` bounded position query; for MVP use existing `usePositionsInfinite` with a small page or `useDepartmentTree` + positions. <!-- TODO: verify positions endpoint supports name search -->
- Submit converts scope string key to integer code.

**Rules applied:** `coding-standards.md` § shadcn Field + RtlSelect, validation via `toast.error`, generated types.

```ts
const GOVERNANCE_SCOPE_OPTIONS = [
  { key: 'tenant', code: 1 },
  { key: 'specific_department', code: 3 },
  { key: 'department_tree', code: 4 },
] as const;

type ScopeKey = typeof GOVERNANCE_SCOPE_OPTIONS[number]['key'];
```

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { usePositionsInfinite } from '@/lib/api/hooks/use-organization';
import { useDepartmentsInfinite } from '@/lib/api/hooks/use-organization';
import { useBlueprintCategories } from '@/lib/api/hooks/use-blueprints';
import { useCreateGovernanceParticipant, useUpdateGovernanceParticipant } from '@/lib/api/hooks/use-confidential-governance';
import { localizeName } from '@/lib/utils/localize';
import { toast } from 'sonner';
import type { ConfidentialGovernanceParticipantResource } from '@/lib/generated/api-types';

const GOVERNANCE_SCOPE_OPTIONS = [
  { key: 'tenant', code: 1 },
  { key: 'specific_department', code: 3 },
  { key: 'department_tree', code: 4 },
] as const;

type ScopeKey = typeof GOVERNANCE_SCOPE_OPTIONS[number]['key'];

interface Props {
  item?: ConfidentialGovernanceParticipantResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  position_id: string;
  scope_type: ScopeKey;
  scope_department_id: string;
  blueprint_category_id: string;
  applies_to_classification_level: '1' | '2' | '3';
}

function scopeKeyFromApi(value?: string): ScopeKey {
  const found = GOVERNANCE_SCOPE_OPTIONS.find((o) => o.key === value);
  return found?.key ?? 'tenant';
}

export function GovernanceRuleFormDialog({ item, open, onOpenChange }: Props) {
  const t = useTranslations('confidential.governance.form');
  const locale = useLocale();
  const isEdit = !!item;
  const create = useCreateGovernanceParticipant();
  const update = useUpdateGovernanceParticipant(item?.public_id ?? '');
  const positions = usePositionsInfinite({ per_page: 50 });
  const departments = useDepartmentsInfinite({});
  const categories = useBlueprintCategories();

  const [form, setForm] = useState<FormState>({
    position_id: '',
    scope_type: 'tenant',
    scope_department_id: '',
    blueprint_category_id: '',
    applies_to_classification_level: '3',
  });

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        position_id: item.position.public_id,
        scope_type: scopeKeyFromApi(item.scope_type),
        scope_department_id: item.scope_department?.public_id ?? '',
        blueprint_category_id: item.blueprint_category?.public_id ?? '',
        applies_to_classification_level: (String(item.applies_to_classification_level) as '1' | '2' | '3') || '3',
      });
    } else {
      setForm({
        position_id: '',
        scope_type: 'tenant',
        scope_department_id: '',
        blueprint_category_id: '',
        applies_to_classification_level: '3',
      });
    }
  }, [open, item]);

  const needsDepartment = form.scope_type !== 'tenant';

  function validate(): boolean {
    if (!form.position_id) { toast.error(t('position_required')); return false; }
    if (needsDepartment && !form.scope_department_id) { toast.error(t('department_required')); return false; }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const scopeCode = GOVERNANCE_SCOPE_OPTIONS.find((o) => o.key === form.scope_type)?.code ?? 1;
    const body = {
      position_id: form.position_id,
      scope_type: scopeCode,
      scope_department_id: needsDepartment ? form.scope_department_id : null,
      blueprint_category_id: form.blueprint_category_id || null,
      applies_to_classification_level: Number(form.applies_to_classification_level) as 1 | 2 | 3,
    };

    if (isEdit) {
      update.mutate(body, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  }

  const isPending = create.isPending || update.isPending;
  const allPositions = positions.data?.pages.flatMap((p) => p.data) ?? [];
  const allDepartments = departments.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>{t('position')}</FieldLabel>
            <RtlSelect value={form.position_id} onValueChange={(v) => setForm((f) => ({ ...f, position_id: v }))}>
              <SelectTrigger><SelectValue placeholder={t('select_position')} /></SelectTrigger>
              <SelectContent position="popper">
                {allPositions.map((p) => (
                  <SelectItem key={p.public_id} value={p.public_id}>
                    {localizeName(locale, p.title_ar, p.title_en)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>

          <Field>
            <FieldLabel>{t('scope_type')}</FieldLabel>
            <RtlSelect value={form.scope_type} onValueChange={(v) => setForm((f) => ({ ...f, scope_type: v as ScopeKey, scope_department_id: '' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                {GOVERNANCE_SCOPE_OPTIONS.map((o) => (
                  <SelectItem key={o.key} value={o.key}>{t(`scope_${o.key}`)}</SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>

          {needsDepartment && (
            <Field>
              <FieldLabel>{t('department')}</FieldLabel>
              <RtlSelect value={form.scope_department_id} onValueChange={(v) => setForm((f) => ({ ...f, scope_department_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t('select_department')} /></SelectTrigger>
                <SelectContent position="popper">
                  {allDepartments.map((d) => (
                    <SelectItem key={d.public_id} value={d.public_id}>
                      {localizeName(locale, d.name_ar, d.name_en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          )}

          <Field>
            <FieldLabel>{t('blueprint_category')}</FieldLabel>
            <RtlSelect value={form.blueprint_category_id || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, blueprint_category_id: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder={t('all_categories')} /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="none">{t('all_categories')}</SelectItem>
                {(categories.data ?? []).map((c) => (
                  <SelectItem key={c.public_id} value={c.public_id}>
                    {localizeName(locale, c.name_ar, c.name_en)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>

          <Field>
            <FieldLabel>{t('classification_level')}</FieldLabel>
            <RtlSelect value={form.applies_to_classification_level} onValueChange={(v) => setForm((f) => ({ ...f, applies_to_classification_level: v as '1' | '2' | '3' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{t('classification_public')}</SelectItem>
                <SelectItem value="2">{t('classification_internal')}</SelectItem>
                <SelectItem value="3">{t('classification_confidential')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>{t('cancel')}</Button>
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

**Test cases:**
1. Select scope "tenant" → department field hidden; submit sends `scope_department_id: null`.
2. Select scope "specific_department" without department → `toast.error(t('department_required'))`.

---

### 12. Governance Participants Manager — `components/domain/admin/governance-participants-manager.tsx`

**Summary:** Page-level orchestrator: table/cards, filters, empty/error/loading states, create/edit/revoke dialogs.

**Key decisions:**
- URL filters: `?scopeType=` and `?status=`.
- Mobile uses card list; desktop uses `RtlTable`.
- Revoke uses `ConfirmDeleteDialog` with revoke wording.

**Rules applied:** `coding-standards.md` § URL state, cursor pagination, all 4 states, `RtlTable`, `useCapability`.

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ShieldOff, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RtlTable } from '@/components/shared/rtl-table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { ActiveBadge } from '@/components/shared/active-badge';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useGovernanceParticipantsInfinite, useRevokeGovernanceParticipant } from '@/lib/api/hooks/use-confidential-governance';
import { GovernanceRuleFormDialog } from './governance-rule-form-dialog';
import { GovernanceParticipantRow } from './governance-participant-row';
import { GovernanceParticipantMobileCard } from './governance-participant-mobile-card';
import { GovernanceTableSkeleton } from './governance-table-skeleton';
import type { ConfidentialGovernanceParticipantResource } from '@/lib/generated/api-types';

export function GovernanceParticipantsManager() {
  const t = useTranslations('confidential.governance');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const canManage = useCapability('iam.manage_capabilities');

  const filters = useMemo(() => ({
    scope_type: searchParams.get('scopeType') ?? undefined,
    status: (searchParams.get('status') as 'active' | 'revoked') ?? undefined,
  }), [searchParams]);

  const query = useGovernanceParticipantsInfinite(filters);
  const revoke = useRevokeGovernanceParticipant('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ConfidentialGovernanceParticipantResource | null>(null);
  const [revokeItem, setRevokeItem] = useState<ConfidentialGovernanceParticipantResource | null>(null);

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleRevoke() {
    if (!revokeItem) return;
    useRevokeGovernanceParticipant(revokeItem.public_id).mutate(undefined, {
      onSuccess: () => setRevokeItem(null),
    });
  }

  if (query.isLoading) return <GovernanceTableSkeleton />;
  if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>{t('title')}</CardTitle>
            {canManage && (
              <Button onClick={() => { setEditItem(null); setDialogOpen(true); }}>
                <Plus className="me-2 size-4" /> {t('add_rule')}
              </Button>
            )}
          </div>
          {/* Filters omitted for brevity — URL-driven scope + status selects */}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState icon={ShieldOff} title={t('empty_title')} description={t('empty_description')} />
          ) : (
            <>
              <div className="hidden md:block">
                <RtlTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t('columns.position')}</TableHead>
                      <TableHead className="text-start">{t('columns.scope')}</TableHead>
                      <TableHead className="text-start">{t('columns.target')}</TableHead>
                      <TableHead className="text-start">{t('columns.category')}</TableHead>
                      <TableHead className="text-start">{t('columns.classification')}</TableHead>
                      <TableHead className="text-start">{t('columns.status')}</TableHead>
                      <TableHead className="text-end">{t('columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <GovernanceParticipantRow
                        key={item.public_id}
                        item={item}
                        canManage={canManage}
                        onEdit={() => { setEditItem(item); setDialogOpen(true); }}
                        onRevoke={() => setRevokeItem(item)}
                      />
                    ))}
                  </TableBody>
                </RtlTable>
              </div>
              <div className="md:hidden flex flex-col gap-4">
                {items.map((item) => (
                  <GovernanceParticipantMobileCard
                    key={item.public_id}
                    item={item}
                    canManage={canManage}
                    onEdit={() => { setEditItem(item); setDialogOpen(true); }}
                    onRevoke={() => setRevokeItem(item)}
                  />
                ))}
              </div>
              {query.hasNextPage && (
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                >
                  {query.isFetchingNextPage ? t('loading') : t('load_more')}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <GovernanceRuleFormDialog
        item={editItem ?? undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDeleteDialog
        open={!!revokeItem}
        onOpenChange={(open) => !open && setRevokeItem(null)}
        title={t('revoke_title')}
        description={t('revoke_description', { name: revokeItem ? localizeName(locale, revokeItem.position.title_ar, revokeItem.position.title_en) : '' })}
        confirmLabel={t('revoke_confirm')}
        cancelLabel={t('revoke_cancel')}
        onConfirm={handleRevoke}
      />
    </div>
  );
}
```

**Test cases:**
1. Empty list → `EmptyState` with "No rules configured" message.
2. Populated list → desktop table on `md+`, cards on mobile; Load More when `has_more`.

---

### 13. Shell Changes

**`components/domain/shell/app-sidebar.tsx`** — add admin item:

```tsx
const canManageGovernance = useCapability('iam.manage_capabilities');

{...(canManageGovernance ? [{ title: tnav('governance_participants'), url: '/admin/confidential-governance', icon: Shield }] : [])}
```

**`components/domain/shell/use-page-breadcrumb.ts`** — add crumb:

```ts
if (pathname === '/admin/confidential-governance') {
  return [
    { label: nav('label_admin') },
    { label: nav('governance_participants') },
  ];
}
```

---

## Data Flow

```
Task Detail
  ├─ GET /v1/tasks/{publicId} ──► useTaskDetail ──► success → normal detail
  │                                                 403 → useTaskMetadata fallback
  │                                                 404 → not-found EmptyState
  ├─ GET /v1/tasks/{publicId}/metadata ──► useTaskMetadata ──► success → ConfidentialMetadataPage
  │                                                            404 → not-found EmptyState
  ├─ POST /v1/tasks/{publicId}/access-override ──► useAccessOverride ──► success → TaskOverrideSession + normal detail
  ├─ GET /v1/tasks/{publicId}/confidential-participants ──► useConfidentialParticipantsInfinite ──► ConfidentialParticipantsCard
  ├─ POST /v1/tasks/{publicId}/confidential-participants ──► useAddConfidentialParticipant ──► invalidate list
  └─ DELETE /v1/tasks/{publicId}/confidential-participants/{user} ──► useRemoveConfidentialParticipant ──► invalidate list

Governance Admin
  ├─ GET /v1/iam/confidential-governance-participants ──► useGovernanceParticipantsInfinite ──► GovernanceParticipantsManager
  ├─ POST /v1/iam/confidential-governance-participants ──► useCreateGovernanceParticipant ──► invalidate list
  ├─ PUT /v1/iam/confidential-governance-participants/{participant} ──► useUpdateGovernanceParticipant ──► invalidate list
  └─ POST /v1/iam/confidential-governance-participants/{participant}/revoke ──► useRevokeGovernanceParticipant ──► invalidate list
```

---

## Route Structure

| Route | File | Notes |
|-------|------|-------|
| `/tasks/[publicId]` | `app/(dashboard)/tasks/[publicId]/page.tsx` | Existing; orchestrator now handles metadata + override. |
| `/admin/confidential-governance` | `app/(dashboard)/admin/confidential-governance/page.tsx` | New; capability-gated via sidebar + server. |

Locale is cookie-based (`NEXT_LOCALE`); no `[locale]` segment.

---

## Execution Order

1. **Typegen check** — run `npm run generate:api` and verify confidential schemas exist. Confirm metadata endpoint path.
2. **Query keys** — extend `lib/api/query-keys.ts` and `lib/api/query-keys-extra.ts`.
3. **Hooks** — extend `use-task-detail.ts`; create `use-confidential-governance.ts`.
4. **Badges** — refactor `ClassificationBadge` with purple confidential variant.
5. **Task creation** — add confidential explainer to `task-form-fields.tsx`.
6. **Task detail** — update `title-meta-card.tsx`, create participant/metadata/override components, update `task-detail.tsx` orchestrator.
7. **Admin governance** — create manager, form dialog, row/card, skeleton; add route page.
8. **Shell** — add sidebar nav item and breadcrumb.
9. **i18n** — add `confidential.*` keys to both `messages/ar.json` and `messages/en.json`.
10. **Tests** — add MSW handlers and component tests; run `npm run lint && npm run typecheck && npm run test`.

---

## What to Test Manually

1. **Task board (AR + EN)** — confidential task rows show muted `LockKeyhole` icon; non-confidential rows unchanged.
2. **Full-access confidential task detail (AR + EN)** — lock icon next to title, muted confidential badge first (same style as internal), participant card visible for initiator/manager, add/remove works.
3. **Metadata-only detail (AR + EN)** — user with `task.confidential.view_metadata` but no full access sees restricted layout: title, department, status, SLA, due date, amber alert, no sidebar/timeline/actions.
4. **Override flow** — governance officer clicks "Open confidential content", enters reason < 10 chars → toast error; enters valid reason → full detail renders with persistent amber banner; navigate away and back → override reset.
5. **Permission gating** — user without participant management sees no add/remove; user without override sees no override button; non-admin user sees no governance sidebar item.
6. **Loading / empty / error states** — participant card skeleton, empty participant list, metadata error retry, governance table skeleton/empty/error.
7. **Governance CRUD** — create rule with tenant scope (no department), create rule with specific department (department required), edit scope, revoke rule with confirmation, revoked rows show inactive badge.
8. **Task creation explainer** — select Confidential → info alert appears; switch to Public/Internal → alert disappears.
9. **Responsive** — governance table horizontal scroll on tablet, card list on mobile; task detail single-column on tablet/mobile.
10. **Keyboard navigation** — Tab through override dialog, Escape closes dialog, focus returns to trigger; participant remove button reachable.
11. **RTL** — lock icon does not flip; `ChevronRight`/arrows flip; logical properties keep layouts correct in AR.