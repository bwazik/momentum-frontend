# Spec: Help Center — Article CMS & Knowledge Base

> **Number:** 011
> **Date:** 2026-09-07
> **Status:** `completed`
> **Milestone:** F6 — Admin, Org, Help, Onboarding
> **Depends on:** `001-core-shell`, `020-localization-calendar`, `024-task-documents`
> **Backend spec:** `../backend/specs/020-help-center/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** Antigravity
> **Branch:** `feat/011-help-center`
> **Base branch:** `main`

---

## Problem

Momentum governs complex, stage-level government task workflows with strict SLA timers, return transitions, confidentiality rules, and multi-department assignments. While new users complete guided training journeys in the Onboarding module (Spec 019/021), employees across all organizational tiers—executives, department directors, follow-up specialists, action officers, and administrators—regularly need immediate, self-service answers to operational questions as they execute their daily work (e.g., *"How do I initiate a return transition to a previous stage?"*, *"What triggers an SLA warning escalation?"*, or *"How do I configure working calendars?"*).

Without a dedicated, bilingual Help Center:
- Users have no searchable reference to refresh their understanding of specific platform mechanisms after completing initial onboarding.
- New features, revised operational directives, and organizational policies cannot be documented directly within the platform, forcing teams to rely on external PDFs, disconnected portals, or repetitive email blasts.
- Operational friction and support request volume increase significantly for trivial questions that have clear self-service answers.
- Knowledge managers and administrators have no governed, in-platform mechanism to author, organize, publish, and maintain operational guides in both Arabic and English.

The Help Center provides a government-grade, bilingual knowledge base and lightweight article CMS where internal users can search and read illustrated documentation, and authorized administrators can manage categories and the complete article publishing lifecycle.

---

## Goal

Deliver the **Help Center** feature within the authenticated dashboard shell, encompassing:
1. A public knowledge base home page (`/help`) with a hero search experience, category cards directory, featured/popular guides, and a filterable, cursor-paginated article list.
2. A fast, debounced full-text search interface ranking articles by relevance with snippet previews.
3. An article reader view (`/help/[publicId]`) rendering bilingual titles, metadata (author, dual Gregorian/Hijri publication date, view counter, category pill), sanitized rich text content, and attached screenshot/diagram documents.
4. An integrated, capability-gated CMS management workspace allowing users with `helpcenter.manage` to author draft articles, edit content, publish/unpublish, soft-delete, manage image attachments, and organize/reorder categories.

---

## User Stories

### Article Consumption (Internal Users — `helpcenter.view`)

- As an **internal user**, I want to browse published help articles organized by category, so that I can discover documentation relevant to my functional responsibilities.
- As an **internal user**, I want to search articles using Arabic or English keywords from a hero search input, so that I can quickly find answers without clicking through category hierarchies.
- As an **internal user**, I want to read comprehensive articles with rich text formatting (headings, lists, callouts, tables) and attached diagrams, so that I can understand complex workflow procedures.
- As an **internal user**, I want to see how long an article takes to read and when it was last updated (in both Gregorian and Hijri calendars), so that I know whether the content is current and fits my available time.
- As an **internal user**, I want to preview and download high-resolution screenshots and process attachments directly from the article, so that I can review detailed workflow schematics.

### Content & Category Management (Knowledge Managers — `helpcenter.manage`)

- As a **knowledge manager or tenant administrator**, I want to create draft articles with bilingual titles and rich text bodies, so that I can prepare comprehensive operational guidance before making it public.
- As a **knowledge manager**, I want to edit existing articles and update their category, content, and display order, so that platform guidance stays aligned with evolving processes.
- As a **knowledge manager**, I want to publish draft articles or unpublish outdated articles with a single action, so that only verified, up-to-date guidance is visible to regular users.
- As a **knowledge manager**, I want to upload image attachments (PNG, JPG, WebP) directly to an article, so that visual step-by-step guides have accompanying screenshots.
- As a **knowledge manager**, I want to create, edit, deactivate, and reorder categories, so that the knowledge base structure reflects our organization's priorities.
- As a **knowledge manager**, I want to see view counts and publication status on all articles, so that I can evaluate documentation reach and identify content needing revision.

### System & Security

- As the **system**, I want access strictly gated by ABAC capabilities (`helpcenter.view` for browsing/reading; `helpcenter.manage` for authoring/editing/publishing), so that unauthorized modifications are prevented.
- As the **system**, I want draft (unpublished) articles hidden from search results and browsing for regular users, so that unapproved or incomplete guidance is never leaked.
- As the **system**, I want external auditor accounts explicitly denied access (HTTP 403), so that internal operational guides remain confidential to tenant staff.
- As the **system**, I want all rich text HTML strictly sanitized with DOMPurify before rendering, so that malicious markup or XSS payloads cannot be executed in the client.
- As the **system**, I want reading an article to atomically record a view count increment on the server without client-side lag, so that popularity metrics remain accurate.

---

## Acceptance Criteria

### Navigation, Shell, and Permissions

- [x] **Sidebar Entry:** The authenticated sidebar (`AppSidebar`) displays a "Help Center" (`مركز المساعدة`) nav item with a `BookOpen` icon, visible to users holding `helpcenter.view` or `helpcenter.manage`.
- [x] **Breadcrumb Integration:** `usePageBreadcrumb()` recognizes:
  - `/help` → `Help Center`
  - `/help/[slug]` → `Help Center` › `[Category Name]` › `[Article Title]` (category crumb links `/help?category={slug}`)
  - `/help/new` → `Help Center` › `New Article`
  - `/help/[slug]/edit` → `Help Center` › `[Article Title]` › `Edit`
- [x] **Capability Gating:**
  - Users with `helpcenter.view`: Can browse published articles, search, view article reader, and download/preview attachments.
  - Users with `helpcenter.manage`: See management controls ("New Article" button in `PageHeader`, "Manage Categories" trigger, edit/publish/unpublish/delete row actions, draft status filters, and draft badges).
  - External auditors: Receive a clean, accessible `PermissionDenied` (403) state; no help content is rendered.
  - Hydration-safe: all three page clients render a skeleton until the client capability store hydrates, so the server never flashes `PermissionDenied` to authorized users.
- [x] **Page Header:** Standard `PageHeader` provides localized title, description, and dynamic actions (e.g., "New Article" and "Manage Categories" buttons when `helpcenter.manage` is granted).

### Knowledge Base Home Screen (`/help`)

- [x] **Hero Search Section:**
  - Centered hero banner with high-contrast gradient surface matching brand tokens, prominent headline (*"How can we help you?"* / *«كيف يمكننا مساعدتك؟»*), and subtitle.
  - Prominent search input with search icon and clear button (`X`). No dedicated `/` hotkey (deferred — the shell's global ⌘K command palette is the keyboard entry point).
  - Search input is debounced (300 ms). Typing triggers full-text search against `GET /v1/help-center/search?q=...`.
- [x] **Categories Grid:**
  - Displays all active categories fetched from `GET /v1/help-center/categories` in a responsive 1-to-4 column grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
  - Each card displays: localized category name (`name_ar` in RTL, `name_en` in LTR with fallback), a distinct Lucide icon from the slug-keyed `CATEGORY_ICONS` map, and published article count badge. Cards carry `cursor-pointer` (Tailwind v4 no longer sets pointer on buttons).
  - Clicking a category card sets the URL search parameter `?category={category_slug}`, filtering the article list below.
  - Active category card has an highlighted border (`border-primary bg-primary/5`) with a clear filter indicator.
- [x] **Category Quick Filter Tabs:**
  - Horizontal scrollable chip bar with "All Categories" (`جميع الفئات`) and each active category.
  - Reflects and updates the `category` URL query parameter (slugs).
- [x] **Featured & Popular Articles Section:**
  - When no active search query is present, displays a curated grid of up to 4 highlighted articles (top view counts or first in display order).
  - Cards display: category pill, localized title, 2-line description/excerpt, estimated read time (*"5 min read"*), and dual date indicator. Cards link by article `slug` with `public_id` fallback.
  - Hover states feature a subtle lift and primary color border transition.
- [x] **Articles Feed / List View:**
  - Displays published articles matching the active category filter, fetched via `GET /v1/help-center/articles`.
  - For `helpcenter.manage` users, an additional status toggle allows filtering: `All` | `Published` | `Drafts` (bound to `?status=`).
  - Each article row/card displays:
    - Status badge: Draft (`secondary` / slate) vs Published (emerald dot or subtle indicator for admins).
    - Category badge with category name.
    - Localized article title (bold text-sm or text-base).
    - Metadata line: Estimated reading time (calculated: ~200 words/min), view count with `Eye` icon, and formatted last updated date.
    - Directional chevron icon flipping in RTL (`rtl:rotate-180`).
  - Rows are clickable, navigating to `/help/[slug]` (`public_id` fallback; backend resolves both).
  - Manual "Load More" button triggers cursor pagination via `useInfiniteQuery`.

### Search Results View

- [x] **Search Mode Activation:** When search query `q` has ≥ 2 characters, the view switches to search results mode.
- [x] **Results Display:** Consumes `GET /v1/help-center/search?q={query}&category_id={cat}` with cursor pagination.
- [x] **Relevance Ranking:** Results are displayed in relevance order from PostgreSQL full-text search (`ts_rank`).
- [x] **Result Card:** Shows matched article title, highlighted search snippet, category pill, and read time. Cards link by article `slug` (backend search resource exposes it).
- [x] **Search Empty State:** When no results are found, renders `EmptyState` with a search icon, localized message (*"No articles found for '{query}'"*), and a "Clear search" CTA button.

### Article Reader View (`/help/[publicId]`)

- [x] **Article Header:**
  - Category pill badge linked back to `/help?category={category_slug}` (slug resolved from the cached categories list).
  - Localized title (`title_ar` or `title_en` with fallback) formatted as `h1` in `text-2xl lg:text-3xl font-bold text-foreground`.
  - Publication metadata: Author name (`author.name_ar` / `author.name_en`), dual date display (`DualDateDisplay` showing Gregorian and Hijri publication timestamps), view count with eye icon, and read time. Includes an AR/EN content-locale toggle when both bodies exist.
  - Administrative toolbar (visible only to `helpcenter.manage` users): "Edit Article", "Unpublish" / "Publish" toggle button, and "Delete" button.
- [x] **Draft Warning Banner:** If the article is unpublished (`is_published: false`), displays a prominent amber warning banner informing the admin that this article is a draft and invisible to regular users.
- [x] **Rich Content Renderer:**
  - Renders `body_ar` or `body_en` sanitized via `DOMPurify.sanitize()`.
  - Styled with Tailwind typography / prose classes (`prose dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary`).
  - Formats tables, blockquotes, ordered/unordered lists, code snippets, and callouts cleanly.
  - Text direction matches the content locale (`dir="rtl"` for Arabic body, `dir="ltr"` for English body).
- [x] **Image Attachments Section:**
  - Queries `GET /v1/help-center/articles/{article}/documents`.
  - Displays attached diagrams, screenshots, or document files in a dedicated gallery following Spec 024's authenticated-blob delivery pattern.
  - Thumbnail previews for images with zoom/preview dialog.
  - Secure download trigger using authenticated blob fetch (sending `X-Tenant` header via `apiClient`).
- [x] **Navigation & Context Footer:**
  - "Back to Help Center" button with directional arrow (`rtl:rotate-180`).
  - "Related Articles in this Category" list (up to 3 articles) allowing seamless reading progression.
- [x] **View Count Increment:** Automatically calls `GET /v1/help-center/articles/{article}`, which atomically increments `view_count` on the backend for internal viewers.

### Category Management Modal / Sheet (`helpcenter.manage`)

- [x] **Category Manager Trigger:** Accessible from `/help` via a "Manage Categories" (`إدارة الفئات`) button in `PageHeader.actions`.
- [x] **Category List Display:** Lists all categories (active and inactive) from `GET /v1/help-center/categories` in a wide (`sm:max-w-4xl`) dialog with vertical-only scrolling (`overflow-x-clip`).
- [x] **Category Fields:**
  - Create/Edit dialog provides: Arabic name (required, `dir="rtl"`) and English name (required, `dir="ltr"`).
  - Uses `BilingualNameFields` shared component.
- [x] **Display Order & Reordering:**
  - Categories show their `display_order`.
  - Up/Down order buttons call batch endpoint `PUT /v1/help-center/categories/reorder` with `categories: [{ public_id, display_order }]`.
- [x] **Category Soft Deletion:**
  - Deleting a category (`DELETE /v1/help-center/categories/{category}`):
    - Confirmed via `ConfirmDeleteDialog`.
    - If category has published articles, API rejects with 422 (`CategoryHasPublishedArticlesException`). UI catches error and shows localized toast: *"Cannot delete a category that has published articles."*
    - If category has only unpublished drafts, API soft-deletes category and cascades soft-delete to drafts. UI shows success toast and invalidates categories cache.
- [x] **Category Deactivation Toggle:** Deferred — removal is covered by delete; no `is_active` toggle in the manager dialog.

### Article Authoring & Editing CMS (`helpcenter.manage`)

- [x] **Editor Routes:**
  - Create: `/help/new`.
  - Edit: `/help/[slug]/edit` (UUID also resolves).
- [x] **Editor Form Structure:**
  - **Category Select:** `RtlSelect` populating active categories with required validation.
  - **Bilingual Titles:** Arabic title (`title_ar`, required, max 255 chars) and English title (`title_en`, optional, max 255 chars).
  - **Bilingual Bodies:**
    - Arabic Body (`body_ar`, required, max 100,000 chars, `dir="rtl"`).
    - English Body (`body_en`, optional, max 100,000 chars, `dir="ltr"`).
    - Rich text formatting toolbar (Bold, Italic, Heading 2/3, Bullet List, Numbered List, Blockquote, Code Block, Link, Table) with live Markdown/HTML Preview tab.
  - **Display Order:** Numeric input (`min: 0`).
- [x] **Attachments Manager in Editor:**
  - Upload section allowing knowledge managers to attach PNG/JPG/WebP images up to 10MB each.
  - Uses `POST /v1/help-center/articles/{article}/documents`.
  - List of uploaded attachments with copyable markdown image tag (e.g., `![alt](preview_url)`), thumbnail preview, and delete button.
- [x] **Publishing Lifecycle Controls:**
  - **Save Draft:** Submits `POST /v1/help-center/articles` (create) or `PUT /v1/help-center/articles/{article}` (update) with `is_published: false`.
  - **Publish:** Submits `POST /v1/help-center/articles/{article}/publish`. Sets `is_published = true`, updates `published_at`, and shows success toast.
  - **Unpublish:** Submits `POST /v1/help-center/articles/{article}/unpublish`. Sets `is_published = false` and shows warning/info toast.
  - **Delete Article:** Triggers `ConfirmDeleteDialog`, sends `DELETE /v1/help-center/articles/{article}`, and navigates back to `/help`.
  - After create/update, the form navigates to `/help/[slug]` (`public_id` fallback).
- [x] **Dirty State Guard:** Warns user with `CancelDiscardDialog` if navigating away from the editor with unsaved modifications.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`, `docs/ai/architecture.md`, `docs/ai/security-policy.md`

