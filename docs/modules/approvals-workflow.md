# Approvals Workflow Engine Module

Last updated: 2026-06-14

## Scope Implemented

Backend only. This module stores reusable approval workflow records and APIs. Existing local approval/status flows for leave, attendance corrections, expenses, purchase requests, payroll, and other modules were not refactored.

Implemented in `apps/backend/src/modules/approvals-workflow`:

- Approval workflow definitions.
- Approval workflow steps.
- Step approver types: user, employee, role, department head, reporting manager, finance manager, HR manager, and admin.
- Approval request records.
- Entity linking support for leave, attendance correction, expense claim, purchase request, payroll run, vendor bill, invoice, quotation, asset assignment, document, and custom records.
- Approval request statuses: draft, pending, approved, rejected, cancelled.
- Approval step instance records.
- Step statuses: pending, approved, rejected, skipped.
- Approval action/comment records.
- Delegation metadata.
- Escalation metadata only.
- My pending approvals endpoint.
- Approval history endpoint per entity.
- Search, filters, sorting, and pagination.
- Audit logs for workflow create/update/delete, request submit, approve, reject, cancel, and delegate actions.

## Permissions

Seeded permission keys:

- `approvals.view`
- `approvals.manage`
- `approvals.approve`

All approval routes require JWT auth and permission-key guards.

## Data Model

Prisma migration:

```text
apps/backend/prisma/migrations/20260614090008_approvals_workflow_engine
```

Primary models:

- `ApprovalWorkflowDefinition`
- `ApprovalWorkflowStep`
- `ApprovalRequest`
- `ApprovalStepInstance`
- `ApprovalActionRecord`

Primary enums:

- `ApprovalStepApproverType`
- `ApprovalEntityType`
- `ApprovalRequestStatus`
- `ApprovalStepStatus`
- `ApprovalAction`

## API Routes

Base route:

```text
/api/v1/approvals
```

Routes:

- `GET /api/v1/approvals/workflows`
- `POST /api/v1/approvals/workflows`
- `PATCH /api/v1/approvals/workflows/:id`
- `DELETE /api/v1/approvals/workflows/:id`
- `GET /api/v1/approvals/requests`
- `POST /api/v1/approvals/requests`
- `GET /api/v1/approvals/pending`
- `GET /api/v1/approvals/history/:entityType/:entityId`
- `PATCH /api/v1/approvals/requests/:id/approve`
- `PATCH /api/v1/approvals/requests/:id/reject`
- `PATCH /api/v1/approvals/requests/:id/cancel`
- `PATCH /api/v1/approvals/requests/:id/delegate`

## List Filters

Workflow list supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `entityType`

Request and pending-approval lists support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `entityType`
- `entityId`
- `workflowDefinitionId`

## Workflow Behavior

- Workflow create rejects duplicate active `key` values per company.
- Request submit materializes pending step instances from the workflow definition.
- Approving the last pending step marks the request approved.
- Rejecting any step marks the request rejected.
- Cancelling marks the request cancelled.
- Delegation stores delegation target metadata on the step instance and an action record.
- Escalation fields are stored as metadata only; no worker processes them yet.

## Exclusions

Not implemented yet:

- Frontend screens.
- Refactoring existing local approval flows into this engine.
- Real notification sending.
- Real escalation workers.
- Automatic approver resolution for department head, reporting manager, finance manager, HR manager, or admin approver types.
- BullMQ jobs.
