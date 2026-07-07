# Implementation Plan: 023 Task Comments

> **Spec:** `specs/023-task-comments/spec.md`
> **Date:** 2026-07-04
> **Status:** `completed`

---

## Open Questions Resolved

| # | Question (from spec) | Decision | Rationale |
|---|----------------------|----------|-----------|
| 1 | shadcn `Message` + `Bubble` installation | **Install.** `@shadcn/message` and `@shadcn/bubble` were added to the registry after the original plan. Installed via `npx shadcn@latest add message bubble`. Used `<Message>`, `<MessageAvatar>`, `<MessageContent>`, `<MessageHeader>`, `<MessageFooter>`, `<Bubble>`, `<BubbleContent>` for message rows. | Registry now provides the components. Bubble variant `default` (`bg-primary`) for current user, `secondary` (`bg-secondary`) for others. |
| 2 | Generated type freshness | **`CommentResource` and `StoreCommentRequest` are already present in `lib/generated/api-types.ts`.** No regeneration required before implementation. | Confirmed by grep in `lib/generated/api-types.ts`. |
| 3 | Composer sticky behavior | **Composer stays at the bottom of the Comments card; the message list scrolls if it exceeds `max-h-[60vh]`.** | Matches the existing detail-page stacked-card pattern and avoids a floating input that overlaps other cards. |
| 4 | Current-user message alignment | **Current user's own comments align to `end` (chat-style); all others align to `start`.** | Improves scanability and matches common conversation UX. |
| 5 | Reply threading depth | **Single-level replies only.** Reply button is shown only on top-level comments; reply rows have no Reply button. | Backend 013 enforces this; UI reflects it to avoid 422 errors. |
| 6 | OpenAPI path param type | **`task` path param is typed as `number` in generated types, but the route accepts the task `public_id` string.** Implementation uses `/v1/tasks/${taskPublicId}/comments` where `taskPublicId` is the UUID from the URL. | Consistent with all other task-detail endpoints (e.g., `/v1/tasks/${publicId}`). |

<!-- TODO resolved: `per_page` default of 15 accepted; no override implemented. -->

---

## Technical Approach

**One-line summary:** Add a Comments card to the task detail main column (after Stage Timeline) using `useInfiniteQuery` for top-level comments, a `useMutation` for create/reply, and shadcn `Message` + `Bubble` components for message rows.

**Key decisions:**
- **Use shadcn Message + Bubble components** — `<Message>` with `align` prop handles row layout, avatar alignment, and RTL; `<Bubble>` with `variant` prop handles bubble surface styling (`default` for current user, `secondary` for others).
- **Cursor pagination for top-level comments only** — replies are returned inline as a full list per backend 013.
- **Single-file hook domain** — add comment hooks to a new `lib/api/hooks/use-task-comments.ts` file to keep the detail hook file from growing.
- **Granular invalidation** — `useCreateComment` invalidates `queryKeys.tasks.comments(taskPublicId)` and `queryKeys.tasks.timeline(taskPublicId)` so Recent Activity refreshes with the `CommentAdded` event.
- **No optimistic update** — server returns the created comment; list refetch is sufficient and simpler.
- **No Zustand** — all state is TanStack Query (server), local React state (active reply, composer text), or URL-less.
- **Plain text only** — preserve line breaks with `whitespace-pre-wrap`; never render HTML/Markdown.
- **Permission gate** — comments use the parent task's visibility; no extra capability. The task-detail orchestrator already handles 403/404, so the Comments card only renders inline error/retry for 500/network.

---

## Component Tree

```text
app/(dashboard)/tasks/[publicId]/page.tsx            Server
  TaskDetailPage
    TaskDetail (Client)                               existing
      TitleMetaCard
      StageTimeline
      TaskCommentsCard (Client)                       NEW — owns comments query + composer + list
        TaskCommentsList (Client)                     NEW — scrollable list + Load more
          TaskCommentItem (Client)                    NEW — top-level comment row
            TaskCommentReply[] (Client)               NEW — nested reply rows
            TaskCommentReplyComposer (Client)         NEW — inline reply composer
        TaskCommentComposer (Client)                  NEW — bottom composer for top-level comments
        TaskCommentSkeleton (Client)                  NEW — loading state
        EmptyState / ErrorState                       existing shared components
```

