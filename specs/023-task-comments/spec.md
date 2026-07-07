# Spec: Task Comments

> **Number:** 023
> **Date:** 2026-07-04
> **Status:** `completed`
> **Milestone:** F2 — Task board & task details
> **Depends on:** `001-core-shell`, `003-task-board`, `004-task-details`
> **Backend spec:** `../backend/specs/013-comments-collaboration/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/023-task-comments`
> **Base branch:** `main`

---

## Problem

Task details (spec 004) shows the full lifecycle context — title, stage timeline, metadata, and recent activity — but there is still no place for task participants to talk to each other inside the task. Today a stage assignee who needs clarification, an initiator who wants to add context, or a reviewer who needs to record an informal observation must leave the platform and use email, chat, or phone. That fragments accountability: the conversation that explains *why* a decision was made is stored outside the audit trail, invisible to future reviewers and follow-up specialists.

Government workflows require every clarification and supporting statement to be discoverable and auditable. Without an in-task comment thread, the platform cannot answer basic operational questions such as "Who asked for this change?", "What was the reason for the delay?", or "Where is the supporting evidence?".

The backend Comments & Collaboration subsystem (spec 013) is now stable: it provides top-level comments, single-level replies, document attachments on comments (handled by the Document module, spec 012), and automatic indexing into search and recent activity. This spec delivers the UI that surfaces the conversation layer on the task details page. Document upload, preview, and download UI is intentionally deferred to spec `024-task-documents` so the document components are built once and reused.

---

## Goal

Add a **Comments** card to the task details main column (immediately after the Stage Timeline card) that lets authorized task participants read, post, and reply to comments. The card consumes the stable backend comment API:

- `GET /v1/tasks/{task}/comments` — cursor-paginated top-level comments with nested replies.
- `POST /v1/tasks/{task}/comments` — create a top-level comment or a single-level reply.

Authorization is gated by parent-task visibility only; no additional capability is required to read or post comments.

The UI uses the shadcn/ui `Message` component family (`Message`, `MessageAvatar`, `MessageContent`, `MessageHeader`, `MessageFooter`, `Bubble`, `BubbleContent`) for message rows, combined with project avatars and locale-aware timestamps. The layout follows the existing task-detail stacked-card pattern from spec 004 and reserves no tabs.

---

## User Stories

### Task Participant

- As a **task initiator**, I want to add a top-level comment to a task, so that I can provide clarification or additional context to current and future assignees.
- As a **stage assignee**, I want to reply to an existing comment, so that follow-up questions and answers stay threaded inside the task.
- As a **task viewer**, I want to see all comments and replies in chronological order, so that I can understand the full conversation history before acting.

### Manager / Follow-Up Specialist

- As a **manager**, I want to read the comment history before overriding an assignment or returning a stage, so that I understand the context behind the current state.
- As a **follow-up specialist**, I want to see whether a task has recent comments, so that I can avoid duplicating questions that were already asked.

### System

- As the **system**, I want the comments panel to enforce task visibility on every data fetch, so that users only see comments on tasks they are authorized to view.
- As the **system**, I want comment creation to invalidate the comments list and recent-activity cache, so that the UI reflects the new comment immediately.

---

## Acceptance Criteria

### Route and Placement

- [x] The Comments card is rendered on the existing `/tasks/[publicId]` route, inside the task-detail main column, immediately after the Stage Timeline card and before any future cards.
- [x] No new route is introduced; comments are part of the task detail page.
- [x] The route param `publicId` is the task `public_id` (never internal `id`), per `glossary.md` URL rules.

### Comment List

- [x] The card fetches `GET /v1/tasks/{task}/comments` using generated OpenAPI types (`CommentResource`, cursor-paginated `data`, `next_cursor`, `has_more`).
- [x] Top-level comments are rendered oldest-first, matching the backend ordering (`orderBy('id')` ascending).
- [x] Each top-level comment displays: author avatar with initials fallback, localized author name (`name_ar` / `name_en` picked by locale), relative timestamp, comment body, attachment count indicator when `attachment_count > 0`, and a Reply button.
- [x] Replies are nested under their parent top-level comment, also oldest-first, using the same message-row styling but visually indented (ps-8).
- [ ] Consecutive replies from the same author use `MessageGroup` styling where appropriate to reduce visual noise. *(Deferred — MVP renders replies as separate rows; MessageGroup requires grouping logic not yet needed.)*
- [x] Comment body is plain text; line breaks are preserved. No rich text, Markdown, or HTML rendering in MVP.

### Adding Comments

