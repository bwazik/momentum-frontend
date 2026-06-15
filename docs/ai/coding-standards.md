# Coding Standards — Momentum Frontend

> Read when writing new code, refactoring, or unsure about structure.
> **MUST read before writing ANY implementation code.**

---

## General Principles

- Explicit over implicit; one component, one responsibility
- Smallest change that satisfies the spec
- Match patterns in the active feature area before inventing new ones
- Architecture rules in `architecture.md` are non-negotiable
- Colocate related code — keep hooks, types, and utilities near consumers
- Prefer composition over configuration — build from small pieces

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files (components) | kebab-case `.tsx` | `task-board.tsx`, `sla-badge.tsx` |
| Files (hooks) | kebab-case `use-*.ts` | `use-tasks.ts`, `use-auth.ts` |
| Files (utilities) | kebab-case `.ts` | `date-utils.ts`, `query-keys.ts` |
| Files (types) | kebab-case `.ts` | `task-types.ts` |
| Components | PascalCase | `TaskBoard`, `SlaBadge` |
| Hooks | camelCase with `use` | `useTasks`, `useAuth` |
| Variables | camelCase | `taskStatus`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `SLA_COLORS`, `DEFAULT_PAGE_SIZE` |
| Query keys | dot-namespaced arrays | `['tasks', 'list', { status }]` |
| Zustand stores | camelCase with `use...Store` | `useFilterStore`, `useSidebarStore` |
| CSS variables | kebab-case `--` prefix | `--color-primary`, `--radius-lg` |
| Route segments | kebab-case | `/task-board`, `/follow-up-center` |
| URL params | camelCase | `publicId`, `blueprintId` |
| Translation keys | dot-namespaced snake_case | `task_board.columns.sla_health` |
| Enum-like objects | PascalCase keys | `TaskStatus.Active`, `SlaHealth.AtRisk` |

---

## File Organization

### Feature-Based Structure

Organize code by feature domain, not by file type:

```
components/
├── ui/                     # shadcn/ui primitives (managed by CLI)
│   ├── button.tsx
│   ├── badge.tsx
│   └── ...
├── domain/                 # Business domain components
│   ├── tasks/
│   │   ├── task-board.tsx
│   │   ├── task-card.tsx
│   │   ├── task-filters.tsx
│   │   └── sla-badge.tsx
│   ├── blueprints/
│   │   ├── blueprint-builder.tsx
│   │   └── stage-node.tsx
│   └── follow-up/
│       ├── follow-up-board.tsx
│       └── action-log.tsx
└── shared/                 # Cross-domain reusable
    ├── data-table.tsx
    ├── page-header.tsx
    ├── empty-state.tsx
    └── skeleton-card.tsx
```

### Route Structure

```
app/
├── [locale]/               # ar | en
│   ├── (auth)/             # Unauthenticated layouts
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/        # Authenticated shell
│   │   ├── layout.tsx      # Sidebar + topbar
│   │   ├── page.tsx        # Executive dashboard
│   │   ├── tasks/
│   │   │   ├── page.tsx    # Task board
│   │   │   └── [publicId]/
│   │   │       └── page.tsx # Task details
│   │   ├── blueprints/
│   │   ├── follow-up/
│   │   ├── analytics/
│   │   ├── organization/
│   │   └── admin/
│   └── layout.tsx          # Root locale layout (dir, lang, fonts)
├── layout.tsx              # Root layout
└── not-found.tsx
```

### Hooks & Lib Structure

```
lib/
├── api/
│   ├── client.ts           # Fetch wrapper (credentials, headers, error handling)
│   ├── query-keys.ts       # Centralized query key factory
│   └── hooks/
│       ├── use-tasks.ts    # Task query/mutation hooks
│       ├── use-blueprints.ts
│       ├── use-auth.ts
│       └── use-notifications.ts
├── generated/
│   └── api-types.ts        # OpenAPI → TypeScript (auto-generated, never edit)
├── stores/
│   ├── use-filter-store.ts
│   ├── use-sidebar-store.ts
│   └── use-locale-store.ts
└── utils/
    ├── date-utils.ts       # Hijri conversion, relative time
    ├── sla-utils.ts        # SLA health color/label mapping
    └── cn.ts               # Tailwind class merging utility
```

