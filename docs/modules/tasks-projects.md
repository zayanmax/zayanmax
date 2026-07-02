# Tasks & Projects Module

Last updated: 2026-06-12

## Scope

Implemented backend-only Tasks & Projects foundation.

Included:

- Projects.
- Project members.
- Project statuses.
- Tasks.
- Subtasks through parent task relation.
- Task comments.
- Task attachment metadata only.
- Task assignees.
- Task priorities and statuses.
- Start dates, due dates, and completion dates.
- Search, filters, sorting, and pagination.
- Kanban-friendly task listing grouped by status.
- Optional client relation for projects.
- Optional user/employee relations for project members and task assignees.
- Audit logs for create, update, delete, status changes, member changes, and assignment changes.

Excluded for now:

- Frontend screens.
- Invoices.
- Payments.
- Approvals.
- Real file upload/storage processing.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `Project`
- `ProjectMember`
- `Task`
- `TaskAssignee`
- `TaskComment`
- `TaskAttachment`

Added enums:

- `ProjectStatus`
- `TaskStatus`
- `TaskPriority`

Migration:

```text
apps/backend/prisma/migrations/20260612131444_tasks_projects
```

## Permissions

Uses existing seeded permissions:

- `projects.view`
- `projects.create`
- `projects.update`
- `projects.delete`
- `tasks.view`
- `tasks.create`
- `tasks.update`
- `tasks.delete`

No role names are hardcoded for access checks.

## Endpoints

Project routes:

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id/status`
- `DELETE /api/v1/projects/:id`
- `GET /api/v1/projects/:id/members`
- `POST /api/v1/projects/:id/members`
- `DELETE /api/v1/projects/:id/members/:memberId`

Task routes:

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/kanban`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id/status`
- `DELETE /api/v1/tasks/:id`
- `POST /api/v1/tasks/:id/subtasks`
- `GET /api/v1/tasks/:id/comments`
- `POST /api/v1/tasks/:id/comments`
- `GET /api/v1/tasks/:id/attachments`
- `POST /api/v1/tasks/:id/attachments`
- `GET /api/v1/tasks/:id/assignees`
- `POST /api/v1/tasks/:id/assignees`

Task attachment APIs store metadata only. They do not upload files or integrate with object storage yet.

## Project Filters

`GET /api/v1/projects` supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `clientId`
- `memberUserId`
- `memberEmployeeId`

Search checks project `name` and `description`.

## Task Filters

`GET /api/v1/tasks` and `GET /api/v1/tasks/kanban` support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `projectId`
- `parentTaskId`
- `status`
- `priority`
- `assigneeUserId`
- `assigneeEmployeeId`

Search checks task `title` and `description`.

## Kanban Output

`GET /api/v1/tasks/kanban` returns an object keyed by task status:

- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `REVIEW`
- `DONE`
- `CANCELLED`

## Audit Logging

Audit actions:

- `projects.create`
- `projects.update`
- `projects.status_change`
- `projects.delete`
- `projects.members.add`
- `projects.members.remove`
- `tasks.create`
- `tasks.update`
- `tasks.status_change`
- `tasks.delete`
- `tasks.comments.create`
- `tasks.attachments.create`
- `tasks.assignees.add`

## Tests

Unit tests:

```text
apps/backend/src/modules/tasks-projects/tasks-projects.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

The e2e flow logs in the seeded admin, creates a project, adds a project member, creates a task with an assignee, adds a subtask/comment/attachment, checks kanban listing, changes task/project status, and soft deletes task/project records.
