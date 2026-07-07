# Implementation Plan: 024 Task Documents

> **Spec:** `specs/024-task-documents/spec.md`
> **Date:** 2026-07-05
> **Status:** `completed`

---

## Open Questions Resolved

| # | Question (from spec) | Decision | Rationale |
|---|---|---|---|
| 1 | Attachment ordering (`?sort=asc\|desc`) | **Pass `sort=desc` by default** in `useTaskDocuments`. Backend 012 supports the param even though `openapi.json` does not yet expose it; newest-first matches comments/recent-activity UX. | Consistent with task detail timeline/comments ordering. |
| 2 | Upload max size / allowed types source of truth | **Frontend mirrors backend defaults** (20 MB; PDF, JPEG, PNG, GIF, DOC/DOCX, XLS/XLSX) for pre-validation, but backend `UploadDocumentRequest` is the final authority. | Avoids duplicating tenant-configurable rules; 422 surfaces backend rejection. |
| 3 | Image preview thumbnail | **No thumbnail endpoint.** Use full `preview_url` inside a constrained `object-fit: contain` container. | Backend 012 has no thumbnail generation in MVP. |
| 4 | Version dialog UX | **Read-only version history + "Upload New Version" action.** Historical versions have no download/preview URLs; current version actions stay on the main row only. | Matches backend `DocumentVersionResource` shape. |
| 5 | Stage/sub-stage attachments in task list | **Sidebar Documents card stays task-direct only.** Stage/sub-stage endpoints exist but are out of scope for this card. | Prevents scope creep; reuse same row components later. |
| 6 | `multipart/form-data` in `apiClient` | **Add FormData detection to `apiClient`.** When `body` is `FormData`, skip `JSON.stringify` and omit `Content-Type` so the browser sets the multipart boundary. | Required for file uploads; no new dependency. |
| 7 | Download/preview delivery | **Fetch blob through `apiClient` with `X-Tenant` + `X-Locale` headers**, then use `URL.createObjectURL()`. Backend requires `X-Tenant` header on all requests, so direct `window.open` / `<img src>` doesn't work. | Added `fetchDocumentBlob()` and `downloadDocument()` utilities. Preview dialog fetches blob on open via `useEffect`. |

---

## Technical Approach

**One-line summary:** Add a Documents card to the task detail sidebar using the stable backend 012 document API, shadcn `Attachment` primitives, TanStack Query hooks with cursor pagination, and capability-gated upload/version/delete actions.

**Key decisions:**
- **Card placement:** Insert `<TaskDocumentsCard publicId={publicId} />` into the task detail sidebar between `<DetailsCard />` and `<RecentActivityCard />`, matching the two-column stacked-card layout established by spec 004.
- **shadcn Attachment family:** Use `@shadcn/attachment` (`Attachment`, `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`, `AttachmentAction`, `AttachmentTrigger`, `AttachmentGroup`) for file rows instead of building custom rows.
- **Cursor pagination:** `useTaskDocuments` and `useDocumentVersions` use `useInfiniteQuery` with manual "Load more" buttons.
- **FormData uploads:** Extend `apiClient` to natively support `FormData` bodies for `POST /v1/tasks/{task}/documents` and `POST /v1/documents/{document}/versions`.
- **Inline upload with Attachment states:** Replaced the upload Dialog with the shadcn `Attachment` component's built-in `state` system. File appears inline as `state="idle"` → `state="uploading"` (shimmer) → removed on success or `state="error"` (retry). Description entered via inline text input on the idle state.
- **Client-side pre-validation:** Validate file type and size before any network call. Invalid files show `state="error"` immediately.
- **Version dialog matches card pattern:** The version dialog's "Upload New Version" uses the same inline Attachment state pattern instead of `TaskDocumentUploadDialog`.
- **Two-tier card pattern:** Card shows first 3 documents inline. "View all" link opens a Dialog with full list + load more. Matches follow-up sidebar pattern.
- **Blob fetch for download/preview:** `download_url` and `preview_url` fetched via `fetch` with `X-Tenant` + `X-Locale` headers + credentials, then served as `URL.createObjectURL()` blobs.
- **Single tooltip on content area:** Consolidated filename + description tooltips into one tooltip wrapping the entire `AttachmentContent`.
- **ScrollArea avoided in dialogs:** Replaced `ScrollArea` with plain `overflow-y-auto` div to avoid Radix `display: table` width calculation issues.
- **Capability gating:** Hide upload/version/delete actions with `useCapability('task.manage_documents')`; the server returns 403 regardless.
- **No Zustand:** All server state lives in TanStack Query; only dialog open/close, selected-file state, and pending uploads are local.
- **No URL params:** Documents have no filter/permalink state in MVP.
- **Generated types only:** Use `DocumentResource`, `DocumentVersionResource`, `UploadDocumentRequest`, `UploadDocumentVersionRequest` from `lib/generated/api-types.ts`.
- **Reuse existing utilities:** `localizeName`, `formatRelativeTime`, `timeFmtFromT` from `task-detail-utils.ts`; add a small `formatFileSize` helper.

---

## Component Tree

```text
app/(dashboard)/tasks/[publicId]/page.tsx              Server
  TaskDetailPage
    TaskDetail (Client)                                 existing
      TitleMetaCard
      StageTimeline
      TaskCommentsCard
      ┌── Sidebar ──────────────────────────────────────┐
      │ DetailsCard                                      │  existing
│ TaskDocumentsCard (Client)                       │  NEW
│   [pendingUploads: PendingUpload[]]              │  local state for inline upload
│     Attachment state="idle"                      │  file selected, description input + Upload button
│     Attachment state="uploading"                 │  shimmer animation during upload
│     Attachment state="error"                     │  red border, retry + dismiss
│   TaskDocumentsList (Client)                     │  used inside "View all" Dialog
│     TaskDocumentItem (Client)
│       [actions] Download / Preview / Versions / Delete
│   TaskDocumentVersionDialog (Client)
│     [pendingUploads: PendingVersionUpload[]]     │  same idle→uploading→error pattern as card
│   TaskDocumentPreviewDialog (Client)
│   TaskDocumentDeleteDialog (Client)
│   TaskDocumentsSkeleton (Client)
      │ RecentActivityCard                               │  existing
      └──────────────────────────────────────────────────┘
```