---

## Component Architecture

### Server vs Client Components

Next.js App Router renders Server Components by default. Use this decision tree:

```
Does the component...
├── Need useState, useEffect, event handlers? → 'use client'
├── Need browser APIs (window, localStorage)? → 'use client'
├── Need TanStack Query hooks?                → 'use client'
├── Need Zustand store?                       → 'use client'
├── Need React context consumers?             → 'use client'
└── Only render data passed as props?         → Server Component (default)
```

**Rules:**

```tsx
// ✅ Correct — Server Component (default, no directive needed)
// app/[locale]/(dashboard)/tasks/page.tsx
export default function TasksPage() {
  return (
    <PageHeader title="task_board.title" />
    <TaskBoard />  {/* Client component handles interactivity */}
  );
}

// ✅ Correct — Client Component (needs interactivity)
// components/domain/tasks/task-board.tsx
'use client';

import { useTasks } from '@/lib/api/hooks/use-tasks';

export function TaskBoard() {
  const { data, isLoading } = useTasks();
  // ...
}

// ❌ Wrong — 'use client' on a page that doesn't need it
'use client';  // Don't add this unless the page itself needs interactivity
export default function TasksPage() { ... }
```

### Component Size Limits

- **Max ~200 lines per component file** — split if larger
- Extract sub-components into the same directory
- Extract hooks into `lib/api/hooks/` or colocated `use-*.ts` files
- Extract types into colocated `*-types.ts` or `lib/generated/`

### Props & Types

```tsx
// ✅ Correct — explicit interface, exported for reuse
interface TaskCardProps {
  task: Task;
  onSelect?: (publicId: string) => void;
  variant?: 'compact' | 'detailed';
}

export function TaskCard({ task, onSelect, variant = 'compact' }: TaskCardProps) {
  // ...
}

// ❌ Wrong — inline object type, no export
export function TaskCard({ task, onSelect }: { task: any; onSelect: Function }) {
  // ...
}
```

**Never use `any`.** Use generated types from `lib/generated/api-types.ts` or define explicit interfaces.

---

## Data Fetching Patterns

### TanStack Query — Server State

All API data fetching uses TanStack Query. Never use `useEffect` + `fetch` for API calls.

#### Query Key Factory

Centralize all query keys in a single factory to prevent typos and enable targeted invalidation:

```ts
// lib/api/query-keys.ts
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: TaskFilters) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (publicId: string) => [...queryKeys.tasks.details(), publicId] as const,
  },
  blueprints: {
    all: ['blueprints'] as const,
    lists: () => [...queryKeys.blueprints.all, 'list'] as const,
    list: (filters?: BlueprintFilters) => [...queryKeys.blueprints.lists(), filters] as const,
    detail: (publicId: string) => [...queryKeys.blueprints.all, 'detail', publicId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filter?: string) => [...queryKeys.notifications.all, 'list', filter] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
    capabilities: ['auth', 'capabilities'] as const,
  },
} as const;
```

#### Query Hook Pattern

```ts
// lib/api/hooks/use-tasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import { apiClient } from '../client';
import type { Task, TaskFilters, CreateTaskRequest } from '@/lib/generated/api-types';

/** Fetch paginated task list with filters */
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => apiClient.get<TaskListResponse>('/v1/tasks', {
      params: filters,
    }),
    // Cursor-paginated data may use useInfiniteQuery instead — see below
  });
}

/** Fetch single task by publicId */
export function useTask(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(publicId),
    queryFn: () => apiClient.get<Task>(`/v1/tasks/${publicId}`),
    enabled: !!publicId,
  });
}

/** Create a new draft task */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      apiClient.post<Task>('/v1/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
}
```

#### Cursor Pagination with useInfiniteQuery

The backend uses cursor pagination (`{data, next_cursor, has_more}`). Use `useInfiniteQuery` for paginated lists:

```ts
// lib/api/hooks/use-tasks.ts
import { useInfiniteQuery } from '@tanstack/react-query';

export function useTasksInfinite(filters: TaskFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPaginatedResponse<Task>>('/v1/tasks', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}
```

#### What NOT To Do