### Data Fetching Strategy

- [x] **Query Hooks (`lib/api/hooks/use-help-center.ts`):**
  - `useHelpCategories()`: Fetches category list via `apiClient.get('/v1/help-center/categories')`. Cached for 5 minutes (`staleTime: 300_000`), matching backend 300s cache.
  - `useHelpArticlesInfinite(filters)`: Uses `useInfiniteQuery` with `{ category_id, is_published, per_page: 15 }` for cursor pagination.
  - `useHelpArticle(publicId)`: Uses `useQuery` fetching `GET /v1/help-center/articles/{publicId}` (accepts slug or UUID). Enabled when `!!publicId`.
  - `useHelpArticleSearch(params)`: Uses `useInfiniteQuery` fetching `GET /v1/help-center/search` with `{ q, category_id, per_page: 15 }`. Enabled when `params.q.trim().length >= 2`.
  - `useHelpArticleDocuments(articlePublicId)`: Uses `useInfiniteQuery` fetching `GET /v1/help-center/articles/{articlePublicId}/documents`.
- [x] **Mutation Hooks:**
  - `useCreateHelpCategory()`, `useUpdateHelpCategory()`, `useReorderHelpCategories()`, `useDeleteHelpCategory()`
  - `useCreateHelpArticle()`, `useUpdateHelpArticle()`, `usePublishHelpArticle()`, `useUnpublishHelpArticle()`, `useDeleteHelpArticle()`
  - `useUploadHelpArticleDocument()`, `useDeleteHelpArticleDocument()`
