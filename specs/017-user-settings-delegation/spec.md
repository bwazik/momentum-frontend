# Spec: User Settings & Delegation

> **Number:** 017
> **Date:** 2026-07-15
> **Status:** `completed`
> **Milestone:** F6 — Admin, Organization, Help & Onboarding
> **Depends on:** `001-core-shell` (authenticated shell, locale and capability UI), `005-blueprint-builder` (blueprint category and stage-type lookups), `020-localization-calendar` (Hijri date input and dual-date display)
> **Backend spec:** `../backend/specs/016-delegation-oof/` — `Contract status: stable`; also consumes the stable self-profile contract from `003-iam-abac`
> **Contract status:** `stable` for the existing profile, availability, active-list, and admin-managed delegation APIs. The approved self-service authorization change remains a backend follow-on.
> **Author:** Codex
> **Branch:** `feat/017-user-settings-delegation`
> **Base branch:** `main`

---

## Problem

Employees need one reliable place to keep the personal details that affect their experience current, confirm their availability, and arrange cover before an absence. Without it, a user cannot safely update their preferred language or mobile number, and administrators must manually infer who is covering an absent colleague. This creates avoidable assignment delays in approval-heavy government workflows, especially when an absent decision maker is a stage assignee.

The screen must make the effect of out-of-office and delegation explicit: a user can see whether they are marked unavailable, who is designated to cover them, when a delegation applies, and which work categories it covers. Authorized follow-up and administrative users also need a current, organization-wide view of active cover arrangements without exposing a historical audit product.

## Goal

Add a `/settings` screen in the authenticated tenant shell. It provides a self-service profile and availability surface for every authenticated user, plus an active-delegations workspace for users granted delegation visibility. The workspace uses the completed IAM contract for profile, out-of-office, scoped delegation, and active-list operations; it does not create a separate permission model or duplicate assignment-routing logic in the browser.

---

## User Stories

### All Authenticated Users

- As an **internal user**, I want to update my Arabic/English display name, mobile number, and preferred language, so that my profile and experience remain accurate.
- As an **internal user**, I want to see my email, employee ID, and current position without being able to alter controlled organization data, so that I know which details are managed by my organization.
- As an **internal user**, I want to mark myself out of office, so that my unavailability is visible to the system and authorized managers.
- As an **internal user**, I want to mark myself back in office, so that future assignments resume normally.

### Delegation Viewers and Managers

- As a **follow-up specialist with `iam.view_delegations`**, I want to view current active delegations, so that I can identify who is acting on whose behalf.
- As a **user with `iam.manage_users`**, I want to create, edit, and revoke a scoped delegation, so that temporary authority is applied only for the intended dates and type of work.
- As a **delegation manager**, I want to filter active delegations by person, blueprint category, and stage type, so that I can investigate a particular coverage arrangement quickly.

### System

- As the **system**, I want to send Gregorian or Hijri dates with the selected `calendar_system`, so that the backend remains the source of truth for date conversion and validation.
- As the **system**, I want to hide or disable unavailable actions using capabilities while relying on the server to enforce authorization, so that the UI remains helpful without duplicating ABAC decisions.

---

## Acceptance Criteria

### Route and Navigation

- [x] A signed-in tenant user can open `/settings` from the existing user-menu Preferences entry; the route remains inside the standard dashboard shell.
- [x] The page title, description, tabs, field labels, status text, toasts, and empty/error messages are localized with `next-intl` in Arabic and English.
- [x] The selected section is represented by `?tab=profile` or `?tab=delegations`; an absent or invalid value defaults to `profile`.
- [x] The Delegations tab is hidden from users without either `iam.view_delegations` or `iam.manage_users`; direct navigation must still render the server response rather than make a client-side authorization decision.

### Profile and Preferences

- [x] The Profile tab loads the authenticated user's `name_ar`, `name_en`, `mobile`, `preferred_language`, email, employee ID, current position, and current out-of-office state from the generated `UserResource` contract.
- [x] The editable profile form uses `BilingualNameFields` for Arabic (required) and English (optional), plus a mobile field and Arabic/English preference selector; email, employee ID, and position are read-only.
- [x] Saving profile changes calls `PUT /v1/iam/profile`, shows a localized success or failure toast, and refreshes the authenticated-user cache without optimistic profile changes.
- [x] Changing the preferred language updates the backend preference, sets `NEXT_LOCALE` through the existing locale mechanism, invalidates the authenticated-user cache, and takes effect on the next page load.
- [x] No profile field, toast, URL, analytics payload, or console output exposes credentials, a session token, or unnecessary PII.