```tsx
// ❌ Wrong — manual fetch in useEffect
useEffect(() => {
  fetch('https://api.momentum.test/v1/tasks')
    .then(res => res.json())
    .then(setTasks);
}, []);

// ❌ Wrong — hardcoded query key string
useQuery({ queryKey: ['tasks-list'], ... });

// ❌ Wrong — mutation without invalidation
useMutation({
  mutationFn: createTask,
  // Missing onSuccess invalidation — stale list!
});

// ❌ Wrong — fetching in a Server Component when data needs client interactivity
// Server Components cannot use TanStack Query hooks
export default async function TasksPage() {
  const tasks = await fetch('https://api.momentum.test/v1/tasks'); // Can't interact with this data
  return <TaskBoard tasks={tasks} />;
}
```

---

## API Client

### Fetch Wrapper

A single fetch wrapper handles auth cookies, tenant header, error parsing, and typed responses:

```ts
// lib/api/client.ts
import type { ApiError } from '@/lib/generated/api-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test';

interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = new URL(path, BASE_URL);

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method,
    credentials: 'include',  // Sanctum cookies
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new ApiRequestError(response.status, error);
  }

  // 204 No Content (delete responses)
  if (response.status === 204) return undefined as T;

  return response.json();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError,
  ) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
}
```

### CSRF Cookie

Before login, fetch the CSRF cookie:

```ts
// lib/api/hooks/use-auth.ts
async function getCsrfCookie(): Promise<void> {
  await fetch('https://api.momentum.test/sanctum/csrf-cookie', { credentials: 'include' });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      await getCsrfCookie();
      return apiClient.post<AuthResponse>('/v1/iam/auth/login', credentials);
    },
  });
}
```

---

## State Management

### Decision Tree

```
Where does this data live?

├── Comes from API?           → TanStack Query (server state)
├── URL filter/sort params?   → URL search params (useSearchParams)
├── Form input values?        → React Hook Form (local form state)
├── UI toggle (sidebar open)? → Zustand (client-only global state)
├── Single-component toggle?  → useState (local component state)
└── Shared across pages?      → Zustand (persisted if needed)
```

### Zustand Store Pattern

```ts
// lib/stores/use-filter-store.ts
import { create } from 'zustand';

interface FilterState {
  status: string | null;
  department: string | null;
  priority: string | null;
  setFilter: (key: keyof Omit<FilterState, 'setFilter' | 'resetFilters'>, value: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  status: null,
  department: null,
  priority: null,
  setFilter: (key, value) => set({ [key]: value }),
  resetFilters: () => set({ status: null, department: null, priority: null }),
}));
```

### URL State for Filters

For shareable/bookmarkable filter state, prefer URL search params:

```tsx
// ✅ Correct — filters in URL (shareable, back-button works)
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function TaskFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = searchParams.get('status');

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <FilterChip
      active={status === 'overdue'}
      onClick={() => setFilter('status', status === 'overdue' ? null : 'overdue')}
    >
      Overdue
    </FilterChip>
  );
}
```

### What NOT To Do

```tsx
// ❌ Wrong — API data in Zustand (duplicates TanStack Query cache)
const useTaskStore = create((set) => ({
  tasks: [],
  fetchTasks: async () => {
    const res = await fetch('https://api.momentum.test/v1/tasks');
    set({ tasks: await res.json() });
  },
}));

// ❌ Wrong — using React context for frequently changing global state
const FilterContext = createContext(null);  // Use Zustand instead

// ❌ Wrong — prop drilling through 4+ levels
<Page filters={filters}>
  <Section filters={filters}>
    <Table filters={filters}>
      <Row filters={filters} />  // Use Zustand or URL state
    </Table>
  </Section>
</Page>
```

---

## Form Handling

### React Hook Form + Zod + shadcn Form

All forms use React Hook Form with Zod validation and shadcn Form components:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const createTaskSchema = z.object({
  title_ar: z.string().min(1, 'required').max(255),
  title_en: z.string().max(255).optional(),
  description_ar: z.string().min(1, 'required'),
  blueprint_public_id: z.string().uuid(),
  priority_public_id: z.string().uuid(),
});

type CreateTaskValues = z.infer<typeof createTaskSchema>;

