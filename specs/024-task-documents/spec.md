# Spec: Task Documents

> **Number:** 024
> **Date:** 2026-07-05
> **Status:** `completed`
> **Milestone:** F2 — Task board & task details
> **Depends on:** `001-core-shell`, `003-task-board`, `004-task-details`, `023-task-comments`
> **Backend spec:** `../backend/specs/012-documents-attachments/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/024-task-documents`
> **Base branch:** `main`

---

## Problem

Task details (spec 004) and comments (spec 023) give users the full lifecycle and conversation context, but there is still no way to see or share the actual files that belong to a task. Government work is document-driven: ministerial directives, correspondence scans, legal opinions, budget spreadsheets, signed approvals, and supporting evidence all need to travel with the task. Without an attachment layer, users fall back to email or shared drives, fragmenting the audit trail and making it impossible to know which file version is authoritative.

The backend Documents & Attachments module (spec 012) is now stable. It provides upload, list, download, preview, versioning, and soft-delete endpoints for task, stage, sub-stage, and comment attachments. This spec delivers the UI that surfaces those documents on the task detail page and lets authorized users manage them.

---

## Goal

Add a **Documents** card to the task details sidebar (between the Details card and the Recent Activity card) that lets authorized users view, upload, download, preview, version, and delete task attachments. The card consumes the stable backend document API:

- `GET /v1/tasks/{task}/documents` — cursor-paginated list of current task attachments.
- `POST /v1/tasks/{task}/documents` — upload a new attachment.
- `GET /v1/documents/{document}` — attachment metadata.
- `GET /v1/documents/{document}/download` — download file.
- `GET /v1/documents/{document}/preview` — inline preview for PDF/image.
- `POST /v1/documents/{document}/versions` — upload a new version.
- `GET /v1/documents/{document}/versions` — list version history.
- `DELETE /v1/documents/{document}` — soft-delete attachment chain.

The UI uses the shadcn/ui `Attachment` component family (`Attachment`, `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`, `AttachmentAction`, `AttachmentTrigger`, `AttachmentGroup`) for file rows, combined with project patterns for upload dropzones, dialogs, capability gating, and locale-aware metadata. Stage and sub-stage output attachments are also supported where the backend already exposes endpoints; task-level attachments are the MVP focus.

---

## User Stories

### Task Participant

- As a **task initiator**, I want to upload supporting documents to a task, so that all stage assignees have the context they need in one place.
- As a **stage assignee**, I want to upload output documents when I complete my stage, so that the next stage owner can review my work.
- As a **task viewer**, I want to preview a PDF or image inline and download any attachment, so that I can review evidence without switching systems.
- As a **task viewer**, I want to see who uploaded a file and when, so that I can judge its recency and authority.

### Manager / Task Owner

- As a **manager** with `task.manage_documents` capability, I want to replace an attachment with a newer version while keeping older versions visible, so that the task history remains accurate and auditable.
- As a **manager** with `task.manage_documents` capability, I want to delete an outdated or wrongly uploaded attachment, so that the task record stays clean.

### System

- As the **system**, I want document actions to be gated by capabilities, so that only authorized users can upload, version, or delete attachments.
- As the **system**, I want document visibility to inherit parent-task ABAC rules, so that confidential task files are not exposed to unauthorized users.
- As the **system**, I want mutations to invalidate the document list and recent-activity cache, so that the UI reflects the new state immediately.

---

## Acceptance Criteria

### Route and Placement

- [x] The Documents card is rendered on the existing `/tasks/[publicId]` route, inside the task-detail sidebar, between the Details card and the Recent Activity card.
- [x] No new route is introduced; documents are part of the task detail page.
- [x] The route param `publicId` is the task `public_id` (never internal `id`), per `glossary.md` URL rules.

### Document List

- [x] The card fetches `GET /v1/tasks/{task}/documents` using generated OpenAPI types (`DocumentResource`, cursor-paginated `data`, `next_cursor`, `has_more`).
- [x] Each attachment displays: mime-category icon (FileText/FileImage/FileSpreadsheet/FileType/File), localized filename, file type + size, uploader name, relative upload timestamp, and action buttons (download, preview when available, version history, delete).
- [x] Image and PDF attachments show an inline preview in a Dialog using blob URLs (fetched with auth headers). Other file types show a mime-category icon.
- [x] Attachments are ordered newest-first by default. The list query passes `sort=desc` to `GET /v1/tasks/{task}/documents`.
- [x] Long filenames truncate with ellipsis; full filename available via tooltip (single tooltip on the entire content area).

