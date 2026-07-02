# Frontend Foundation

Last updated: 2026-07-02

## Scope

The frontend foundation lives in `apps/frontend`.

Implemented:

- Next.js App Router with React and TypeScript.
- Tailwind CSS v4 and shadcn/ui component setup.
- Radix UI packages for accessible primitives and a Radix-backed confirm dialog.
- Lucide React icons.
- TanStack Query provider.
- React Hook Form and Zod forms.
- Axios API client.
- Zustand auth/session store.
- Protected dashboard layout.
- Permission-aware navigation.
- Auth screens and dashboard summary foundation.

Not implemented yet:

- Module CRUD screens.
- File upload UI.
- Real notifications.
- Deep charting.
- Frontend code generation from OpenAPI.

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

The backend Swagger JSON remains available at:

```text
/api/docs-json
```

## App Structure

```text
apps/frontend/src/app
apps/frontend/src/components
apps/frontend/src/components/ui
apps/frontend/src/components/layout
apps/frontend/src/components/shared
apps/frontend/src/components/data
apps/frontend/src/components/forms
apps/frontend/src/config
apps/frontend/src/features
apps/frontend/src/hooks
apps/frontend/src/lib
apps/frontend/src/providers
apps/frontend/src/types
```

## Auth Flow

Auth endpoints used:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/me`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`
- `POST /auth/change-password`

Stored browser metadata:

- access token
- refresh token
- session ID
- current user and permission keys

The API client attaches bearer tokens automatically. On one authorized `401`, it calls refresh with `userId`, `refreshToken`, and `sessionId`, updates stored tokens, and retries the original request once. If refresh fails, it clears local auth state and routes the user back to login.

## Implemented Pages

- `/login`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/change-password`
- `/`

The root route redirects to `/dashboard`; the dashboard shell redirects unauthenticated users to `/login`.

## Dashboard

The dashboard page calls:

- `GET /dashboard/summary`
- `GET /dashboard/hr`
- `GET /dashboard/projects-tasks`
- `GET /dashboard/crm-sales`
- `GET /dashboard/finance`
- `GET /dashboard/inventory-assets`
- `GET /dashboard/helpdesk`
- `GET /dashboard/approvals`
- `GET /dashboard/calendar`

It includes date range filters and summary cards for employees, attendance, projects/tasks, clients/sales, finance, approvals, helpdesk, calendar, and inventory/assets.

## Reusable Components

Foundation components include:

- page header
- stat card
- data card
- data table
- status badge
- confirm dialog
- form field wrapper
- search/filter bar
- pagination controls
- date range filter
- loading state
- empty state
- error state
- permission guard
- protected app shell
- sidebar
- topbar
- breadcrumbs

## Navigation

Navigation is configured in:

```text
apps/frontend/src/config/navigation.ts
```

Items are hidden unless the current user has the configured backend permission key. The current groups are Dashboard, HR, Clients & CRM, Projects & Tasks, Sales, Billing, Finance, Inventory & Assets, Documents, Calendar, Helpdesk, Approvals, Reports, and Settings.

## Verification

Required frontend checks:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```