export function CreateTaskForm() {
  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title_ar: '',
      title_en: '',
      description_ar: '',
    },
  });

  const createTask = useCreateTask();

  function onSubmit(values: CreateTaskValues) {
    createTask.mutate(values, {
      onSuccess: () => {
        form.reset();
        // Navigate or show toast
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العنوان بالعربية *</FormLabel>
              <FormControl>
                <Input {...field} dir="rtl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createTask.isPending}>
          {createTask.isPending ? <Spinner /> : 'إنشاء مهمة'}
        </Button>
      </form>
    </Form>
  );
}
```

### Bilingual Form Fields

Arabic is required; English is optional. Use a consistent pattern:

```tsx
// ✅ Correct — Arabic required, English optional
<FormField name="title_ar" render={...}>
  <FormLabel>العنوان *</FormLabel>
</FormField>
<FormField name="title_en" render={...}>
  <FormLabel>Title (English, optional)</FormLabel>
</FormField>
```

---

## Error Handling & Loading States

### Error Boundary

Wrap route segments with error boundaries:

```tsx
// app/[locale]/(dashboard)/tasks/error.tsx
'use client';

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="حدث خطأ"
      description={error.message}
      action={<Button onClick={reset}>إعادة المحاولة</Button>}
    />
  );
}
```

### API Error Handling

Handle specific HTTP status codes in query hooks:

```tsx
// ✅ Correct — handle error states
export function TaskBoard() {
  const { data, isLoading, isError, error } = useTasks(filters);

  if (isLoading) return <TaskBoardSkeleton />;
  if (isError) {
    if (error instanceof ApiRequestError && error.status === 403) {
      return <NoPermission capability="task.view" />;
    }
    return <ErrorState message={error.message} />;
  }
  if (!data?.data.length) return <EmptyState type="tasks" />;

  return <DataTable data={data.data} columns={taskColumns} />;
}
```

### Loading States — Required Pattern

Every data-fetching component MUST implement all four states:

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | Skeleton | Match layout shape of real content |
| Error | Error boundary or inline | Show message + retry button |
| Empty | EmptyState | Icon + headline + CTA |
| Success | Real content | Data rendered |

```tsx
// ✅ Correct — all 4 states handled
function TaskBoard() {
  const { data, isLoading, isError } = useTasks(filters);

  if (isLoading) return <TaskBoardSkeleton />;
  if (isError) return <ErrorState />;
  if (!data?.data.length) return <EmptyState type="tasks" />;
  return <DataTable data={data.data} columns={columns} />;
}

// ❌ Wrong — missing loading and empty states
function TaskBoard() {
  const { data } = useTasks(filters);
  return <DataTable data={data?.data ?? []} columns={columns} />;
}
```

### Skeleton Pattern

Use skeleton loaders that match the shape of the real content:

```tsx
// ✅ Correct — skeleton matches real layout
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-3" />
      <div className="h-8 w-16 bg-muted rounded" />
    </div>
  );
}
```

### Toast Notifications

Use shadcn toast for mutation feedback:

```tsx
import { toast } from 'sonner';

const createTask = useCreateTask();

createTask.mutate(values, {
  onSuccess: () => toast.success('تم إنشاء المهمة بنجاح'),
  onError: (error) => toast.error(error.message),
});
```

---

## i18n & RTL

### Translation Key Conventions

```ts
// Namespace by feature, use snake_case
{
  "task_board": {
    "title": "لوحة المهام",
    "columns": {
      "task_title": "المهمة",
      "sla_health": "حالة SLA",
      "assignee": "المكلف"
    },
    "filters": {
      "all": "الكل",
      "overdue": "متأخرة"
    },
    "empty": {
      "title": "لا توجد مهام",
      "description": "لم يتم العثور على مهام تطابق معايير البحث"
    }
  }
}
```

### Logical Properties — Mandatory

**Never use physical direction properties.** Always use CSS logical properties via Tailwind:

```tsx
// ✅ Correct — logical properties (RTL-safe)
<div className="ms-4 me-2 ps-3 pe-1 text-start border-s-2">
  <ChevronRight className="rtl:rotate-180" />
</div>

// ❌ Wrong — physical properties (breaks RTL)
<div className="ml-4 mr-2 pl-3 pr-1 text-left border-l-2">
  <ChevronRight />  {/* Doesn't flip in RTL */}