### Upload

- [x] A primary "Upload" button is visible to users with `task.manage_documents` capability.
- [x] Clicking Upload opens a file picker directly (no dialog). The file input is hidden and triggered via a ref.
- [x] Client-side validation enforces max file size (20 MB) and allowed MIME types (PDF, JPEG, PNG, GIF, DOC/DOCX, XLS/XLSX) before any network request. Invalid files show `Attachment state="error"` immediately with the translated error message. Backend `UploadDocumentRequest` enforces the same defaults as the final authority.
- [x] When a valid file is selected, it appears as `Attachment state="idle"` at the top of the list with: file icon, filename, "Ready to upload" description, an inline text input for the optional description, and a primary "Upload" button.
- [x] Submitting calls `POST /v1/tasks/{task}/documents` with `multipart/form-data` (`file`, optional `description`).
- [x] During upload: the attachment transitions to `state="uploading"` with a shimmer animation on the title and "Uploading..." description. A dismiss (X) button allows cancellation.
- [x] On success: the pending entry is removed, the document list is invalidated/refetched, success toast is shown.
- [x] On 422 (file too large, disallowed type, storage error): the attachment transitions to `state="error"` with red border, the error message in the description, and retry (RefreshCw) + dismiss (X) buttons.
- [x] The submit button shows a cursor-pointer and is disabled via the mutation's `isPending` state.

### Download & Preview

- [x] Every attachment row has a Download action that fetches the file blob via `fetchDocumentBlob()` (with `X-Tenant` + `X-Locale` headers) and triggers a browser download via `URL.createObjectURL()`.
- [x] PDF and image attachments have a Preview action that opens the file inline in a `Dialog`. The blob is fetched on dialog open via `useEffect`, served as `URL.createObjectURL()` (iframe for PDF, `img` for images).
- [x] Preview action is hidden when `preview_url` is `null`.
- [x] Download and preview respect task visibility; 403/404 errors show the existing error patterns.

### Version History

- [x] Each attachment row has a "Versions" action that opens a `Dialog` showing the version history.
- [x] The version dialog fetches `GET /v1/documents/{document}/versions` (cursor-paginated `DocumentVersionResource[]`).
- [x] Each version row shows version number, filename, size, uploader, and upload date. The version list response does not include download/preview URLs, so historical versions are read-only in MVP.
- [x] Users with `task.manage_documents` see an "Upload New Version" button that triggers a file picker directly. When a file is selected, it appears as `Attachment state="idle"` inside the version dialog with an inline description input and upload button — matching the main card pattern. On success, the version list refreshes.
- [x] The latest version is visually highlighted in the version list. Download and preview actions remain on the main attachment row only (current version).

### Delete

- [ ] Users with `task.manage_documents` capability see a Delete action on each attachment row.
- [ ] Clicking Delete opens an `AlertDialog` with a destructive confirmation and the attachment name.
- [ ] On confirm, `DELETE /v1/documents/{document}` is called.
- [ ] On success: the document list is invalidated/refetched, success toast is shown.
- [ ] On 403 (not uploader and lacks `task.manage_documents`): error toast is shown; the row remains.

### Stage & Sub-stage Attachments (Supported but Secondary)

- [ ] The same `Attachment` row component and hooks can be reused for stage/sub-stage output documents by passing the appropriate entity public ID.
- [ ] In MVP, the UI only exposes task-level attachments in the sidebar; stage/sub-stage output attachments are surfaced through the Complete Stage dialog or a future enhancement if needed (see Out of Scope).

### States

- [x] **Loading**: a documents-specific skeleton matching the card shape — 3 attachment-row skeletons (icon + text lines) inside the Documents card.
- [x] **Empty**: when the task has no attachments, the Documents card shows an `EmptyState` with a paperclip/file icon, localized headline ("No attachments yet"), and an "Upload" CTA for users with `task.manage_documents`.
- [x] **Error (500/network)**: an inline `ErrorState` inside the Documents card with a retry button that refetches the document list; the rest of the task detail page remains usable.
- [x] **Error (403)**: if the user cannot view the task, the entire task detail page shows the existing no-permission state; documents are not rendered separately.
- [x] **Success**: the full Documents card renders with the document list, upload button, and per-row actions. The card shows the first 3 documents inline with a "View all" link if more exist.

### Responsive Behavior

