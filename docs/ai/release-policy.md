# Release Policy — Momentum Frontend

> Read for deployment, CI, type generation, or production-impacting changes.

---

## Environments

| Environment | Purpose |
|-------------|---------|
| Local | `next dev` |
| Production | VPS behind Nginx |

No staging environment in MVP.

---

## Deployment Flow

```
PR on feat/{spec} branch
  → GitHub Actions: lint, typecheck, test, build
  → Merge to main
  → GitHub Actions: build + deploy to VPS
  → Node server restarts behind Nginx
```

Deploy only after CI passes. Backend and frontend deploy independently.

---

## CI Pipeline

| Step | Command | Blocks PR |
|------|---------|-----------|
| Lint | `npm run lint` | ✅ |
| Typecheck | `npm run typecheck` | ✅ |
| Tests | `npm run test` | ✅ |
| Build | `npm run build` | ✅ |
| Typegen freshness | Compare `api-types.ts` hash vs `openapi.json` | ✅ (when wired) |

---

## OpenAPI Type Generation

### Workflow

```
Backend updates openapi.json → Frontend runs npm run generate:api → Commit updated api-types.ts
```

### Rules

- Run `npm run generate:api` when `../backend/openapi/openapi.json` changes
- Commit the regenerated `lib/generated/api-types.ts` file
- CI verifies generated types match the current `openapi.json` — stale types fail the build
- Never hand-edit `lib/generated/api-types.ts`

### Coordination Protocol

1. Backend spec reaches `Contract status: stable`
2. Backend runs Scramble → commits updated `openapi.json`
3. Frontend runs typegen → commits updated `api-types.ts`
4. Frontend spec implementation begins

---

## API Contract Coordination

- Before merging UI that consumes new endpoints: verify backend `openapi.json` updated and types regenerated
- If backend not deployed yet: **mock-only branch** — do not merge production UI on mocks
- Mock branches: use `// MOCK` comments on all mock data; remove before merge to `main`

---

## Feature Flags & Mocks

### Mock-Only Branches

When backend API is not yet `stable`, frontend can develop on a feature branch using mocks:

```tsx
// ✅ Correct — clearly marked mock data
const MOCK_TASKS: Task[] = [  // MOCK — remove when backend 005-task-execution stable
  { public_id: '...', title_ar: '...', ... },
];

export function useTasks() {
  // MOCK — replace with real API call when backend stable
  return useQuery({
    queryKey: queryKeys.tasks.list({}),
    queryFn: () => Promise.resolve({ data: MOCK_TASKS, has_more: false, next_cursor: null }),
  });
}
```

**Rules:**
- All mock data and mock hooks must have `// MOCK` comment with the blocking backend spec
- Never merge mock-based code to `main` — wait for backend contract stability
- Feature branch: `feat/{number}-{name}` matching the frontend spec

---

## Breaking Changes

- Renamed generated types may break build — coordinate with backend spec owner
- Route path changes need redirect or bookmark update
- Design token changes affect all screens — review globally before merging

---

## Requires Sign-Off

- Auth flow changes
- Route structure changes affecting bookmarks/deep links
- New third-party dependencies
- Tailwind / design token changes affecting all screens
- Middleware changes affecting route protection

---

## Build Artifacts

- Next.js production build (`next build`)
- Static assets served by Nginx, API requests proxied to Node server
- No CDN in MVP — assets served from VPS

---

→ **Next:** [glossary.md](glossary.md)