</div>
```

| Physical (never) | Logical (always) |
|-------------------|-------------------|
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-*` / `right-*` | `start-*` / `end-*` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `border-l` / `border-r` | `border-s` / `border-e` |
| `rounded-l` / `rounded-r` | `rounded-s` / `rounded-e` |
| `float-left` / `float-right` | `float-start` / `float-end` |

### Icons That Must Flip

Directional icons must rotate 180° in RTL:

```tsx
// ✅ Correct — chevrons, arrows, and navigation icons flip
<ChevronRight className="rtl:rotate-180" />
<ArrowLeft className="rtl:rotate-180" />

// ❌ Wrong — direction icons without RTL flip
<ChevronRight />
```

Icons that should NOT flip: checkmarks, plus, minus, search, settings, user avatars.

### Hijri Date Display

API returns Gregorian. Display both formats in the UI:

```tsx
// lib/utils/date-utils.ts
export function formatDualDate(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  const gregorian = new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(date);

  // Hijri via Intl API (supported in modern browsers)
  const hijri = new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(date);

  return `${hijri} — ${gregorian}`;
}
```

---

## Performance

### Dynamic Imports

Heavy components that aren't needed on initial render should be lazy-loaded:

```tsx
import dynamic from 'next/dynamic';

// ✅ Correct — heavy chart library loaded on demand
const AnalyticsChart = dynamic(
  () => import('@/components/domain/analytics/analytics-chart'),
  { loading: () => <ChartSkeleton /> }
);

// ✅ Correct — blueprint builder only loaded on that route
const BlueprintCanvas = dynamic(
  () => import('@/components/domain/blueprints/blueprint-canvas'),
  { ssr: false }  // Canvas uses browser APIs
);
```

### Image Optimization

Always use `next/image` for images:

```tsx
import Image from 'next/image';

// ✅ Correct
<Image src={tenantLogo} alt={tenantName} width={120} height={40} />

// ❌ Wrong
<img src={tenantLogo} alt={tenantName} />
```

### Memoization Rules

- **Do NOT** `useMemo`/`useCallback` everything by default
- **Do** memoize expensive computations (sorting/filtering large lists)
- **Do** memoize callbacks passed to heavily re-rendering children (data tables)
- **Do** memoize objects used as TanStack Query `queryKey` dependencies

```tsx
// ✅ Correct — memoize expensive filter
const sortedTasks = useMemo(
  () => tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  [tasks]
);

// ❌ Wrong — unnecessary memoization
const label = useMemo(() => `Task ${id}`, [id]);  // String concat is cheap
```

---

## Type Safety

### Generated Types — Never Duplicate

API response types come from `lib/generated/api-types.ts`. **Never** create hand-written interfaces for API responses:

```ts
// ✅ Correct — import from generated types
import type { Task, Blueprint, SlaTimerInstance } from '@/lib/generated/api-types';

// ❌ Wrong — hand-written API response type
interface Task {
  public_id: string;
  title_ar: string;
  // ... duplicating what OpenAPI already defines
}
```

### Discriminated Unions for Status

Use discriminated unions for status-dependent rendering:

```ts
// ✅ Correct — type narrowing on status
type TaskStatus = 'draft' | 'active' | 'suspended' | 'completed' | 'cancelled';

function getStatusBadgeVariant(status: TaskStatus): BadgeVariant {
  const map: Record<TaskStatus, BadgeVariant> = {
    draft: 'secondary',
    active: 'default',
    suspended: 'outline',
    completed: 'success',
    cancelled: 'destructive',
  };
  return map[status];
}
```

### No `any`

```ts
// ❌ Forbidden
function processData(data: any) { ... }
const result: any = await fetch(...);

// ✅ Use `unknown` and narrow
function processData(data: unknown) {
  if (isTask(data)) { ... }
}
```

---

## SLA Status Colors — Semantic Mapping

SLA health colors are critical for the platform. Use the semantic token system consistently:

```ts
// lib/utils/sla-utils.ts
import type { SlaHealth } from '@/lib/generated/api-types';

export const SLA_CONFIG: Record<SlaHealth, {
  color: string;
  bg: string;
  dot: string;
  label_ar: string;
  label_en: string;
}> = {
  green: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    label_ar: 'في الموعد',
    label_en: 'On Track',
  },
  amber: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
    label_ar: 'قريب من الموعد',
    label_en: 'At Risk',
  },
  red: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    dot: 'bg-red-500',
    label_ar: 'متأخر',
    label_en: 'Overdue',
  },
  grey: {
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    dot: 'bg-slate-400',
    label_ar: 'معلق',
    label_en: 'Suspended',
  },
};
```