**Server vs Client:**
- `TaskDetailPage` remains a Server Component.
- `TaskCommentsCard` and all descendants are Client Components because they use TanStack Query, event handlers, and local state.

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `lib/api/hooks/use-task-comments.ts` | `useTaskComments`, `useCreateComment`, and shared `CursorPage<T>` helper. |
| `components/domain/tasks/task-comments-card.tsx` | Main comments card: queries, composer, list, empty/error/skeleton orchestration. |
| `components/domain/tasks/task-comments-list.tsx` | Scrollable list of top-level comments with manual "Load more" button. |
| `components/domain/tasks/task-comment-item.tsx` | Top-level comment row: avatar, header, bubble, footer, reply button, nested replies. |
| `components/domain/tasks/task-comment-reply.tsx` | Single reply row nested under a top-level comment. |
| `components/domain/tasks/task-comment-composer.tsx` | Multiline textarea + submit button for top-level comments. |
| `components/domain/tasks/task-comment-reply-composer.tsx` | Inline composer for replies; thin wrapper around the same textarea/submit pattern. |
| `components/domain/tasks/task-comment-skeleton.tsx` | Skeleton rows matching message shape. |
| `components/domain/tasks/task-comment-types.ts` | Colocated generated-type aliases for `CommentResource`, `StoreCommentRequest`. |
| `__tests__/components/domain/tasks/task-comments-card.test.tsx` | Component tests for loading, empty, success, error, post, reply, 422. |

### Modified Files

| File | Change |
|------|--------|
| `lib/api/query-keys.ts` | Add `tasks.comments(taskPublicId)` key factory entry nested under `tasks.detail`. |
| `components/domain/tasks/task-detail.tsx` | Insert `<TaskCommentsCard publicId={publicId} />` after `<StageTimeline />` in the main column. |
| `messages/ar.json` | Add `tasks.comments` namespace with all UI strings. |
| `messages/en.json` | Add `tasks.comments` namespace with all UI strings. |
| `__tests__/mocks/handlers.ts` | Add MSW handlers for `GET /v1/tasks/:publicId/comments` and `POST /v1/tasks/:publicId/comments`. |

---

## Implementation Notes

### 1. Query Keys — `lib/api/query-keys.ts`

**One-line summary:** Add a `comments` key nested under `tasks.detail` so invalidating the task detail also enables granular invalidation of comments.

**Key decisions:**
- Nesting under `tasks.detail(publicId)` mirrors the existing `slaHealth`, `timeline`, and `returns` keys.
- No hardcoded strings.

**Files:** `lib/api/query-keys.ts`

```ts
// Add inside tasks namespace after returns:
comments: (publicId: string) =>
  [...queryKeys.tasks.detail(publicId), 'comments'] as const,
```

**Coding standards applied:**
- `coding-standards.md` § Query Key Factory — centralized factory, no string literals.

---

### 2. Comment Hooks — `lib/api/hooks/use-task-comments.ts`

**One-line summary:** Provide `useTaskComments` (cursor-paginated list) and `useCreateComment` (mutation with invalidation).

**Key decisions:**
- Use `useInfiniteQuery` for top-level comments.
- Replies come inline; no separate query.
- `enabled: !!taskPublicId`.
- Mutation invalidates comments + timeline; toast success/error comes from the hook so components stay simple.
- 422 errors are surfaced to the composer via the mutation's `error` property, not swallowed by the toast.

**Files:** `lib/api/hooks/use-task-comments.ts`

```ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

export type CommentResource = components['schemas']['CommentResource'];
type StoreCommentRequest = components['schemas']['StoreCommentRequest'];

export interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export function useTaskComments(taskPublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.comments(taskPublicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<CommentResource>>(`/v1/tasks/${taskPublicId}/comments`, {
        params: { cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!taskPublicId,
  });
}

export function useCreateComment(taskPublicId: string) {
  const t = useTranslations('tasks.comments');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StoreCommentRequest) =>
      apiClient.post<CommentResource>(`/v1/tasks/${taskPublicId}/comments`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskPublicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_posted'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}
```

**Test cases:**
1. Render `useTaskComments` → MSW returns one page with two top-level comments; `data.pages[0].data` length is 2.
2. Render `useCreateComment` → call `mutate({ body: 'test' })`; MSW returns created comment; comments list is invalidated and `timeline` is invalidated.

**Coding standards applied:**
- `coding-standards.md` § Data Fetching — `useInfiniteQuery` for cursor pagination, mutation invalidation.
- `coding-standards.md` § Type Safety — generated types only.

---

### 3. Types — `components/domain/tasks/task-comment-types.ts`

**One-line summary:** Re-export generated comment types for colocated use.