- [ ] **Desktop (≥1024px)**: Documents card sits in the sidebar (1/3 width) between Details and Recent Activity; list uses horizontal attachment rows.
- [ ] **Tablet (640–1023px)**: Documents card stacks full-width below the main column; same internal layout as desktop.
- [ ] **Mobile (<640px)**: Documents card stacks full-width; attachment rows remain horizontal but action buttons collapse into an overflow menu or shrink to icon-only.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useTaskDocuments(taskPublicId, sort = 'desc')` uses `useInfiniteQuery`, `queryKeys.tasks.documents(taskPublicId, { sort })`, and `GET /v1/tasks/{task}/documents?sort=desc`. `enabled: !!taskPublicId`. Cursor pagination (`next_cursor`, `has_more`) with manual "Load more" button.
- [x] `useDocument(documentPublicId)` uses `useQuery` and `GET /v1/documents/{document}` for metadata detail (optional in MVP; not used in components).
- [x] `useDocumentVersions(documentPublicId)` uses `useInfiniteQuery` and `GET /v1/documents/{document}/versions` for the version-history dialog.
- [x] `useUploadTaskDocument(taskPublicId)` uses `useMutation` and `POST /v1/tasks/{task}/documents` with `multipart/form-data`. On success: invalidate document list and timeline queries using prefix matching.
- [x] `useUploadDocumentVersion(documentPublicId)` uses `useMutation` and `POST /v1/documents/{document}/versions`. On success: invalidate version list and task document queries.
- [x] `useDeleteDocument()` uses `useMutation` and `DELETE /v1/documents/{document}`. On success: invalidate document list and timeline queries.
- [x] All response/request types come from `lib/generated/api-types.ts`; no hand-written API DTOs. `DocumentResource`, `DocumentVersionResource`, `UploadDocumentRequest`, and `UploadDocumentVersionRequest` are confirmed present.
- [x] No `useEffect` + `fetch` for API data; all API calls go through TanStack Query hooks. `fetch()` is only used for document blob downloads (which require auth headers).

### Query Key Structure

> Extend `lib/api/query-keys.ts`:

```ts
tasks: {
  // existing keys...
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
```

- [ ] Document keys are nested under `tasks.detail(taskPublicId)` so that invalidating the task detail also enables granular invalidation of documents.
- [ ] No hardcoded query key strings in any component.

### State Management

- [ ] **TanStack Query**: all API-derived state (document list, versions, metadata).
- [ ] **URL state**: no additional URL params for documents in MVP (no permalink to a single document, no filter state).
- [ ] **Zustand**: none required. No API data in Zustand.
- [ ] **Local component state**:
  - Upload dialog open/close.
  - Selected file object and optional description value.
  - Version-history dialog open/close and active document public ID.
  - Upload-version dialog open/close inside version history.
  - Preview dialog open/close and active preview URL/document.

### Mutations

- [ ] `useUploadTaskDocument()` invalidates the documents list and recent-activity/timeline queries on success. No optimistic update in MVP — the server returns the created `DocumentResource` and the list refetches.
- [ ] `useUploadDocumentVersion()` invalidates the version list and parent task documents list on success.
- [ ] `useDeleteDocument()` invalidates the documents list and timeline queries on success.
- [ ] All mutations use `toast.success()` / `toast.error()` from sonner for feedback per `coding-standards.md`.

### Error Handling

- [ ] 401 → redirect to login (handled globally by query client `QueryCache.onError`).
- [ ] 403 → the existing task-detail `EmptyState` with lock icon is shown; task visibility is the authorization gate for documents.
- [ ] 404 → the existing task-detail "task not found" `EmptyState` is shown.
- [ ] 422 (file validation, storage error) → inline error in the upload dialog or toast; dialog stays open so the user can retry.
- [ ] 500 / network error → inline `ErrorState` inside the Documents card with retry; no stack traces or internal IDs exposed.
- [ ] Mutation errors show `toast.error()` with the backend message (localized via `X-Locale` header).

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `TaskDocumentsCard` | Client | Domain | Main documents card rendered inside `TaskDetail` sidebar; owns queries, upload button, list, pending upload states, and "View all" dialog |
| `TaskDocumentsList` | Client | Domain | Scrollable/infinite list of attachment rows with "Load more" |
| `TaskDocumentItem` | Client | Domain | Single attachment row using shadcn `Attachment` primitives |
| `TaskDocumentVersionDialog` | Client | Domain | Dialog showing version history + inline upload-new-version with `Attachment` states |
| `TaskDocumentPreviewDialog` | Client | Domain | Dialog for inline PDF/image preview using blob URL |
| `TaskDocumentDeleteDialog` | Client | Domain | `AlertDialog` wrapper for destructive delete confirmation |
| `TaskDocumentsSkeleton` | Client | Domain | Skeleton rows matching attachment shape |
| `TaskDocumentUploadDialog` | Client | Domain | Dialog with drag-drop file input + description textarea. Used by the version dialog for uploading new versions. |
| `Attachment`, `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`, `AttachmentAction`, `AttachmentTrigger`, `AttachmentGroup` | Client | shadcn | `state` prop used for upload lifecycle: `idle` (ready), `uploading` (shimmer), `error` (retry), `done` (complete) |
| `Button`, `Card`, `Dialog`, `AlertDialog`, `Skeleton`, `Tooltip`, `ScrollArea` | Client | shadcn | Existing primitives. `ScrollArea` replaced by plain `overflow-y-auto` div in "View all" dialog to avoid Radix `display: table` width issues |
| `EmptyState`, `ErrorState` | Client | Shared | Reused from `components/shared/` |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `TaskDocumentsSkeleton` | 3–4 attachment-row skeletons (icon + title + description lines) inside the Documents card |
| Empty | `EmptyState` | Paperclip/file icon, "No attachments yet" headline, upload CTA for authorized users |
| Error | `ErrorState` | Safe message + retry button inside the Documents card |
| Success | `TaskDocumentsCard` | Full card: attachment list + upload button + per-row actions |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Documents card stacks full-width; attachment rows stay horizontal but action buttons collapse to overflow menu or icon-only; upload dialog is full-screen or bottom sheet |
| Tablet (640–1023px) | Documents card stacks full-width below main column; same internal layout as desktop |
| Desktop (≥1024px) | Documents card is in sidebar (1/3 width); horizontal attachment rows with action buttons visible |

### RTL Considerations

- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`). No physical direction classes (`ml-`, `mr-`, `text-left`, etc.).
- [x] Attachment row content aligns to start; actions align to end.
- [x] Directional icons (`ArrowRight`, download arrow) use `rtl:rotate-180`.
- [x] Filename and metadata text align `text-start`.
- [x] Dialog content aligns `text-start`.