**Rule:** SLA status is NEVER color-only — always include a text label for accessibility.

---

## Permission-Gated UI

### Pattern: Hide or Disable Based on Capabilities

The server is the source of truth. The frontend uses capabilities from the current user's session to optimistically show/hide actions:

```tsx
// lib/api/hooks/use-capabilities.ts
export function useCapability(capability: string): boolean {
  const { data: user } = useCurrentUser();
  return user?.capabilities?.includes(capability) ?? false;
}

// Usage in component
export function TaskActions({ task }: { task: Task }) {
  const canManage = useCapability('task.manage');
  const canEscalate = useCapability('task.escalate');

  return (
    <div className="flex gap-2">
      {canManage && (
        <Button onClick={handleCancel} variant="destructive">
          إلغاء المهمة
        </Button>
      )}
      {canEscalate && (
        <Button onClick={handleEscalate}>تصعيد</Button>
      )}
    </div>
  );
}
```

**Rule:** Never trust client-side capability checks for security. The server returns 403 regardless. These checks are for UX only — hiding actions the user cannot perform.

---

## Cursor Pagination UI

### Pattern: Load More Button

```tsx
export function TaskList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasksInfinite(filters);

  const allTasks = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <>
      <DataTable data={allTasks} columns={columns} />
      {hasNextPage && (
        <Button
          variant="outline"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 w-full"
        >
          {isFetchingNextPage ? 'جاري التحميل...' : 'تحميل المزيد'}
        </Button>
      )}
    </>
  );
}
```

---

## Tailwind CSS v4 Conventions

### Theme Configuration

Use the `@theme` directive in CSS for design tokens:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-sidebar: #0f172a;
  --color-page-bg: #f1f5f9;
  --color-surface: #ffffff;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

### Dark Mode & Theming

- We use `next-themes` to manage Light/Dark/System preferences.
- Wrap the application in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` in `app/layout.tsx`.
- Use Tailwind's `dark:` variant for all inverted styles.
- Do not implement custom theme toggles using local state or `localStorage` directly.

### Class Merging

Always use the `cn()` utility for conditional classes:

```ts
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  'rounded-xl border p-4',
  isActive && 'border-primary bg-primary/5',
  isDisabled && 'opacity-50 cursor-not-allowed',
)} />
```

---

## Dependencies

- No new npm packages without team discussion
- Prefer shadcn/ui components over third-party UI libraries
- Prefer native browser APIs over utility libraries (e.g., `Intl.DateTimeFormat` over moment.js)
- Tree-shakeable imports only — no barrel imports from large packages

---

## Code Style

- **Formatter:** ESLint + Prettier (configured in `eslint.config.mjs`)
- **Linter:** `next lint` catches Next.js-specific issues
- Run before commit: `npm run lint && npm run typecheck`

---

## What To Avoid

- `any` type — use `unknown` and narrow
- `useEffect` for data fetching — use TanStack Query
- Hand-written API response interfaces — use generated types
- Physical direction properties (`ml-`, `mr-`, `text-left`) — use logical (`ms-`, `me-`, `text-start`)
- `localStorage` for auth tokens — Sanctum cookies only
- Business logic duplication (SLA calculation, ABAC decisions) — server is truth
- Hardcoded English-only strings in user-facing components
- `console.log` in committed code — use structured error handling
- God components >200 lines — split by responsibility
- Barrel `index.ts` re-exports in large directories — import directly
- `dangerouslySetInnerHTML` — never use without explicit security review
- Duplicating permission/capability logic — server returns 403
- Offset pagination — backend enforces cursor pagination (`next_cursor`).
- Infinite scroll on tables — use manual "Load More" for tables, but use infinite scroll for chronological feeds (Timeline, Action Log).
- Missing loading/empty/error states — all 4 states required
- Inline styles — use Tailwind classes
- `!important` in CSS — fix specificity instead

---

→ **Next:** [security-policy.md](security-policy.md)