- [x] A composer input is fixed at the bottom of the Comments card with a multiline textarea and a primary "Post Comment" button.
- [x] The textarea enforces the backend `maxLength` of 5000 characters (client-side + server-side validation).
- [x] Clicking "Reply" on a comment reveals an inline composer for that comment only; the inline composer has the same 5000-character limit and a "Post Reply" button.
- [x] Only one reply composer is open at a time; clicking Reply on another comment closes the previous one.
- [x] Posting a top-level comment calls `POST /v1/tasks/{task}/comments` with `body`; posting a reply includes `parent_comment_id` (the top-level comment `public_id`).
- [x] On success: the comments list is invalidated/refetched, the composer is cleared, any open reply composer is closed, and a success toast is shown.
- [ ] On 422 (e.g., reply-to-reply, parent on another task): the backend message is shown as a sonner toast, the composer remains open with the text preserved. *(Changed from inline to toast — see plan.md for rationale.)*
- [x] The submit button shows loading text and is disabled while the mutation is in flight.

### Attachment Count Indicator (Read-Only)

- [x] A comment with `attachment_count > 0` shows a non-interactive attachment indicator (paperclip icon + count) in its footer.
- [x] The indicator is a visual hint only; clicking it does **not** expand a list or download files in this spec.
- [x] Attachment upload, preview, download, and list expansion are deferred to spec `024-task-documents`.

### Pagination

- [x] Top-level comments use `useInfiniteQuery` with cursor pagination (`next_cursor`, `has_more`).
- [x] A manual "Load more comments" button appears when `has_more` is true; it is disabled while fetching the next page.
- [x] Replies under each top-level comment are rendered as a full list (backend returns all replies inline); no separate pagination for replies in MVP.

### States

- [x] **Loading**: a comments-specific skeleton matching the card shape — 3 message-row skeletons (avatar circle + bubble rectangles) inside the Comments card.
- [x] **Empty**: when the task has no comments, the Comments card shows an `EmptyState` with a conversation icon, localized headline ("No comments yet"), and a short CTA encouraging the user to start the conversation.
- [x] **Error (500/network)**: an inline `ErrorState` inside the Comments card with a retry button that refetches the comments list; the rest of the task detail page remains usable.
- [x] **Error (403)**: if the user cannot view the task, the entire task detail page shows the existing no-permission state; comments are not rendered separately.
- [x] **Success**: the full Comments card renders with the comment list, composer, and reply/attachment interactions.

### Responsive Behavior