- [x] **Cache Invalidation Rules:**
  - Category mutations invalidate `queryKeys.helpCenter.categories()`.
  - Article mutations invalidate `queryKeys.helpCenter.articles()` and `queryKeys.helpCenter.detail(publicId)`.
  - Publish/unpublish invalidates `queryKeys.helpCenter.articles()`, `queryKeys.helpCenter.detail(publicId)`, and `queryKeys.helpCenter.categories()` (to refresh article counts).
  - Document uploads/deletions invalidate `queryKeys.helpCenter.documents(articlePublicId)`.

### Query Key Structure (`lib/api/query-keys.ts`)

```ts
export const queryKeys = {
  // ... existing keys
  helpCenter: {
    all: ['help-center'] as const,
    categories: () => [...queryKeys.helpCenter.all, 'categories'] as const,
    articles: () => [...queryKeys.helpCenter.all, 'articles'] as const,
    articleList: (filters?: { categoryId?: string | null; isPublished?: boolean | null }) =>
      [...queryKeys.helpCenter.articles(), filters] as const,
    details: () => [...queryKeys.helpCenter.all, 'detail'] as const,
    detail: (publicId: string) => [...queryKeys.helpCenter.details(), publicId] as const,
    search: (filters: { query: string; categoryId?: string | null }) =>
      [...queryKeys.helpCenter.all, 'search', filters] as const,
    documents: (articlePublicId: string) =>
      [...queryKeys.helpCenter.detail(articlePublicId), 'documents'] as const,
  },
} as const;
```