**Server vs Client:**
- **Server:** `TaskDetailPage` only.
- **Client:** `TaskDocumentsCard` and all descendants (queries, event handlers, dialogs, local state).

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `lib/api/hooks/use-task-documents.ts` | `useTaskDocuments`, `useDocument`, `useDocumentVersions`, `useUploadTaskDocument`, `useUploadDocumentVersion`, `useDeleteDocument`. |
| `components/domain/tasks/task-documents-card.tsx` | Main documents card: queries, upload button, pending upload states, two-tier list (preview + "View all" Dialog), empty/error/skeleton orchestration. |
| `components/domain/tasks/task-documents-list.tsx` | Scrollable/infinite list of attachment rows with "Load more". |
| `components/domain/tasks/task-document-item.tsx` | Single attachment row using shadcn `Attachment` primitives + action buttons. Single tooltip on content area. |
| `components/domain/tasks/task-document-upload-dialog.tsx` | *(retained for backward compatibility)* Replaced by inline `Attachment` state upload in both card and version dialog. |
| `components/domain/tasks/task-document-version-dialog.tsx` | Version-history dialog + inline upload-new-version using `Attachment` states (idle→uploading→error). |
| `components/domain/tasks/task-document-preview-dialog.tsx` | Inline PDF/image preview dialog using blob URLs fetched with auth headers. |
| `components/domain/tasks/task-document-delete-dialog.tsx` | Destructive `AlertDialog` confirmation. Delete icon uses outlined danger variant. |
| `components/domain/tasks/task-documents-skeleton.tsx` | Skeleton rows matching attachment shape. |
| `components/domain/tasks/task-document-utils.ts` | Pure helpers: `formatFileSize`, `DOCUMENT_ICONS`, `isPreviewable`, `fetchDocumentBlob`, `downloadDocument`. |
| `components/domain/tasks/task-document-types.ts` | Re-export generated document types. |
| `__tests__/components/domain/tasks/task-documents-card.test.tsx` | 9 tests: loading, empty, success, upload idle→uploading flow, 422 error inline, delete confirmation, version dialog, Arabic RTL. |
| `__tests__/components/domain/tasks/task-document-item.test.tsx` | 4 tests: renders filename, download action, preview action, hides preview when null. |

### Modified Files

| File | Change |
|------|--------|
| `lib/api/query-keys.ts` | Add `tasks.documents(taskPublicId, filters)`, `documents.detail(publicId)`, `documents.versions(publicId)`. |
| `lib/api/client.ts` | Detect `FormData` body: skip `JSON.stringify`, omit `Content-Type` header, preserve CSRF/X-Tenant/X-Locale. |
| `components/domain/tasks/task-detail.tsx` | Insert `<TaskDocumentsCard publicId={publicId} />` in the sidebar between `DetailsCard` and `RecentActivityCard`. |
| `messages/ar.json` | Add `tasks.documents` namespace with `ready_to_upload` and `view_all` keys. |
| `messages/en.json` | Add `tasks.documents` namespace with `ready_to_upload` and `view_all` keys. |
| `__tests__/mocks/handlers.ts` | Add MSW handlers for `GET/POST /v1/tasks/:publicId/documents`, `GET/POST /v1/documents/:document/versions`, `DELETE /v1/documents/:document`. |
| `components/ui/tooltip.tsx` | *(no change needed)* Tooltip base classes already include `inline-flex` — inner div uses `flex flex-col` to stack tooltip content vertically. |

### shadcn Components to Add

| Component | Command | Reason |
|-----------|---------|--------|
| `attachment` | `npx shadcn@latest add attachment` | File rows per spec UI breakdown. |
| `alert-dialog` | `npx shadcn@latest add alert-dialog` | Delete confirmation (if not already present from spec 004). |

---

## Implementation Notes

### 1. API Client — `lib/api/client.ts`

**One-line summary:** Extend `apiClient` so `FormData` bodies are sent as multipart instead of JSON.

**Key decisions:**
- When `body` is an instance of `FormData`, do **not** set `Content-Type` (the browser sets the correct boundary).
- Do **not** `JSON.stringify` FormData.
- Keep `X-Tenant`, `X-Locale`, and `X-XSRF-TOKEN` headers unchanged.
- This is a generic change that also helps future file uploads (comment attachments, etc.).

**Files:** `lib/api/client.ts`

```ts
function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = new URL(path, BASE_URL);
  // ... existing param serialization unchanged ...

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Tenant': getTenantSlug(),
    'X-Locale': getLocaleSlug(),
    ...options?.headers,
  };

  const bodyIsFormData = isFormData(body);
  if (!bodyIsFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const xsrf = getXsrfToken();
  if (xsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-XSRF-TOKEN'] = xsrf;
  }

  const response = await fetch(url.toString(), {
    method,
    credentials: 'include',
    headers,
    body: bodyIsFormData ? body : (body ? JSON.stringify(body) : undefined),
  });

  // ... existing error handling unchanged ...
}
```

**Test cases:**
1. `apiClient.post('/v1/tasks/x/documents', formData)` → request body is `FormData`, `Content-Type` header is missing.
2. `apiClient.post('/v1/tasks/x/cancel', { reason: 'x' })` → body is JSON string, `Content-Type: application/json` is set.

**Coding standards applied:**
- `coding-standards.md` § API Client — single fetch wrapper, credentials included, tenant/locale headers preserved.
- `security-policy.md` — no token leakage; cookies remain HttpOnly.

---

### 2. Query Keys — `lib/api/query-keys.ts`

**One-line summary:** Add document-related keys nested under `tasks.detail` and a top-level `documents` namespace.

**Key decisions:**
- `tasks.documents(taskPublicId, filters)` is nested under `tasks.detail(taskPublicId)` so invalidating the task detail also invalidates documents.
- `documents.detail(publicId)` and `documents.versions(publicId)` live under a new `documents` namespace.

**Files:** `lib/api/query-keys.ts`

```ts
export const queryKeys = {
  // ... existing namespaces ...
  tasks: {
    // ... existing keys ...
    documents: (taskPublicId: string, filters?: { sort?: 'asc' | 'desc' }) =>
      [...queryKeys.tasks.detail(taskPublicId), 'documents', filters] as const,
  },
  documents: {
    all: ['documents'] as const,
    detail: (documentPublicId: string) =>
      [...queryKeys.documents.all, 'detail', documentPublicId] as const,
    versions: (documentPublicId: string) =>
      [...queryKeys.documents.detail(documentPublicId), 'versions'] as const,
  },
} as const;
```