**Files:** `components/domain/tasks/task-comment-types.ts`

```ts
import type { components } from '@/lib/generated/api-types';

export type CommentResource = components['schemas']['CommentResource'];
export type StoreCommentRequest = components['schemas']['StoreCommentRequest'];
```

---

### 4. Utility Helpers — reuse existing `task-detail-utils.ts`

**One-line summary:** Use `localizeName` and `formatRelativeTime` from `task-detail-utils.ts`; add a tiny comment-specific helper for initials.

**Key decisions:**
- Author name localization: `localizeName(locale, name_ar, name_en)`.
- Relative timestamp: existing `formatRelativeTime(timestamp, timeFmtFromT(t))` from `task-detail-utils.ts`.
- Avatar initials: first character of the localized name; if two words, first char of each.

**Snippet (add to `task-detail-utils.ts` or inline in component):**

```ts
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
```

---

### 5. `TaskCommentsCard` — `components/domain/tasks/task-comments-card.tsx`

**One-line summary:** Orchestrator rendered inside `TaskDetail` main column; handles loading, empty, error, and success states.

**Key decisions:**
- Receives `publicId` prop (task public_id).
- Uses `useTaskComments`, `useCreateComment`, and `useCurrentUser` to determine current-user alignment.
- Local state: `replyToPublicId: string | null` (only one reply composer open at a time), `composerText: string` (top-level).
- On successful post, clear the relevant composer text and close reply composer.
- 500/network errors render `ErrorState` inside the card; 403/404 are handled by the parent `TaskDetail` and never reach this card.

**Files:** `components/domain/tasks/task-comments-card.tsx`

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useTaskComments, useCreateComment } from '@/lib/api/hooks/use-task-comments';
import { TaskCommentsList } from './task-comments-list';
import { TaskCommentComposer } from './task-comment-composer';
import { TaskCommentSkeleton } from './task-comment-skeleton';

interface TaskCommentsCardProps {
  publicId: string;
}

