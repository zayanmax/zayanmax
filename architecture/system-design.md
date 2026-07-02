# System Design

## Main Design Principles

1. Modular domains, shared infrastructure.
2. Every important action should be auditable.
3. Every sensitive feature should be permission-protected.
4. Workflows should be configurable, not hardcoded.
5. Files should be stored outside the database.
6. Reports should be generated asynchronously when heavy.
7. All APIs should be predictable and versioned.

## Main Entities

```text
Company
Branch
Department
Designation
User
Employee
Role
Permission
Session
AuditLog
Notification
ApprovalRequest
ApprovalStep
File
Comment
ActivityLog
```

## Cross-Cutting Features

### Activity Timeline
Important modules should expose a timeline:
- Clients
- Projects
- Employees
- Invoices
- Helpdesk tickets
- Purchase requests
- Approvals

### Comments
Use a reusable comments system:
- `entityType`
- `entityId`
- `commentText`
- `createdById`

### Attachments
Use a reusable attachment model:
- `entityType`
- `entityId`
- `fileId`

### Status Model
Use consistent statuses:

```text
DRAFT
PENDING
APPROVED
REJECTED
ACTIVE
INACTIVE
ARCHIVED
CANCELLED
COMPLETED
```

## Dashboard Design

Dashboard should be role-aware:

### Admin Dashboard
- Total employees
- Present today
- Pending approvals
- Expenses this month
- Project status
- Recent activities
- Alerts

### HR Dashboard
- Attendance summary
- Leave requests
- Joining/onboarding
- Birthdays
- Probation alerts

### Finance Dashboard
- Income
- Expense
- Outstanding invoices
- Pending payments
- Payroll status

### Manager Dashboard
- Team attendance
- Assigned tasks
- Pending approvals
- Project deadlines

### Employee Dashboard
- My attendance
- My leaves
- My tasks
- Announcements
- Upcoming events

## API Versioning

All APIs should start with:

```text
/api/v1
```

## Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": []
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

## Pagination Response Format

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```
