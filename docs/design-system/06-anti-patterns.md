# 06 — Anti-Patterns

> What NOT to do. Check this list before submitting a PR.
> Violations caught in code review must be fixed before merge.

---

## Color Anti-Patterns

### ❌ Hardcoded hex colors instead of tokens

```tsx
// ❌ Wrong — hardcoded hex
<div className="bg-[#10b981] text-[#ffffff]">Success</div>
<div style={{ color: '#ef4444' }}>Error</div>

// ✅ Correct — use token-based classes
<div className="bg-primary text-primary-foreground">Success</div>
<div className="text-danger">Error</div>
```

### ❌ Color-only status indicators

```tsx
// ❌ Wrong — only color, no text
<span className="h-3 w-3 rounded-full bg-red-500" />

// ✅ Correct — color + text label
<Badge className="bg-red-50 text-red-600 gap-1.5">
  <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
  متأخر
</Badge>
```

### ❌ Wrong SLA colors

```tsx
// ❌ Wrong — inconsistent SLA mapping
<Badge className="bg-green-500">On Track</Badge>      // Should be emerald, not green
<Badge className="bg-yellow-500">At Risk</Badge>       // Should be amber, not yellow
<Badge className="bg-orange-500">Overdue</Badge>       // Should be red, not orange

// ✅ Correct — use SLA_CONFIG from sla-utils.ts
<SlaBadge health="green" />
```

### ❌ Arbitrary opacity values

```tsx
// ❌ Wrong — random opacity
<div className="bg-white/37">Card</div>

// ✅ Correct — use design token opacity values
<div className="bg-white/72">Glass card</div>    // From 02-glassmorphism.md
<div className="bg-emerald-600/20">Active nav</div>  // From 01-tokens.md
```

---

## Layout Anti-Patterns

### ❌ Physical direction properties

```tsx
// ❌ Wrong — breaks RTL
<div className="ml-4 mr-2 pl-3 text-left border-l-2 rounded-l-lg float-left">
  Content
</div>

// ✅ Correct — logical properties
<div className="ms-4 me-2 ps-3 text-start border-s-2 rounded-s-lg float-start">
  Content
</div>
```

### ❌ Fixed widths that break responsiveness

```tsx
// ❌ Wrong — breaks on small screens
<div className="w-[800px]">Table container</div>

// ✅ Correct — responsive
<div className="w-full max-w-4xl">Table container</div>
```

### ❌ Missing responsive breakpoints

```tsx
// ❌ Wrong — 5-column grid on all screens
<div className="grid grid-cols-5 gap-4">

// ✅ Correct — responsive grid
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
```

### ❌ Inline styles for layout

```tsx
// ❌ Wrong — inline styles
<div style={{ marginLeft: '16px', padding: '24px' }}>

// ✅ Correct — Tailwind classes
<div className="ms-4 p-6">
```

### ❌ Missing page padding

```tsx
// ❌ Wrong — content touching edges
<main>{children}</main>

// ✅ Correct — standard page padding
<main className="p-6">{children}</main>
```

---

## Component Anti-Patterns

### ❌ Reinventing shadcn components

```tsx
// ❌ Wrong — custom button from scratch
<button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">
  Create Task
</button>

// ✅ Correct — use shadcn Button
import { Button } from '@/components/ui/button';
<Button>Create Task</Button>
```

### ❌ Hand-editing shadcn ui/ files

```
// ❌ Wrong — modifying generated files
components/ui/button.tsx  ← Never edit directly

// ✅ Correct — customize via CSS variables or wrapper components
// Modify theme variables in globals.css
// Or create domain wrapper: components/domain/tasks/task-action-button.tsx
```

### ❌ Domain imports in shared components

```tsx
// ❌ Wrong — shared component imports domain type
// components/shared/data-table.tsx
import type { Task } from '@/lib/generated/api-types';  // Domain-specific!

// ✅ Correct — generic with generics
// components/shared/data-table.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
}
```

### ❌ Cross-domain component imports

```tsx
// ❌ Wrong — task component importing from blueprints
// components/domain/tasks/task-card.tsx
import { StageNode } from '@/components/domain/blueprints/stage-node';

// ✅ Correct — extract to shared if needed
import { StageIndicator } from '@/components/shared/stage-indicator';
```

### ❌ God components (>200 lines)

```tsx
// ❌ Wrong — everything in one file
export function TaskBoard() {
  // 350 lines of filters, table, pagination, modals, forms...
}

// ✅ Correct — split by responsibility
export function TaskBoard() {
  return (
    <>
      <TaskFilters />
      <TaskTable />
      <TaskPagination />
    </>
  );
}
```

---

## Typography Anti-Patterns

### ❌ Arbitrary font sizes

```tsx
// ❌ Wrong — arbitrary size
<p className="text-[13px]">Custom size</p>
<h2 className="text-[22px]">Heading</h2>

// ✅ Correct — use scale from tokens
<p className="text-sm">Body text (14px)</p>
<h2 className="text-xl">Heading (20px)</h2>
```

### ❌ Wrong font weight

```tsx
// ❌ Wrong — generic bold
<span className="font-bold">Label text</span>    // Too heavy for labels

// ✅ Correct — semibold for headings, medium for labels
<span className="font-medium">Label text</span>
<h2 className="font-semibold">Page title</h2>
```

