# Plan: Task Board

> **Spec:** `specs/003-task-board/spec.md`
> **Date:** 2026-06-19
> **Status:** `completed`
> **Target branch:** `feat/003-task-board`
> **Base branch:** `main`

---

## Open Questions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Which exact board filters are available? | Use `GET /v1/follow-up/board` with `status`, `stage_type_id`, `assignee_id`, `department_id`, `priority_id[]`, `blueprint_category_id`, `date_from`, `date_to`, `date_field`, `search`, `sort_by`, `sort_direction`, `per_page`. Omit `external_reference`. | Backend `FollowUpBoardService` returns board-ready rows with current stage, assignees, department, category, SLA health, and sorting. It explicitly rejects `external_reference` until external references exist. |
| Should "My Tasks" use an explicit backend filter? | Yes. Map URL `scope=mine` to `assignee_id={currentUser.public_id}` and default `status=active`. | Backend supports `assignee_id`; ABAC remains the visibility source of truth. |
| Should department/category dropdowns be shown? | Yes. Use `GET /v1/organization/departments?is_active=true`, `GET /v1/blueprints/categories`, and `GET /v1/blueprints/stage-types`. | These lookup endpoints exist and are stable. |
| Should completed/cancelled tasks be included by default? | No. URL-less board defaults to `status=active`. The `All` quick filter clears status and shows all backend-visible non-draft tasks. | Backend default includes all non-draft tasks, but this screen is an operational work queue. Completed/cancelled remain available via filters. |
| Does the board need a Create Task button? | No active create flow in this spec. Header may omit it or show disabled UI only if product asks. | Create/edit/launch/manual assignment needs a separate task creation spec. |

Residual issue: generated `BoardTaskResource.current_assignees` is currently typed as `string`, but backend `BoardTaskResource.php` returns an array of users. Implementation should prefer a backend OpenAPI schema fix and `npm run generate:api`; if not available, use `unknown` narrowing in a display adapter without `any`.

---

## Technical Approach

Build `/tasks` as a client-driven operational board inside the existing dashboard shell. Use `GET /v1/follow-up/board` for board rows, TanStack `useInfiniteQuery` for cursor pagination, URL search params for filters/sort/search, and shadcn primitives for table, mobile cards, filters, empty/error/loading states.

Key decisions:

- Use `/v1/follow-up/board`, not `/v1/tasks`, because `/v1/tasks` returns CRUD `TaskResource` rows without current stage, assignees, SLA health, department, or blueprint category.
- Use URL params for all board state: `status`, `scope`, `stageTypeId`, `assigneeId`, `departmentId`, `priorityId`, `blueprintCategoryId`, `dateFrom`, `dateTo`, `dateField`, `search`, `sortBy`, `sortDirection`.
- Use `status=active` as the effective default when no `status` or `scope` is present.
- Update `apiClient` param serialization to support array params like `priority_id[]`.
- Keep row-level lifecycle mutations out of scope. Navigation to future `/tasks/[publicId]` is the only row action.
- Use generated OpenAPI types from `lib/generated/api-types.ts`; normalize display-only values in adapters, not API DTOs.
- Use shadcn `ToggleGroup` for quick filters, `Field` + `InputGroup` for search, `Table` for desktop, `Card` for mobile, `Empty`/existing `EmptyState`, `Skeleton`, and `Badge`.
- `cursor-pointer` is handled globally in base components (`button.tsx`, `toggle.tsx`, `select.tsx`, `dropdown-menu.tsx`, `command.tsx`, `sidebar.tsx`) — no per-instance `cursor-pointer` overrides needed for these primitives. Only `TableRow` and `Card` rows keep explicit `cursor-pointer` since they're non-primitive elements.

---

## Component Tree

```text
app/(dashboard)/tasks/page.tsx                         Server
  TasksPage
    components/domain/tasks/task-board.tsx             Client
      TaskBoardHeader                                  Client
      TaskBoardFilters                                 Client
        QuickFilterToggleGroup                         Client
        SearchInput                                    Client
      TaskBoardContent                                 Client
        TaskBoardSkeleton                              Client
        ErrorState / NoPermission / EmptyState          Client
        TaskBoardTable                                 Client
          TaskBoardRow                                 Client
            TaskStatusBadge / PriorityBadge / SlaBadge Client
        TaskBoardMobileList                            Client
          TaskCard                                     Client
            TaskStatusBadge / PriorityBadge / SlaBadge Client
      LoadMoreButton                                   Client
```

Server components:

- `TasksPage` only reads translations and renders the board shell.

Client components:

