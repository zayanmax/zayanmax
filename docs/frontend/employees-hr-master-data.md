# Employees And HR Master Data Frontend

Last updated: 2026-07-02

## Scope

Implemented frontend screens for:

- Employees.
- Branches.
- Departments.
- Designations.

Not implemented in this pass:

- Attendance.
- Leave.
- Payroll.
- Performance.
- Recruitment.
- Deep dashboard work.

## Routes

Employees:

- `/employees`
- `/employees/new`
- `/employees/[id]`
- `/employees/[id]/edit`

HR master data:

- `/settings/branches`
- `/settings/departments`
- `/settings/designations`

## Permissions

Employees:

- `employees.view`
- `employees.create`
- `employees.update`
- `employees.delete`

HR master data:

- `settings.view`
- `settings.manage`

Navigation items are hidden when the current user does not have the required permission key from `/auth/me`.

## Employee Screens

The employee list page includes:

- employee code
- name
- email and phone
- department
- designation
- branch
- status
- joining date
- view, edit, and delete actions
- search
- status filter
- branch, department, and designation filters
- pagination
- loading, empty, and error states

The employee create/edit form includes:

- basic details
- contact details
- work details
- branch, department, designation, and reporting manager assignment
- status display
- joining details

The employee detail page includes:

- profile summary
- work info
- contact info
- branch, department, and designation
- status
- created and updated metadata when available
- edit and delete actions

## HR Master Data Screens

Branches, departments, and designations include:

- list view
- client-side search
- create modal
- edit modal
- status display
- loading, empty, and error states

Delete/soft-delete actions are not shown for these three screens because the current backend controllers do not expose delete routes for branches, departments, or designations.

## API Hooks

Feature folders added:

```text
apps/frontend/src/features/employees
apps/frontend/src/features/branches
apps/frontend/src/features/departments
apps/frontend/src/features/designations
apps/frontend/src/features/hr-master-data
```

Each primary feature folder includes API functions, query/mutation hooks, schemas, types, and page-level components where needed.

## Backend Notes

The current employee backend list supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`

It does not currently support server-side `branchId`, `departmentId`, or `designationId` filters. The frontend applies these filters client-side to the current paginated result set.

The current employee create/update DTO does not accept `status`, so the frontend displays status but does not submit status changes.

The current employee responses do not include expanded branch, department, or designation objects. The frontend fetches those master-data lists and resolves display names by ID.