### Accessibility

- [x] All interactive elements (Upload button, Download, Preview, Versions, Delete, Load more) have visible focus rings.
- [x] Icon-only buttons (Download, Preview, Versions, Delete) have `aria-label` in the active locale describing the action and target filename.
- [x] Upload triggers via a hidden file input ref. No dropzone in the current implementation.
- [x] The attachment list has an `aria-label` describing it as "Attachments" / "المرفقات".
- [x] Preview dialog uses `Dialog` with focus trap and Escape-to-close.
- [x] Delete confirmation uses `AlertDialog` with explicit destructive button label.
- [x] Error messages in the pending upload attachment are announced via `role="alert"`.
- [x] Touch targets meet minimum sizes on action buttons.
- [x] `prefers-reduced-motion` disables skeleton pulse (inherited from shadcn Skeleton).

### Animation

- [ ] Skeleton: `animate-pulse` on attachment-row skeletons; disabled under `prefers-reduced-motion`.
- [ ] Upload dropzone: subtle border/background transition on drag-over (`transition-colors duration-200`).
- [ ] Upload in-progress: shadcn `Attachment` `state="uploading"` shimmer on the newly added row if optimistic preview is shown; otherwise rely on dialog loading spinner.
- [ ] Button press: `active:scale-[0.98] transition-transform` on submit buttons.
- [ ] Dialog open/close: shadcn default `animate-in fade-in` overlay + `animate-in zoom-in-95` content.
- [ ] No glass effects on documents card (dense file list; glass deferred per `02-glassmorphism.md`).

---

## Non-Functional Requirements

### Performance

- [ ] Cursor pagination for attachment lists; do not load the entire attachment history at once.
- [ ] Memoize the flattened document list via `useMemo` to avoid unnecessary re-renders.
- [ ] No heavy third-party libraries; built with existing project primitives and shadcn `Attachment`.
- [ ] PDF/image preview dialog lazy-loads the preview content; only fetch `preview_url` when the dialog opens.

### Security

- [ ] Backend ABAC (`TaskVisibilityScope`) is the source of truth for document visibility — client never reconstructs visibility rules.
- [ ] Capability checks (`useCapability('task.manage_documents')`, `useCapability('task.view_documents')`) hide/disable upload/delete/version actions for UX only; server returns 403 regardless.
- [ ] No PII in URLs or console logs. Uploader display uses `name_ar` / `name_en` only.
- [ ] No `dangerouslySetInnerHTML` — document descriptions are plain text rendered through React escaping.
- [ ] No `console.log` of document data in committed code (verified during lint).

