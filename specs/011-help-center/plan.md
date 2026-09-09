# Implementation Plan: 011 Help Center — Article CMS & Knowledge Base

> **Spec:** `specs/011-help-center/spec.md`
> **Date:** 2026-09-07
> **Status:** `completed` (delivered 2026-09-09)

---

## Open Questions Resolved

All open questions from `spec.md` and architecture reviews are resolved:

| # | Open Question | Decision | Rationale |
|---|---|---|---|
| 1 | **Where does Help Center CMS live?** | Integrated directly into `/help`. Users with `helpcenter.manage` see "New Article" and "Manage Categories" in `PageHeader.actions`, draft status filter pills on the list, and edit/publish controls on the reader. Authoring is handled via full-page routes `/help/new` and `/help/[publicId]/edit`. | Avoids cluttering the `/admin` workspace while giving knowledge managers immediate context-aware CMS tools. |
| 2 | **How is rich text authored without heavy third-party dependencies?** | A lightweight Markdown/HTML editor with standard formatting toolbar (headings, bold, italic, bullet/numbered lists, blockquote, code, link, image, table) and a side-by-side / toggleable "Preview" tab sanitized with `DOMPurify`. | Zero external WYSIWYG bundle bloat; generates clean, accessible markup up to 100,000 characters; compliant with `coding-standards.md`. |
| 3 | **How are article image attachments handled?** | Uploaded to `POST /v1/help-center/articles/{article}/documents` via `DocumentService` (entity type `HelpArticle`). In the editor, uploaded images provide a "Copy markdown tag" button (`![alt](preview_url)`). In the reader, images appear in a previewable/downloadable gallery using authenticated blob fetch (`fetchDocumentBlob` with `X-Tenant` header). | Reuses established Document patterns from Spec 024; prevents public asset URL security vulnerabilities. |
| 4 | **How is view count tracked?** | Atomically recorded on the backend when `GET /v1/help-center/articles/{article}` is called by regular internal users (`helpcenter.view`). | Zero additional API calls or client-side overhead; returns fresh `view_count` on read. |
| 5 | **How are search queries debounced and surfaced?** | Hero search input debounces 300 ms. When `q.trim().length >= 2`, the view switches to a dedicated search results state showing relevance-ranked articles with matched snippets and category filtering. When cleared, the directory view is restored. | Provides an instant, Google/Algolia-style search experience without layout clutter or redundant network requests. |
| 6 | **What happens when deleting a category with published articles?** | Backend returns HTTP 422 `CategoryHasPublishedArticlesException`. UI catches error and shows localized toast: *"Cannot delete a category that has published articles."* Cascading soft-delete to drafts occurs only if no published articles exist. | Enforces data integrity and prevents accidental loss of live operational documentation. |
| 7 | **What about API types before `openapi.json` regeneration?** | Resolved during delivery: `php artisan scramble:export` refreshed `openapi.json` (slug fields across all help resources, plus one stale `UserResource` → `PlatformTenantUserResource` `$ref` correction) and `npm run generate:api` rebuilt `lib/generated/api-types.ts`. Domain types in `lib/api/types/help-center-types.ts` already carried optional `slug` fields. Backend also added `slug` (article + category) to `HelpArticleSearchResultResource`. | Contract and codegen now fully aligned; no hand-written response interfaces remain load-bearing. |
| 8 | **Slugs or UUIDs in category URLs?** | URLs use `?category={slug}`. The API filter expects a UUID, so the client resolves via a `slugToIdMap` from cached categories (UUIDs pass through). | Human-readable, bookmarkable links; fixes the PostgreSQL error from passing slugs as `category_id`. |
| 9 | **Slugs or UUIDs in article URLs?** | Links prefer `slug` with `public_id` fallback everywhere (cards, featured, search, related, edit, post-save navigation). Backend `resolveRouteBinding` accepts both; mutations keep using `public_id` from payloads (stable across slug changes). | Readable URLs with zero breaking change — old UUID links keep resolving. |
| 10 | **Capability-store hydration mismatch?** | All three help page clients gate permission checks behind a client-only `hydrated` flag and render the matching skeleton until then; all hooks stay above conditional returns. | No SSR/client HTML mismatch, no `PermissionDenied` flash, no Rules-of-Hooks violations. |
| 11 | **Narrow manager dialog with sideways scroll?** | Dialog uses `sm:max-w-4xl` (same `sm:` variant is required to beat the base `sm:max-w-sm` in the cascade) and `overflow-x-clip` on both scroll containers. | Wide dialog, action buttons always visible, vertical-only scrolling. |
| 12 | **Identical category icons + missing pointer cursor?** | Slug-keyed `CATEGORY_ICONS` map (14 distinct icons, keyword fallback for custom categories); `cursor-pointer` added to cards (Tailwind v4 dropped the button default). | Distinct Wayfinding per category; correct affordance. |
| 13 | **Reader skeleton mismatch?** | Skeleton rewritten to mirror the reader section-by-section (manager actions, badge + locale toggle, full-width title, 4-item meta, gallery + related grids). | No layout shift on load. |