### State Management Decision Matrix

| Concern | Mechanism | Location / Store | Rationale |
|---|---|---|---|
| Search Query (`q`) | URL param `?q=` | Browser URL / `useSearchParams` | Bookmarkable search results, shareable links, back button works |
| Active Category Filter | URL param `?category=` | Browser URL / `useSearchParams` | Deep-linking to specific category views |
| Article Publish Status Filter | URL param `?status=` | Browser URL / `useSearchParams` | Allows admin to filter draft vs published articles |
| Category Manager Modal Open | Local `useState` | Client Component | Ephemeral dialog state |
| Article Editor Form Data | Local component state | `useForm` / controlled state | Form input state (never stored in Zustand or URL) |
| Active Tab in Editor (Write / Preview) | Local `useState` | Editor component | Ephemeral UI tab toggle |
| Breadcrumb Article Name | Zustand store | `useHelpDisplayStore` | Avoids UUID in breadcrumb, displays actual article title |

### Error Handling & Edge Cases

- [x] **401 Unauthorized:** Handled globally by `prefetchAuthenticatedUser()` and `QueryCache.onError` → redirects to `/login`.
- [x] **403 Forbidden:**
  - External auditors: Displays shared `PermissionDenied` state (*"External auditors do not have access to the Help Center"*).
  - Regular internal users attempting to view draft articles or hit management routes: Displays 403 `ErrorState` with "Back to Help Center" CTA.