- [x] **Desktop (≥1024px)**: Comments card spans the main column (2/3 width) with the composer fixed at the bottom and a scrollable message area above.
- [x] **Tablet (640–1023px)**: Comments card stacks full-width below the Stage Timeline card (inherits grid layout from TaskDetail); composer remains at the bottom of the card.
- [x] **Mobile (<640px)**: Comments card stacks full-width (inherits single-column grid layout); composer textarea grows; reply composer is full-width below the parent comment.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useTaskComments(taskPublicId)` uses `useInfiniteQuery`, `queryKeys.tasks.comments(taskPublicId)`, and `GET /v1/tasks/{task}/comments`. `enabled: !!taskPublicId`. Top-level comments are cursor-paginated (`next_cursor`, `has_more`); replies are embedded in each `CommentResource.replies`.
- [x] `useCreateComment(taskPublicId)` uses `useMutation` and `POST /v1/tasks/{task}/comments`. On success: invalidate `queryKeys.tasks.comments(taskPublicId)` and `queryKeys.tasks.timeline(taskPublicId)` (so Recent Activity card refreshes with the `CommentAdded` event).
- [x] All response/request types come from `lib/generated/api-types.ts`; no hand-written API DTOs. `CommentResource` and `StoreCommentRequest` were confirmed present at implementation time.
- [x] No `useEffect` + `fetch`; all API calls go through TanStack Query hooks.

### Query Key Structure

> Extend `lib/api/query-keys.ts`:

```ts
tasks: {
  // existing keys...
  comments: (taskPublicId: string) =>
    [...queryKeys.tasks.detail(taskPublicId), 'comments'] as const,
},
```

- [x] Comment keys are nested under `tasks.detail(taskPublicId)` so that invalidating the task detail also enables granular invalidation of comments.
- [x] No hardcoded query key strings in any component.

### State Management

- [x] **TanStack Query**: all API-derived state (comment list).
- [x] **URL state**: no additional URL params for comments in MVP (no permalink to a single comment, no filter state).
- [x] **Zustand**: none required. No API data in Zustand.
- [x] **Local component state**:
  - Active reply comment `public_id` (or `null`).
  - Composer text value for top-level comments.
  - Reply composer text value per active reply (reset on submit).

### Mutations

- [x] `useCreateComment()` invalidates the comments list and recent-activity/timeline queries on success. No optimistic update in MVP — the server returns the created `CommentResource` and the list refetches.
- [x] All mutations use `toast.success()` / `toast.error()` from sonner for feedback per `coding-standards.md`.

### Error Handling

- [x] 401 → redirect to login (handled globally by query client `QueryCache.onError`).
- [x] 403 → the existing task-detail `EmptyState` with lock icon is shown; task visibility is the authorization gate for comments.
- [x] 404 → the existing task-detail "task not found" `EmptyState` is shown.
- [x] 422 (comment validation) → toast error via sonner; composer stays open with text preserved.
- [x] 500 / network error → inline `ErrorState` inside the Comments card with retry; no stack traces or internal IDs exposed.
- [x] Mutation errors show `toast.error()` with the backend message (localized via `X-Locale` header).

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `TaskCommentsCard` | Client | Domain | Main comments card rendered inside `TaskDetail` main column; owns queries, composer, and list |
| `TaskCommentsList` | Client | Domain | Scrollable list of top-level comments with "Load more" |
| `TaskCommentItem` | Client | Domain | Single top-level comment row: avatar, header, bubble, footer, reply button, nested replies |
| `TaskCommentReply` | Client | Domain | Single reply row nested under a top-level comment |
| `TaskCommentComposer` | Client | Domain | Multiline textarea + submit button for top-level comments |
| `TaskCommentReplyComposer` | Client | Domain | Inline composer for replies; same internals as top-level composer |
| `TaskCommentSkeleton` | Client | Domain | Skeleton rows matching message shape |
| `Message`, `MessageAvatar`, `MessageContent`, `MessageHeader`, `MessageFooter`, `MessageGroup` | Client | shadcn | Install via `npx shadcn@latest add @shadcn/message` |
| `Bubble`, `BubbleContent` | Client | shadcn | Dependency of `Message`; install alongside message |
| `Avatar`, `AvatarFallback`, `AvatarImage` | Client | shadcn | Existing project avatar primitive |
| `Button`, `Card`, `Skeleton`, `Textarea`, `Separator`, `ScrollArea`, `Tooltip` | Client | shadcn | Existing primitives |
| `EmptyState`, `ErrorState` | Client | Shared | Reused from `components/shared/` |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `TaskCommentSkeleton` | 3–4 message-row skeletons (circular avatar + rounded bubble rectangles) inside the Comments card |
| Empty | `EmptyState` | Conversation/message-circle icon, "No comments yet" headline, short CTA |
| Error | `ErrorState` | Safe message + retry button inside the Comments card |
| Success | `TaskCommentsCard` | Full card: scrollable message list + composer |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Comments card stacks full-width; composer textarea grows; reply composer is full-width below parent comment |
| Tablet (640–1023px) | Comments card stacks full-width below Stage Timeline; same internal layout as desktop |
| Desktop (≥1024px) | Comments card is in main column (2/3 width); message list scrolls if taller than viewport; composer sticky at card bottom |

### RTL Considerations

- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`). No physical direction classes (`ml-`, `mr-`, `text-left`, etc.).
- [x] Message alignment: current-user comments align to `end` (flex-row-reverse); others align to `start`.
- [x] Author avatar and bubble order follows reading direction.
- [x] Reply indentation uses logical start padding (`ps-8`) so it remains indented in RTL.
- [x] Composer action buttons align to the end of the card (`justify-end`).
- [x] Timestamp and attachment indicator text align `text-start`.

### Accessibility

- [x] All interactive elements (Reply button, submit button, Load more button) have visible focus rings.
- [x] Icon-only buttons (reply) have `aria-label` in the active locale.
- [x] Comment list is an `<ol>` with `aria-label="Comments"` / `aria-label="Replies"` so screen readers announce the structure.
- [x] Each comment row uses `article` semantics with `aria-labelledby` pointing to the author.
- [x] The composer textarea has an associated `<label>` (visually hidden) per accessibility requirements.
- [ ] Required validation errors linked via `aria-describedby`. *(Inline errors replaced by toasts; aria-describedby not implemented for toast errors.)*
- [x] Sonner toasts handle live region announcements for mutations.
- [x] Touch targets meet minimum sizes on action buttons.
- [x] `prefers-reduced-motion` disables skeleton pulse (inherited from shadcn Skeleton).

### Animation

- [x] Skeleton: `animate-pulse` on message-row skeletons; disabled under `prefers-reduced-motion`.
- [x] New comment appearance: rely on list refetch + re-render; no custom entrance animation in MVP.
- [x] Button press: `active:scale-[0.98] transition-transform` on submit buttons.
- [x] No glass effects on comments card (dense conversation content; glass deferred per `02-glassmorphism.md`).