---

## Technical Approach

**One-line summary:** Deliver a bilingual, responsive knowledge base and lightweight CMS under `/help` composing shadcn primitives, TanStack Query hooks with cursor pagination, `DOMPurify` HTML sanitization, and capability-gated authoring workflows.

### Key Decisions

- **URL-Driven Browsing & Search State:** URL parameters govern all directory state: `?category={slug}` (category filter, resolved to UUID via `slugToIdMap`), `?q={searchQuery}` (full-text search), and `?status=all|published|draft` (CMS publication filter). Search and category filters are bookmarkable and shareable.
- **Slug-First Article URLs:** All article links use `article.slug || article.public_id`; the backend resolves both, and mutations keep `public_id` (immune to slug changes on retitle).
- **Hydration-Safe Permission Gating:** Page clients render skeletons until a client-only `hydrated` flag flips; capability checks run only after hydration.
- **Strict HTML Sanitization:** All rich text bodies (`body_ar`, `body_en`) are sanitized via `DOMPurify.sanitize()` before injection, whitelisting semantic HTML tags (`h1-h6`, `p`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `a`, `img`, `strong`, `em`, `hr`, `span`) with `rel="noopener noreferrer"` on all links.
- **Two-Level Capability ABAC:**
  - `helpcenter.view`: Browses published articles, searches, views reader, downloads attachments.
  - `helpcenter.manage`: Sees draft articles, draft badges, "New Article" CTA, edit/publish/unpublish/delete actions, and category management modal.
  - External auditors: Denied access (HTTP 403) via `PermissionDenied` state per rule HC-3.
- **Cursor Pagination for Articles & Search:** `GET /v1/help-center/articles` and `GET /v1/help-center/search` use `useInfiniteQuery` with manual "Load More" buttons. Category listing (`GET /v1/help-center/categories`) returns full bounded list (<100 rows) cached for 5 minutes (`staleTime: 300_000`).
- **Reuse Established Document Delivery:** Image attachments use `fetchDocumentBlob()` with `X-Tenant` and `X-Locale` headers to create secure object URLs for previews and downloads, matching Spec 024.
- **Dual Calendar Publication Dates:** All article metadata displays both Gregorian and Hijri timestamps using the shared `DualDateDisplay` component from Spec 020.
- **Breadcrumb Synchronization:** `usePageBreadcrumb()` extended to resolve `/help`, `/help/[slug]`, `/help/new`, and `/help/[slug]/edit` using `useHelpDisplayStore` (`categorySlug`) to avoid UUID flashes.

---

## Component Tree

```text
app/(dashboard)/help/page.tsx                                   Server Component
└── HelpCenterPageClient                                        Client Component
    ├── PageHeader (shared)                                     Title, description, actions
    │   ├── [canManage] CreateArticleButton → Link to /help/new
    │   └── [canManage] ManageCategoriesButton → opens HelpCategoryManagerDialog
    ├── HelpSearchHero                                          Hero banner, search input with clear button
    ├── [if search active: q.length >= 2]
    │   └── HelpSearchResults                                   Relevance-ranked search results feed with snippets
    │       ├── 4 states: loading skeleton, empty state, error, populated
    │       └── LoadMoreButton
    ├── [if search idle: q.length < 2]
    │   ├── HelpCategoryGrid                                    4-column category cards with article counts
    │   ├── HelpCategoryTabs                                    Horizontal scrollable chip bar (?category=)
    │   ├── HelpFeaturedArticles                                2-column top popular/featured guide cards
    │   └── HelpArticleList                                     Cursor-paginated articles feed
    │       ├── [canManage] StatusFilterToggle (?status=)
    │       ├── 4 states: loading skeleton, empty state, error, populated
    │       ├── HelpArticleCard × N (title, category, read time, view count, chevron)
    │       └── LoadMoreButton
    └── HelpCategoryManagerDialog                               Sheet/Dialog for category CRUD, reorder, deactivation
    └── PermissionDenied (shared pattern, domain-local)        403 state for auditors/unauthorized users

app/(dashboard)/help/[publicId]/page.tsx                        Server Component
└── HelpArticleReaderPageClient                                 Client Component
    ├── Breadcrumb & Back Navigation Link
    ├── [if !is_published] DraftWarningBanner                   Amber warning banner for draft state
    ├── ArticleHeader (Title, Category Badge, Author, DualDateDisplay, ViewCount, ReadTime)
    ├── [canManage] ArticleManageToolbar (Edit, Publish/Unpublish toggle, Delete with ConfirmDialog)
    ├── HelpArticleContent (DOMPurify sanitized prose body with responsive styling)
    ├── HelpArticleAttachmentsGallery (Image thumbnails, full preview modal, authenticated download)
    └── HelpRelatedArticles ("More in this category" cards)

app/(dashboard)/help/new/page.tsx                               Server Component
└── HelpArticleEditorPageClient (mode="create")                 Client Component (gated by helpcenter.manage)
    ├── HelpArticleForm                                         Category select, bilingual titles, bilingual bodies, toolbar, preview, attachments
    └── CancelDiscardDialog                                    Dirty-state navigation guard

app/(dashboard)/help/[publicId]/edit/page.tsx                   Server Component
└── HelpArticleEditorPageClient (mode="edit")                   Client Component (gated by helpcenter.manage)
    └── HelpArticleForm                                         Pre-filled article form + live attachments manager + publish/unpublish/delete
```