**Test cases:**
1. `queryKeys.tasks.documents('task-uuid', { sort: 'desc' })` → `['tasks', 'detail', 'task-uuid', 'documents', { sort: 'desc' }]`.
2. Invalidating `queryKeys.tasks.detail('task-uuid')` also invalidates the documents key.

**Coding standards applied:**
- `coding-standards.md` § Query Key Factory — centralized factory, no hardcoded strings.

---

### 3. Document Hooks — `lib/api/hooks/use-task-documents.ts`

**One-line summary:** All document query and mutation hooks in one file, using generated types and the query-key factory.

**Key decisions:**
- `useTaskDocuments` uses `useInfiniteQuery` with `sort: 'desc'`.
- `useDocumentVersions` uses `useInfiniteQuery`.
- Upload mutations send `FormData`; on success they invalidate documents and timeline.
- Delete mutation invalidates documents and timeline.
- Toast success/error comes from the hook; 422 errors are surfaced to dialogs via `mutation.error`.

**Files:** `lib/api/hooks/use-task-documents.ts`

```ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

export type DocumentResource = components['schemas']['DocumentResource'];
export type DocumentVersionResource = components['schemas']['DocumentVersionResource'];
type UploadDocumentRequest = components['schemas']['UploadDocumentRequest'];
type UploadDocumentVersionRequest = components['schemas']['UploadDocumentVersionRequest'];

export interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export function useTaskDocuments(taskPublicId: string, sort: 'asc' | 'desc' = 'desc') {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.documents(taskPublicId, { sort }),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<DocumentResource>>(`/v1/tasks/${taskPublicId}/documents`, {
        params: { cursor: pageParam, sort },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!taskPublicId,
  });
}

export function useDocument(documentPublicId: string) {
  return useQuery({
    queryKey: queryKeys.documents.detail(documentPublicId),
    queryFn: () => apiClient.get<DocumentResource>(`/v1/documents/${documentPublicId}`),
    enabled: !!documentPublicId,
  });
}

export function useDocumentVersions(documentPublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.documents.versions(documentPublicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<DocumentVersionResource>>(
        `/v1/documents/${documentPublicId}/versions`,
        { params: { cursor: pageParam } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!documentPublicId,
  });
}

export function useUploadTaskDocument(taskPublicId: string) {
  const t = useTranslations('tasks.documents');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<DocumentResource>(`/v1/tasks/${taskPublicId}/documents`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.documents(taskPublicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_uploaded'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}

export function useUploadDocumentVersion(documentPublicId: string, taskPublicId: string) {
  const t = useTranslations('tasks.documents');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<DocumentResource>(`/v1/documents/${documentPublicId}/versions`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.versions(documentPublicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.documents(taskPublicId) });
      toast.success(t('toast_version_created'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}

export function useDeleteDocument(taskPublicId: string) {
  const t = useTranslations('tasks.documents');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentPublicId: string) =>
      apiClient.delete<void>(`/v1/documents/${documentPublicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.documents(taskPublicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

**Test cases:**
1. `useTaskDocuments('task-uuid')` → MSW returns cursor page; `data.pages[0].data` contains a `DocumentResource`.
2. `useUploadTaskDocument('task-uuid').mutate(formData)` → MSW returns 200; documents + timeline queries are invalidated.

**Coding standards applied:**
- `coding-standards.md` § Data Fetching — `useInfiniteQuery` for cursor pagination, mutation invalidation.
- `coding-standards.md` § Type Safety — generated types only, no hand-written API DTOs.
- `coding-standards.md` § Toast Notifications — sonner for mutation feedback.

---

### 4. Document Types & Utilities — `components/domain/tasks/task-document-types.ts`, `task-document-utils.ts`

**One-line summary:** Colocate generated type aliases and add pure helpers for file sizes and mime-category icons.

**Key decisions:**
- Re-export generated types for colocated use.
- `formatFileSize` converts bytes (string from API) to human-readable KB/MB.
- `getDocumentIcon` maps `mime_category` to Lucide icons.
- `isPreviewable` mirrors backend `DocumentMimeCategory::supportsPreview()` (PDF + image only).

**Files:**
- `components/domain/tasks/task-document-types.ts`
- `components/domain/tasks/task-document-utils.ts`

```ts
// task-document-types.ts
import type { components } from '@/lib/generated/api-types';

export type DocumentResource = components['schemas']['DocumentResource'];
export type DocumentVersionResource = components['schemas']['DocumentVersionResource'];
```

```ts
// task-document-utils.ts
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileType,
  File,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function formatFileSize(sizeBytes: string | number): string {
  const bytes = typeof sizeBytes === 'string' ? parseInt(sizeBytes, 10) : sizeBytes;
  if (Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getDocumentIcon(mimeCategory: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    Pdf: FileText,
    Image: FileImage,
    Excel: FileSpreadsheet,
    Word: FileType,
  };
  return map[mimeCategory] ?? File;
}

export function isPreviewable(mimeCategory: string): boolean {
  return mimeCategory === 'Pdf' || mimeCategory === 'Image';
}
```

**Test cases:**
1. `formatFileSize('2048')` → `'2.0 KB'`.
2. `isPreviewable('Pdf')` → `true`; `isPreviewable('Word')` → `false`.

**Coding standards applied:**
- `coding-standards.md` § Type Safety — generated types re-exported, no new API DTOs.
- `coding-standards.md` § Utils are pure — no React imports, no side effects.

---

### 5. `TaskDocumentsCard` — `components/domain/tasks/task-documents-card.tsx`

**One-line summary:** Orchestrator rendered inside `TaskDetail` sidebar; handles loading, empty, error, and success states.

**Key decisions:**
- Receives `publicId` prop (task public_id).
- Uses `useTaskDocuments`, `useUploadTaskDocument`, and `useCapability('task.manage_documents')`.
- Local state: upload dialog open, active document for version/preview dialogs.
- 500/network errors render `ErrorState` inside the card; 403/404 are handled by parent `TaskDetail`.
- Empty state shows upload CTA only for users with `task.manage_documents`.

**Files:** `components/domain/tasks/task-documents-card.tsx`

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Paperclip, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import {
  useTaskDocuments,
  useUploadTaskDocument,
} from '@/lib/api/hooks/use-task-documents';
import { TaskDocumentsList } from './task-documents-list';
import { TaskDocumentsSkeleton } from './task-documents-skeleton';
import { TaskDocumentUploadDialog } from './task-document-upload-dialog';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentsCardProps {
  publicId: string;
}

export function TaskDocumentsCard({ publicId }: TaskDocumentsCardProps) {
  const t = useTranslations('tasks.documents');
  const canManage = useCapability('task.manage_documents');
  const documentsQuery = useTaskDocuments(publicId);
  const uploadDocument = useUploadTaskDocument(publicId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<DocumentResource | null>(null);
  const [dialogMode, setDialogMode] = useState<'version' | 'preview' | null>(null);

  const allDocuments = useMemo(
    () => documentsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [documentsQuery.data],
  );

  if (documentsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskDocumentsSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (documentsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message={t('error')} onRetry={() => documentsQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('title')}
        </CardTitle>
        {canManage && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="me-1 size-4" />
            {t('upload')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {allDocuments.length === 0 ? (
          <EmptyState
            icon={Paperclip}
            title={t('empty_title')}
            description={t('empty_description')}
            action={
              canManage ? (
                <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                  <Plus className="me-1 size-4" />
                  {t('upload')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <TaskDocumentsList
            documents={allDocuments}
            taskPublicId={publicId}
            onVersion={setActiveDocument}
            onPreview={setActiveDocument}
            fetchNextPage={documentsQuery.fetchNextPage}
            hasNextPage={documentsQuery.hasNextPage}
            isFetchingNextPage={documentsQuery.isFetchingNextPage}
          />
        )}
      </CardContent>

      <TaskDocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        uploadMutation={uploadDocument}
      />
      {/* Version and Preview dialogs rendered here using activeDocument */}
    </Card>
  );
}
```

**Test cases:**
1. Render with no documents + `canManage=true` → empty state shows upload CTA.
2. Render with documents → attachment list renders; upload button is in card header.
3. Render with 500 error → inline `ErrorState` with retry button.

**Coding standards applied:**
- `coding-standards.md` § All 4 States — loading skeleton, error with retry, empty with CTA, success list.
- `coding-standards.md` § Permission UI — `useCapability('task.manage_documents')` hides actions.
- `coding-standards.md` § i18n — all strings via `useTranslations`.
- `design-system/04-layout-patterns.md` — card in sidebar, header with action slot.

---

### 6. `TaskDocumentsList` — `components/domain/tasks/task-documents-list.tsx`

**One-line summary:** Scrollable container for attachment rows with a manual "Load more" button.

**Key decisions:**
- Use an `<ol>` with `aria-label` for the attachment list.
- Each row is `TaskDocumentItem`.
- "Load more" appears when `hasNextPage` is true.

**Files:** `components/domain/tasks/task-documents-list.tsx`

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TaskDocumentItem } from './task-document-item';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentsListProps {
  documents: DocumentResource[];
  taskPublicId: string;
  onVersion: (document: DocumentResource) => void;
  onPreview: (document: DocumentResource) => void;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}

export function TaskDocumentsList({
  documents,
  taskPublicId,
  onVersion,
  onPreview,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: TaskDocumentsListProps) {
  const t = useTranslations('tasks.documents');

  return (
    <div className="flex flex-col gap-3">
      <ol className="space-y-3" aria-label={t('documents_list_label')}>
        {documents.map((document) => (
          <li key={document.public_id}>
            <TaskDocumentItem
              document={document}
              taskPublicId={taskPublicId}
              onVersion={() => onVersion(document)}
              onPreview={() => onPreview(document)}
            />
          </li>
        ))}
      </ol>
      {hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full"
        >
          {isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
    </div>
  );
}
```

**Test cases:**
1. Render list with `hasNextPage=true` → "Load more" button visible and enabled.
2. Click "Load more" → `fetchNextPage` called, button shows loading text.

**Coding standards applied:**
- `coding-standards.md` § Cursor Pagination — manual "Load more" with `useInfiniteQuery`.
- `design-system/05-accessibility.md` — semantic `<ol>` with `aria-label`.

---

### 7. `TaskDocumentItem` — `components/domain/tasks/task-document-item.tsx`

**One-line summary:** Single attachment row using shadcn `Attachment` primitives with localized metadata and capability-gated actions.

**Key decisions:**
- Use `Attachment`, `AttachmentMedia` (icon variant), `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`, `AttachmentAction`.
- Title is `original_filename`; description is `${mime_category} · ${formatFileSize(size_bytes)} · ${uploader} · ${relativeTime}`.
- Download button opens `download_url` in a new tab.
- Preview button shown only when `preview_url` is non-null.
- Version and Delete buttons shown only when `canManage` is true.
- Long filename truncates with ellipsis; full name via tooltip.
- Mobile: action buttons collapse to icon-only with `aria-label`.

**Files:** `components/domain/tasks/task-document-item.tsx`

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Download,
  Eye,
  History,
  Trash2,
} from 'lucide-react';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { localizeName, formatRelativeTime, timeFmtFromT } from './task-detail-utils';
import { formatFileSize, getDocumentIcon, isPreviewable } from './task-document-utils';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentItemProps {
  document: DocumentResource;
  taskPublicId: string;
  onVersion: () => void;
  onPreview: () => void;
}

export function TaskDocumentItem({
  document,
  onVersion,
  onPreview,
}: TaskDocumentItemProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.documents');
  const timeFmt = timeFmtFromT(t);
  const canManage = useCapability('task.manage_documents');
  const Icon = getDocumentIcon(document.mime_category);
  const uploaderName = localizeName(locale, document.uploader.name_ar, document.uploader.name_en);
  const relativeTime = formatRelativeTime(document.created_at, timeFmt);
  const description = `${document.mime_category} · ${formatFileSize(document.size_bytes)} · ${uploaderName} · ${relativeTime}`;

  return (
    <Attachment>
      <AttachmentMedia>
        <Icon className="size-5" aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent className="min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AttachmentTitle className="truncate">{document.original_filename}</AttachmentTitle>
            </TooltipTrigger>
            <TooltipContent>{document.original_filename}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <AttachmentDescription>{description}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          size="icon-xs"
          aria-label={t('download_document', { name: document.original_filename })}
          onClick={() => window.open(document.download_url, '_blank')}
        >
          <Download className="size-4" />
        </AttachmentAction>
        {document.preview_url && isPreviewable(document.mime_category) && (
          <AttachmentAction
            size="icon-xs"
            aria-label={t('preview_document', { name: document.original_filename })}
            onClick={onPreview}
          >
            <Eye className="size-4" />
          </AttachmentAction>
        )}
        {canManage && (
          <>
            <AttachmentAction
              size="icon-xs"
              aria-label={t('view_versions', { name: document.original_filename })}
              onClick={onVersion}
            >
              <History className="size-4" />
            </AttachmentAction>
            <TaskDocumentDeleteDialog
              document={document}
              trigger={
                <AttachmentAction
                  size="icon-xs"
                  aria-label={t('delete_document', { name: document.original_filename })}
                >
                  <Trash2 className="size-4" />
                </AttachmentAction>
              }
            />
          </>
        )}
      </AttachmentActions>
    </Attachment>
  );
}
```

**Test cases:**
1. Render PDF document → Download + Preview + Versions + Delete (if manager) actions visible.
2. Render Word document without manage capability → only Download visible; Versions/Delete hidden.

**Coding standards applied:**
- `coding-standards.md` § Permission UI — `useCapability('task.manage_documents')` gates actions.
- `coding-standards.md` § RTL — logical properties inside `Attachment`; directional icons use `rtl:rotate-180` where applicable (none here, all icons are non-directional except Download which can be considered action-only and does not flip).
- `design-system/05-accessibility.md` — icon-only buttons have `aria-label`; filename tooltip; semantic list item.
- `design-system/03-components.md` — use shadcn `Attachment` family.

---

### 8. `TaskDocumentUploadDialog` — `components/domain/tasks/task-document-upload-dialog.tsx`

**One-line summary:** Dialog with a drag-and-drop file input, optional description textarea, client-side validation, and inline 422 error display. Still used by the version dialog for uploading new versions.

**Key decisions:**
- Drag-over sets visual highlight state.
- Dropping a file selects it via hidden `<input type="file">`.
- Client-side validation: size ≤ 20 MB, allowed MIME types.
- Build `FormData` and pass to `useUploadTaskDocument` mutation.
- On success, close dialog and clear local file/description state.
- On 422, show inline error and keep dialog open.
- Submit button disabled while no file selected or upload is pending.

**Files:** `components/domain/tasks/task-document-upload-dialog.tsx`

```tsx
'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { ApiRequestError } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { UseMutationResult } from '@tanstack/react-query';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadMutation: UseMutationResult<DocumentResource, Error, FormData, unknown>;
}

const MAX_SIZE_MB = 20;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function TaskDocumentUploadDialog({
  open,
  onOpenChange,
  uploadMutation,
}: TaskDocumentUploadDialogProps) {
  const t = useTranslations('tasks.documents');
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setDescription('');
    setClientError(null);
  }

  function validate(selected: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(selected.type)) {
      return t('error_disallowed_type');
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      return t('error_too_large', { max: MAX_SIZE_MB });
    }
    return null;
  }

  function handleFile(selected: File | null) {
    setClientError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const error = validate(selected);
    if (error) {
      setClientError(error);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleSubmit() {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    if (description.trim()) formData.append('description', description.trim());

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  const error422 =
    uploadMutation.error instanceof ApiRequestError && uploadMutation.error.status === 422
      ? uploadMutation.error.error.message
      : null;

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) reset(); onOpenChange(value); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('upload_dialog_title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 transition-colors',
              dragOver && 'border-primary bg-primary/5',
              !dragOver && 'border-border bg-muted/50',
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files?.[0] ?? null;
              handleFile(dropped);
            }}
            role="button"
            tabIndex={0}
            aria-label={t('dropzone_label')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('doc-upload-input')?.click(); }}
          >
            <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('dropzone_text')}</p>
            <input
              id="doc-upload-input"
              type="file"
              className="hidden"
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('doc-upload-input')?.click()}>
              {t('choose_file')}
            </Button>
          </div>

          {file && (
            <p className="text-sm text-foreground">
              {t('selected_file')}: <span className="font-medium">{file.name}</span> ({formatFileSize(file.size)})
            </p>
          )}

          <Field>
            <FieldLabel htmlFor="doc-description">{t('description_optional')}</FieldLabel>
            <Textarea
              id="doc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('description_placeholder')}
              rows={3}
            />
          </Field>

          {(clientError || error422) && (
            <p className="text-sm text-destructive" role="alert">
              {clientError ?? error422}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploadMutation.isPending}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? t('uploading') : t('upload')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Test cases:**
1. Drop a PDF → file selected, validation passes; click Upload → mutation called with `FormData`; on success dialog closes.
2. Drop an `.exe` → client error shown, Upload disabled.
3. MSW returns 422 → inline error shown, dialog stays open, file preserved.

**Coding standards applied:**
- `coding-standards.md` § Forms — shadcn `Field` + `Textarea`.
- `coding-standards.md` § Error Handling — 422 inline, network error via toast.
- `design-system/05-accessibility.md` — dropzone `role="button"`, `aria-label`, keyboard activation.

---

### 9. `TaskDocumentVersionDialog` — `components/domain/tasks/task-document-version-dialog.tsx`

**One-line summary:** Dialog showing cursor-paginated version history with the latest version highlighted and an "Upload New Version" action for managers.

**Key decisions:**
- Fetch versions with `useDocumentVersions(document.public_id)`.
- Each version row shows version number, filename, size, uploader, date.
- Latest version (highest `version_number`) is visually highlighted.
- Managers see an "Upload New Version" button that reuses `TaskDocumentUploadDialog` with `useUploadDocumentVersion`.
- Historical versions are read-only (no download/preview URLs in response).

**Files:** `components/domain/tasks/task-document-version-dialog.tsx`

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useDocumentVersions, useUploadDocumentVersion } from '@/lib/api/hooks/use-task-documents';
import { localizeName, formatRelativeTime, timeFmtFromT } from './task-detail-utils';
import { formatFileSize } from './task-document-utils';
import { TaskDocumentUploadDialog } from './task-document-upload-dialog';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentVersionDialogProps {
  document: DocumentResource | null;
  taskPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDocumentVersionDialog({
  document,
  taskPublicId,
  open,
  onOpenChange,
}: TaskDocumentVersionDialogProps) {
  const t = useTranslations('tasks.documents');
  const locale = useLocale();
  const canManage = useCapability('task.manage_documents');
  const versionsQuery = useDocumentVersions(document?.public_id ?? '');
  const uploadVersion = useUploadDocumentVersion(document?.public_id ?? '', taskPublicId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const timeFmt = timeFmtFromT(t);

  const allVersions = useMemo(
    () => versionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [versionsQuery.data],
  );

  const latestVersionNumber = useMemo(() => {
    return allVersions.reduce((max, v) => Math.max(max, parseInt(v.version_number, 10) || 0), 0);
  }, [allVersions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('versions_title', { name: document?.original_filename ?? '' })}</DialogTitle>
        </DialogHeader>
        {canManage && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="me-1 size-4" />
            {t('upload_new_version')}
          </Button>
        )}
        <ScrollArea className="max-h-[60vh]">
          <ol className="space-y-2 pe-4" aria-label={t('versions_list_label')}>
            {allVersions.map((version) => {
              const isLatest = parseInt(version.version_number, 10) === latestVersionNumber;
              const uploader = localizeName(locale, version.uploader.name_ar, version.uploader.name_en);
              return (
                <li
                  key={version.public_id}
                  className={cn(
                    'rounded-lg border p-3',
                    isLatest ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {t('version_n', { n: version.version_number })}
                    </span>
                    {isLatest && (
                      <span className="text-xs font-medium text-primary">{t('latest')}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{version.original_filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(version.size_bytes)} · {uploader} · {formatRelativeTime(version.created_at, timeFmt)}
                  </p>
                </li>
              );
            })}
          </ol>
        </ScrollArea>
        {document && (
          <TaskDocumentUploadDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            uploadMutation={uploadVersion}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Test cases:**
1. Open versions dialog → version list renders, latest version highlighted.
2. Manager clicks "Upload New Version" → upload dialog opens; on success version list refreshes.

**Coding standards applied:**
- `coding-standards.md` § Cursor Pagination — `useInfiniteQuery` for version history.
- `coding-standards.md` § Permission UI — upload-new-version gated by `task.manage_documents`.

---

### 10. `TaskDocumentPreviewDialog` — `components/domain/tasks/task-document-preview-dialog.tsx`

**One-line summary:** Dialog for inline PDF/image preview using the document's `preview_url`.

**Key decisions:**
- PDF: `<iframe src={preview_url} className="h-[60vh] w-full" />`.
- Image: `<img src={preview_url} className="max-h-[60vh] w-full object-contain" />`.
- Fallback/error state if preview fails to load.
- Dialog uses focus trap and Escape-to-close via shadcn `Dialog`.

**Files:** `components/domain/tasks/task-document-preview-dialog.tsx`

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isPreviewable } from './task-document-utils';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentPreviewDialogProps {
  document: DocumentResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDocumentPreviewDialog({
  document,
  open,
  onOpenChange,
}: TaskDocumentPreviewDialogProps) {
  const t = useTranslations('tasks.documents');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>{document?.original_filename}</DialogTitle>
        </DialogHeader>
        {document?.preview_url && isPreviewable(document.mime_category) ? (
          document.mime_category === 'Image' ? (
            <img
              src={document.preview_url}
              alt={document.original_filename}
              className="max-h-[65vh] w-full object-contain"
            />
          ) : (
            <iframe
              src={document.preview_url}
              title={document.original_filename}
              className="h-[65vh] w-full rounded-md border"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <AlertCircle className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('preview_unavailable')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Test cases:**
1. Open preview for PDF → iframe with `preview_url` renders.
2. Open preview for unsupported type → fallback message renders.

**Coding standards applied:**
- `design-system/05-accessibility.md` — `Dialog` focus trap, `alt` text on image, `title` on iframe.

---

### 11. `TaskDocumentDeleteDialog` — `components/domain/tasks/task-document-delete-dialog.tsx`

**One-line summary:** Destructive `AlertDialog` confirmation that calls `useDeleteDocument`.

**Key decisions:**
- Use shadcn `AlertDialog` with destructive confirm button.
- Show the document name in the description.
- On confirm, call `deleteMutation.mutate(document.public_id)`.
- Trigger is passed as a child (the `Trash2` action button).

**Files:** `components/domain/tasks/task-document-delete-dialog.tsx`

```tsx
'use client';

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
import { useDeleteDocument } from '@/lib/api/hooks/use-task-documents';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentDeleteDialogProps {
  document: DocumentResource;
  taskPublicId: string;
  trigger: React.ReactNode;
}

export function TaskDocumentDeleteDialog({
  document,
  taskPublicId,
  trigger,
}: TaskDocumentDeleteDialogProps) {
  const t = useTranslations('tasks.documents');
  const deleteMutation = useDeleteDocument(taskPublicId);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_description', { name: document.original_filename })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deleteMutation.mutate(document.public_id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('deleting') : t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Test cases:**
1. Click Delete → confirm → mutation called → list refreshes.
2. Click Cancel → mutation not called, dialog closes.

**Coding standards applied:**
- `design-system/04-layout-patterns.md` — destructive confirmation pattern.
- `design-system/05-accessibility.md` — `AlertDialog` with explicit destructive button label.

---

### 12. `TaskDocumentsSkeleton` — `components/domain/tasks/task-documents-skeleton.tsx`

**One-line summary:** Skeleton rows matching the `Attachment` shape (icon + title + description lines).

**Files:** `components/domain/tasks/task-documents-skeleton.tsx`

```tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TaskDocumentsSkeleton() {
  return (
    <div className="space-y-3" data-testid="task-documents-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Test case:** Render loading state → skeleton rows with `data-testid="task-documents-skeleton"` are present.

**Coding standards applied:**
- `coding-standards.md` § Loading States — skeleton matches real content shape.

---

### 13. Wire into `TaskDetail` — `components/domain/tasks/task-detail.tsx`

**One-line summary:** Insert `<TaskDocumentsCard publicId={publicId} />` into the sidebar between `DetailsCard` and `RecentActivityCard`.

**Files:** `components/domain/tasks/task-detail.tsx`

```tsx
import { TaskDocumentsCard } from './task-documents-card';

// Inside the sidebar div:
<div className="space-y-5 lg:col-span-1">
  <div className="space-y-5 lg:sticky lg:top-20">
    <DetailsCard task={task} />
    <TaskDocumentsCard publicId={publicId} />
    <RecentActivityCard
      entries={showFullTimeline ? timelineQuery.data : stageActivities}
      isLoading={timelineQuery.isLoading}
      onViewFull={() => setShowFullTimeline(true)}
    />
  </div>
</div>
```

**Coding standards applied:**
- `design-system/04-layout-patterns.md` — two-column detail page, sidebar stacked cards.

---

### 14. i18n — `messages/ar.json` and `messages/en.json`

**One-line summary:** Add `tasks.documents` namespace with all UI strings in Arabic and English.

**Files:** `messages/ar.json`, `messages/en.json`

```json
{
  "tasks": {
    "documents": {
      "title": "المرفقات",
      "upload": "رفع مرفق",
      "uploading": "جاري الرفع...",
      "upload_dialog_title": "رفع مرفق جديد",
      "choose_file": "اختيار ملف",
      "dropzone_label": "منطقة إفلات الملف",
      "dropzone_text": "اسحب الملف هنا أو انقر للاختيار",
      "selected_file": "الملف المختار",
      "description_optional": "الوصف (اختياري)",
      "description_placeholder": "أضف وصفاً قصيراً...",
      "empty_title": "لا توجد مرفقات بعد",
      "empty_description": "قم برفع المستندات والصور المتعلقة بالمهمة هنا.",
      "error": "تعذر تحميل المرفقات.",
      "load_more": "تحميل المزيد",
      "loading_more": "جاري التحميل...",
      "documents_list_label": "المرفقات",
      "download_document": "تنزيل {name}",
      "preview_document": "معاينة {name}",
      "view_versions": "إصدارات {name}",
      "delete_document": "حذف {name}",
      "delete_title": "حذف المرفق",
      "delete_description": "هل أنت متأكد من حذف {name}؟ لا يمكن التراجع عن هذا الإجراء.",
      "delete": "حذف",
      "deleting": "جاري الحذف...",
      "cancel": "إلغاء",
      "versions_title": "إصدارات {name}",
      "versions_list_label": "قائمة الإصدارات",
      "upload_new_version": "رفع إصدار جديد",
      "version_n": "الإصدار {n}",
      "latest": "الأحدث",
      "preview_unavailable": "لا يمكن معاينة هذا النوع من الملفات.",
      "error_too_large": "حجم الملف يتجاوز {max} ميجابايت.",
      "error_disallowed_type": "نوع الملف غير مسموح به. يُسمح بملفات PDF والصور وWord وExcel فقط.",
      "toast_uploaded": "تم رفع المرفق",
      "toast_version_created": "تم إنشاء إصدار جديد",
      "toast_deleted": "تم حذف المرفق"
    }
  }
}
```

English equivalents follow the same structure.

**Coding standards applied:**
- `coding-standards.md` § i18n — all user-facing strings via `useTranslations`.

---

### 15. MSW Handlers — `__tests__/mocks/handlers.ts`

**One-line summary:** Add handlers for document list, upload, versions, and delete endpoints.

**Files:** `__tests__/mocks/handlers.ts`

```ts
import type { DocumentResource } from '@/components/domain/tasks/task-document-types';

const mockDocuments: DocumentResource[] = [
  {
    public_id: 'doc-1',
    original_filename: 'report.pdf',
    mime_type: 'application/pdf',
    mime_category: 'Pdf',
    size_bytes: '1024000',
    version_number: '1',
    description: '',
    uploader: { public_id: 'user-1', name_ar: 'أحمد', name_en: 'Ahmed' },
    download_url: 'https://api.momentum.test/v1/documents/doc-1/download',
    preview_url: 'https://api.momentum.test/v1/documents/doc-1/preview',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

http.get('https://api.momentum.test/v1/tasks/:publicId/documents', () => {
  return HttpResponse.json({
    data: mockDocuments,
    next_cursor: null,
    has_more: false,
  });
}),

http.post('https://api.momentum.test/v1/tasks/:publicId/documents', async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const created: DocumentResource = {
    public_id: 'doc-new',
    original_filename: file?.name ?? 'uploaded.bin',
    mime_type: file?.type ?? 'application/octet-stream',
    mime_category: 'Pdf',
    size_bytes: String(file?.size ?? 0),
    version_number: '1',
    description: String(formData.get('description') ?? ''),
    uploader: { public_id: 'current-user', name_ar: 'أنت', name_en: 'You' },
    download_url: 'https://api.momentum.test/v1/documents/doc-new/download',
    preview_url: null,
    created_at: new Date().toISOString(),
  };
  return HttpResponse.json(created, { status: 200 });
}),

http.get('https://api.momentum.test/v1/documents/:documentId/versions', () => {
  return HttpResponse.json({
    data: mockDocuments.map((d) => ({
      public_id: d.public_id,
      version_number: d.version_number,
      original_filename: d.original_filename,
      mime_type: d.mime_type,
      size_bytes: d.size_bytes,
      uploader: d.uploader,
      created_at: d.created_at,
    })),
    next_cursor: null,
    has_more: false,
  });
}),

http.post('https://api.momentum.test/v1/documents/:documentId/versions', async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  return HttpResponse.json({
    ...mockDocuments[0],
    public_id: 'doc-version-new',
    original_filename: file?.name ?? 'version.pdf',
    version_number: '2',
    created_at: new Date().toISOString(),
  });
}),

http.delete('https://api.momentum.test/v1/documents/:documentId', () => {
  return new HttpResponse(null, { status: 204 });
}),
```

**Test cases:**
1. MSW returns documents → `TaskDocumentsCard` renders attachment rows.
2. MSW returns 422 for disallowed type → upload dialog shows inline error.

**Coding standards applied:**
- `testing-policy.md` — MSW for API mocking, fresh QueryClient per test.

---

### 16. Component Tests — `__tests__/components/domain/tasks/task-documents-card.test.tsx`

**One-line summary:** Test loading, empty, success, upload, delete, and version states.

**Files:** `__tests__/components/domain/tasks/task-documents-card.test.tsx`

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils/test-utils';
import { TaskDocumentsCard } from '@/components/domain/tasks/task-documents-card';

test('renders loading skeleton', () => {
  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);
  expect(screen.getByTestId('task-documents-skeleton')).toBeInTheDocument();
});

test('renders documents and download action', async () => {
  renderWithProviders(<TaskDocumentsCard publicId="task-uuid-1" />);
  await screen.findByText('report.pdf');
  expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
});
```

**Coding standards applied:**
- `testing-policy.md` — render + interaction tests; test user-visible behavior.

---

## Data Flow

```text
User opens /tasks/[publicId]
  → TaskDetailPage renders TaskDetail
  → TaskDetail renders TaskDocumentsCard in sidebar

TaskDocumentsCard mounts:
  → useTaskDocuments(publicId) → GET /v1/tasks/{publicId}/documents?sort=desc
  → apiClient sends credentials + X-Tenant + X-Locale
  → Backend TaskVisibilityScope enforces task visibility
  → Response: { data: DocumentResource[], next_cursor, has_more }
  → TanStack Query caches under queryKeys.tasks.documents(publicId)
  → UI renders list, empty state, or inline error

User clicks Upload:
  → TaskDocumentUploadDialog opens
  → User selects/drops file + optional description
  → Client-side validation passes
  → useUploadTaskDocument.mutate(FormData)
  → POST /v1/tasks/{publicId}/documents
  → On success:
      - invalidate queryKeys.tasks.documents(publicId)
      - invalidate queryKeys.tasks.timeline(publicId)
      - toast.success(t('toast_uploaded'))
      - dialog closes, list refreshes

User clicks Versions:
  → TaskDocumentVersionDialog opens
  → useDocumentVersions(documentPublicId) fetches history
  → Manager clicks Upload New Version → TaskDocumentUploadDialog with useUploadDocumentVersion
  → On success, version list + task documents refresh

User clicks Delete:
  → TaskDocumentDeleteDialog opens
  → Confirm → useDeleteDocument.mutate(documentPublicId)
  → DELETE /v1/documents/{documentPublicId}
  → On success, documents list + timeline refresh

User clicks Preview:
  → TaskDocumentPreviewDialog opens
  → PDF renders in iframe; image renders in img
  → Unsupported types show fallback message
```

---

## Route Structure

```text
app/
  (dashboard)/
    tasks/
      [publicId]/
        page.tsx          # existing — renders TaskDetail
        error.tsx         # existing
```

No new route is introduced. Documents live inside the existing task detail page sidebar.
Locale remains cookie-based (`NEXT_LOCALE`); no `[locale]` route segment.

---

## Execution Order

1. ✅ Verify generated types include `DocumentResource`, `DocumentVersionResource`, `UploadDocumentRequest`, `UploadDocumentVersionRequest` (already confirmed).
2. ✅ Add `attachment` (and confirm `alert-dialog`) via shadcn CLI.
3. ✅ Extend `lib/api/client.ts` to support `FormData` bodies.
4. ✅ Extend `lib/api/query-keys.ts` with `tasks.documents` and `documents.*` namespaces.
5. ✅ Create `lib/api/hooks/use-task-documents.ts`.
6. ✅ Create `components/domain/tasks/task-document-types.ts` and `task-document-utils.ts`.
7. ✅ Create `components/domain/tasks/task-documents-skeleton.tsx`.
8. ✅ Create `components/domain/tasks/task-document-upload-dialog.tsx` *(retained for compat, no longer used by card)*.
9. ✅ Create `components/domain/tasks/task-document-version-dialog.tsx` *(refactored to use inline Attachment states for upload)*.
10. ✅ Create `components/domain/tasks/task-document-preview-dialog.tsx` *(refactored to fetch blob with auth headers)*.
11. ✅ Create `components/domain/tasks/task-document-delete-dialog.tsx`.
12. ✅ Create `components/domain/tasks/task-document-item.tsx` *(single tooltip, outlined danger delete icon)*.
13. ✅ Create `components/domain/tasks/task-documents-list.tsx`.
14. ✅ Create `components/domain/tasks/task-documents-card.tsx` *(two-tier pattern, inline upload with Attachment states)*.
15. ✅ Modify `components/domain/tasks/task-detail.tsx` to render `TaskDocumentsCard` in sidebar.
16. ✅ Add `tasks.documents` translations to `messages/ar.json` and `messages/en.json` *(added ready_to_upload, view_all)*.
17. ✅ Add MSW handlers for document endpoints.
18. ✅ Add component tests *(9 card tests + 4 item tests = 13 total)*.
19. ✅ Run `npm run lint`, `npm run typecheck`, `npm run test` *(all passing)*.

---

## What to Test Manually

### Happy Paths (both locales)

1. **AR RTL:** Open a task with attachments → Documents card loads in sidebar → Arabic text, RTL layout, action buttons align to end.
2. **EN LTR:** Switch to English → same task shows English labels, LTR layout, action buttons align to end.
3. **Upload:** Click Upload → choose a PDF → enter description → submit → toast appears, dialog closes, new attachment appears at top of list (sort=desc).
4. **Preview:** Click Preview on a PDF → dialog opens with iframe; click Preview on an image → dialog opens with img.
5. **Download:** Click Download → file opens in new tab.
6. **Versions:** Click Versions → version history dialog opens; upload a new version → list refreshes with latest highlighted.
7. **Delete:** Click Delete → confirm → attachment removed from list.

### States

8. **Loading:** Navigate directly to a task → Documents card shows skeleton rows before data arrives.
9. **Empty:** Open a task with no attachments → "No attachments yet" empty state appears; upload CTA visible only for managers.
10. **Error (500/network):** Simulate API failure → inline `ErrorState` with retry button inside Documents card; rest of task detail remains usable.
11. **Error (403/404):** Handled by parent `TaskDetail`; Documents card is not rendered separately.

### Validation

12. **Disallowed type:** Try to upload `.exe` → client-side error, Upload disabled.
13. **Too large:** Try to upload >20 MB → client-side error, Upload disabled.
14. **Backend 422:** MSW/real backend rejects a file type/size → inline error shown, dialog stays open.

### Pagination

15. **Load more:** Add 16+ attachments → "Load more" button appears → click appends next page while preserving existing rows.

### Responsive

16. **Desktop (≥1024px):** Documents card sits in sidebar (1/3 width); horizontal attachment rows with action buttons visible.
17. **Tablet (640–1023px):** Documents card stacks full-width below main column.
18. **Mobile (<640px):** Documents card full-width; action buttons collapse to icon-only; upload dialog is full-screen or bottom sheet.

### Keyboard Navigation

19. **Tab order:** Upload button → attachment rows → action buttons → Load more button.
20. **Dropzone keyboard:** Focus dropzone → press Enter/Space → file picker opens.
21. **Dialog keyboard:** Escape closes upload/preview/version dialogs; focus trap works.
22. **Focus rings:** All interactive elements show visible focus rings.