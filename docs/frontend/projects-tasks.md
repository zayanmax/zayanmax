# Projects And Tasks Frontend

Last updated: 2026-07-02

## Scope

Implemented frontend screens for the Projects & Tasks module.

Included:

- Project list.
- Project create and edit forms.
- Project detail page.
- Project status change action.
- Project soft-delete action.
- Project members section.
- Project task summary section.
- Task list.
- Task create and edit forms.
- Task detail page.
- Task status change action.
- Task soft-delete action.
- Task subtasks section.
- Task comments section.
- Task assignees section.
- Task attachment metadata section.
- Read-only task kanban board.

Not implemented in this pass:

- Billing, sales, invoices, payroll, or reports screens.
- File upload.
- Drag-and-drop kanban updates.
- Dedicated user lookup picker for project members or task assignees.
- Child record update/delete flows where the backend does not expose endpoints.

## Routes

- `/projects`
- `/projects/new`
- `/projects/[id]`
- `/projects/[id]/edit`
- `/tasks`
- `/tasks/new`
- `/tasks/[id]`
- `/tasks/[id]/edit`
- `/tasks/kanban`

## Permissions

- `projects.view`
- `projects.create`
- `projects.update`
- `projects.delete`
- `tasks.view`
- `tasks.create`
- `tasks.update`
- `tasks.delete`

Navigation now exposes separate Projects, Tasks, and Kanban entries. Each entry is hidden unless `/auth/me` returns the matching view permission.

## API Coverage

Project APIs:

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `PATCH /projects/:id/status`
- `DELETE /projects/:id`
- `GET /projects/:id/members`
- `POST /projects/:id/members`
- `DELETE /projects/:id/members/:memberId`

Task APIs:

- `GET /tasks`
- `GET /tasks/kanban`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `PATCH /tasks/:id/status`
- `DELETE /tasks/:id`
- `POST /tasks/:id/subtasks`
- `GET /tasks/:id/comments`
- `POST /tasks/:id/comments`
- `GET /tasks/:id/attachments`
- `POST /tasks/:id/attachments`
- `GET /tasks/:id/assignees`
- `POST /tasks/:id/assignees`

## Screens

The projects list page includes:

- project name
- client
- status
- start date
- due date
- members count
- tasks count/progress
- view/edit/delete actions
- search, status filter, client filter, and pagination

The project form includes:

- name
- client
- status
- description
- start date
- due date
- completed date

The project detail page includes:

- summary cards
- client and schedule details
- status change action
- members tab with add/remove
- tasks tab with top-level project tasks

The tasks list page includes:

- task title
- project
- status
- priority
- assignees
- due date
- parent/subtask indicator
- view/edit/delete actions
- search, status filter, priority filter, project filter, and pagination

The task form includes:

- project
- parent task
- title
- assignee on create
- status
- priority
- description
- start date
- due date
- completed date

The task detail page includes:

- summary cards
- project/status/priority details
- dates and description
- status change action
- subtasks tab with create
- comments tab with create
- assignees tab with create
- attachment metadata tab with create

The kanban page uses `GET /tasks/kanban` and groups tasks by status. Drag-and-drop was intentionally left out in this pass because the requested low-risk implementation can be satisfied with a read-only board.

## Backend Notes

- Project member and task assignee APIs support either `userId` or `employeeId`.
- The current frontend has employee lookup hooks, so forms use employee selection.
- A dedicated frontend user lookup is not available yet.
- Task update does not apply assignee arrays; assignees are added from the task detail assignees tab.
- Task assignee removal is not exposed by the backend controller.
- Task comment and attachment update/delete endpoints are not exposed by the backend controller.
- Attachment APIs store metadata only; binary file upload is not implemented.