---

## Affected Files

### New Files

| File | Purpose |
|---|---|
| `lib/api/types/help-center-types.ts` | Domain TypeScript interfaces matching backend models, DTOs, and filter shapes. |
| `lib/api/hooks/use-help-center.ts` | TanStack Query hooks: categories, articles infinite, article detail, search infinite, documents, and all mutation hooks. |
| `lib/stores/use-help-display-store.ts` | Non-persisted Zustand store sharing active article title and category name with breadcrumb. |
| `lib/utils/help-center-utils.ts` | Pure helpers: `estimateReadTime()`, `sanitizeArticleHtml()`, category icon mapping, snippet extraction. |
| `app/(dashboard)/help/page.tsx` | Server route for main Help Center directory and search. |
| `app/(dashboard)/help/[publicId]/page.tsx` | Server route for reading an individual help article. |
| `app/(dashboard)/help/new/page.tsx` | Server route for authoring a new draft article (CMS). |
| `app/(dashboard)/help/[publicId]/edit/page.tsx` | Server route for editing an existing article (CMS). |
| `components/domain/help/help-center-page-client.tsx` | Client orchestrator for the directory view, URL sync, and dialog management. |
| `components/domain/help/help-search-hero.tsx` | Search banner with search icon, clear button, and debounced URL synchronization. |
| `components/domain/help/help-category-grid.tsx` | 4-column responsive category cards displaying name, icon, and article count. |
| `components/domain/help/help-category-tabs.tsx` | Horizontal scrollable chip bar for quick category filtering. |
| `components/domain/help/help-featured-articles.tsx` | 2-column featured / popular guide cards with hover lift. |
| `components/domain/help/help-article-list.tsx` | Cursor-paginated article feed with status toggle and load more. |
| `components/domain/help/help-article-card.tsx` | Individual article card item with metadata and RTL-flipping chevron. |
| `components/domain/help/help-search-results.tsx` | Search results list rendering query-matched snippets and relevance ranking. |
| `components/domain/help/help-article-reader-page-client.tsx` | Client orchestrator for the reader view, view count tracking, and toolbar. |
| `components/domain/help/help-article-content.tsx` | DOMPurify-sanitized rich text article renderer with Tailwind prose typography. |
| `components/domain/help/help-article-attachments-gallery.tsx` | Attachment list, image zoom preview dialog, and authenticated download button. |
| `components/domain/help/help-article-editor-page-client.tsx` | Client orchestrator for authoring/editing routes with dirty state guard. |
| `components/domain/help/help-article-form.tsx` | Bilingual article form with formatting toolbar, live preview tab, and attachments uploader. |
| `components/domain/help/help-category-manager-dialog.tsx` | Sheet/Dialog for category CRUD, reordering, and deactivation. |
| `components/domain/help/help-center-skeleton.tsx` | Skeleton loader matching hero banner, category cards, and article list rows. |
| `components/domain/help/help-article-reader-skeleton.tsx` | Skeleton loader mirroring the reader section-by-section (manager actions, meta row, gallery + related grids). |
| `components/domain/help/permission-denied.tsx` | Domain-local 403 state for auditors and unauthorized users. |
| `components/domain/help/cancel-discard-dialog.tsx` | Dirty-state navigation guard for the article editor. |
| `__tests__/components/domain/help/help-center.test.tsx` | Component tests: directory render, search, category filter, 4 states, RTL. |
| `__tests__/components/domain/help/help-article-reader.test.tsx` | Component tests: sanitized content rendering, draft alert, attachment download. |
| `__tests__/components/domain/help/help-article-form.test.tsx` | Component tests: form validation, preview toggle, publish/unpublish mutation. |

### Modified Files

| File | Change |
|---|---|
| `lib/api/query-keys.ts` | Add `helpCenter` namespace to query key factory. |
| `components/domain/shell/app-sidebar.tsx` | Add "Help Center" navigation item with `BookOpen` icon, gated by `helpcenter.view` or `helpcenter.manage`. |
| `components/domain/shell/use-page-breadcrumb.ts` | Extend `usePageBreadcrumb()` to resolve `/help`, `/help/[publicId]`, `/help/new`, and `/help/[publicId]/edit`. |
| `messages/ar.json` | Add `help_center.*` Arabic translation strings. |
| `messages/en.json` | Add `help_center.*` English translation strings. |