- [x] **404 Not Found:** If article slug/`publicId` does not exist or was soft-deleted, renders `EmptyState` with `FileQuestion` icon and a return link.
- [x] **422 Validation Error:**
  - Category deletion with published articles: Backend returns 422 `CategoryHasPublishedArticlesException`. UI intercepts and triggers `toast.error(t('category_has_published_articles'))`.
  - Body length > 100,000 chars: Client-side validation prevents submission and shows toast.
- [x] **500 Server / Network Error:** Renders `ErrorState` with retry button.

### Security, PII, and XSS Protection

- [x] **DOMPurify Sanitization:** Article bodies (`body_ar`, `body_en`) are processed through `DOMPurify.sanitize(html)` with permitted tags (`h1-h6`, `p`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `a`, `img`, `strong`, `em`, `hr`, `span`) before rendering.
- [x] **Safe Link Attributes:** All links within rendered articles receive `rel="noopener noreferrer"` and target `_blank` for external links.
- [x] **No Secrets or PII:** Article contents and logs never include user credentials, session tokens, or sensitive internal IDs.
- [x] **Authenticated Attachment Fetching:** Images and attachments are downloaded and previewed via `fetchDocumentBlob()` with `credentials: 'include'` and `X-Tenant` header; no public unauthenticated object URLs.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md` through `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Location | Purpose |
|---|---|---|---|
| `HelpCenterPage` | Client Page | `app/(dashboard)/help/page.tsx` | Main Help Center directory page with search, categories, and articles feed |
| `HelpArticlePage` | Client Page | `app/(dashboard)/help/[publicId]/page.tsx` | Full article reader page with rich text, attachments, and metadata |
| `HelpArticleEditorPage` | Client Page | `app/(dashboard)/help/new/page.tsx` & `.../[publicId]/edit/page.tsx` | CMS editor for creating and updating bilingual articles |
| `HelpSearchHero` | Client Component | `components/domain/help/help-search-hero.tsx` | Search banner with debounced input and clear action |
| `HelpCategoryGrid` | Client Component | `components/domain/help/help-category-grid.tsx` | 4-column responsive category cards grid with active state |
| `HelpCategoryTabs` | Client Component | `components/domain/help/help-category-tabs.tsx` | Horizontal scrollable category pill filter tabs |
| `HelpFeaturedArticles` | Client Component | `components/domain/help/help-featured-articles.tsx` | 2-column featured / popular guide cards |
| `HelpArticleList` | Client Component | `components/domain/help/help-article-list.tsx` | Cursor-paginated article list with status badges and load more |
| `HelpArticleCard` | Client Component | `components/domain/help/help-article-card.tsx` | Individual article card item with metadata and chevron |
| `HelpArticleReader` | Client Component | `components/domain/help/help-article-reader.tsx` | Sanitized rich text content renderer, attachments gallery, and footer |
| `HelpArticleAttachments` | Client Component | `components/domain/help/help-article-attachments.tsx` | Attachment list, image previews, and authenticated downloads |
| `HelpCategoryManagerDialog` | Client Component | `components/domain/help/help-category-manager-dialog.tsx` | Category CRUD, reordering, and deactivation sheet/dialog |
| `HelpArticleForm` | Client Component | `components/domain/help/help-article-form.tsx` | Full CMS editor form with bilingual inputs and markdown/preview tabs |
| `HelpCenterSkeleton` | Client Component | `components/domain/help/help-center-skeleton.tsx` | Skeleton loader matching hero, category grid, and article list |
| `HelpArticleReaderSkeleton` | Client Component | `components/domain/help/help-article-reader-skeleton.tsx` | Skeleton loader matching article header, body lines, and attachment cards |
| `PageHeader` | Shared Component | `components/shared/page-header.tsx` | Page title, description, and action buttons slot |
| `EmptyState` | Shared Component | `components/shared/empty-state.tsx` | Empty search, empty category, and missing article states |
| `ErrorState` | Shared Component | `components/shared/error-state.tsx` | API failure state with retry button |
| `DualDateDisplay` | Domain Component | `components/domain/localization/dual-date-display.tsx` | Dual Gregorian and Hijri publication date formatter |
| `BilingualNameFields` | Shared Component | `components/shared/bilingual-name-fields.tsx` | Standard Arabic (required) and English (optional) input pair |
| `ConfirmDeleteDialog` | Shared Component | `components/shared/confirm-delete-dialog.tsx` | Destructive confirmation for category and article deletions |