- Anything using TanStack Query, URL search params, router navigation, event handlers, or local state.

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `D:\Projects\momentum\frontend\components\domain\tasks\task-board.tsx` | Main client board container and state orchestration. |
| `D:\Projects\momentum\frontend\components\domain\tasks\task-board-filters.tsx` | URL-driven quick filters, search, and dropdown filters. |
| `D:\Projects\momentum\frontend\components\domain\tasks\task-board-table.tsx` | Desktop/tablet shadcn table view. |
| `D:\Projects\momentum\frontend\components\domain\tasks\task-board-mobile-list.tsx` | Mobile card list. |
| `D:\Projects\momentum\frontend\components\domain\tasks\task-card.tsx` | Single mobile task card. |
| `D:\Projects\momentum\frontend\components\domain\tasks\task-board-skeleton.tsx` | Loading skeletons matching table/cards. |
| `D:\Projects\momentum\frontend\components\domain\tasks\task-badges.tsx` | `SlaBadge`, `TaskStatusBadge`, `PriorityBadge`, `ClassificationBadge`. |
| `D:\Projects\momentum\frontend\components\domain\tasks\task-board-types.ts` | Filter types, display helper types, generated-type aliases. |
| `D:\Projects\momentum\frontend\components\domain\tasks\task-board-utils.ts` | URL param parsing, API param mapping, locale label/date helpers. |
| `D:\Projects\momentum\frontend\lib\api\hooks\use-task-board.ts` | Board and lookup query hooks. |
| `D:\Projects\momentum\frontend\__tests__\components\domain\tasks\task-board.test.tsx` | Board loading/empty/success/filter tests. |
| `D:\Projects\momentum\frontend\__tests__\components\domain\tasks\task-badges.test.tsx` | Badge label/color tests. |

### Modified Files

| File | Change |
|------|--------|
| `D:\Projects\momentum\frontend\app\(dashboard)\tasks\page.tsx` | Replace placeholder with `TaskBoard`. |
| `D:\Projects\momentum\frontend\lib\api\client.ts` | Support array query params for `priority_id[]`; preserve existing headers/CSRF behavior. |
| `D:\Projects\momentum\frontend\lib\api\query-keys.ts` | Add `taskBoard`, `organization.departments`, `blueprints.categories`, `blueprints.stageTypes`, `tasks.priorities`. |
| `D:\Projects\momentum\frontend\lib\api\hooks\use-tasks.ts` | Keep CRUD hooks or add `useTaskPriorities`; do not use basic `/v1/tasks` for the board. |
| `D:\Projects\momentum\frontend\messages\ar.json` | Add `tasks.board.*` translations. |
| `D:\Projects\momentum\frontend\messages\en.json` | Add `tasks.board.*` translations. |
| `D:\Projects\momentum\frontend\__tests__\mocks\handlers.ts` | Add MSW handlers for `/v1/follow-up/board`, priorities, departments, categories, stage types. |

Optional backend coordination:

- Fix Scramble/OpenAPI schema for `BoardTaskResource.current_assignees` and `time_at_current_stage_seconds`, then run `npm run generate:api`.

---

## Implementation Notes

### 1. API Client And Query Keys

One-line summary: add array query param support and typed query keys for board, lookups, and task priorities.

Key decisions:

- `priority_id[]` must serialize as repeated query params. Current `apiClient` converts arrays to comma strings, which will not match backend `BoardRequest`.
- Query keys stay centralized in `lib/api/query-keys.ts`.
- No new auth/session logic.

Files:

- `D:\Projects\momentum\frontend\lib\api\client.ts`
- `D:\Projects\momentum\frontend\lib\api\query-keys.ts`

Query key snippet:

```ts
export const queryKeys = {
  // existing namespaces...
  taskBoard: {
    all: ['task-board'] as const,
    lists: () => [...queryKeys.taskBoard.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.taskBoard.lists(), filters] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.tasks.lists(), filters] as const,
    priorities: () => [...queryKeys.tasks.all, 'priorities'] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (publicId: string) => [...queryKeys.tasks.details(), publicId] as const,
  },
  organization: {
    all: ['organization'] as const,
    departments: (filters?: Record<string, unknown>) =>
      [...queryKeys.organization.all, 'departments', filters] as const,
  },
  blueprints: {
    all: ['blueprints'] as const,
    categories: () => [...queryKeys.blueprints.all, 'categories'] as const,
    stageTypes: () => [...queryKeys.blueprints.all, 'stage-types'] as const,
    lists: () => [...queryKeys.blueprints.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.blueprints.lists(), filters] as const,
    detail: (publicId: string) => [...queryKeys.blueprints.all, 'detail', publicId] as const,
  },
} as const;
```

Array param serialization snippet:

```ts
if (options?.params) {
  Object.entries(options.params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          url.searchParams.append(key, String(item));
        }
      });
      return;
    }

    url.searchParams.set(key, String(value));
  });
}
```