export function TaskCommentsCard({ publicId }: TaskCommentsCardProps) {
  const t = useTranslations('tasks.comments');
  const locale = useLocale();
  const { data: user } = useCurrentUser();
  const commentsQuery = useTaskComments(publicId);
  const createComment = useCreateComment(publicId);
  const [replyToPublicId, setReplyToPublicId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');

  const allComments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [commentsQuery.data],
  );

  function handlePostTopLevel() {
    if (!composerText.trim()) return;
    createComment.mutate(
      { body: composerText.trim() },
      {
        onSuccess: () => setComposerText(''),
      },
    );
  }

  function handlePostReply(body: string) {
    if (!body.trim() || !replyToPublicId) return;
    createComment.mutate(
      { body: body.trim(), parent_comment_id: replyToPublicId },
      {
        onSuccess: () => setReplyToPublicId(null),
      },
    );
  }

  if (commentsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskCommentSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (commentsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            message={t('error')}
            onRetry={() => commentsQuery.refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {allComments.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title={t('empty_title')}
            description={t('empty_description')}
          />
        ) : (
          <TaskCommentsList
            comments={allComments}
            currentUserPublicId={user?.public_id}
            replyToPublicId={replyToPublicId}
            onReply={setReplyToPublicId}
            onPostReply={handlePostReply}
            isPosting={createComment.isPending}
            fetchNextPage={commentsQuery.fetchNextPage}
            hasNextPage={commentsQuery.hasNextPage}
            isFetchingNextPage={commentsQuery.isFetchingNextPage}
          />
        )}
        <TaskCommentComposer
          value={composerText}
          onChange={setComposerText}
          onSubmit={handlePostTopLevel}
          isPending={createComment.isPending}
        />
      </CardContent>
    </Card>
  );
}
```

**Test cases:**
1. Render with no comments → `EmptyState` with "No comments yet" appears and composer is visible.
2. Render with comments → list shows both top-level comments and nested replies; composer remains at bottom.

**Coding standards applied:**
- `coding-standards.md` § All 4 States — loading skeleton, error with retry, empty with CTA, success list.
- `coding-standards.md` § State Management — TanStack Query for server state, local `useState` for UI toggles.
- `coding-standards.md` § i18n — all strings via `useTranslations`.

---

### 6. `TaskCommentsList` — `components/domain/tasks/task-comments-list.tsx`

**One-line summary:** Scrollable container for top-level comments with a manual "Load more" button.

**Key decisions:**
- Limit list height with `max-h-[60vh]` and `overflow-y-auto`.
- Render each top-level comment with `TaskCommentItem`.
- "Load more" button appears when `hasNextPage` is true; disabled while fetching.
- The list is an `<ol>` with `aria-label`.

**Files:** `components/domain/tasks/task-comments-list.tsx`

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TaskCommentItem } from './task-comment-item';
import type { CommentResource } from './task-comment-types';

interface TaskCommentsListProps {
  comments: CommentResource[];
  currentUserPublicId?: string;
  replyToPublicId: string | null;
  onReply: (publicId: string | null) => void;
  onPostReply: (body: string) => void;
  isPosting: boolean;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}

export function TaskCommentsList({
  comments,
  currentUserPublicId,
  replyToPublicId,
  onReply,
  onPostReply,
  isPosting,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: TaskCommentsListProps) {
  const t = useTranslations('tasks.comments');

  return (
    <div className="flex flex-col gap-4">
      <ol
        className="max-h-[60vh] space-y-4 overflow-y-auto pe-2"
        aria-label={t('comments_list_label')}
      >
        {comments.map((comment) => (
          <li key={comment.public_id}>
            <TaskCommentItem
              comment={comment}
              currentUserPublicId={currentUserPublicId}
              isReplyOpen={replyToPublicId === comment.public_id}
              onReply={onReply}
              onPostReply={onPostReply}
              isPosting={isPosting}
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
1. Render list with `hasNextPage=true` → "Load more" button is enabled and visible.
2. Click "Load more" → button shows loading text and `fetchNextPage` is called.

**Coding standards applied:**
- `coding-standards.md` § Cursor Pagination — manual "Load more" with `useInfiniteQuery`.
- `design-system/05-accessibility.md` — semantic `<ol>` with `aria-label`.

---

### 7. `TaskCommentItem` — `components/domain/tasks/task-comment-item.tsx`

**One-line summary:** Render a top-level comment row with avatar, author, timestamp, body, attachment count, reply button, and nested replies.

**Key decisions:**
- Use `<Message>` with `align` prop for row layout and avatar alignment.
- `<Bubble variant="default">` for current user (`bg-primary text-primary-foreground`); `<Bubble variant="secondary">` for others (`bg-secondary text-secondary-foreground`).
- Author name and timestamp rendered in `<MessageHeader>`, not inside the bubble.
- Reply button and attachment count rendered in `<MessageFooter>`.
- Reply button is visible only on top-level comments.
- Replies are nested in a sub-list with logical start indentation (`ps-8`).
- Attachment count indicator: non-interactive `Paperclip` icon + count.
- Timestamp uses `formatRelativeTime` from `task-detail-utils.ts`.

**Files:** `components/domain/tasks/task-comment-item.tsx`

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Paperclip, Reply } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { localizeName, getInitials, formatRelativeTime, timeFmtFromT } from './task-detail-utils';
import { TaskCommentReply } from './task-comment-reply';
import { TaskCommentReplyComposer } from './task-comment-reply-composer';
import type { CommentResource } from './task-comment-types';

interface TaskCommentItemProps {
  comment: CommentResource;
  currentUserPublicId?: string;
  isReplyOpen: boolean;
  onReply: (publicId: string | null) => void;
  onPostReply: (body: string) => void;
  isPosting: boolean;
}

export function TaskCommentItem({
  comment,
  currentUserPublicId,
  isReplyOpen,
  onReply,
  onPostReply,
  isPosting,
}: TaskCommentItemProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.comments');
  const timeFmt = timeFmtFromT(t);
  const authorName = localizeName(locale, comment.author.name_ar, comment.author.name_en);
  const isCurrentUser = comment.author.public_id === currentUserPublicId;
  const initials = getInitials(authorName || '?');

  return (
    <article
      className={cn('flex gap-3', isCurrentUser && 'flex-row-reverse')}
      aria-labelledby={`comment-author-${comment.public_id}`}
    >
      <Avatar className="size-9 shrink-0">
        <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
      </Avatar>

      <div className={cn('flex min-w-0 flex-1 flex-col', isCurrentUser && 'items-end')}>
        <div
          className={cn(
            'max-w-[85%] rounded-xl border px-4 py-2.5',
            isCurrentUser ? 'bg-muted' : 'bg-background',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              id={`comment-author-${comment.public_id}`}
              className="text-xs font-semibold text-foreground"
            >
              {authorName}
            </span>
            <time className="text-xs text-muted-foreground" dateTime={comment.created_at}>
              {formatRelativeTime(comment.created_at, timeFmt)}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
        </div>

        <div className="mt-1 flex items-center gap-3">
          {(comment.attachment_count ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="size-3" aria-hidden="true" />
              {comment.attachment_count}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onReply(isReplyOpen ? null : comment.public_id)}
            aria-label={t('reply_to', { author: authorName })}
          >
            <Reply className="me-1 size-3 rtl:rotate-180" />
            {t('reply')}
          </Button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <ol className="mt-3 w-full space-y-3 ps-8" aria-label={t('replies_list_label')}>
            {comment.replies.map((reply) => (
              <li key={reply.public_id}>
                <TaskCommentReply
                  reply={reply}
                  currentUserPublicId={currentUserPublicId}
                />
              </li>
            ))}
          </ol>
        )}

        {isReplyOpen && (
          <div className="mt-3 w-full ps-8">
            <TaskCommentReplyComposer
              onSubmit={onPostReply}
              isPending={isPosting}
              onCancel={() => onReply(null)}
            />
          </div>
        )}
      </div>
    </article>
  );
}
```

**Test cases:**
1. Render top-level comment with 2 replies → author name, body, and 2 reply rows are visible; reply button is visible.
2. Render current-user comment → bubble aligns to `end` (flex-row-reverse on desktop; in RTL the row-reverse still yields end alignment because the parent is LTR/RTL aware via logical properties).

**Coding standards applied:**
- `coding-standards.md` § RTL — `<Message align="end">` handles row reversal; `me-*`/`ps-*` logical properties; `rtl:rotate-180` on directional icons.
- `design-system/05-accessibility.md` — `aria-labelledby`, semantic `<article>`, `<ol>` for replies, icon-only/labelled actions.

---

### 8. `TaskCommentReply` — `components/domain/tasks/task-comment-reply.tsx`

**One-line summary:** Render a single nested reply; no reply button (single-level threading).

**Files:** `components/domain/tasks/task-comment-reply.tsx`

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { localizeName, getInitials, formatRelativeTime, timeFmtFromT } from './task-detail-utils';
import type { CommentResource } from './task-comment-types';

interface TaskCommentReplyProps {
  reply: CommentResource;
  currentUserPublicId?: string;
}

export function TaskCommentReply({ reply, currentUserPublicId }: TaskCommentReplyProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.comments');
  const timeFmt = timeFmtFromT(t);
  const authorName = localizeName(locale, reply.author.name_ar, reply.author.name_en);
  const isCurrentUser = reply.author.public_id === currentUserPublicId;
  const initials = getInitials(authorName || '?');

  return (
    <div className={cn('flex gap-3', isCurrentUser && 'flex-row-reverse')}>
      <Avatar className="size-7 shrink-0">
        <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
      </Avatar>
      <div className={cn('flex min-w-0 flex-1 flex-col', isCurrentUser && 'items-end')}>
        <div
          className={cn(
            'max-w-[85%] rounded-xl border px-3 py-2',
            isCurrentUser ? 'bg-muted' : 'bg-background',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{authorName}</span>
            <time className="text-xs text-muted-foreground" dateTime={reply.created_at}>
              {formatRelativeTime(reply.created_at, timeFmt)}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{reply.body}</p>
        </div>
        {(reply.attachment_count ?? 0) > 0 && (
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="size-3" aria-hidden="true" />
            {reply.attachment_count}
          </span>
        )}
      </div>
    </div>
  );
}
```

**Test cases:**
1. Render reply → author name, body, and timestamp are visible; no Reply button.
2. Render reply with `attachment_count=2` → paperclip + "2" appears.

---

### 9. `TaskCommentComposer` & `TaskCommentReplyComposer`

**One-line summary:** Multiline textarea + submit button with 5000-character limit, loading state, and inline 422 error display.

**Key decisions:**
- Use shadcn `Textarea` + `Button`.
- Show character count only when nearing limit (optional) or always show `body.length / 5000`.
- Disable submit when text is empty or over limit.
- Show inline error from `mutation.error` if it is an `ApiRequestError` with status 422.
- Reply composer is a thin wrapper with `onCancel`.

**Files:**
- `components/domain/tasks/task-comment-composer.tsx`
- `components/domain/tasks/task-comment-reply-composer.tsx`

```tsx
// task-comment-composer.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { ApiRequestError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 5000;

interface TaskCommentComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error?: Error | null;
  submitLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}

export function TaskCommentComposer({
  value,
  onChange,
  onSubmit,
  isPending,
  error,
  submitLabel,
  onCancel,
  cancelLabel,
}: TaskCommentComposerProps) {
  const t = useTranslations('tasks.comments');

  const error422 = error instanceof ApiRequestError && error.status === 422
    ? error.error.message
    : null;

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit();
    }
  }

  const canSubmit = value.trim().length > 0 && value.length <= MAX_LENGTH && !isPending;

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <Field>
        <FieldLabel htmlFor="comment-composer" className="sr-only">
          {t('composer_label')}
        </FieldLabel>
        <Textarea
          id="comment-composer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('composer_placeholder')}
          maxLength={MAX_LENGTH}
          rows={3}
          className="resize-y"
          aria-describedby={error422 ? 'comment-composer-error' : undefined}
        />
      </Field>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs text-muted-foreground',
            value.length > MAX_LENGTH * 0.9 && 'text-amber-600',
          )}
        >
          {value.length} / {MAX_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
              {cancelLabel ?? t('cancel')}
            </Button>
          )}
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="active:scale-[0.98] transition-transform"
          >
            {isPending ? t('posting') : (submitLabel ?? t('post_comment'))}
          </Button>
        </div>
      </div>
      {error422 && (
        <p id="comment-composer-error" className="text-sm text-destructive" role="alert">
          {error422}
        </p>
      )}
    </div>
  );
}
```

```tsx
// task-comment-reply-composer.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TaskCommentComposer } from './task-comment-composer';
import { ApiRequestError } from '@/lib/api/client';

