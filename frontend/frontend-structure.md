# Frontend Project Structure

Recommended frontend: Next.js + TypeScript + Tailwind CSS + shadcn/ui + React Query or TanStack Query.

```text
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   └── dashboard/
│       ├── page.tsx
│       ├── employees/
│       ├── attendance/
│       ├── leaves/
│       ├── projects/
│       ├── clients/
│       ├── finance/
│       ├── approvals/
│       ├── reports/
│       └── settings/
├── components/
│   ├── ui/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── page-header.tsx
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── shared/
├── features/
│   ├── employees/
│   ├── clients/
│   ├── projects/
│   ├── finance/
│   └── approvals/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── permissions.ts
│   ├── utils.ts
│   └── constants.ts
├── hooks/
├── types/
├── styles/
└── public/
```

## UI Layout

### Sidebar
Width: 260px desktop.

Main nav:
- Dashboard
- Employees
- Attendance
- Leaves
- Tasks & Projects
- Clients
- Sales & Leads
- Finance
- HR & Payroll
- Inventory & Assets
- Documents
- Approvals
- Calendar
- Reports
- Helpdesk
- Settings

### Topbar
- Global search
- Quick create
- Notifications
- Messages
- User profile dropdown

### Main Content
- Page header
- Stats cards
- Filters
- Table/card/list content

## API Client Rules

Use a central API client:

```ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
```

Attach access token through interceptor.

## State Management

- Server state: TanStack Query
- Local UI state: React state/Zustand
- Forms: React Hook Form + Zod

## Permission Rendering

Use permission helpers:

```tsx
<Can permission="clients.create">
  <Button>Add Client</Button>
</Can>
```