Test cases:

- Render -> calling board hook with two priorities sends two `priority_id[]` params.
- Render -> query keys use `queryKeys.taskBoard.list(filters)`, not hardcoded strings.

Rules:

- `coding-standards.md`: centralized query key factory, no hardcoded query keys, no `useEffect` fetch.
- `security-policy.md`: preserve credentials, `X-Tenant`, `X-Locale`, CSRF behavior.

### 2. Board Query Hooks

One-line summary: add board and lookup hooks using generated OpenAPI aliases and TanStack Query.

Key decisions:

- `useTaskBoardInfinite` uses `/v1/follow-up/board`.
- `useTaskPriorities`, `useBlueprintCategories`, and `useStageTypes` are bounded `useQuery`.
- `useDepartmentsInfinite` uses cursor pagination because the endpoint is cursor-paginated.
- No mutations in this spec.

File:

- `D:\Projects\momentum\frontend\lib\api\hooks\use-task-board.ts`

Hook snippet:

```ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components, operations } from '@/lib/generated/api-types';

type BoardTask = components['schemas']['BoardTaskResource'];
type Priority = components['schemas']['TaskPriorityResource'];
type Department = components['schemas']['DepartmentResource'];
type BlueprintCategory = components['schemas']['BlueprintCategoryResource'];
type StageType = components['schemas']['StageTypeResource'];
type BoardQuery = NonNullable<
  operations['followUpBoard.board']['parameters']['query']
>;

interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export function useTaskBoardInfinite(filters: BoardQuery) {
  return useInfiniteQuery({
    queryKey: queryKeys.taskBoard.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BoardTask>>('/v1/follow-up/board', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useTaskPriorities() {
  return useQuery({
    queryKey: queryKeys.tasks.priorities(),
    queryFn: () => apiClient.get<Priority[]>('/v1/tasks/priorities'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlueprintCategories() {
  return useQuery({
    queryKey: queryKeys.blueprints.categories(),
    queryFn: () => apiClient.get<BlueprintCategory[]>('/v1/blueprints/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStageTypes() {
  return useQuery({
    queryKey: queryKeys.blueprints.stageTypes(),
    queryFn: () => apiClient.get<StageType[]>('/v1/blueprints/stage-types'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartmentsInfinite() {
  return useInfiniteQuery({
    queryKey: queryKeys.organization.departments({ is_active: true }),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<Department>>('/v1/organization/departments', {
        params: { is_active: true, per_page: 100, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    staleTime: 5 * 60 * 1000,
  });
}
```

Test cases:

- Render -> `useTaskBoardInfinite({ status: 'active' })` returns board rows from MSW.
- Render -> lookup hooks fetch priorities/categories/departments without duplicating API data in Zustand.

Rules:

- `coding-standards.md`: generated types, cursor pagination with `useInfiniteQuery`, no API data in Zustand.

### 3. URL Filter Mapping

One-line summary: parse search params into frontend filter state and backend query params.

Key decisions:

- URL-less board maps to backend `status=active`.
- `quick=all` or no status with explicit `scope=all` clears `status`.
- `scope=mine` maps to `assignee_id=currentUser.public_id` and defaults status to active.
- Use `priorityId` in URL but `priority_id[]` in API params.
- Use camelCase URL params and backend snake_case API params.

Files:

- `D:\Projects\momentum\frontend\components\domain\tasks\task-board-types.ts`
- `D:\Projects\momentum\frontend\components\domain\tasks\task-board-utils.ts`

Snippet:

```ts
import type { operations } from '@/lib/generated/api-types';

export type BoardQuery = NonNullable<
  operations['followUpBoard.board']['parameters']['query']
> & { cursor?: string | null };

export interface TaskBoardUrlFilters {
  status?: 'active' | 'suspended' | 'overdue' | 'at_risk' | 'completed' | 'cancelled' | 'all';
  scope?: 'mine' | 'all';
  stageTypeId?: string;
  assigneeId?: string;
  departmentId?: string;
  priorityId?: string[];
  blueprintCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: 'created_at' | 'due_date' | 'completed_at';
  search?: string;
  sortBy?: 'priority' | 'due_date' | 'created_at' | 'time_at_stage' | 'department' | 'stage_type';
  sortDirection?: 'asc' | 'desc';
}

export function readBoardFilters(params: URLSearchParams): TaskBoardUrlFilters {
  return {
    status: (params.get('status') as TaskBoardUrlFilters['status']) ?? undefined,
    scope: (params.get('scope') as TaskBoardUrlFilters['scope']) ?? undefined,
    stageTypeId: params.get('stageTypeId') ?? undefined,
    assigneeId: params.get('assigneeId') ?? undefined,
    departmentId: params.get('departmentId') ?? undefined,
    priorityId: params.getAll('priorityId'),
    blueprintCategoryId: params.get('blueprintCategoryId') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    dateField: (params.get('dateField') as TaskBoardUrlFilters['dateField']) ?? undefined,
    search: params.get('search') ?? undefined,
    sortBy: (params.get('sortBy') as TaskBoardUrlFilters['sortBy']) ?? undefined,
    sortDirection: (params.get('sortDirection') as TaskBoardUrlFilters['sortDirection']) ?? undefined,
  };
}

export function toBoardQuery(
  filters: TaskBoardUrlFilters,
  currentUserPublicId?: string,
): BoardQuery {
  const status = filters.status === 'all'
    ? undefined
    : filters.status ?? 'active';

  return {
    status,
    stage_type_id: filters.stageTypeId,
    assignee_id: filters.scope === 'mine'
      ? currentUserPublicId
      : filters.assigneeId,
    department_id: filters.departmentId,
    'priority_id[]': filters.priorityId?.length ? filters.priorityId : undefined,
    blueprint_category_id: filters.blueprintCategoryId,
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    date_field: filters.dateField,
    search: filters.search,
    sort_by: filters.sortBy,
    sort_direction: filters.sortDirection,
    per_page: 15,
  };
}
```

Test cases:

- Render with empty URL -> backend query has `status: 'active'`.
- Render with `scope=mine` -> backend query has `assignee_id` equal to current user public id.

Rules:

- `architecture.md`: filter/sort state belongs in URL search params.
- `coding-standards.md`: URL params use camelCase, API params can use backend snake_case.

### 4. Page And Board Container

One-line summary: replace the placeholder `/tasks` page with a server page rendering a client board.

Key decisions:

- Server page uses `getTranslations` for page metadata/title context.
- Client component owns queries and URL interactions.
- All four states are handled before success rendering.

Files:

- `D:\Projects\momentum\frontend\app\(dashboard)\tasks\page.tsx`
- `D:\Projects\momentum\frontend\components\domain\tasks\task-board.tsx`

Page snippet:

```tsx
import { getTranslations } from 'next-intl/server';
import { TaskBoard } from '@/components/domain/tasks/task-board';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default async function TasksPage() {
  const t = await getTranslations('tasks.board');
  const nav = await getTranslations('nav');

  return (
    <main className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{nav('dashboard')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <TaskBoard />
    </main>
  );
}
```

Board snippet:

```tsx
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { ApiRequestError } from '@/lib/api/client';
import { useTaskBoardInfinite } from '@/lib/api/hooks/use-task-board';
import { readBoardFilters, toBoardQuery } from './task-board-utils';
import { TaskBoardFilters } from './task-board-filters';
import { TaskBoardSkeleton } from './task-board-skeleton';
import { TaskBoardTable } from './task-board-table';
import { TaskBoardMobileList } from './task-board-mobile-list';

export function TaskBoard() {
  const t = useTranslations('tasks.board');
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();

  const urlFilters = useMemo(
    () => readBoardFilters(searchParams),
    [searchParams],
  );
  const apiFilters = useMemo(
    () => toBoardQuery(urlFilters, user?.public_id),
    [urlFilters, user?.public_id],
  );

  const query = useTaskBoardInfinite(apiFilters);
  const allTasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => page.data) ?? []).filter((task) => {
      if (seen.has(task.public_id)) return false;
      seen.add(task.public_id);
      return true;
    });
  }, [query.data]);

  if (query.isLoading) return <TaskBoardSkeleton />;
  if (query.isError) {
    return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <TaskBoardFilters filters={urlFilters} />
      {tasks.length === 0 ? (
        <EmptyState
          title={t('empty_title')}
          description={t('empty_description')}
          action={<Button variant="outline">{t('reset_filters')}</Button>}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <TaskBoardTable tasks={tasks} />
          </div>
          <div className="md:hidden">
            <TaskBoardMobileList tasks={tasks} />
          </div>
          {query.hasNextPage && (
            <Button
              variant="outline"
              
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
```

Test cases:

- Render loading -> skeleton rows/cards are visible.
- Render success -> task title and load-more button appear when `has_more=true`.

Rules:

- `coding-standards.md`: all four states, `useInfiniteQuery`, no `useEffect` fetch.
- `design-system/04-layout-patterns.md`: list page layout and manual load-more pagination.

### 5. Filters

One-line summary: build URL-driven filter controls with shadcn Field, InputGroup, ToggleGroup, Select, and Sheet on mobile if needed.

Key decisions:

- Use `ToggleGroup` for quick filters per shadcn skill rules.
- Use `InputGroup` for search; do not position icons manually.
- `SelectItem` must be inside `SelectGroup`.
- Debounce search before writing to URL using manual `setTimeout`/`clearTimeout` in `useEffect`.
- No disabled placeholders for missing endpoints; current lookup endpoints exist.