---

## Non-Functional Requirements

### Performance

- [x] Cursor pagination for top-level comments; do not load the entire conversation at once.
- [x] Memoize the flattened comment list via `useMemo` to avoid unnecessary re-renders.
- [x] No heavy third-party libraries; built with existing project primitives (`Avatar`, `Card`, `Button`, `Textarea`).

### Security

- [x] Backend ABAC (`TaskVisibilityScope`) is the source of truth for comment visibility — client never reconstructs visibility rules.
- [x] No PII in URLs or console logs. Author display uses `name_ar` / `name_en` only.
- [x] No `dangerouslySetInnerHTML` — comment body is plain text rendered through React escaping, with `whitespace-pre-wrap` for line-break preservation.
- [x] No `console.log` of comment data in committed code (verified during lint).

### Testing

> Reference: `docs/ai/testing-policy.md`

- [x] Component test for `TaskCommentsCard`: loading skeleton, empty state, success with comments, error state with retry.
- [ ] Component test for `TaskCommentItem`: renders author, body, timestamp, reply button, nested replies. *(Covered implicitly by TaskCommentsCard success test.)*
- [x] Interaction test: type in composer → click Post → MSW returns created comment → list refreshes → composer cleared.
- [x] Interaction test: click Reply → type reply → Post → composer closes on success.
- [x] Interaction test: 422 → toast error shown, composer stays open.
- [ ] Both locales tested (AR RTL + EN LTR) for message alignment, reply indentation, and composer layout. *(English locale verified for labels; locale-specific layout verified in browser.)*
- [x] MSW handlers for `GET /tasks/{task}/comments`, `POST /tasks/{task}/comments`.
- [x] Tests use `renderWithProviders` wrapper with fresh `QueryClientProvider` per test.

---

## Out of Scope

- **Editing or deleting comments** (backend 013 supports soft deletes only; no edit/delete endpoints in MVP) — V2 feature #175.
- **@mentions and mention notifications** (feature #146) — V2.
- **Internal / department-only comments** (feature #174) — V2.
- **Rich text, Markdown, or HTML formatting** — plain text only in MVP.
- **Comment reactions / emoji responses** — V2.
- **Real-time websockets or live comment streaming** — V2; comments refresh via list invalidation after creation.
- **Email or in-app notifications for new comments** — V2 (backend event hook exists but delivery logic is deferred).
- **Comment-level permission grants beyond parent-task visibility** — deferred.
- **Comment attachments version restrictions or access controls beyond the parent task** — deferred.
- **Uploading, listing, previewing, or downloading comment attachments** — deferred to spec `024-task-documents`. `023` only shows a read-only `attachment_count` indicator.
- **Merging comments into the task timeline endpoint** — comments remain a separate panel in MVP.
- **Standalone comments page or route** — comments live only inside task details.
- **Comment search / full-text search UI** — comment content is indexed for global task search, but there is no dedicated comment search box.

---

## Open Questions — Resolved

- [x] **shadcn `Message` + `Bubble` installation:** **Resolved.** `@shadcn/message` and `@shadcn/bubble` were added to the registry after the original plan. Installed via `npx shadcn@latest add message bubble`. `TaskCommentItem` and `TaskCommentReply` use `<Message align={...}>` with `<MessageAvatar>`, `<MessageContent>`, `<MessageHeader>`, `<MessageFooter>`, and `<Bubble variant={...}>` for message rows. Bubble variants: `default` (`bg-primary`) for current user, `secondary` (`bg-secondary`) for others.
- [x] **Generated type freshness:** **Resolved.** `CommentResource` and `StoreCommentRequest` were confirmed present in `lib/generated/api-types.ts`. No regeneration required before implementation. `DocumentResource` will be needed in spec `024-task-documents`.
- [x] **Comment composer sticky behavior:** **Resolved.** Composer stays at the bottom of the card; the message list scrolls if it exceeds `max-h-[60vh]`. Matches the existing detail-page stacked-card pattern and avoids a floating input that overlaps other cards.
- [x] **Current-user message alignment:** **Resolved.** Current user's own comments align to `end` (chat-style); all others align to `start`. Implemented via `<Message align="end">` + `<Bubble variant="default">` for own messages, `<Message align="start">` + `<Bubble variant="secondary">` for others.
- [x] **Reply threading depth:** **Resolved.** Backend spec `013` enforces single-level replies only (a reply cannot have its own replies). The UI reflects this by showing a **Reply** button only on top-level comments; reply rows have no Reply button.

---