### Availability / Out of Office

- [x] The Profile tab shows an Availability card with a text status in addition to its visual state: In office / Out of office.
- [x] A user can mark only their own account out of office through `POST /v1/iam/users/{publicId}/out-of-office`; a manager may operate on another user only when the established backend contract permits it.
- [x] Users without `iam.manage_users` can mark themselves out of office without a delegate selector. Users with `iam.manage_users` can optionally select a delegate and see a clear warning that no selected delegate means no replacement recipient is configured.
- [x] Marking back in office calls `POST /v1/iam/users/{publicId}/back-in-office`, clears the displayed delegate, refreshes the authenticated-user cache, and announces the updated status through a localized toast.
- [x] Availability mutations disable their initiating control while pending and preserve the user’s form state after a failed request.

### Active Delegations

- [x] Users with `iam.view_delegations` or `iam.manage_users` can view `GET /v1/iam/delegations/active` in a cursor-paginated active-delegations table.
- [x] Each row shows delegator, delegate, scope label, localized scope detail (blueprint category and/or stage type when present), start and end dates in dual Gregorian/Hijri format, and an explicit Active status label.
- [x] The active list uses a manual, accessible Load More button when `has_more` is true; it never uses offset pagination or infinite scrolling for the table.
- [x] Active-list filters for delegator, delegate, blueprint category, and stage type are URL-driven and forwarded as their public IDs. Clearing filters removes the corresponding URL parameter and returns to the unfiltered active list.
- [x] Delegator/delegate filter controls are rendered only for users with `iam.manage_users`, which is the current authorization required for the user-directory lookup. A user with only `iam.view_delegations` can still view the unfiltered active list and use non-person lookup filters.
- [x] An empty active-delegations result explains that no delegation is currently in effect and shows a Create delegation call to action only when the user has the required mutation capability.

### Create, Edit, and Revoke Delegations