### States Specification (All 4 States)

| State | Component / View | Visual Appearance |
|---|---|---|
| **Loading** | `HelpCenterSkeleton` | Animated skeleton with hero banner box, 4 category card rectangles, and 5 article list row placeholders matching real dimensions. |
| **Loading** | `HelpArticleReaderSkeleton` | Mirrors the reader section-by-section: back + 3 manager-action placeholders, badge + language-toggle row, full-width title, 4-item metadata row, paragraph skeletons, `sm:grid-cols-2 lg:grid-cols-3` attachment tiles, and a 3-card related-articles grid. |
| **Empty** | `EmptyState` (Search) | `SearchX` icon, title: *"No articles match your search"*, description: *"Try adjusting your search terms or clearing filters"*, CTA: *"Clear search"* button. |
| **Empty** | `EmptyState` (Category) | `FolderOpen` icon, title: *"No articles in this category"*, description: *"Articles will appear here once published."*, optional CTA: *"Create Article"* for managers. |
| **Error** | `ErrorState` | `AlertCircle` icon, localized error message, and *"Retry"* button calling TanStack Query `refetch()`. |
| **Success** | Populated Views | Rendered hero search, active category cards, featured cards, articles list, and full rich text article reader. |

### Responsive Behavior

| Breakpoint | Layout Adjustments |
|---|---|
| **Mobile (<640px)** | - Hero search padding reduced (`py-8 px-4`). Headline font size `text-xl`.<br>- Category grid collapses to a single column (`grid-cols-1`) or 2 columns (`grid-cols-2`).<br>- Featured articles collapse to a single column.<br>- Article list items stack metadata vertically; chevrons hidden to preserve touch target area.<br>- Category manager renders as a full-height Sheet instead of a Dialog.<br>- Article editor tabs (Write / Preview) stack vertically or toggle via segmented control. |
| **Tablet (640–1024px)** | - Category grid renders in 2 columns (`grid-cols-2`).<br>- Featured articles render in 2 columns.<br>- Article reader adds comfortable horizontal margins (`max-w-3xl mx-auto`). |
| **Desktop (≥1024px)** | - Category grid renders in 4 columns (`grid-cols-4`).<br>- Featured articles render in 2 columns (`grid-cols-2`).<br>- Article reader renders in a focused reading container (`max-w-4xl mx-auto`) with optional sticky table-of-contents or related-articles sidebar. |