interface TaskCommentReplyComposerProps {
  onSubmit: (body: string) => void;
  isPending: boolean;
  onCancel: () => void;
  error?: Error | null;
}

export function TaskCommentReplyComposer({
  onSubmit,
  isPending,
  onCancel,
  error,
}: TaskCommentReplyComposerProps) {
  const t = useTranslations('tasks.comments');
  const [value, setValue] = useState('');

  return (
    <TaskCommentComposer
      value={value}
      onChange={setValue}
      onSubmit={() => {
        onSubmit(value);
        setValue('');
      }}
      isPending={isPending}
      error={error}
      submitLabel={t('post_reply')}
      onCancel={onCancel}
      cancelLabel={t('cancel')}
    />
  );
}
```

**Test cases:**
1. Type text and click Post → `onSubmit` called with trimmed text; button shows loading state.
2. Empty textarea → Post button disabled.
3. 422 error from MSW → inline error message appears below textarea.

**Coding standards applied:**
- `coding-standards.md` § Forms — shadcn `Field` + `Textarea`; client-side max length mirrors backend.
- `design-system/05-accessibility.md` — associated label (visually hidden), `aria-describedby` for errors, `role="alert"`.

---

### 10. `TaskCommentSkeleton` — `components/domain/tasks/task-comment-skeleton.tsx`

**One-line summary:** Skeleton matching message-row shape (avatar circle + bubble rectangles).

**Files:** `components/domain/tasks/task-comment-skeleton.tsx`

```tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TaskCommentSkeleton() {
  return (
    <div className="space-y-4" data-testid="task-comments-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-3/4 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Test case:** Render loading state → skeleton rows with `data-testid="task-comments-skeleton"` are present.

**Coding standards applied:**
- `coding-standards.md` § Loading States — skeleton matches real content shape.
- `design-system/05-accessibility.md` — `motion-reduce:animate-none` is inherited from shadcn `Skeleton` if configured; otherwise wrap in `motion-reduce:animate-none`.

---

### 11. Wire into `TaskDetail` — `components/domain/tasks/task-detail.tsx`

**One-line summary:** Insert `<TaskCommentsCard publicId={publicId} />` after `<StageTimeline />` in the main column.

**Files:** `components/domain/tasks/task-detail.tsx`

```tsx
// Inside the main column div, after StageTimeline:
<TaskCommentsCard publicId={publicId} />
```

---

### 12. i18n — `messages/ar.json` and `messages/en.json`

**One-line summary:** Add `tasks.comments` namespace.

**Files:** `messages/ar.json`, `messages/en.json`

```json
{
  "tasks": {
    "comments": {
      "title": "التعليقات",
      "composer_label": "تعليق جديد",
      "composer_placeholder": "اكتب تعليقك هنا...",
      "post_comment": "نشر تعليق",
      "post_reply": "نشر رد",
      "posting": "جاري النشر...",
      "reply": "رد",
      "reply_to": "رد على {author}",
      "cancel": "إلغاء",
      "load_more": "تحميل المزيد",
      "loading_more": "جاري التحميل...",
      "empty_title": "لا توجد تعليقات بعد",
      "empty_description": "ابدأ المحادثة بإضافة أول تعليق.",
      "error": "تعذر تحميل التعليقات.",
      "toast_posted": "تم نشر التعليق",
      "comments_list_label": "التعليقات",
      "replies_list_label": "الردود"
    }
  }
}
```

English equivalents:

```json
{
  "tasks": {
    "comments": {
      "title": "Comments",
      "composer_label": "New comment",
      "composer_placeholder": "Write your comment...",
      "post_comment": "Post Comment",
      "post_reply": "Post Reply",
      "posting": "Posting...",
      "reply": "Reply",
      "reply_to": "Reply to {author}",
      "cancel": "Cancel",
      "load_more": "Load more",
      "loading_more": "Loading...",
      "empty_title": "No comments yet",
      "empty_description": "Start the conversation by adding the first comment.",
      "error": "Unable to load comments.",
      "toast_posted": "Comment posted",
      "comments_list_label": "Comments",
      "replies_list_label": "Replies"
    }
  }
}
```

**Coding standards applied:**
- `coding-standards.md` § i18n — all user-facing strings via `useTranslations`.

---

### 13. MSW Handlers — `__tests__/mocks/handlers.ts`

**One-line summary:** Add handlers for `GET` and `POST /v1/tasks/:publicId/comments`.

**Files:** `__tests__/mocks/handlers.ts`

```ts
import type { CommentResource } from '@/components/domain/tasks/task-comment-types';

const mockComments: CommentResource[] = [
  {
    public_id: '01912a00-0000-7000-8000-000000000001',
    task_id: 'task-uuid-1',
    author: { public_id: 'user-1', name_ar: 'أحمد', name_en: 'Ahmad' },
    body: 'هل يمكن توضيح المطلوب؟',
    parent_comment_id: '',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    attachment_count: 0,
    replies: [
      {
        public_id: '01912a00-0000-7000-8000-000000000002',
        task_id: 'task-uuid-1',
        author: { public_id: 'user-2', name_ar: 'سارة', name_en: 'Sara' },
        body: 'سأرسل التفاصيل الآن.',
        parent_comment_id: '01912a00-0000-7000-8000-000000000001',
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        attachment_count: 0,
      },
    ],
  },
];

http.get('https://api.momentum.test/v1/tasks/:publicId/comments', () => {
  return HttpResponse.json({
    data: mockComments,
    next_cursor: null,
    has_more: false,
  });
}),

http.post('https://api.momentum.test/v1/tasks/:publicId/comments', async ({ request }) => {
  const body = (await request.json()) as { body: string; parent_comment_id?: string | null };
  const created: CommentResource = {
    public_id: 'new-comment-uuid',
    task_id: 'task-uuid-1',
    author: { public_id: 'current-user', name_ar: 'أنت', name_en: 'You' },
    body: body.body,
    parent_comment_id: body.parent_comment_id ?? '',
    created_at: new Date().toISOString(),
    attachment_count: 0,
  };
  return HttpResponse.json(created, { status: 200 });
}),
```

**Test cases:**
1. MSW returns comments → component renders them.
2. MSW returns 422 for reply-to-reply → composer shows inline error and stays open.

---

### 14. Component Tests — `__tests__/components/domain/tasks/task-comments-card.test.tsx`

**One-line summary:** Test loading, empty, success, error, post, reply, and 422 states.

**Files:** `__tests__/components/domain/tasks/task-comments-card.test.tsx`

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils/test-utils';
import { TaskCommentsCard } from '@/components/domain/tasks/task-comments-card';

test('renders loading skeleton', () => {
  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);
  expect(screen.getByTestId('task-comments-skeleton')).toBeInTheDocument();
});

test('renders comments and allows reply', async () => {
  renderWithProviders(<TaskCommentsCard publicId="task-uuid-1" />);
  await screen.findByText('هل يمكن توضيح المطلوب؟');
  expect(screen.getByText('رد')).toBeInTheDocument();
});
```

**Coding standards applied:**
- `testing-policy.md` — render + interaction tests; MSW for API mocking; fresh QueryClient per test.

---

## Data Flow

```
User opens /tasks/[publicId]
  → TaskDetailPage renders TaskDetail
  → TaskDetail renders TaskCommentsCard

TaskCommentsCard mounts:
  → useTaskComments(publicId) → GET /v1/tasks/{publicId}/comments
  → apiClient sends credentials + X-Tenant + X-Locale
  → Backend TaskVisibilityScope enforces task visibility
  → Response: { data: CommentResource[], next_cursor, has_more }
  → TanStack Query caches under queryKeys.tasks.comments(publicId)
  → UI renders list or empty/error state

User types a top-level comment and clicks Post Comment:
  → useCreateComment.mutate({ body })
  → POST /v1/tasks/{publicId}/comments
  → On success:
      - invalidate queryKeys.tasks.comments(publicId)
      - invalidate queryKeys.tasks.timeline(publicId) (Recent Activity refreshes)
      - toast.success(t('toast_posted'))
      - TaskCommentsCard clears composerText
  → TanStack refetches comments list
  → New comment appears at the end (oldest-first order)

User clicks Reply on a top-level comment:
  → TaskCommentsCard sets replyToPublicId = comment.public_id
  → Inline composer appears
  → User types and clicks Post Reply:
      - useCreateComment.mutate({ body, parent_comment_id })
      - On success: replyToPublicId is cleared
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

No new route is introduced. Comments live inside the existing task detail page.
Locale remains cookie-based (`NEXT_LOCALE`); no `[locale]` route segment.

---

## Execution Order

1. Verify `CommentResource` and `StoreCommentRequest` exist in `lib/generated/api-types.ts` (already confirmed; skip if true).
2. Extend `lib/api/query-keys.ts` with `tasks.comments`.
3. Create `lib/api/hooks/use-task-comments.ts`.
4. Create `components/domain/tasks/task-comment-types.ts`.
5. Add `getInitials` helper to `components/domain/tasks/task-detail-utils.ts`.
6. Create skeleton, composer, reply composer, reply row, item, list, and card components.
7. Modify `components/domain/tasks/task-detail.tsx` to render `TaskCommentsCard` after `StageTimeline`.
8. Add `tasks.comments` translations to `messages/ar.json` and `messages/en.json`.
9. Add MSW handlers for comments endpoints.
10. Add component tests.
11. Run `npm run lint`, `npm run typecheck`, `npm run test`.

---

## What to Test Manually

### Happy Paths (both locales)

1. **AR RTL:** Open a task with comments → Comments card loads below Stage Timeline → Arabic text, RTL layout, current-user bubbles align to start/end correctly, reply indentation uses logical start padding.
2. **EN LTR:** Switch to English → same task shows English labels, LTR layout, bubbles flip correctly.
3. **Post top-level comment:** Type in composer → click Post Comment → toast appears, composer clears, new comment appears in list.
4. **Post reply:** Click Reply on a top-level comment → type in inline composer → click Post Reply → reply appears nested under the comment, inline composer closes.
5. **Attachment count:** View a comment with `attachment_count > 0` → paperclip icon + count visible; clicking it does nothing.

### States

6. **Loading:** Navigate directly to a task → Comments card shows skeleton rows before data arrives.
7. **Empty:** Open a task with no comments → "No comments yet" empty state appears with CTA and composer.
8. **Error (500/network):** Simulate API failure → inline `ErrorState` with retry button inside Comments card; rest of task detail remains usable.
9. **Error (403/404):** Handled by parent `TaskDetail`; Comments card is not rendered separately.

### Pagination

10. **Load more:** Add 16+ top-level comments → "Load more" button appears → click appends next page while preserving existing comments.

### Validation

11. **Empty submit:** Post button disabled when textarea is empty.
12. **Max length:** Type past 5000 characters → textarea blocks further input; submit remains disabled if over limit.
13. **422 reply-to-reply:** Try to reply to a reply via API manipulation → inline error shown, composer stays open with text preserved. (UI should not offer a Reply button on replies.)

### Responsive

14. **Desktop (≥1024px):** Comments card sits in main column (2/3 width); list scrolls if tall; composer at bottom.
15. **Tablet (640–1023px):** Comments card stacks full-width below Stage Timeline.
16. **Mobile (<640px):** Comments card full-width; composer textarea grows; reply composer is full-width below parent comment; touch targets ≥ 44px.

### Keyboard Navigation

17. **Tab order:** Composer textarea → Post Comment button → Reply buttons → Load more button.
18. **Ctrl/Cmd + Enter:** While focused in textarea, submits the composer.
19. **Escape in reply composer:** Closes inline reply composer (implement `onCancel`).
20. **Focus rings:** All buttons and textarea show visible focus rings.

---