### Testing

> Reference: `docs/ai/testing-policy.md`

- [ ] Component test for `TaskDocumentsCard`: loading skeleton, empty state, success with attachments, error state with retry.
- [ ] Component test for `TaskDocumentItem`: renders filename, size, uploader, actions; hides delete/version actions without `task.manage_documents`.
- [ ] Interaction test: open upload dialog → select file → enter description → submit → MSW returns created document → list refreshes → dialog closes.
- [ ] Interaction test: click Delete → confirm → MSW returns 204 → list refreshes.
- [ ] Interaction test: click Versions → version list dialog opens → upload new version → version list refreshes.
- [ ] Interaction test: 422 (disallowed file type) → error shown in dialog, dialog stays open.
- [ ] Both locales tested (AR RTL + EN LTR) for attachment row layout, action alignment, and dialog text alignment.
- [ ] MSW handlers for `GET /tasks/{task}/documents`, `POST /tasks/{task}/documents`, `GET /documents/{document}/versions`, `POST /documents/{document}/versions`, `DELETE /documents/{document}`.
- [ ] Tests use `renderWithProviders` wrapper with fresh `QueryClientProvider` per test.

---

## Out of Scope

- **Comment attachments** — backend 012/013 supports uploading documents to comments, but the UI for uploading or viewing comment attachments is deferred. Spec 023 only shows a read-only `attachment_count` indicator; the actual comment attachment UX is a future enhancement.
- **Stage/sub-stage output attachment UI** — backend supports attaching files to stage/sub-stage instances, but in MVP the Documents card only lists task-level attachments. Surfacing stage output attachments in the Complete Stage dialog or a separate panel is deferred.
- **Bulk upload** — upload one file at a time in MVP; multi-file drop is V2.
- **Drag-and-drop onto the entire card** — only the upload dialog dropzone supports drag-and-drop in MVP; card-level drop is V2.
- **File renaming** — no edit-name endpoint in backend; users delete and re-upload if the name is wrong.
- **Advanced preview** — no office document preview, no text-file preview, no video/audio preview. Only PDF and images are previewable, matching backend `DocumentMimeCategory::supportsPreview()`.
- **Document-level access restrictions beyond parent-task visibility** — deferred.
- **Virus scanning, OCR, thumbnails, full-text search** — deferred to V2/V3.
- **Standalone documents page or route** — documents live only inside task details in MVP.
- **Document search / filter** — no search box or type filter in MVP.

---

## Open Questions — All Resolved

- [x] **Attachment ordering** — **Resolved.** Backend now accepts `?sort=asc|desc` on `GET /v1/tasks/{task}/documents` (and stage/sub-stage/comment list endpoints). Default backend sort remains `asc` (oldest-first). Frontend passes `sort=desc` to show newest attachments first, which matches the UI convention. No client-side reversal needed.
- [x] **Upload max size / allowed types source of truth** — **Resolved.** Frontend hardcodes the same defaults as backend (20 MB; PDF, JPEG, PNG, GIF, DOC/DOCX, XLS/XLSX) for client-side pre-validation. Backend `UploadDocumentRequest` reads `tenant.settings.max_upload_size_mb` and can override defaults per-tenant; frontend relies on backend validation as the final authority. V2 may add a `GET /v1/settings/documents` endpoint if the UI needs to reflect tenant overrides dynamically.
- [x] **Image preview thumbnail** — **Resolved.** No thumbnail endpoint in MVP. Use the full `preview_url` inside a constrained `<img>` container with `object-fit: contain`. The backend streams the full file inline; CSS handles the sizing.
- [x] **Version dialog UX** — **Resolved.** MVP version dialog is read-only history (version_number, filename, size, uploader, date) + "Upload New Version" action. Historical versions have no download/preview URLs in the backend response, so Download/Preview on old versions is deferred. The main attachment row keeps Download/Preview for the current (latest) version only.
- [x] **Stage/sub-stage attachments in task list** — **Resolved.** Sidebar Documents card stays task-direct only in MVP. `GET /v1/tasks/{task}/documents` filters by `entity_type = Task`. Stage/sub-stage attachments have separate endpoints and are out of scope for this card; an aggregated endpoint is V2 scope.

---

→ **Next:** Review this spec. Do not create `plan.md` until the draft is approved.