### RTL Considerations

- [x] **Logical CSS Properties:** Exclusively use logical Tailwind properties: `ms-` / `me-` for margins, `ps-` / `pe-` for padding, `text-start` / `text-end` for text alignment, `border-s-` / `border-e-` for side borders, `start-` / `end-` for positioning.
- [x] **No Physical Direction Classes:** Strict ban on `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, `border-l-`, `border-r-`, `left-`, `right-`.
- [x] **Icon Rotation:** Directional navigation chevrons and back arrows flip in RTL via `rtl:rotate-180` (e.g., `<ChevronRight className="rtl:rotate-180" />`, `<ArrowLeft className="rtl:rotate-180" />`). Search, book, eye, and calendar icons do not flip.
- [x] **Bilingual Content Direction:**
  - Arabic article titles and bodies render with `dir="rtl"`.
  - English article titles and bodies render with `dir="ltr"`.
  - Metadata badges and breadcrumbs respect the active app shell direction.

### Accessibility (a11y)

- [x] **Keyboard Navigation:**
  - Full tab stop support for search input, category cards, filter chips, article rows, and attachments.
  - Category cards are native `<button>` elements with `Enter` / `Space` activation and visible focus rings.
- [x] **Screen Reader Labels:**
  - Icon-only buttons (search clear button, reorder/edit/delete actions, preview/download, close dialog) have explicit `aria-label`s.
- [x] **Color Contrast & Indicators:**
  - Text contrast meets WCAG AA (minimum 4.5:1 ratio against card backgrounds).
  - Draft and Published status badges combine distinct color tokens with clear localized text labels (never color alone).
- [x] **Focus Rings:** Visible focus ring (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`) on all interactive controls.

### Animation and Micro-Interactions

- [x] Featured cards feature subtle hover lift (`hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md`); category cards use border/shadow transitions.
- [x] Active category chip selection smoothly highlights border and background with `transition-colors`.
- [x] Loading skeleton cards shimmer with subtle opacity pulse.
- [x] Reduced-motion guards (`motion-reduce:transition-none`) on help transitions — deferred, no heavy animation in scope.

---

## Non-Functional Requirements

### Performance

- [x] **Debounced Search:** Hero search debounces keystrokes by 300 ms to avoid redundant API queries.
- [x] **Dynamic Lazy Loading:** Deferred — no `next/dynamic` splits in help scope; the editor uses zero heavy WYSIWYG dependencies so bundle impact is negligible.
- [x] **Optimized Pagination:** Articles list and search results use cursor pagination with a default page size of 15 items.
- [x] **Image Optimization:** Attachment tiles use fixed-height rounded containers with an on-demand preview modal (no remote-image optimization needed — blobs are tenant-authenticated).

### Security

- [x] **Sanitized Markup:** Strict DOMPurify sanitization on article HTML prevents stored XSS vulnerabilities.
- [x] **Permission UI Consistency:** Administrative actions ("New Article", "Edit", "Publish", "Delete", "Manage Categories") are hidden from users lacking `helpcenter.manage`.
- [x] **No Client-Side Authority:** Server enforces ABAC authorization on all endpoints; client handles 403 gracefully.
- [x] **External Auditor Block:** Auditing users without internal access cannot view help documentation or API endpoints (Rule HC-3).

---

## Out of Scope