### ❌ Missing uppercase-tracking on table headers

```tsx
// ❌ Wrong — normal case table header
<th className="text-sm text-slate-500">Task</th>

// ✅ Correct — uppercase tracking pattern
<th className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
  المهمة
</th>
```

---

## RTL Anti-Patterns

### ❌ Directional icons that don't flip

```tsx
// ❌ Wrong — chevron doesn't flip in RTL
<ChevronRight className="w-4 h-4" />
<ArrowLeft className="w-4 h-4" />

// ✅ Correct — flip directional icons
<ChevronRight className="w-4 h-4 rtl:rotate-180" />
<ArrowLeft className="w-4 h-4 rtl:rotate-180" />
```

### ❌ Hardcoded text alignment

```tsx
// ❌ Wrong — assumes LTR
<td className="text-right">123</td>

// ✅ Correct — logical alignment
<td className="text-end">123</td>
```

### ❌ English-only strings in user-facing code

```tsx
// ❌ Wrong — hardcoded English
<Button>Create Task</Button>
<p>No tasks found</p>
<Label>Task Title</Label>

// ✅ Correct — use translation keys
<Button>{t('task_board.create')}</Button>
<p>{t('task_board.empty.title')}</p>
<Label>{t('task_form.title')}</Label>
```

---

## Data Fetching Anti-Patterns

### ❌ useEffect + fetch

```tsx
// ❌ Wrong — manual fetch
const [tasks, setTasks] = useState([]);
useEffect(() => {
  fetch('/api/v1/tasks').then(r => r.json()).then(setTasks);
}, []);

// ✅ Correct — TanStack Query
const { data: tasks } = useTasks(filters);
```

### ❌ Hardcoded query keys

```tsx
// ❌ Wrong — string literal
useQuery({ queryKey: ['tasks-list'], ... });

// ✅ Correct — factory function
useQuery({ queryKey: queryKeys.tasks.list(filters), ... });
```

### ❌ API data in Zustand

```tsx
// ❌ Wrong — duplicating server state
const useTaskStore = create((set) => ({
  tasks: [],
  fetchTasks: async () => { ... },
}));

// ✅ Correct — TanStack Query owns server state
const { data } = useTasks(filters);
```

### ❌ Hand-written API types

```tsx
// ❌ Wrong — duplicating OpenAPI definitions
interface Task {
  public_id: string;
  title_ar: string;
  // ...
}

// ✅ Correct — import from generated types
import type { Task } from '@/lib/generated/api-types';
```

### ❌ Missing mutation invalidation

```tsx
// ❌ Wrong — stale data after mutation
useMutation({
  mutationFn: createTask,
  // No onSuccess → list stays stale!
});

// ✅ Correct — invalidate related queries
useMutation({
  mutationFn: createTask,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
  },
});
```

---

## State Anti-Patterns

### ❌ Missing states (loading/empty/error)

```tsx
// ❌ Wrong — only handles success
function TaskBoard() {
  const { data } = useTasks();
  return <DataTable data={data?.data ?? []} />;
}

// ✅ Correct — all 4 states
function TaskBoard() {
  const { data, isLoading, isError } = useTasks();
  if (isLoading) return <TaskBoardSkeleton />;
  if (isError) return <ErrorState />;
  if (!data?.data.length) return <EmptyState type="tasks" />;
  return <DataTable data={data.data} />;
}
```

### ❌ `console.log` in committed code

```tsx
// ❌ Wrong — debug logging in production
console.log('tasks:', data);
console.log('user:', currentUser);

// ✅ Correct — remove all console.log before commit
// Use error boundaries and structured error handling instead
```

---

## Performance Anti-Patterns

### ❌ Heavy animations on scrolling elements

```tsx
// ❌ Wrong — glass on every table row
{tasks.map(task => (
  <tr className="backdrop-blur-md bg-white/72">  {/* GPU layer per row! */}

// ✅ Correct — glass on container only
<div className="backdrop-blur-md bg-white/72 rounded-xl">
  <table>{/* solid rows */}</table>
</div>
```

### ❌ Animating expensive properties

```css
/* ❌ Wrong — causes layout recalculation */
.card:hover { width: 110%; height: 110%; top: -5px; }

/* ✅ Correct — GPU-composited properties */
.card:hover { transform: scale(1.02) translateY(-2px); }
```

### ❌ Missing dynamic imports for heavy components

```tsx
// ❌ Wrong — chart library in main bundle
import { BarChart } from 'recharts';

// ✅ Correct — lazy load
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), {
  loading: () => <ChartSkeleton />,
});
```

---

## Security Anti-Patterns

### ❌ localStorage for auth

```tsx
// ❌ Wrong
localStorage.setItem('token', response.token);

// ✅ Correct — Sanctum cookies (automatic)
fetch('/api/v1/tasks', { credentials: 'include' });
```

### ❌ dangerouslySetInnerHTML without sanitization

```tsx
// ❌ Wrong — XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Correct — sanitize if absolutely needed
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

### ❌ Trusting client-side permission checks

```tsx
// ❌ Wrong — blocking access client-side
if (!hasCapability) throw new Error('Forbidden');

// ✅ Correct — hide UI, but server enforces
{hasCapability && <Button onClick={action}>Execute</Button>}
// Server returns 403 if user lacks capability regardless
```
