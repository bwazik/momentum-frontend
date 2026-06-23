# Security Policy — Momentum Frontend

> Read when touching auth, permissions, session handling, or user-facing sensitive data.
> Blueprint: `../_blueprints/04_Visibility_Access_Rules.md`

⚠️ Violations require explicit approval before proceeding.

---

## Authentication — Sanctum SPA Cookies

### Mechanism

- **Auth type:** Laravel Sanctum SPA (HttpOnly session cookies)
- **Cross-origin:** API is hosted at `api.momentum.test` while frontend apps are at `{tenant}.momentum.test` (e.g. mof) and `admin.momentum.test`
- **CORS & Credentials:** All API calls use absolute URLs (`https://api.momentum.test/v1/...`) and must include credentials
- **No localStorage auth:** Never store tokens, session IDs, or credentials in localStorage, sessionStorage, or cookies set by JavaScript

### Auth Flow

```
1. GET  /sanctum/csrf-cookie           → Sets XSRF-TOKEN cookie
2. POST /v1/iam/auth/login             → Sets session cookie (HttpOnly, domain=.momentum.test)
3. All subsequent requests              → Browser sends cookies automatically (withCredentials)
4. POST /v1/iam/auth/logout            → Clears session
```

### Implementation Rules

```tsx
// ✅ Correct — use apiClient (credentials included, CSRF handled, X-Tenant + X-Locale added)
import { apiClient } from '@/lib/api/client';

const tasks = await apiClient.get<Task[]>('/v1/tasks', { params: { status: 'active' } });

// ❌ Wrong — manual fetch without credentials/headers
const response = await fetch('https://api.momentum.test/v1/tasks');

// ❌ Wrong — manual token management
const token = localStorage.getItem('auth_token');
fetch('https://api.momentum.test/v1/tasks', {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

### CSRF Protection

Sanctum requires the `X-XSRF-TOKEN` header on mutating requests. The `apiClient` handles this automatically — extracts the `XSRF-TOKEN` cookie (non-HttpOnly) and includes it on POST/PUT/PATCH/DELETE requests:

```ts
// lib/api/client.ts — CSRF handled automatically by apiClient
// No manual extraction needed in component code.

// Login flow: CSRF cookie must be fetched FIRST
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials) => {
      await getCsrfCookie();  // GET /sanctum/csrf-cookie — sets XSRF-TOKEN cookie
      return apiClient.post<AuthResponse>('/v1/iam/auth/login', credentials);
    },
  });
}
```

### Session Expiry

- Handle 401 responses globally — redirect to login page
- Clear TanStack Query cache on logout
- Never show stale authenticated content after session expiry

```tsx
// Global 401 handler in query client config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiRequestError && error.status === 401) {
          return false; // Don't retry auth failures
        }
        return failureCount < 3;
      },
    },
  },
});
```

---

## Route Protection

### proxy.ts (Security Headers)

The root `proxy.ts` file (Next.js 16 Proxy) applies security headers and cache control to all routes:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Cache-Control: no-store` (prevents bfcache on authenticated pages)

No auth logic in `proxy.ts` — auth protection is done server-side in the dashboard layout via `prefetchAuthenticatedUser()` which returns 401 before shell HTML renders.

### Dashboard Layout Auth Guard

The `(dashboard)/layout.tsx` uses `dynamic = 'force-dynamic'` and calls `prefetchAuthenticatedUser()` server-side. On 401, it redirects to `/login` before any shell HTML is sent to the browser. Client-side 401s are handled globally via `QueryCache.onError`.

---

## Permission UI — Capability-Based

### Philosophy

The server is the **sole authority** on permissions. The frontend uses capabilities for UX optimization only — hiding/disabling actions the user likely cannot perform. The server returns 403 regardless.

### Capability Check Pattern

```tsx
// ✅ Correct — hide action when user lacks capability
function TaskActions({ task }: { task: Task }) {
  const canManage = useCapability('task.manage');

  return (
    <>
      {canManage && (
        <Button variant="destructive" onClick={handleCancel}>
          إلغاء المهمة
        </Button>
      )}
    </>
  );
}

// ✅ Also correct — disable with tooltip for discoverability
function TaskActions({ task }: { task: Task }) {
  const canEscalate = useCapability('task.escalate');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              disabled={!canEscalate}
              onClick={handleEscalate}
            >
              تصعيد
            </Button>
          </span>
        </TooltipTrigger>
        {!canEscalate && (
          <TooltipContent>ليس لديك صلاحية التصعيد</TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
```

### What NOT To Do

```tsx
// ❌ Wrong — blocking navigation based on client-side check
if (!user.capabilities.includes('analytics.view')) {
  redirect('/403');  // Server should return 403, not client
}

// ❌ Wrong — duplicating ABAC logic
if (user.role === 'director' && task.department === user.department) {
  // Never duplicate server-side access logic
}

// ❌ Wrong — hardcoded role checks
if (user.account_type === 'tenant_admin') {
  showAdminPanel();  // Use capabilities, not roles
}
```

---

## PII & Sensitive Data

### Display Rules

- **PII fields:** name, email, mobile, employee_id
- **Never** log PII to browser console in production
- **Never** include PII in error tracking payloads without redaction
- **Never** store PII in localStorage or sessionStorage
- **Never** include sensitive data in URL query parameters

```tsx
// ✅ Correct — PII displayed from API, not logged
function UserProfile({ user }: { user: User }) {
  return <span>{user.name_ar}</span>;
}

// ❌ Wrong — PII in console
console.log('User data:', user);  // Logs email, mobile, etc.

// ❌ Wrong — PII in URL
router.push(`/users?email=${user.email}`);
```

### Error Display

```tsx
// ✅ Correct — user-friendly error, no internal details
<ErrorState message="حدث خطأ. يرجى المحاولة مرة أخرى." />

// ❌ Wrong — exposing internal IDs or stack traces
<ErrorState message={error.stack} />
<ErrorState message={`Model [App\\Models\\User] not found: ${error.message}`} />
```

---

## XSS Prevention

### React's Built-in Protection

React escapes all rendered strings by default. This covers most XSS vectors:

```tsx
// ✅ Safe — React escapes this
<div>{userInput}</div>
<p>{task.description_ar}</p>

// ❌ Dangerous — bypasses React's escaping
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### `dangerouslySetInnerHTML` Ban

**Never use `dangerouslySetInnerHTML`** without explicit security review and approval. If HTML rendering is needed (e.g., rich text from Help Center articles), use a sanitization library:

```tsx
// If approved after review — sanitize first
import DOMPurify from 'dompurify';

function RichContent({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

---

## Content Security Policy (CSP) — Planned

CSP headers will be added to `next.config.ts` when deployed. Intended directives: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`, `font-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`.

---

## Cookie Handling

- **Never** set cookies via JavaScript for auth purposes
- **Never** read session cookies in client-side code (they are HttpOnly)
- XSRF-TOKEN cookie is the only cookie read by client code (for CSRF headers)
- Session cookie name is configured server-side — do not hardcode

---

## Third-Party Scripts

- No third-party analytics or tracking scripts in MVP
- If added later, load via `next/script` with appropriate `strategy`
- Never load scripts from untrusted CDNs

---

## Requires Explicit Approval

- Changes to authentication or session handling
- Changes to CSRF token extraction logic
- Adding `dangerouslySetInnerHTML` usage
- Changes to route protection middleware
- Adding third-party scripts
- Modifications to Content Security Policy headers
- New endpoints returning sensitive data in URL params

---

→ **Next:** [testing-policy.md](testing-policy.md)