- [x] Create, edit, and revoke controls are shown only for users with `iam.manage_users` until the approved self-service authorization update is released. After release, authenticated users may manage only their own delegations.
- [x] For users with `iam.manage_users`, the create form shows an optional “Delegating on behalf of” user selector. Omitting it creates a delegation for the authenticated user; providing it creates on behalf of the selected user.
- [x] The delegation form includes delegate, start date/time, end date/time, scope type, and conditional Blueprint Category and Stage Type selectors. It uses generated request types and submits public IDs only.
- [x] Scope choices are All work, Blueprint category, Stage type, and Blueprint category plus stage type. Selecting a scope clears and hides fields that no longer apply; category and/or stage type are required exactly when their selected scope requires them.
- [x] The form reuses `CalendarSystemToggle` from Spec 020. Hijri entry sends `calendar_system: 'hijri'` with `starts_at` and `ends_at`; changing calendar system clears date values to prevent mixed-calendar submission.
- [x] Creating uses `POST /v1/iam/delegations`, editing uses `PUT /v1/iam/delegations/{publicId}`, and revoking uses `POST /v1/iam/delegations/{publicId}/revoke` after an `AlertDialog` confirmation.
- [x] Successful delegation mutations show localized sonner toasts and refresh the active list; failed 422 validation responses are shown as localized toasts without discarding entered values.
- [x] The UI never presents a delegation as active solely because its `is_active` flag is true; the active list endpoint, which also evaluates its date window, is authoritative.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`, `docs/ai/architecture.md`, and `docs/ai/security-policy.md`.

### Data Fetching

- [x] Reuse `useCurrentUser()` and `queryKeys.auth.me` for profile and availability display; do not add a duplicate client-side user store or a `useEffect` fetch.
- [x] Add a domain-focused `use-delegations.ts` query-hook module. `useActiveDelegationsInfinite(filters)` uses `useInfiniteQuery` against `GET /v1/iam/delegations/active`, passes `cursor`, and derives `getNextPageParam` from `has_more` / `next_cursor`.
- [x] Reuse bounded catalog hooks `useBlueprintCategories()` and `useBlueprintStageTypes()` for scope selectors. Load them only when the create/edit dialog is opened or prefetch them on the Create action’s intentional hover/focus; no background prefetch is needed for the profile tab.
- [x] Reuse the existing cursor-paginated user-list hook/key for delegate and on-behalf lookups only when `iam.manage_users` is present; do not add a new directory endpoint for MVP.
- [x] Active delegations are time-sensitive: use a short stale time (30 seconds), refetch on window focus, and do not introduce client-side response caching beyond TanStack Query.
- [x] Consume only generated OpenAPI types from `lib/generated/api-types.ts`; never hand-write a `User`, `Delegation`, or request DTO.

### Query Key Structure

- [x] Extend `lib/api/query-keys.ts` with a `delegations` namespace, following the existing factory convention:

  ```ts
  delegations: {
    all: ['delegations'] as const,
    activeLists: () => [...queryKeys.delegations.all, 'active', 'list'] as const,
    activeList: (filters: DelegationFilters) =>
      [...queryKeys.delegations.activeLists(), filters] as const,
    detail: (publicId: string) =>
      [...queryKeys.delegations.all, 'detail', publicId] as const,
  }
  ```

- [x] Reuse `queryKeys.auth.me` for profile/OOO invalidation, `queryKeys.users.list(filters)` for authorized user lookup, and the existing `queryKeys.blueprints.categories()` / `stageTypes()` catalog keys.

### State Management

- [x] Put shareable section and active-list filters in URL search params: `tab`, `delegatorId`, `delegateId`, `blueprintCategoryId`, and `stageTypeId`.
- [x] Keep dialog/sheet visibility, confirmation target, date input values, selected calendar system, and unsaved form values in local component state. Reset them on close or successful completion as appropriate.
- [x] Do not add Zustand state for API data, profile drafts, or filters. Continue to use the capability and locale stores only for their established UI responsibilities.

### Mutation and Cache Pattern

- [x] Profile update, out-of-office, back-in-office, create, update, and revoke operations use `useMutation` through `apiClient`, with `credentials: 'include'`, tenant, locale, and CSRF behavior supplied by the central client.
- [x] Do not optimistically update routing- or availability-affecting data. On success invalidate `queryKeys.auth.me` for profile/OOO changes and `queryKeys.delegations.all` for delegation mutations; invalidate any affected user lookup page only if its displayed state changes.
- [x] Each mutation uses the project sonner toast pattern. Buttons are disabled and show pending feedback while the mutation is in flight.

### Error Handling

- [x] Let the global query client handle 401 by clearing authenticated cache and redirecting to login.
- [x] Treat 403 as a permission-aware UI state: profile remains available, while the restricted delegation region explains that access is unavailable and offers retry only when a subsequent authorized response is possible.
- [x] Render loading, error, empty, and success states independently for profile/availability and the active-delegations list. Use `ErrorState` with retry for recoverable GET failures.
- [x] Show 422 form validation and request errors through localized `toast.error()` messages, never raw server payloads, stack traces, or inline `FieldError` components.

### Stable API Contract Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET / PUT | `/v1/iam/profile` | Read and update the authenticated user’s profile. |
| POST | `/v1/iam/users/{user}/out-of-office` | Mark self (or an authorized user) unavailable, optionally with a delegate. |
| POST | `/v1/iam/users/{user}/back-in-office` | Return self (or an authorized user) to office. |
| GET | `/v1/iam/delegations/active` | Cursor-paginated active delegation view with person and scope filters. |
| POST | `/v1/iam/delegations` | Create a scoped delegation. |
| PUT | `/v1/iam/delegations/{delegation}` | Update dates and scope of a delegation. |
| POST | `/v1/iam/delegations/{delegation}/revoke` | Revoke an active delegation. |
| GET | `/v1/blueprints/categories`, `/v1/blueprints/stage-types` | Bounded scope reference data. |

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, and `06-anti-patterns.md`. Glassmorphism is deferred by `02-glassmorphism.md` and is not part of this screen.

### Component Breakdown

| Component | Type | Source | Notes |
|---|---|---|---|
| `SettingsPage` | Server | Route page | Renders the `PageHeader`; interactive content is delegated to client components. |
| `SettingsWorkspace` | Client | Domain | Reads section/filter URL state and composes Profile and Delegations sections. |
| `ProfileSettingsCard` | Client | Domain + `Card`, `Field`, `InputGroup`, `RtlSelect` | Editable personal data; controlled organization fields are read-only. |
| `AvailabilityCard` | Client | Domain + `Card`, `Switch`, `Popover`/`Command`, `AlertDialog` | Current OOO status, delegate selection, return-to-office confirmation. |
| `ActiveDelegationsPanel` | Client | Domain + `Table`, `Card`, `Button`, `RtlSelect` | Desktop table, mobile cards, URL filters, and Load More. |
| `DelegationFormDialog` | Client | Domain + `Dialog`/`Sheet`, `Field`, `RtlSelect`, `CalendarSystemToggle` | Create/edit delegation with conditional scope fields. |
| `RevokeDelegationDialog` | Client | Shared `AlertDialog` pattern | Explains that future routing stops; requires explicit confirmation. |
| `SettingsSkeleton` / `DelegationTableSkeleton` | Client | Domain + `Skeleton` | Match the form-card and table/card shapes; no generic spinner-only page. |
| `EmptyState` / `ErrorState` | Client | Shared | Use existing, generic components rather than one-off equivalents. |

### States

| State | Component | Pattern |
|---|---|---|
| Loading | `SettingsSkeleton` | Two card-shaped sections with label/input lines and a compact button row. |
| Loading | `DelegationTableSkeleton` | Five table rows on desktop; stacked delegation cards on mobile. |
| Empty | `ActiveDelegationsPanel` | `EmptyState` with coverage icon, active-locale explanation, and conditional Create CTA. |
| Error | Profile / availability | `ErrorState` with localized retry; do not show stale editable data as current. |
| Error | Delegation list | `ErrorState` in the table region with retry; retain URL filters. |
| Success | Profile / availability | Saved profile and a text-labelled office status. |
| Success | Delegation list | Accessible table or mobile cards plus manual Load More control when applicable. |

### Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| Mobile (<640px) | One-column settings cards; profile fields stack; delegation table becomes cards; filters collapse into a Sheet; all icon actions retain at least 44×44px targets. |
| Tablet (640–1024px) | Profile and availability cards may form a two-column grid where space permits; delegation filters wrap into rows; dialogs use the available width. |
| Desktop (≥1024px) | Use standard `p-6` page padding and `gap-6`; Profile spans two columns beside an Availability card; active delegations render as a dense, labelled table with a Load More footer. |

### RTL and Localization

- [x] Use logical Tailwind utilities exclusively (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `border-s`); never use physical direction classes.
- [x] Keep table column order consistent between locales. Text columns use `text-start`, date/technical columns use their appropriate logical alignment, and the actions column uses `text-end`.
- [x] Flip chevrons, back arrows, and dialog-navigation arrows with `rtl:rotate-180`; do not flip person, availability, calendar, or status icons.
- [x] Use `localizeName` for people, categories, and stage types; database-backed Arabic/English names are not hardcoded translations.
- [x] Render dates using the dual-date utilities established by Spec 020 and respect the selected form calendar system.

### Accessibility

- [x] Meet WCAG 2.1 AA. All status colors are paired with text; Out of office and Active are never conveyed by color alone.
- [x] Use semantic headings, labelled `Tabs`, a labelled table with `scope="col"` headers, and mobile cards with equivalent text content.
- [x] Associate every form control with a visible `FieldLabel`; provide accessible names/descriptions for the OOO switch, delegate combobox, scope fields, and destructive confirmation.
- [x] All icon-only controls receive localized `aria-label` values. Decorative icons are `aria-hidden`.
- [x] Use shadcn `Dialog`, `Sheet`, `AlertDialog`, `Select`, and `Command` primitives so focus is trapped, Escape closes overlays, and focus returns to the trigger.
- [x] Preserve visible shadcn focus rings, logical tab order, keyboard operation for tabs/comboboxes/dialogs, and sonner live announcements for mutation feedback.

### Animation and Visual Treatment

- [x] Use token-aligned cards (`rounded-xl`, standard border/shadow), `gap-4` within cards, and `gap-6` between sections. Do not introduce glass surfaces or hardcoded colors.
- [x] Buttons use the established `active:scale-[0.98] transition-transform`; interactive cards may use a 200ms transform/opacity transition only when they are clickable.
- [x] Skeletons use `animate-pulse`; all animation and hover translation uses `motion-reduce` alternatives. Do not animate layout properties, table rows, or blur.

---

## Non-Functional Requirements

### Performance

- [x] Cursor pagination and manual Load More protect organization-scale delegation listings; reference catalogs are bounded `useQuery` lookups.
- [x] Do not add a heavy visualization, image asset, chart library, or new dependency. No dynamic import is needed beyond the existing command/search primitives.
- [x] Avoid duplicate profile requests by using the existing authenticated-user query cache.

### Security and Permissions

- [x] All requests use `apiClient`; authentication remains Sanctum HttpOnly cookies, never localStorage or a manually managed bearer token.
- [x] Capability checks use `useCapability()` only for UI affordances. The server remains authoritative for every GET and mutation, including direct routes.
- [x] Do not put mobile numbers, email addresses, employee IDs, display names, or any other PII in URLs or browser logs.
- [x] User-facing error messages remain generic/localized and never render raw server errors, implementation details, or internal identifiers.

### Testing Expectations for the Later Plan

- [x] Feature tests use MSW and generated contract shapes to cover profile save, language preference, OOO/back-in-office, active-list loading/empty/error/success, scope-field conditions, revoke confirmation, and cache invalidation behavior.
- [x] Critical interactions are tested in Arabic RTL and English LTR, including keyboard operation, focus return from overlays, icon direction, and responsive table-to-card rendering.

---

## Out of Scope

- Notification channel preferences, do-not-disturb scheduling, and email-delivery preference management (V2).
- Password reset/change UX, MFA, account recovery, or any auth/session changes.
- Delegation activity summaries on return, full delegation history/audit, and a personal delegation-status dashboard (V2 features 209, 210, and 219).
- New assignment-routing rules, manual task reassignment, delegation acceptance/decline, financial delegation thresholds, and cross-tenant delegation.
- Tenant-wide user administration, capability management, position assignment, and audit-trail administration (Spec `010-system-administration`).
- Backend implementation changes, including the approved self-service delegation authorization update. This frontend spec consumes the resulting contract but does not implement it.

---

## Open Questions — All Resolved

- [x] **Self-service delegation authorization:** Should a user be allowed to create, edit, and revoke only their own delegations, or must all delegation mutations remain restricted to `iam.manage_users`? — **Resolved.** Add self-service support with a small backend authorization change. The controller already defaults an omitted `delegator_user_id` to the authenticated user; mutation routes must allow the authenticated delegator or a user with `iam.manage_users`. Until that release, the frontend keeps Create, Edit, and Revoke controls behind `iam.manage_users`.
- [x] **Eligible delegate lookup:** Should the backend add a lightweight eligible-delegate directory endpoint for normal users? — **Resolved.** No. Delegate selection remains admin-only for MVP because `GET /v1/iam/users` requires `iam.manage_users`. Users without that capability may set themselves out of office without selecting a delegate.
- [x] **On-behalf creation:** Should an `iam.manage_users` user be able to create a delegation for another person? — **Resolved.** Yes; it already works. `delegator_user_id` is optional in `StoreDelegationRequest`: omit it for the authenticated user, or provide it for an on-behalf delegation. Show the optional “Delegating on behalf of” selector only to users with `iam.manage_users`.
- [x] **Scope serialization:** What values should the frontend use to display and submit delegation scope? — **Resolved.** `DelegationResource` returns lowercase strings: `all`, `blueprint_category`, `stage_type`, and `blueprint_category_and_stage_type`. Requests accept either those strings or integer values `1`–`4`; the frontend uses the strings and generated OpenAPI types. The OpenAPI artifact has been regenerated.
- [x] **Language preference mapping:** How should the frontend map the profile language value and apply a successful preference change? — **Resolved.** The API returns `arabic` or `english` and accepts integer (`1` / `2`) or enum-string (`ARABIC` / `ENGLISH`) requests. On successful `PUT /v1/iam/profile`, set the `NEXT_LOCALE` cookie and invalidate `queryKeys.auth.me`; the chosen locale takes effect on the next page load.

---

â†’ **Next:** Obtain spec review approval before creating `plan.md`.