---

## Implementation Notes

### 1. Domain Types (`lib/api/types/help-center-types.ts`)

**One-line summary:** Explicit TypeScript models matching backend 020 resources and requests.

```ts
export interface HelpArticleCategory {
  public_id: string;
  name_ar: string;
  name_en: string;
  display_order: number;
  is_active: boolean;
  article_count?: number;
  created_at?: string;
}

export interface HelpArticleAuthor {
  public_id: string;
  name_ar: string;
  name_en: string;
}

export interface HelpArticle {
  public_id: string;
  title_ar: string;
  title_en: string;
  category?: {
    public_id: string;
    name_ar: string;
    name_en: string;
  };
  is_published: boolean;
  display_order: number;
  view_count: number;
  author?: HelpArticleAuthor;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelpArticleDetail extends HelpArticle {
  body_ar: string;
  body_en?: string | null;
  last_editor?: HelpArticleAuthor;
}

export interface HelpArticleSearchResult extends HelpArticle {
  relevance_score?: number;
  snippet?: string;
}

export interface HelpArticleFilters {
  category_id?: string | null;
  is_published?: boolean | null;
  per_page?: number;
}

export interface HelpArticleSearchFilters {
  q: string;
  category_id?: string | null;
  per_page?: number;
}

export interface StoreHelpArticleRequest {
  category_id: string;
  title_ar: string;
  title_en?: string;
  body_ar: string;
  body_en?: string;
  display_order?: number;
}

export interface UpdateHelpArticleRequest {
  category_id?: string;
  title_ar?: string;
  title_en?: string;
  body_ar?: string;
  body_en?: string;
  display_order?: number;
}

export interface StoreHelpCategoryRequest {
  name_ar: string;
  name_en: string;
  display_order?: number;
}

export interface UpdateHelpCategoryRequest {
  name_ar?: string;
  name_en?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface ReorderHelpCategoriesRequest {
  categories: Array<{
    public_id: string;
    display_order: number;
  }>;
}
```

---

### 2. Query Key Factory Extension (`lib/api/query-keys.ts`)

**One-line summary:** Centralized query keys for category, article, search, and document caches.

```ts
export const queryKeys = {
  // ... existing keys
  helpCenter: {
    all: ['help-center'] as const,
    categories: () => [...queryKeys.helpCenter.all, 'categories'] as const,
    articles: () => [...queryKeys.helpCenter.all, 'articles'] as const,
    articleList: (filters?: HelpArticleFilters) =>
      [...queryKeys.helpCenter.articles(), filters] as const,
    details: () => [...queryKeys.helpCenter.all, 'detail'] as const,
    detail: (publicId: string) => [...queryKeys.helpCenter.details(), publicId] as const,
    search: (filters: HelpArticleSearchFilters) =>
      [...queryKeys.helpCenter.all, 'search', filters] as const,
    documents: (articlePublicId: string) =>
      [...queryKeys.helpCenter.detail(articlePublicId), 'documents'] as const,
  },
} as const;
```

---

### 3. TanStack Query Hooks (`lib/api/hooks/use-help-center.ts`)

**One-line summary:** Full suite of hooks for categories, articles (infinite), detail, search, and mutations with cache invalidation.

```ts
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../query-keys';
import type { CursorPage } from '../types';
import type {
  HelpArticleCategory,
  HelpArticle,
  HelpArticleDetail,
  HelpArticleSearchResult,
  HelpArticleFilters,
  HelpArticleSearchFilters,
  StoreHelpArticleRequest,
  UpdateHelpArticleRequest,
  StoreHelpCategoryRequest,
  UpdateHelpCategoryRequest,
  ReorderHelpCategoriesRequest,
} from '../types/help-center-types';

/** Fetch all active categories (manage users see inactive as well) */
export function useHelpCategories() {
  return useQuery({
    queryKey: queryKeys.helpCenter.categories(),
    queryFn: () => apiClient.get<HelpArticleCategory[]>('/v1/help-center/categories'),
    staleTime: 300_000, // 5 min warm cache matching backend
  });
}

/** Fetch cursor-paginated help articles */
export function useHelpArticlesInfinite(filters: HelpArticleFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.helpCenter.articleList(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<HelpArticle>>('/v1/help-center/articles', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });
}

/** Fetch single article detail with body */
export function useHelpArticle(publicId: string) {
  return useQuery({
    queryKey: queryKeys.helpCenter.detail(publicId),
    queryFn: () => apiClient.get<HelpArticleDetail>(`/v1/help-center/articles/${publicId}`),
    enabled: !!publicId,
  });
}

/** Full-text search with cursor pagination */
export function useHelpArticleSearch(filters: HelpArticleSearchFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.helpCenter.search(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<HelpArticleSearchResult>>('/v1/help-center/search', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    enabled: filters.q.trim().length >= 2,
  });
}

/** Article attachments hook */
export function useHelpArticleDocuments(articlePublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.helpCenter.documents(articlePublicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<any>>(`/v1/help-center/articles/${articlePublicId}/documents`, {
        params: { cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    enabled: !!articlePublicId,
  });
}

/** Mutations */
export function useCreateHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StoreHelpArticleRequest) =>
      apiClient.post<HelpArticleDetail>('/v1/help-center/articles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() });
    },
  });
}

export function useUpdateHelpArticle(publicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateHelpArticleRequest) =>
      apiClient.put<HelpArticleDetail>(`/v1/help-center/articles/${publicId}`, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.setQueryData(queryKeys.helpCenter.detail(publicId), updated);
    },
  });
}

export function usePublishHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<HelpArticleDetail>(`/v1/help-center/articles/${publicId}/publish`),
    onSuccess: (_, publicId) => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() });
    },
  });
}

export function useUnpublishHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<HelpArticleDetail>(`/v1/help-center/articles/${publicId}/unpublish`),
    onSuccess: (_, publicId) => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() });
    },
  });
}

export function useDeleteHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/help-center/articles/${publicId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.articles() });
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() });
    },
  });
}

export function useCreateHelpCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StoreHelpCategoryRequest) =>
      apiClient.post<HelpArticleCategory>('/v1/help-center/categories', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() }),
  });
}

export function useUpdateHelpCategory(publicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateHelpCategoryRequest) =>
      apiClient.put<HelpArticleCategory>(`/v1/help-center/categories/${publicId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() }),
  });
}