File:

- `D:\Projects\momentum\frontend\components\domain\tasks\task-board-filters.tsx`

Snippet:

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { TaskBoardUrlFilters } from './task-board-utils';

interface TaskBoardFiltersProps {
  filters: TaskBoardUrlFilters;
}

export function TaskBoardFilters({ filters }: TaskBoardFiltersProps) {
  const t = useTranslations('tasks.board.filters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    router.replace(pathname);
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={filters.scope === 'mine' ? 'mine' : filters.status ?? 'active'}
          onValueChange={(value) => {
            if (!value) return;
            const params = new URLSearchParams(searchParams.toString());
            params.delete('scope');
            params.delete('status');
            if (value === 'mine') params.set('scope', 'mine');
            else if (value !== 'all') params.set('status', value);
            else params.set('status', 'all');
            router.replace(`${pathname}?${params.toString()}`);
          }}
        >
          <ToggleGroupItem value="active" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('active')}</ToggleGroupItem>
          <ToggleGroupItem value="mine" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('mine')}</ToggleGroupItem>
          <ToggleGroupItem value="overdue" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('overdue')}</ToggleGroupItem>
          <ToggleGroupItem value="at_risk" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('at_risk')}</ToggleGroupItem>
          <ToggleGroupItem value="suspended" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('suspended')}</ToggleGroupItem>
          <ToggleGroupItem value="all" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('all')}</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" onClick={resetFilters}>
          {t('reset')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel className="sr-only">{t('search')}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              defaultValue={filters.search ?? ''}
              placeholder={t('search_placeholder')}
              onChange={(event) => setParam('search', event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <div className="flex items-center gap-2">
          <Select
            value={filters.sortBy ?? 'time_at_stage'}
            onValueChange={(value) => setParam('sortBy', value)}
          >
            <SelectTrigger className="flex-1" aria-label={t('sort_by')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align={locale === 'ar' ? 'start' : 'end'}>
              <SelectGroup>
                <SelectItem" value="time_at_stage">{t('sort_time_at_stage')}</SelectItem>
                <SelectItem" value="priority">{t('sort_priority')}</SelectItem>
                <SelectItem" value="due_date">{t('sort_due_date')}</SelectItem>
                <SelectItem" value="created_at">{t('sort_created_at')}</SelectItem>
                <SelectItem" value="department">{t('sort_department')}</SelectItem>
                <SelectItem" value="stage_type">{t('sort_stage_type')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            aria-label={filters.sortDirection === 'asc' ? t('sort_asc') : t('sort_desc')}
            onClick={() => setParam('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

Implementation note: search uses manual `setTimeout`/`clearTimeout` in `useEffect` for 300ms debounce before URL replacement.

Test cases:

- User clicks Overdue -> URL contains `status=overdue`.
- User types search -> after debounce URL contains `search=<term>` and board query refetches.

Rules:

- `architecture.md`: filters in URL.
- shadcn skill: Field/InputGroup for search, ToggleGroup for option sets, SelectItem inside SelectGroup.
- `coding-standards.md`: no physical direction classes.

### 6. Table, Mobile Cards, And Badges

One-line summary: render desktop rows and mobile cards from the same `BoardTaskResource` display helpers.

Key decisions:

- Desktop uses semantic shadcn `Table` with 6 hybrid enterprise columns: SLA, Task (rich cell), Current Stage (with department subtext), Assignees, Time In Stage (with due date subtext), Actions (dropdown menu).
- Status, Priority, and Department are no longer standalone columns — Status and Priority are inline badges in the Task cell; Department appears as subtext under Current Stage.
- SLA column moves to position 1 (risk-first layout); Due Date moves to subtext under Time In Stage.
- Time In Stage column surfaces `time_at_current_stage_seconds` from the API (previously unused).
- Actions column uses shadcn `DropdownMenu` with Open Details + Copy Link.
- Rows have a `border-s-4` colored left accent based on status (blue=active, teal=completed, red=cancelled, slate=suspended).
- Mobile uses `Card` composition with `CardHeader` and `CardContent`, matching the same information hierarchy.
- Rows/cards navigate with `router.push('/tasks/${publicId}')`.
- Use `Badge` for statuses; SLA colors follow design-system semantic mapping even though shadcn skill prefers semantic tokens. This is explicitly allowed by project docs for SLA.
- Current generated type mismatch for `current_assignees` is normalized with `unknown` narrowing.

Files:

- `D:\Projects\momentum\frontend\components\domain\tasks\task-board-table.tsx`
- `D:\Projects\momentum\frontend\components\domain\tasks\task-board-mobile-list.tsx`
- `D:\Projects\momentum\frontend\components\domain\tasks\task-card.tsx`
- `D:\Projects\momentum\frontend\components\domain\tasks\task-badges.tsx`
- `D:\Projects\momentum\frontend\components\domain\tasks\task-board-utils.ts`

Assignee adapter snippet:

```ts
import type { components } from '@/lib/generated/api-types';

type BoardTask = components['schemas']['BoardTaskResource'];

interface AssigneeDisplay {
  public_id: string;
  name_ar?: string | null;
  name_en?: string | null;
  position_public_id?: string | null;
}

export function getCurrentAssignees(task: BoardTask): AssigneeDisplay[] {
  const raw = task.current_assignees as unknown;
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item): AssigneeDisplay[] => {
    if (!item || typeof item !== 'object') return [];
    const value = item as Record<string, unknown>;
    const publicId = value.public_id;
    if (typeof publicId !== 'string') return [];
    return [{
      public_id: publicId,
      name_ar: typeof value.name_ar === 'string' ? value.name_ar : null,
      name_en: typeof value.name_en === 'string' ? value.name_en : null,
      position_public_id: typeof value.position_public_id === 'string'
        ? value.position_public_id
        : null,
    }];
  });
}
```

Table snippet (hybrid enterprise layout):

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Ellipsis, ExternalLink, Copy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { components } from '@/lib/generated/api-types';
import { SlaBadge, TaskStatusBadge, PriorityBadge, ClassificationBadge } from './task-badges';
import { getCurrentAssignees, localizeName, formatTimeInStage, formatDueDate } from './task-board-utils';

type BoardTask = components['schemas']['BoardTaskResource'];

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-4 border-s-emerald-500 dark:border-s-emerald-400',
  amber: 'border-s-4 border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-4 border-s-red-500 dark:border-s-red-400',
  grey: 'border-s-4 border-s-slate-400 dark:border-s-slate-500',
} as const;

interface TaskBoardTableProps {
  tasks: BoardTask[];
}

export function TaskBoardTable({ tasks }: TaskBoardTableProps) {
  const router = useRouter();
  const locale = useLocale();

  return (
    <Table aria-label="Task board">
      <TableHeader>
        <TableRow>
          <TableHead className="w-28 text-start">{t('sla')}</TableHead>
          <TableHead className="text-start">{t('task')}</TableHead>
          <TableHead className="text-start">{t('stage')}</TableHead>
          <TableHead className="text-start">{t('assignees')}</TableHead>
          <TableHead className="w-32 text-start">{t('time_in_stage')}</TableHead>
          <TableHead className="w-12 text-end">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last-child]:border-b-0">
        {tasks.map((task) => (
          <TableRow
            key={task.public_id}
            tabIndex={0}
            className="cursor-pointer"
            onClick={() => router.push(`/tasks/${task.public_id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') router.push(`/tasks/${task.public_id}`);
            }}
          >
            <TableCell className={cn('text-start', SLA_BORDER[slaHealth])}><SlaBadge health={task.sla_health} /></TableCell>
            <TableCell className="text-start">
              <div className="flex flex-col gap-0.5">
                {task.public_id && (
                  <span className="text-xs text-muted-foreground">{task.public_id}</span>
                )}
                <span className="text-sm font-medium leading-tight">
                  {localizeName(locale, task.title_ar, task.title_en)}
                </span>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <ClassificationBadge level={task.classification_level} />
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
            </TableCell>
            <TableCell className="text-start align-top">
              {task.current_stage ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    {localizeName(locale, task.current_stage.name_ar, task.current_stage.name_en)}
                  </span>
                  {task.department && (
                    <span className="text-xs text-muted-foreground">
                      {localizeName(locale, task.department.name_ar, task.department.name_en)}
                    </span>
                  )}
                </div>
              ) : <span className="text-sm text-muted-foreground">-</span>}
            </TableCell>
            <TableCell className="text-start align-top">
              {assignees.length > 0 ? (
                <AvatarGroup>
                  {assignees.slice(0, 3).map((user) => {
                    const name = localizeName(locale, user.name_ar, user.name_en);
                    return (
                      <Tooltip key={user.public_id}>
                        <TooltipTrigger asChild>
                          <Avatar size="sm">
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="top">{name}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {assignees.length > 3 && (
                    <AvatarGroupCount>+{assignees.length - 3}</AvatarGroupCount>
                  )}
                </AvatarGroup>
              ) : <span className="text-sm text-muted-foreground">-</span>}
            </TableCell>
            <TableCell className="text-start align-top">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">{formatTimeInStage(task.time_at_current_stage_seconds)}</span>
                {task.due_date && (
                  <span className={cn('text-xs', formatDueDate(task.due_date).includes('overdue') && 'text-muted-foreground font-semibold')}>
                    {formatDueDate(task.due_date)}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-end align-top">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
                    <Ellipsis className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align={locale === 'ar' ? 'start' : 'end'} className="min-w-36">
                  <DropdownMenuItem className="whitespace-nowrap" onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.public_id}`); }}>
                    <ExternalLink className="me-2 size-4" /> {t('open_details')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="whitespace-nowrap" onClick={(e) => {
                    e.stopPropagation();
                    const url = `${window.location.origin}/tasks/${task.public_id}`;
                    if (navigator.clipboard) navigator.clipboard.writeText(url);
                    toast.success(t('link_copied'));
                  }}>
                    <Copy className="me-2 size-4" /> {t('copy_link')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

Badge snippet:

```tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SLA_STYLES = {
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  grey: 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400',
} as const;

export function SlaBadge({ health }: { health?: string | null }) {
  const value = health === 'amber' || health === 'red' || health === 'grey'
    ? health
    : 'green';

  return (
    <Badge
      variant="outline"
      role="status"
      className={cn('gap-1.5', SLA_STYLES[value])}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(value)}
    </Badge>
  );
}
```

Test cases:

- Render row -> title, stage, SLA text, and assignee names appear.
- Press Enter on focused row -> router navigates to `/tasks/{publicId}`.

Rules:

- `design-system/05-accessibility.md`: semantic table, color plus text for SLA.
- `coding-standards.md`: logical `text-start`/`text-end`, no physical direction classes.
- shadcn skill: use `Badge`, `Table`, full `Card` composition for mobile.

### 7. Skeleton, Empty, Error, No Permission

One-line summary: handle all required data states with reusable shared components and shadcn Skeleton.

Key decisions:

- Use existing `EmptyState` and `ErrorState`.
- Add a task-specific skeleton because shape must match table/card layout.
- A 403 from `ApiRequestError` should render no-permission content, not a generic retry loop.

File:

- `D:\Projects\momentum\frontend\components\domain\tasks\task-board-skeleton.tsx`
- `D:\Projects\momentum\frontend\components\domain\tasks\task-board.tsx`

Snippet:

```tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TaskBoardSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="task-board-skeleton">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24" />
        ))}
        <Skeleton className="h-9 w-16" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <div className="overflow-x-auto">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex gap-2 border-b p-2 last:border-b-0">
            <div className="flex w-28 items-start ps-1">
              <div className="border-s-4 border-s-zinc-300 ps-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full max-w-56" />
              <div className="flex gap-1.5">
                <Skeleton className="h-3 w-14 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
            <div className="flex w-36 flex-col gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex w-28 items-start">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex w-28 flex-col gap-1">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex w-16 items-start justify-end">
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl border-s-4 border-s-zinc-300 p-4">
            <div className="flex items-start justify-between gap-2 pb-2">
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
            </div>
            <div className="flex flex-col gap-1.5 border-t pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-32" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Test cases:

- API 500 -> `ErrorState` and Retry button appear.
- API 403 -> no-permission message appears and task data is not rendered.

Rules:

- `coding-standards.md`: loading, error, empty, success states are mandatory.
- shadcn skill: use `Skeleton`, not custom animated divs.

### 8. Translations

One-line summary: add `tasks.board` namespaces for all visible labels in Arabic and English.

Files:

- `D:\Projects\momentum\frontend\messages\ar.json`
- `D:\Projects\momentum\frontend\messages\en.json`

Required keys:

```json
{
  "tasks": {
    "board": {
      "title": "Tasks",
      "description": "Track active work, SLA risk, and current assignees.",
      "error": "Unable to load tasks.",
      "empty_title": "No tasks found",
      "empty_description": "Adjust filters or reset the board.",
      "load_more": "Load more",
      "loading_more": "Loading...",
      "reset_filters": "Reset filters",
      "no_permission_title": "No permission",
      "no_permission_description": "You do not have permission to view the task board.",
      "columns": {
        "task": "Task",
        "status": "Status",
        "priority": "Priority",
        "stage": "Stage",
        "assignees": "Assignees",
        "department": "Department",
        "sla": "SLA",
        "due_date": "Due Date",
        "time_in_stage": "Time In Stage",
        "actions": "Actions",
        "table_label": "Task board",
        "row_actions": "Row actions",
        "open_details": "Open Details",
        "copy_link": "Copy Link",
        "link_copied": "Link copied",
        "copy_failed": "Failed to copy link"
      },
      "sla": {
        "green": "On Track",
        "amber": "At Risk",
        "red": "Overdue",
        "grey": "Suspended"
      },
      "status": {
        "draft": "Draft",
        "active": "Active",
        "suspended": "Suspended",
        "completed": "Completed",
        "cancelled": "Cancelled"
      },
      "priority": {
        "unknown": "Unknown"
      },
      "classification": {
        "internal": "Internal",
        "confidential": "Confidential"
      },
      "filters": {
        "active": "Active",
        "mine": "My Tasks",
        "overdue": "Overdue",
        "at_risk": "At Risk",
        "suspended": "Suspended",
        "all": "All",
        "reset": "Reset",
        "search": "Search",
        "search_placeholder": "Search tasks...",
        "sort_by": "Sort by",
        "sort_time_at_stage": "Time at stage",
        "sort_priority": "Priority",
        "sort_due_date": "Due date",
        "sort_created_at": "Created date",
        "sort_department": "Department",
        "sort_stage_type": "Stage type"
      }
    }
  }
}
```

Test cases:

- Arabic locale -> Arabic labels render and document direction is RTL.
- English locale -> English labels render and document direction is LTR.

Rules:

- `coding-standards.md`: no hardcoded user-facing English strings.

---

## Data Flow

1. User opens `/tasks`.
2. `app/(dashboard)/layout.tsx` has already authenticated and hydrated current user per `001-core-shell`.
3. `TasksPage` renders `TaskBoard`.
4. `TaskBoard` reads URL search params.
5. `readBoardFilters()` returns URL filter state.
6. `toBoardQuery()` maps URL filters and current user public id into backend params.
7. `useTaskBoardInfinite()` calls `GET /v1/follow-up/board` through `apiClient`.
8. `apiClient` sends `credentials: include`, `X-Tenant`, `X-Locale`, and serialized query params.
9. Backend applies ABAC through `TaskVisibilityScope` and board filters in `FollowUpBoardService`.
10. Backend returns `{ data: BoardTaskResource[], next_cursor, has_more }`.
11. Component flattens pages and renders table/cards.
12. User changes filters -> URL changes -> query key changes -> board refetches.
13. User clicks Load More -> `fetchNextPage()` appends cursor page.
14. User clicks row/card -> Next router navigates to future `/tasks/[publicId]`.

---

## Route Structure

```text
app/
  (dashboard)/
    tasks/
      page.tsx              # /tasks, Server Component
```

Locale remains cookie-based through `NEXT_LOCALE`; no `[locale]` route segment is added.

Future route dependency:

```text
app/(dashboard)/tasks/[publicId]/page.tsx
```

This future route belongs to `004-task-details`; row navigation may point to it before details are implemented.

---

## Execution Order

1. Update `lib/api/client.ts` to serialize array query params.
2. Extend `lib/api/query-keys.ts` with board and lookup keys.
3. Add `components/domain/tasks/task-board-types.ts` and `task-board-utils.ts`.
4. Add `lib/api/hooks/use-task-board.ts`.
5. Add badge components in `components/domain/tasks/task-badges.tsx`.
6. Add skeleton component in `components/domain/tasks/task-board-skeleton.tsx`.
7. Add table and mobile card components.
8. Add `task-board-filters.tsx` with URL-driven filters.
9. Add main `task-board.tsx` container.
10. Replace placeholder `app/(dashboard)/tasks/page.tsx`.
11. Add translations to `messages/ar.json` and `messages/en.json`.
12. Add MSW handlers for board and lookups.
13. Add component tests for board states, filters, pagination, badges, and navigation.
14. Run `npm run lint`, `npm run typecheck`, and `npm run test`.

---

## What to Test Manually

1. Arabic happy path: open `/tasks` with no params, verify active tasks load, RTL layout is correct, and SLA badges show Arabic text.
2. English happy path: switch locale to English, open `/tasks`, verify LTR layout and English labels.
3. Default filter: open `/tasks` with no params and verify backend request includes `status=active`.
4. All filter: choose All and verify status is cleared and completed/cancelled rows can appear if backend returns them.
5. My Tasks: choose My Tasks and verify request includes `assignee_id` matching the current user public id.
6. Overdue and At Risk: choose quick filters and verify requests use `status=overdue` and `status=at_risk`.
7. Dropdown filters: filter by priority, department, stage type, and blueprint category.
8. Search: type a task title, wait 300ms, verify URL and results update.
9. Pagination: use Load More and verify existing rows remain while new rows append.
10. Empty state: choose filters with no matches and verify empty state plus reset action.
11. Error state: simulate API failure and verify retry works.
12. Permission state: simulate 403 and verify no task data is displayed.
13. Responsive: verify desktop table, tablet reduced layout, and mobile cards.
14. Keyboard: Tab to filters, rows/cards, action menu, and Load More; press Enter on a focused row/card.
15. Accessibility: verify visible focus rings, semantic table headers, icon-only labels, and color plus text SLA status.