- **Article Versioning & Revision History (V2):** Storing and diffing previous revisions of articles.
- **Article Rating & User Comments (V2):** Star ratings, "Was this helpful? Yes/No" feedback, and comment threads.
- **Hierarchical / Nested Sub-Categories:** Backend supports flat categories only; multi-level category trees are deferred.
- **Public / Unauthenticated Help Center:** External public knowledge base without logging in; Momentum Help Center is internal tenant-scoped only.
- **Interactive Walkthroughs & Guided Tours:** Belongs exclusively to the Onboarding module (Spec 019/021).
- **Email Notifications on Publication:** Dispatching automated emails when new articles are published.
- **Full Unified Search Indexing:** Help articles use their dedicated full-text search endpoint (`/v1/help-center/search`); integration into the global command palette (`/v1/search`) is deferred to global search enhancements.

---

## Open Questions

- [x] **Where should Help Center management (CMS) live?**
  - **Resolution:** Directly integrated within `/help`. Users with `helpcenter.manage` see administrative buttons ("New Article", "Manage Categories") in the `PageHeader`, draft filters on the list, and edit/publish controls on the article reader. Authoring is handled via `/help/new` and `/help/[publicId]/edit`. This keeps documentation and management unified without cluttering the `/admin` workspace.
- [x] **How should rich text be input by authors in the MVP?**
  - **Resolution:** A lightweight Markdown/HTML editor with a standard formatting toolbar (headings, bold, lists, quotes, code, link, image, tables) and a side-by-side / toggleable "Preview" tab sanitized with DOMPurify. This avoids heavy third-party WYSIWYG dependencies while producing clean, secure HTML up to 100,000 characters.
- [x] **How should article image attachments be embedded into the body?**
  - **Resolution:** Uploaded via the existing Document module (`DocumentEntityType::HelpArticle`). Uploaded attachments appear in an "Attachments" gallery below the editor with a "Copy markdown tag" button (e.g. `![diagram](preview_url)`), allowing authors to embed screenshots cleanly into the body while also listing them in the reader's attachments panel.
- [x] **Should reading an article increment the view count in local dev/tests?**
  - **Resolution:** The backend automatically increments `view_count` on `GET /v1/help-center/articles/{article}` when requested by users without `helpcenter.manage`. The frontend simply calls the endpoint and displays the returned `view_count`.
- [x] **Slugs or UUIDs in category URLs?**
  - **Resolution:** URLs use human-readable slugs (`?category={slug}`). The API's `category_id` filter expects a UUID, so the client resolves slugs via a `slugToIdMap` built from the cached categories list (UUIDs pass through untouched). Resolved at 011 delivery after the mismatch returned a PostgreSQL error.
- [x] **Slugs or UUIDs in article URLs?**
  - **Resolution:** Article links prefer `slug` with `public_id` fallback (`article.slug || article.public_id`). The backend `resolveRouteBinding` accepts both, so old UUID links keep working. Backend added `slug` to `HelpArticleSearchResultResource`; `openapi.json` was re-exported via Scramble and `lib/generated/api-types.ts` regenerated.
- [x] **How to avoid capability-store hydration mismatch?**
  - **Resolution:** The Zustand capability store is empty during SSR, which rendered `PermissionDenied` on the server and full content on the client. All three help page clients gate permission checks behind a client-only `hydrated` flag and render the matching skeleton until hydration, with all hooks kept above the conditional returns (Rules of Hooks).
- [x] **Why did all category cards show the same icon?**
  - **Resolution:** The keyword matcher ran against localized display names, which rarely contain the English keywords. Replaced with a slug-keyed `CATEGORY_ICONS` map (14 distinct icons) with keyword matching kept as fallback for custom categories.
- [x] **Why was the category manager dialog narrow with sideways scrolling?**
  - **Resolution:** The base `DialogContent` carries `sm:max-w-sm`, which beats any base-variant width override in the cascade — the override must use the same `sm:` variant (`sm:max-w-4xl`). Both scroll containers use `overflow-x-clip` so only vertical scrolling remains.
- [x] **Help content seeding?**
  - **Resolution:** 53 bilingual guides (EN + AR) across all 14 categories were rewritten from generic templates into UI-specific, friendly/practical articles referencing real routes, buttons, and components, then reseeded for all tenants.

---

→ **Next:** Spec completed and delivered. No further action.