export function useReorderHelpCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderHelpCategoriesRequest['categories']) =>
      apiClient.put('/v1/help-center/categories/reorder', { categories: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() }),
  });
}

export function useDeleteHelpCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.delete(`/v1/help-center/categories/${publicId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.helpCenter.categories() }),
  });
}

export function useUploadHelpArticleDocument(articlePublicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post(`/v1/help-center/articles/${articlePublicId}/documents`, formData),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.helpCenter.documents(articlePublicId) }),
  });
}
```

---

### 4. Utilities & Helpers (`lib/utils/help-center-utils.ts`)

**One-line summary:** Pure calculation functions for reading time, HTML sanitization, and category icons.

```ts
import DOMPurify from 'dompurify';
import {
  BookOpen,
  Compass,
  FileText,
  HelpCircle,
  Layers,
  Settings,
  Shield,
  Workflow,
  BarChart3,
  ListTodo,
  type LucideIcon,
} from 'lucide-react';

export function estimateReadTime(text: string | null | undefined): number {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function sanitizeArticleHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml) return '';
  if (typeof window === 'undefined') return rawHtml; // SSR fallback
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'a', 'img', 'hr', 'br',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'dir'],
  });
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'workspace-navigation': Compass,
  'task-lifecycle': ListTodo,
  'stage-workflow': Workflow,
  'blueprint-engine': Layers,
  'sla-escalations': Timer,
  'follow-up-center': Activity,
  'collaboration-documents': MessagesSquare,
  'confidentiality-governance': ShieldCheck,
  'delegation-management': Users,
  'organization-structure': Building2,
  'system-administration': Settings,
  'analytics-reporting': BarChart3,
  'platform-operations': Server,
  'help-center-cms': BookOpen,
};

export function getCategoryIcon(slugOrName: string | null | undefined): LucideIcon {
  const key = (slugOrName ?? '').toLowerCase().trim();
  if (key && CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  // Keyword fallback for custom categories (matched against slug or name)
  if (key.includes('start') || key.includes('بدء')) return Compass;
  if (key.includes('task') || key.includes('مهم')) return ListTodo;
  if (key.includes('blueprint') || key.includes('مخطط')) return Workflow;
  if (key.includes('report') || key.includes('تقرير') || key.includes('تحليل')) return BarChart3;
  if (key.includes('admin') || key.includes('إدار') || key.includes('نظام')) return Settings;
  if (key.includes('security') || key.includes('أمان') || key.includes('صلاح')) return Shield;
  return BookOpen;
}
// Grid calls getCategoryIcon(category.slug || name); cards carry cursor-pointer.
```

---

### 5. Breadcrumb Extension (`components/domain/shell/use-page-breadcrumb.ts`)

**One-line summary:** Maps `/help`, `/help/[publicId]`, `/help/new`, and `/help/[publicId]/edit` to human-readable crumbs.

```ts
// Inside usePageBreadcrumb():
const helpArticleEdit = pathname.match(/^\/help\/([^/]+)\/edit$/);
if (helpArticleEdit) {
  return [
    { label: nav('help_center'), href: '/help' },
    { label: articleTitle || '...', href: `/help/${helpArticleEdit[1]}` },
    { label: nav('edit') },
  ];
}

const helpArticleNew = pathname === '/help/new';
if (helpArticleNew) {
  return [
    { label: nav('help_center'), href: '/help' },
    { label: nav('new_article') },
  ];
}

const helpArticleDetail = pathname.match(/^\/help\/([^/]+)$/);
if (helpArticleDetail) {
  return [
    { label: nav('help_center'), href: '/help' },
    ...(categoryName ? [{ label: categoryName, href: `/help?category=${categorySlug}` }] : []),
    { label: articleTitle || '...' },
  ];
}

if (pathname === '/help') {
  return [
    { label: nav('help_center') },
  ];
}
```

---

### 6. AppSidebar Navigation Link (`components/domain/shell/app-sidebar.tsx`)

**One-line summary:** Adds Help Center nav item in the sidebar for users with `helpcenter.view` or `helpcenter.manage`.

```tsx
const canViewHelp = useCapability('helpcenter.view', mode === 'tenant') ||
                    useCapability('helpcenter.manage', mode === 'tenant');

// Under Support / Help section or main navigation:
{mode === 'tenant' && canViewHelp && (
  <SidebarGroup>
    <SidebarGroupLabel>{tnav('label_support')}</SidebarGroupLabel>
    <SidebarGroupContent>
      <NavMain
        items={[
          { title: tnav('help_center'), url: '/help', icon: BookOpen },
        ]}
        pathname={pathname}
      />
    </SidebarGroupContent>
  </SidebarGroup>
)}
```

---

### 7. Core Component TSX Snippets

#### A. Hero Search Banner (`components/domain/help/help-search-hero.tsx`)

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Search, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpSearchHeroProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

export function HelpSearchHero({ value, onChange, onClear }: HelpSearchHeroProps) {
  const t = useTranslations('help_center.hero');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 text-white shadow-md">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
          <BookOpen className="size-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t('headline')}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {t('subheadline')}
        </p>
        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded-xl border border-white/20 bg-white/10 py-3.5 pe-10 ps-12 text-sm text-white placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={t('search_placeholder')}
          />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="absolute end-2 top-1/2 size-7 -translate-y-1/2 text-slate-400 hover:text-white"
              aria-label={t('clear_search')}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### B. Article Reader Renderer (`components/domain/help/help-article-content.tsx`)

```tsx
'use client';

import { useMemo } from 'react';
import { sanitizeArticleHtml } from '@/lib/utils/help-center-utils';

interface HelpArticleContentProps {
  content: string;
  locale?: 'ar' | 'en';
}

export function HelpArticleContent({ content, locale = 'ar' }: HelpArticleContentProps) {
  const sanitized = useMemo(() => sanitizeArticleHtml(content), [content]);

  return (
    <article
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-img:rounded-xl prose-img:border prose-table:border"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

#### C. Category Manager Dialog (`components/domain/help/help-category-manager-dialog.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import {
  useHelpCategories,
  useCreateHelpCategory,
  useUpdateHelpCategory,
  useDeleteHelpCategory,
  useReorderHelpCategories,
} from '@/lib/api/hooks/use-help-center';
import { ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface HelpCategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpCategoryManagerDialog({ open, onOpenChange }: HelpCategoryManagerDialogProps) {
  const t = useTranslations('help_center.categories');
  const { data: categories = [] } = useHelpCategories();
  const createCategory = useCreateHelpCategory();
  const updateCategory = useUpdateHelpCategory('');
  const deleteCategory = useDeleteHelpCategory();
  const reorderCategories = useReorderHelpCategories();

  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');

  const handleSave = async () => {
    if (!nameAr.trim()) {
      toast.error(t('name_ar_required'));
      return;
    }
    if (!nameEn.trim()) {
      toast.error(t('name_en_required'));
      return;
    }

    if (editingCategory) {
      updateCategory.mutate(
        { name_ar: nameAr, name_en: nameEn },
        {
          onSuccess: () => {
            toast.success(t('update_success'));
            setEditingCategory(null);
            setNameAr('');
            setNameEn('');
          },
          onError: (err: any) => toast.error(err.message),
        }
      );
    } else {
      createCategory.mutate(
        { name_ar: nameAr, name_en: nameEn, display_order: categories.length },
        {
          onSuccess: () => {
            toast.success(t('create_success'));
            setNameAr('');
            setNameEn('');
          },
          onError: (err: any) => toast.error(err.message),
        }
      );
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newOrder = [...categories];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const payload = newOrder.map((cat, idx) => ({
      public_id: cat.public_id,
      display_order: idx,
    }));

    reorderCategories.mutate(payload, {
      onError: (err: any) => toast.error(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('manager_title')}</DialogTitle>
          <DialogDescription>{t('manager_desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-xl border p-4">
            <h4 className="mb-3 text-sm font-semibold">
              {editingCategory ? t('edit_category') : t('new_category')}
            </h4>
            <BilingualNameFields
              nameAr={nameAr}
              nameEn={nameEn}
              onChangeAr={setNameAr}
              onChangeEn={setNameEn}
              labelAr={t('name_ar')}
              labelEn={t('name_en')}
            />
            <div className="mt-3 flex justify-end gap-2">
              {editingCategory && (
                <Button variant="outline" size="sm" onClick={() => { setEditingCategory(null); setNameAr(''); setNameEn(''); }}>
                  {t('cancel')}
                </Button>
              )}
              <Button size="sm" onClick={handleSave}>
                {editingCategory ? t('save_changes') : t('add_category')}
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {categories.map((cat, index) => (
              <div key={cat.public_id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{cat.name_ar} / {cat.name_en}</p>
                  <p className="text-xs text-muted-foreground">{cat.article_count ?? 0} {t('articles_count')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => handleMove(index, 'up')}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={index === categories.length - 1} onClick={() => handleMove(index, 'down')}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setNameAr(cat.name_ar); setNameEn(cat.name_en); }}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(cat)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {deleteTarget && (
          <ConfirmDeleteDialog
            open={!!deleteTarget}
            onOpenChange={(o) => !o && setDeleteTarget(null)}
            title={t('confirm_delete_title')}
            description={t('confirm_delete_desc', { name: deleteTarget.name_ar })}
            onConfirm={() => {
              deleteCategory.mutate(deleteTarget.public_id, {
                onSuccess: () => {
                  toast.success(t('delete_success'));
                  setDeleteTarget(null);
                },
                onError: (err: any) => {
                  toast.error(err.message || t('delete_failed'));
                  setDeleteTarget(null);
                },
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Data Flow

```text
User Actions / Route Mount
       │
       ▼
app/(dashboard)/help/page.tsx
       │ reads ?category, ?q, ?status from searchParams
       ▼
HelpCenterPageClient
       │
       ├─► useHelpCategories() ──► GET /v1/help-center/categories
       │      └─► Caches (300s) ──► renders HelpCategoryGrid + HelpCategoryTabs
       │
       ├─► [if q >= 2]
       │      └─► useHelpArticleSearch(q, category) ──► GET /v1/help-center/search
       │             └─► Renders HelpSearchResults (relevance rank + snippets)
       │
       └─► [if q < 2]
              └─► useHelpArticlesInfinite(category, status) ──► GET /v1/help-center/articles
                     └─► Cursor pagination ──► renders HelpArticleList (cards + Load More)

When Reading Article (/help/[publicId]):
HelpArticleReaderPageClient
       │
       ├─► useHelpArticle(publicId) ──► GET /v1/help-center/articles/{publicId}
       │      └─► Backend increments view_count for internal users
       │      └─► Syncs title to useHelpDisplayStore (for breadcrumb)
       │      └─► DOMPurify sanitizes body_ar / body_en ──► renders HelpArticleContent
       │
       └─► useHelpArticleDocuments(publicId) ──► GET /v1/help-center/articles/{publicId}/documents
              └─► Displays image gallery with authenticated blob fetch preview/download
```

---

## Route Structure

```text
app/(dashboard)/
├── help/
│   ├── page.tsx                      # Help Center directory & search (/help)
│   ├── new/
│   │   └── page.tsx                  # Create article CMS (/help/new)
│   └── [publicId]/
│       ├── page.tsx                  # Article reader (/help/[publicId])
│       └── edit/
│           └── page.tsx              # Edit article CMS (/help/[publicId]/edit)
```

*Note: All routing is cookie-based via `NEXT_LOCALE`; no `[locale]` URL prefix exists.*

---

## Execution Order

1. **Prerequisites & Dependencies:**
   - Verify `dompurify` and `@types/dompurify` in `package.json` (install if missing).
   - Add domain TypeScript interfaces in `lib/api/types/help-center-types.ts`.
2. **Query Keys & Hooks:**
   - Extend `lib/api/query-keys.ts` with `helpCenter` namespace.
   - Implement `lib/api/hooks/use-help-center.ts` with full query, infinite query, and mutation hooks.
   - Implement `lib/stores/use-help-display-store.ts` for breadcrumb sync.
   - Implement pure helpers in `lib/utils/help-center-utils.ts` (read time calculation, HTML sanitization, category icons).
3. **Shell Navigation & Breadcrumbs:**
   - Update `components/domain/shell/app-sidebar.tsx` with capability-gated Help Center item.
   - Update `components/domain/shell/use-page-breadcrumb.ts` with `/help` sub-routes.
   - Add translation strings to `messages/ar.json` and `messages/en.json`.
4. **Directory & Search Components:**
   - Implement `components/domain/help/help-search-hero.tsx`.
   - Implement `components/domain/help/help-category-grid.tsx` and `help-category-tabs.tsx`.
   - Implement `components/domain/help/help-featured-articles.tsx`.
   - Implement `components/domain/help/help-article-card.tsx` and `help-article-list.tsx`.
   - Implement `components/domain/help/help-search-results.tsx`.
   - Implement `components/domain/help/help-center-skeleton.tsx`.
   - Implement `components/domain/help/help-center-page-client.tsx` and `app/(dashboard)/help/page.tsx`.
5. **Article Reader Components:**
   - Implement `components/domain/help/help-article-content.tsx` (DOMPurify).
   - Implement `components/domain/help/help-article-attachments-gallery.tsx` (secure blob fetch).
   - Implement `components/domain/help/help-article-reader-skeleton.tsx`.
   - Implement `components/domain/help/help-article-reader-page-client.tsx` and `app/(dashboard)/help/[publicId]/page.tsx`.
6. **CMS Authoring & Category Manager:**
   - Implement `components/domain/help/help-category-manager-dialog.tsx` (CRUD + reorder + delete confirmation).
   - Implement `components/domain/help/help-article-form.tsx` (bilingual inputs + markdown/preview + attachments).
   - Implement `components/domain/help/help-article-editor-page-client.tsx` and routes `/help/new/page.tsx` and `/help/[publicId]/edit/page.tsx`.
7. **Automated Unit & Component Tests:**
   - Write `__tests__/components/domain/help/help-center.test.tsx`.
   - Write `__tests__/components/domain/help/help-article-reader.test.tsx`.
   - Write `__tests__/components/domain/help/help-article-form.test.tsx`.
8. **Verification:**
   - Run `npm run typecheck` and `npm run test`.
   - Run manual checklist in Arabic (RTL) and English (LTR).

---

## What to Test Manually

### 1. Happy Paths (both Arabic RTL and English LTR)
- Navigate to `/help` from the sidebar navigation.
- Verify hero search input is visible; type a keyword (e.g. "مهمة" or "task") and verify search results populate with highlight snippets.
- Click a category card (e.g. "Managing Tasks"); verify URL updates to `?category={slug}` and only articles from that category appear. Paste a UUID variant and verify it resolves identically.
- Click an article card; verify navigation to `/help/[slug]`. Paste the UUID variant and verify it resolves to the same article (backend accepts both).
- Verify article title, author, dual date (Gregorian + Hijri), view count, and reading time are properly formatted.
- Verify article content renders headings, lists, tables, and images with proper text alignment (`dir="rtl"` in Arabic, `dir="ltr"` in English).
- Click an attachment thumbnail; verify full image preview dialog opens; click download and verify file downloads with proper tenant authentication.

### 2. Loading, Empty, and Error States
- Simulate loading: verify `HelpCenterSkeleton` renders matching layout shapes without layout shift.
- Search for a non-existent phrase (e.g. "xyz123"): verify `EmptyState` displays with search icon, message, and "Clear search" CTA.
- Select an empty category: verify `EmptyState` displays with folder icon.
- Trigger API 500 error: verify `ErrorState` renders with localized error text and "Retry" button.
- External auditor login: verify `PermissionDenied` (403) state renders with no accessible help content.

### 3. Capability-Gated CMS Controls (`helpcenter.manage`)
- Log in as user with `helpcenter.manage`:
  - Verify "New Article" and "Manage Categories" buttons appear in `PageHeader`.
  - Verify article list displays status toggle (`All` | `Published` | `Drafts`) and draft badges on draft articles.
- Click "Manage Categories":
  - Add a category in Arabic and English; verify it appears in the list.
  - Reorder categories using Up/Down buttons; verify order persists after refetch.
  - Attempt to delete a category that contains published articles; verify 422 error toast *"Cannot delete a category that has published articles."*
- Click "New Article":
  - Fill category, Arabic title, English title, Arabic body, and English body.
  - Switch to "Preview" tab; verify DOMPurify sanitizes and renders the markdown preview cleanly.
  - Click "Save Draft"; verify redirected to `/help` and draft badge is displayed.
  - Open the draft article reader; verify `DraftWarningAlert` banner is visible.
  - Click "Publish"; verify toast confirms publication and draft banner disappears.

### 4. RTL & Responsive Behavior
- Toggle between Arabic and English via locale toggle:
  - Verify layout direction flips seamlessly between RTL and LTR.
  - Verify navigation chevrons and back arrows flip 180° in RTL (`rtl:rotate-180`).
  - Verify no physical margin/padding classes (`ml-`, `mr-`, `pl-`, `pr-`) are present.
- Test viewport on mobile (<640px):
  - Verify category grid stacks into 1-2 columns.
  - Verify category manager opens in full-height Sheet.
  - Verify article reader is comfortable to read with touch targets ≥ 44px.

### 5. Slug URLs, Hydration & Dialog Polish
- Open the category manager: dialog renders wide (`sm:max-w-4xl`), all row action buttons visible with vertical-only scrolling (no sideways scroll).
- Throttle network on an article page: reader skeleton occupies the same width/sections as the loaded article (no layout jump, no `PermissionDenied` flash).
- Breadcrumb on an article shows `Help Center › [Category] › [Title]` with the category crumb linking `?category={slug}`.