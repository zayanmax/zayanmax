# API Contract Notes

## Base Path

All APIs use:

```text
/api/v1
```

## Standard Response

Success:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": []
}
```

Paginated list:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Standard List Query Parameters

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `fromDate`
- `toDate`

## HTTP Status Codes

- `200` success
- `201` created
- `400` bad request
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
- `422` validation error
- `500` server error

## Permission Pattern

Use permission decorators or guards by permission key:

```ts
@RequirePermissions('employees.create')
```

Do not check access by role name only.

## Swagger / OpenAPI

- Swagger UI: `GET /api/docs`
- OpenAPI JSON: `GET /api/docs-json`

Swagger includes bearer JWT auth, module tags, and reusable standard response/error schemas.

## Health And Readiness APIs

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

Health responses include:

- service name
- status
- uptime
- timestamp
- version and build metadata placeholders
- database readiness check
- Redis readiness check

Readiness can return `503` when a dependency check is degraded.

## Auth APIs

Public:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`

Authenticated:

- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/auth/me`

Login returns `accessToken`, `refreshToken`, `sessionId`, and `user`.

Refresh accepts optional `sessionId` for session-aware refresh token rotation.

Password reset request stores token metadata only and does not send email, SMS, or WhatsApp yet.

## Clients / CRM APIs

All routes require JWT auth and permission-key guards.

Client permissions:

- `clients.view`
- `clients.create`
- `clients.update`
- `clients.delete`

### Client Routes

- `GET /api/v1/clients`
- `POST /api/v1/clients`
- `GET /api/v1/clients/:id`
- `PATCH /api/v1/clients/:id`
- `PATCH /api/v1/clients/:id/status`
- `DELETE /api/v1/clients/:id`

### Client Child Routes

- `GET /api/v1/clients/:id/contacts`
- `POST /api/v1/clients/:id/contacts`
- `GET /api/v1/clients/:id/activities`
- `POST /api/v1/clients/:id/activities`
- `GET /api/v1/clients/:id/notes`
- `POST /api/v1/clients/:id/notes`
- `GET /api/v1/clients/:id/documents`
- `POST /api/v1/clients/:id/documents`

Client document APIs store metadata only. They do not upload files or integrate with object storage yet.

### Client List Query Parameters

In addition to the standard list parameters, `GET /api/v1/clients` supports:

- `type`: `COMPANY` or `INDIVIDUAL`
- `status`: `ACTIVE`, `INACTIVE`, `PROSPECT`, or `ARCHIVED`
- `ownerId`: UUID user ID

Search checks client `name`, `email`, `phone`, `industry`, and `taxNumber`.

### Client Duplicate Rule

Client create/update rejects another active record in the same `companyId` when any of these match:

- normalized email.
- phone.
- case-insensitive name.

## Tasks & Projects APIs

All routes require JWT auth and permission-key guards.

Project permissions:

- `projects.view`
- `projects.create`
- `projects.update`
- `projects.delete`

Task permissions:

- `tasks.view`
- `tasks.create`
- `tasks.update`
- `tasks.delete`

### Project Routes

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id/status`
- `DELETE /api/v1/projects/:id`
- `GET /api/v1/projects/:id/members`
- `POST /api/v1/projects/:id/members`
- `DELETE /api/v1/projects/:id/members/:memberId`

### Task Routes

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

### Project List Query Parameters

In addition to the standard list parameters, `GET /api/v1/projects` supports:

- `status`: `PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`, or `ARCHIVED`
- `clientId`: UUID client ID
- `memberUserId`: UUID user ID
- `memberEmployeeId`: UUID employee ID

Search checks project `name` and `description`.

### Task List Query Parameters

In addition to the standard list parameters, `GET /api/v1/tasks` and `GET /api/v1/tasks/kanban` support:

- `projectId`: UUID project ID
- `parentTaskId`: UUID parent task ID
- `status`: `TODO`, `IN_PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`, or `CANCELLED`
- `priority`: `LOW`, `MEDIUM`, `HIGH`, or `URGENT`
- `assigneeUserId`: UUID user ID
- `assigneeEmployeeId`: UUID employee ID

Search checks task `title` and `description`.

### Kanban Response

`GET /api/v1/tasks/kanban` returns a standard success response whose `data` object is keyed by task status.

## Attendance, Leave & Holidays APIs

All routes require JWT auth and permission-key guards.

Attendance permissions:

- `attendance.view`
- `attendance.manage`

Leave permissions:

- `leaves.view`
- `leaves.request`
- `leaves.approve`

### Shift Routes

- `GET /api/v1/shifts`
- `POST /api/v1/shifts`

### Attendance Routes

- `GET /api/v1/attendance`
- `GET /api/v1/attendance/monthly-summary`
- `GET /api/v1/attendance/employees/:employeeId/report`
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/check-out`
- `POST /api/v1/attendance/manual`
- `POST /api/v1/attendance/corrections`
- `PATCH /api/v1/attendance/corrections/:id/review`

Attendance statuses:

- `PRESENT`
- `ABSENT`
- `LATE`
- `HALF_DAY`
- `WORK_FROM_HOME`
- `HOLIDAY`
- `LEAVE`

Correction review statuses:

- `APPROVED`
- `REJECTED`

### Leave Routes

- `GET /api/v1/leaves/types`
- `POST /api/v1/leaves/types`
- `POST /api/v1/leaves/balances`
- `GET /api/v1/leaves/requests`
- `POST /api/v1/leaves/requests`
- `PATCH /api/v1/leaves/requests/:id/review`

Leave request statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

Leave review accepts:

- `APPROVED`
- `REJECTED`

### Holiday Routes

- `GET /api/v1/holidays`
- `POST /api/v1/holidays`
- `DELETE /api/v1/holidays/:id`

### Attendance List Query Parameters

In addition to the standard list parameters, `GET /api/v1/attendance` supports:

- `employeeId`: UUID employee ID
- `shiftId`: UUID shift ID
- `status`: attendance status
- `fromDate`: ISO date
- `toDate`: ISO date

Search checks attendance `notes` and `location`.

### Attendance Summary Parameters

`GET /api/v1/attendance/monthly-summary` supports:

- `year`: number
- `month`: number from 1 to 12
- `employeeId`: optional UUID employee ID

`GET /api/v1/attendance/employees/:employeeId/report` supports:

- `fromDate`: ISO date
- `toDate`: ISO date

### Leave Request List Query Parameters

In addition to the standard list parameters, `GET /api/v1/leaves/requests` supports:

- `employeeId`: UUID employee ID
- `leaveTypeId`: UUID leave type ID
- `status`: leave request status
- `fromDate`: ISO date
- `toDate`: ISO date

### Holiday List Query Parameters

In addition to the standard list parameters, `GET /api/v1/holidays` supports:

- `fromDate`: ISO date
- `toDate`: ISO date

Search checks holiday `name`.

### Attendance Duplicate Rule

Manual attendance create rejects another active record in the same `companyId` for the same `employeeId` and normalized attendance date. Check-in rejects when that employee/date already has a check-in timestamp.

Holiday create rejects another active record in the same `companyId` for the same normalized date and case-insensitive holiday name.

Leave type create rejects another active record in the same `companyId` for the same leave code.

## Payroll & Salary APIs

All routes require JWT auth and permission-key guards.

Payroll permissions:

- `payroll.view`
- `payroll.manage`

### Salary Structure Routes

- `GET /api/v1/payroll/salary-structures`
- `POST /api/v1/payroll/salary-structures`

Salary structure components use:

- `type`: `EARNING` or `DEDUCTION`
- `calculationType`: `FIXED` or `PERCENTAGE`

### Salary Assignment Routes

- `GET /api/v1/payroll/salary-assignments`
- `POST /api/v1/payroll/salary-assignments`

Salary assignment statuses:

- `ACTIVE`
- `INACTIVE`

### Salary Advance Routes

- `GET /api/v1/payroll/advances`
- `POST /api/v1/payroll/advances`

Salary advance statuses:

- `ACTIVE`
- `SETTLED`
- `CANCELLED`

### Payroll Period Routes

- `GET /api/v1/payroll/periods`
- `POST /api/v1/payroll/periods`

### Payroll Run Routes

- `GET /api/v1/payroll/runs`
- `POST /api/v1/payroll/runs`
- `GET /api/v1/payroll/runs/:id`
- `PATCH /api/v1/payroll/runs/:id`
- `PATCH /api/v1/payroll/runs/:id/status`

Payroll run statuses:

- `DRAFT`
- `PROCESSING`
- `APPROVED`
- `PAID`
- `CANCELLED`

### Payslip Metadata Routes

- `GET /api/v1/payroll/payslips/:employeeId`

Payslip APIs return metadata only. They do not generate PDF files, upload documents, or create bank payment files.

### Payroll List Query Parameters

Salary structures and payroll periods support standard list parameters.

Salary assignments also support:

- `employeeId`: UUID employee ID
- `salaryStructureId`: UUID salary structure ID
- `status`: salary assignment status

Salary advances also support:

- `employeeId`: UUID employee ID
- `status`: salary advance status

Payroll runs also support:

- `payrollPeriodId`: UUID payroll period ID
- `status`: payroll run status

Payslip metadata also supports:

- `payrollRunId`: UUID payroll run ID

### Payroll Duplicate Rule

Payroll run create rejects another active run in the same `companyId` for the same `payrollPeriodId`.

Payroll period create rejects another active period in the same `companyId` with the same normalized `startDate` and `endDate`.

Salary assignment create rejects another active assignment for the same company and employee.

## Finance, Expenses & Vendor Payments APIs

All routes require JWT auth and permission-key guards.

Finance permissions:

- `finance.view`
- `finance.manage`

Vendor permissions:

- `vendors.view`
- `vendors.manage`

### Finance Summary Routes

- `GET /api/v1/finance/dashboard-summary`
- `GET /api/v1/finance/payment-modes`

### Expense Category Routes

- `GET /api/v1/finance/expense-categories`
- `POST /api/v1/finance/expense-categories`

### Expense Claim Routes

- `GET /api/v1/finance/expenses`
- `GET /api/v1/finance/expenses/:id`
- `POST /api/v1/finance/expenses`
- `PATCH /api/v1/finance/expenses/:id`
- `PATCH /api/v1/finance/expenses/:id/status`

Expense claim statuses:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REJECTED`
- `PAID`
- `CANCELLED`

Expense attachment APIs store metadata only. They do not upload files or integrate with object storage yet.

### Vendor Routes

- `GET /api/v1/vendors`
- `GET /api/v1/vendors/:id`
- `POST /api/v1/vendors`
- `PATCH /api/v1/vendors/:id`

### Vendor Bill Routes

- `GET /api/v1/finance/vendor-bills`
- `GET /api/v1/finance/vendor-bills/:id`
- `POST /api/v1/finance/vendor-bills`
- `PATCH /api/v1/finance/vendor-bills/:id`

Vendor bill statuses:

- `DRAFT`
- `APPROVED`
- `PARTIALLY_PAID`
- `PAID`
- `CANCELLED`

### Vendor Payment Routes

- `GET /api/v1/finance/vendor-payments`
- `POST /api/v1/finance/vendor-payments`

Vendor payment statuses:

- `RECORDED`
- `CANCELLED`

### Petty Cash Routes

- `GET /api/v1/finance/petty-cash-accounts`
- `POST /api/v1/finance/petty-cash-accounts`
- `GET /api/v1/finance/petty-cash-transactions`
- `POST /api/v1/finance/petty-cash-transactions`

Petty cash transaction types:

- `INFLOW`
- `OUTFLOW`

### Payment Modes

- `CASH`
- `BANK_TRANSFER`
- `UPI`
- `CARD`
- `CHEQUE`
- `OTHER`

### Finance List Query Parameters

Expense categories, vendors, petty cash accounts, and vendor bills support standard list parameters.

Expense claims also support:

- `employeeId`: UUID employee ID
- `status`: expense claim status
- `fromDate`: ISO date
- `toDate`: ISO date

Vendor bills also support:

- `vendorId`: UUID vendor ID
- `status`: vendor bill status

Vendor payments also support:

- `vendorId`: UUID vendor ID
- `vendorBillId`: UUID vendor bill ID
- `status`: vendor payment status

Petty cash transactions also support:

- `pettyCashAccountId`: UUID petty cash account ID
- `type`: `INFLOW` or `OUTFLOW`

### Finance Duplicate Rules

Vendor create rejects another active vendor in the same `companyId` when normalized email, phone, or normalized GSTIN matches.

Vendor bill create rejects another active bill for the same vendor and bill number.

Expense category and petty cash account create reject active duplicates by company and name.

### Finance Exclusions

Finance APIs do not create accounting ledger entries, GST filings, purchase invoice posting, PDFs, or bank payment files yet.

## Purchase, Inventory & Asset Management APIs

All routes require JWT auth and permission-key guards.

Purchase permissions:

- `purchases.view`
- `purchases.manage`

Inventory permissions:

- `inventory.view`
- `inventory.manage`

Asset permissions:

- `assets.view`
- `assets.manage`

### Purchase Request Routes

- `GET /api/v1/purchases/requests`
- `POST /api/v1/purchases/requests`
- `PATCH /api/v1/purchases/requests/:id/status`

Purchase request statuses:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REJECTED`
- `ORDERED`
- `CANCELLED`

### Purchase Order Routes

- `GET /api/v1/purchases/orders`
- `POST /api/v1/purchases/orders`
- `PATCH /api/v1/purchases/orders/:id/status`

Purchase order statuses:

- `DRAFT`
- `SENT`
- `PARTIALLY_RECEIVED`
- `RECEIVED`
- `CANCELLED`

### Goods Received Note Routes

- `GET /api/v1/purchases/goods-received-notes`
- `POST /api/v1/purchases/goods-received-notes`

Goods received notes update inventory stock through `IN` stock movements for received inventory items.

### Inventory Routes

- `GET /api/v1/inventory/categories`
- `POST /api/v1/inventory/categories`
- `GET /api/v1/inventory/items`
- `POST /api/v1/inventory/items`
- `GET /api/v1/inventory/movements`
- `POST /api/v1/inventory/movements`
- `POST /api/v1/inventory/stock-adjustments`

Stock movement types:

- `IN`
- `OUT`
- `ADJUSTMENT`

Inventory item APIs store `lowStockThreshold` for later dashboard/UI reporting.

### Asset Routes

- `GET /api/v1/assets/categories`
- `POST /api/v1/assets/categories`
- `GET /api/v1/assets`
- `POST /api/v1/assets`
- `POST /api/v1/assets/:id/assign`
- `POST /api/v1/assets/:id/maintenance`

Asset statuses:

- `AVAILABLE`
- `ASSIGNED`
- `UNDER_MAINTENANCE`
- `RETIRED`
- `LOST`

Asset APIs include serial number and warranty expiry metadata. Maintenance records store metadata only and do not create invoices or accounting entries.

### Purchase, Inventory & Asset List Query Parameters

All list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Purchase requests also support:

- `requesterEmployeeId`: UUID employee ID
- `status`: purchase request status

Purchase orders also support:

- `vendorId`: UUID vendor ID
- `purchaseRequestId`: UUID purchase request ID
- `status`: purchase order status

Goods received notes also support:

- `purchaseOrderId`: UUID purchase order ID

Inventory items also support:

- `inventoryCategoryId`: UUID inventory category ID
- `status`: record status

Stock movements also support:

- `inventoryItemId`: UUID inventory item ID
- `type`: stock movement type

Assets also support:

- `assetCategoryId`: UUID asset category ID
- `assignedEmployeeId`: UUID employee ID
- `status`: asset status

### Purchase, Inventory & Asset Duplicate Rules

Inventory item create rejects another active item in the same `companyId` with matching `itemCode` or `sku`.

Asset create rejects another active asset in the same `companyId` with matching `assetTag` or `serialNumber`.

Purchase order create rejects another active order in the same `companyId` with matching `orderNumber`.

Inventory category and asset category create reject active duplicates by `companyId + name`.

### Purchase, Inventory & Asset Exclusions

Purchase, inventory, and asset APIs do not implement a full generic approval engine, accounting ledger posting, invoice posting, PDF generation, or frontend screens yet.

## Documents, Files & Knowledge Base APIs

All routes require JWT auth and permission-key guards.

Document permissions:

- `documents.view`
- `documents.upload`
- `documents.manage`

### Document Folder Routes

- `GET /api/v1/document-folders`
- `POST /api/v1/document-folders`
- `PATCH /api/v1/document-folders/:id`
- `DELETE /api/v1/document-folders/:id`

Folder APIs support parent-child hierarchy through `parentFolderId`. Folder `path` is generated from the hierarchy and folder name.

### Document Taxonomy Routes

- `GET /api/v1/document-categories`
- `POST /api/v1/document-categories`
- `GET /api/v1/document-tags`
- `POST /api/v1/document-tags`

### Document Record Routes

- `GET /api/v1/documents`
- `POST /api/v1/documents`
- `PATCH /api/v1/documents/:id`
- `PATCH /api/v1/documents/:id/status`
- `DELETE /api/v1/documents/:id`
- `POST /api/v1/documents/:id/versions`

Document visibility values:

- `COMPANY`
- `DEPARTMENT`
- `PRIVATE`

Document statuses:

- `ACTIVE`
- `ARCHIVED`

Document linked entity types:

- `EMPLOYEE`
- `CLIENT`
- `PROJECT`
- `TASK`
- `VENDOR`
- `ASSET`

Document version APIs store metadata only:

- `fileName`
- `storageKey`
- `mimeType`
- `size`
- `checksum`
- `notes`

They do not upload, scan, preview, or share binary files.

### Knowledge Base Routes

- `GET /api/v1/knowledge-base/categories`
- `POST /api/v1/knowledge-base/categories`
- `GET /api/v1/knowledge-base/articles`
- `POST /api/v1/knowledge-base/articles`
- `PATCH /api/v1/knowledge-base/articles/:id`
- `PATCH /api/v1/knowledge-base/articles/:id/status`
- `DELETE /api/v1/knowledge-base/articles/:id`

Knowledge base article statuses:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

Knowledge base articles can use the same document tags through article-tag join rows.

### Documents And Knowledge Base List Query Parameters

All list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Document folders also support:

- `parentFolderId`: UUID parent folder ID
- `departmentId`: UUID department ID
- `visibility`: document visibility

Documents also support:

- `folderId`: UUID folder ID
- `categoryId`: UUID category ID
- `departmentId`: UUID department ID
- `ownerUserId`: UUID owner user ID
- `visibility`: document visibility
- `status`: document status
- `linkedEntityType`: linked entity type
- `linkedEntityId`: linked entity UUID

Knowledge base categories also support:

- `parentCategoryId`: UUID parent category ID

Knowledge base articles also support:

- `categoryId`: UUID knowledge base category ID
- `status`: article status

### Documents And Knowledge Base Duplicate Rules

Folder create rejects another active folder in the same `companyId` with the same generated path.

Document create rejects another active document in the same `companyId` and folder with the same title.

Document category, document tag, and knowledge base category create reject active duplicates where sensible.

### Documents And Knowledge Base Exclusions

Document and knowledge base APIs do not implement binary upload/storage, OCR, document preview, public sharing, full text search indexing, or frontend screens yet.

## Communication, Announcements & Notifications APIs

All routes require JWT auth and permission-key guards.

Communication permissions:

- `communications.view`
- `communications.manage`

Notification permissions:

- `notifications.view`
- `notifications.manage`

### Announcement Routes

- `GET /api/v1/announcements`
- `POST /api/v1/announcements`
- `PATCH /api/v1/announcements/:id`
- `PATCH /api/v1/announcements/:id/status`
- `POST /api/v1/announcements/:id/read`
- `GET /api/v1/announcements/:id/read-receipts`

Announcement statuses:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

Announcement audience types:

- `ALL_COMPANY`
- `BRANCH`
- `DEPARTMENT`
- `EMPLOYEE`
- `ROLE`

### Notification Type Routes

- `GET /api/v1/notification-types`
- `POST /api/v1/notification-types`

### Internal Notification Routes

- `GET /api/v1/notifications`
- `POST /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/:id/unread`

Notification priorities:

- `LOW`
- `NORMAL`
- `HIGH`
- `URGENT`

Notification categories:

- `GENERAL`
- `SYSTEM`
- `HR`
- `ATTENDANCE`
- `LEAVE`
- `PAYROLL`
- `FINANCE`
- `PURCHASE`
- `INVENTORY`
- `ASSET`
- `CLIENT`
- `PROJECT`
- `TASK`
- `DOCUMENT`
- `KNOWLEDGE_BASE`

Notification linked entity types:

- `EMPLOYEE`
- `CLIENT`
- `PROJECT`
- `TASK`
- `ATTENDANCE`
- `LEAVE`
- `PAYROLL`
- `FINANCE`
- `PURCHASE`
- `INVENTORY`
- `ASSET`
- `DOCUMENT`
- `KNOWLEDGE_BASE`

Delivery channel metadata:

- `IN_APP`
- `EMAIL`
- `SMS`
- `WHATSAPP`
- `PUSH`

Delivery status metadata:

- `PENDING`
- `SENT`
- `FAILED`
- `SKIPPED`

### Preference Routes

- `GET /api/v1/notification-preferences`
- `POST /api/v1/notification-preferences`

Preferences are stored per user, category, and channel.

### Template Routes

- `GET /api/v1/notification-templates`
- `POST /api/v1/notification-templates`

Templates store metadata only. They do not render or send messages yet.

### Reminder Routes

- `GET /api/v1/reminders`
- `POST /api/v1/reminders`

Reminder statuses:

- `PENDING`
- `SENT`
- `CANCELLED`

Reminder records are metadata for future scheduled work. They are not executed by workers yet.

### Communication And Notification List Query Parameters

All list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Announcements also support:

- `status`: announcement status

Notification types also support:

- `category`: notification category

Notifications also support:

- `recipientUserId`: UUID user ID
- `category`: notification category
- `priority`: notification priority
- `entityType`: notification linked entity type
- `entityId`: linked entity UUID
- `isRead`: `true` or `false`

Notification preferences also support:

- `userId`: UUID user ID
- `category`: notification category
- `channel`: delivery channel

Notification templates also support:

- `category`: notification category
- `channel`: delivery channel

Reminders also support:

- `recipientUserId`: UUID user ID
- `status`: reminder status
- `category`: notification category

### Communication And Notification Exclusions

Communication and notification APIs do not integrate email, SMS, WhatsApp, push, or other providers yet. They do not enqueue BullMQ jobs, send real messages, execute reminder schedules, or implement frontend screens.

## Calendar, Meetings & Scheduling APIs

Permission keys:

- `calendar.view`
- `calendar.manage`

### Calendar Event Routes

- `GET /api/v1/calendar/events`
- `GET /api/v1/calendar/my`
- `GET /api/v1/calendar/company`
- `POST /api/v1/calendar/events`
- `PATCH /api/v1/calendar/events/:id`
- `PATCH /api/v1/calendar/events/:id/status`
- `PATCH /api/v1/calendar/events/:id/rsvp`
- `DELETE /api/v1/calendar/events/:id`

Event types:

- `MEETING`
- `TASK_DEADLINE`
- `PROJECT_MILESTONE`
- `HOLIDAY`
- `INTERVIEW`
- `CLIENT_MEETING`
- `REMINDER`
- `BIRTHDAY`
- `WORK_ANNIVERSARY`
- `CUSTOM`

Event statuses:

- `SCHEDULED`
- `COMPLETED`
- `CANCELLED`
- `POSTPONED`

RSVP statuses:

- `PENDING`
- `ACCEPTED`
- `DECLINED`
- `TENTATIVE`

Linked entity types:

- `EMPLOYEE`
- `CLIENT`
- `PROJECT`
- `TASK`
- `LEAVE`
- `HOLIDAY`
- `DOCUMENT`

### Resource Routes

- `GET /api/v1/calendar/resources`
- `POST /api/v1/calendar/resources`

### Resource Booking Routes

- `GET /api/v1/calendar/resource-bookings`
- `POST /api/v1/calendar/resources/:id/bookings`

### Calendar List Query Parameters

All calendar list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Event lists also support:

- `eventType`: calendar event type
- `status`: event status
- `fromDate`: ISO date-time lower bound for overlapping events
- `toDate`: ISO date-time upper bound for overlapping events
- `attendeeUserId`: UUID user ID
- `entityType`: linked entity type
- `entityId`: linked entity UUID

Resource lists also support:

- `status`: resource record status

Resource booking lists also support:

- `status`: booking record status
- `resourceId`: UUID resource ID
- `eventId`: UUID event ID
- `fromDate`: ISO date-time lower bound for overlapping bookings
- `toDate`: ISO date-time upper bound for overlapping bookings

### Calendar Exclusions

Calendar APIs store scheduling and reminder metadata only. They do not integrate Google Calendar, send reminders, enqueue BullMQ jobs, execute recurrence expansion, call providers, or implement frontend screens.

## Helpdesk / Internal Tickets APIs

Permission keys:

- `helpdesk.view`
- `helpdesk.manage`

### Category Routes

- `GET /api/v1/helpdesk/categories`
- `POST /api/v1/helpdesk/categories`

### Subcategory Routes

- `GET /api/v1/helpdesk/subcategories`
- `POST /api/v1/helpdesk/categories/:id/subcategories`

### Ticket Routes

- `GET /api/v1/helpdesk/tickets`
- `GET /api/v1/helpdesk/tickets/my`
- `GET /api/v1/helpdesk/tickets/queue`
- `POST /api/v1/helpdesk/tickets`
- `PATCH /api/v1/helpdesk/tickets/:id`
- `PATCH /api/v1/helpdesk/tickets/:id/status`
- `PATCH /api/v1/helpdesk/tickets/:id/assignment`
- `DELETE /api/v1/helpdesk/tickets/:id`

### Ticket Child Routes

- `POST /api/v1/helpdesk/tickets/:id/comments`
- `POST /api/v1/helpdesk/tickets/:id/internal-notes`
- `POST /api/v1/helpdesk/tickets/:id/attachments`

Ticket statuses:

- `OPEN`
- `IN_PROGRESS`
- `WAITING_FOR_EMPLOYEE`
- `WAITING_FOR_ADMIN`
- `RESOLVED`
- `CLOSED`
- `CANCELLED`

Ticket priorities:

- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

Ticket sources:

- `EMPLOYEE`
- `ADMIN`
- `SYSTEM`

Linked entity types:

- `EMPLOYEE`
- `ASSET`
- `DOCUMENT`
- `PAYROLL`
- `ATTENDANCE`
- `LEAVE`
- `FINANCE`
- `PURCHASE`
- `INVENTORY`

### Helpdesk List Query Parameters

All helpdesk list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`

Categories also support:

- `departmentId`: UUID department ID

Subcategories also support:

- `categoryId`: UUID category ID

Ticket, my ticket, and queue lists also support:

- `priority`: ticket priority
- `source`: ticket source
- `requesterUserId`: UUID user ID
- `requesterEmployeeId`: UUID employee ID
- `assignedUserId`: UUID user ID
- `assignedEmployeeId`: UUID employee ID
- `assignedTeamName`: team placeholder string
- `departmentId`: UUID department ID
- `categoryId`: UUID category ID
- `subcategoryId`: UUID subcategory ID
- `entityType`: linked entity type
- `entityId`: linked entity UUID

### Helpdesk Exclusions

Helpdesk APIs store records and metadata only. They do not run real SLA workers, send notifications, upload files, store binary content, auto-route tickets, or implement frontend screens.

## Performance, Goals & Appraisals APIs

Permission keys:

- `performance.view`
- `performance.manage`

### Cycle Routes

- `GET /api/v1/performance/cycles`
- `POST /api/v1/performance/cycles`

### Goal Routes

- `GET /api/v1/performance/goals`
- `POST /api/v1/performance/goals`
- `POST /api/v1/performance/goals/:id/progress`
- `PATCH /api/v1/performance/goals/:id/status`

Goal statuses:

- `DRAFT`
- `ACTIVE`
- `COMPLETED`
- `CANCELLED`

### KPI Routes

- `POST /api/v1/performance/kpi-categories`
- `POST /api/v1/performance/kpis`

### Review Routes

- `GET /api/v1/performance/review-templates`
- `POST /api/v1/performance/review-templates`
- `GET /api/v1/performance/reviews`
- `POST /api/v1/performance/reviews`
- `PATCH /api/v1/performance/reviews/:id/status`
- `POST /api/v1/performance/reviews/:id/responses`

Review statuses:

- `DRAFT`
- `SELF_REVIEW`
- `MANAGER_REVIEW`
- `HR_REVIEW`
- `COMPLETED`
- `CANCELLED`

### Feedback And Metadata Routes

- `POST /api/v1/performance/feedback`
- `POST /api/v1/performance/one-on-ones`
- `POST /api/v1/performance/promotion-recommendations`

### Summary Routes

- `GET /api/v1/performance/employees/:employeeId/summary`
- `GET /api/v1/performance/managers/:managerEmployeeId/team-summary`

### Performance List Query Parameters

All performance list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`

Goal lists also support:

- `cycleId`: UUID cycle ID
- `employeeId`: UUID employee ID

Review lists also support:

- `cycleId`: UUID cycle ID
- `employeeId`: UUID employee ID
- `managerEmployeeId`: UUID manager employee ID

### Performance Exclusions

Performance APIs store records and metadata only. They do not apply payroll appraisal increments, create calendar meetings, send notifications, run automated appraisal workflows, or implement frontend screens.

## Recruitment & Onboarding APIs

Permission keys:

- `recruitment.view`
- `recruitment.manage`

### Job Opening Routes

- `GET /api/v1/recruitment/jobs`
- `POST /api/v1/recruitment/jobs`
- `PATCH /api/v1/recruitment/jobs/:id/status`

Job opening statuses:

- `DRAFT`
- `OPEN`
- `PAUSED`
- `CLOSED`
- `CANCELLED`

### Candidate Routes

- `GET /api/v1/recruitment/candidates`
- `POST /api/v1/recruitment/candidates`

Candidates are duplicate-protected per company by email or phone when either value is present.

### Pipeline Stage Routes

- `GET /api/v1/recruitment/pipeline-stages`
- `POST /api/v1/recruitment/pipeline-stages`

### Application Routes

- `GET /api/v1/recruitment/applications`
- `POST /api/v1/recruitment/applications`
- `PATCH /api/v1/recruitment/applications/:id/status`
- `POST /api/v1/recruitment/applications/:id/convert-to-employee`

Application statuses:

- `APPLIED`
- `SCREENING`
- `INTERVIEW`
- `OFFERED`
- `HIRED`
- `REJECTED`
- `WITHDRAWN`

Candidate-to-employee conversion happens only through the explicit conversion endpoint.

### Interview Routes

- `POST /api/v1/recruitment/interviews`
- `POST /api/v1/recruitment/interviews/:id/feedback`

### Offer Routes

- `POST /api/v1/recruitment/offers`
- `PATCH /api/v1/recruitment/offers/:id/status`

Offer statuses:

- `DRAFT`
- `SENT`
- `ACCEPTED`
- `DECLINED`
- `EXPIRED`
- `CANCELLED`

### Onboarding Routes

- `POST /api/v1/recruitment/onboarding-checklists`
- `POST /api/v1/recruitment/onboarding-checklists/:id/items`
- `PATCH /api/v1/recruitment/onboarding-items/:id/complete`

### Recruitment List Query Parameters

All recruitment list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`

Job lists also support:

- `departmentId`: UUID department ID
- `designationId`: UUID designation ID

Candidate lists also support:

- `source`: candidate source string

Application lists also support:

- `candidateId`: UUID candidate ID
- `jobOpeningId`: UUID job opening ID
- `stageId`: UUID pipeline stage ID

### Recruitment Exclusions

Recruitment APIs store records and metadata only. They do not generate PDF offer letters, send emails or notifications, create calendar interview events, automatically create employees without the conversion endpoint, or implement frontend screens.

## Sales, Leads & Quotations APIs

Permission keys:

- `sales.view`
- `sales.manage`

Existing `leads.*` permission keys remain seeded for future finer-grained policy.

### Lead Source And Stage Routes

- `GET /api/v1/sales/lead-sources`
- `POST /api/v1/sales/lead-sources`
- `GET /api/v1/sales/lead-stages`
- `POST /api/v1/sales/lead-stages`

### Lead Routes

- `GET /api/v1/sales/leads`
- `GET /api/v1/sales/leads/:id`
- `POST /api/v1/sales/leads`
- `PATCH /api/v1/sales/leads/:id`
- `DELETE /api/v1/sales/leads/:id`
- `POST /api/v1/sales/leads/:id/activities`
- `POST /api/v1/sales/leads/:id/notes`
- `PATCH /api/v1/sales/leads/:id/assignment`
- `PATCH /api/v1/sales/leads/:id/status`
- `POST /api/v1/sales/leads/:id/convert-to-client`

Lead statuses:

- `NEW`
- `CONTACTED`
- `QUALIFIED`
- `PROPOSAL`
- `NEGOTIATION`
- `WON`
- `LOST`
- `ARCHIVED`

Leads are duplicate-protected per company by email or phone when either value is present.

### Opportunity Routes

- `POST /api/v1/sales/opportunity-stages`
- `GET /api/v1/sales/opportunities`
- `GET /api/v1/sales/opportunities/:id`
- `POST /api/v1/sales/opportunities`
- `PATCH /api/v1/sales/opportunities/:id`
- `PATCH /api/v1/sales/opportunities/:id/status`
- `DELETE /api/v1/sales/opportunities/:id`

Opportunity statuses:

- `OPEN`
- `WON`
- `LOST`
- `CANCELLED`

### Quotation Routes

- `GET /api/v1/sales/quotations`
- `GET /api/v1/sales/quotations/:id`
- `POST /api/v1/sales/quotations`
- `PATCH /api/v1/sales/quotations/:id`
- `POST /api/v1/sales/quotations/:id/versions`
- `PATCH /api/v1/sales/quotations/:id/status`
- `DELETE /api/v1/sales/quotations/:id`

Quotation statuses:

- `DRAFT`
- `SENT`
- `ACCEPTED`
- `REJECTED`
- `EXPIRED`
- `CANCELLED`

### Sales List Query Parameters

All sales list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`

Lead lists also support:

- `sourceId`: UUID lead source ID
- `stageId`: UUID lead stage ID
- `assignedUserId`: UUID user ID
- `assignedEmployeeId`: UUID employee ID

Opportunity lists also support:

- `leadId`: UUID lead ID
- `clientId`: UUID client ID
- `stageId`: UUID opportunity stage ID

Quotation lists also support:

- `opportunityId`: UUID opportunity ID
- `leadId`: UUID lead ID
- `clientId`: UUID client ID

### Sales Exclusions

Sales APIs store records and metadata only. They do not generate quotation PDFs, send email or WhatsApp messages, create invoices, record payments, post accounting ledger entries, or implement frontend screens.

## Invoices, Billing & Receivables APIs

Permission keys:

- `billing.view`
- `billing.manage`

### Invoice Series Routes

- `GET /api/v1/billing/invoice-series`
- `POST /api/v1/billing/invoice-series`

Invoice series stores numbering metadata:

- `name`
- `prefix`
- `nextNumber`
- `padding`
- `suffix`
- `financialYear`
- `isDefault`

### Invoice Routes

- `GET /api/v1/billing/invoices`
- `GET /api/v1/billing/invoices/:id`
- `POST /api/v1/billing/invoices`
- `PATCH /api/v1/billing/invoices/:id`
- `PATCH /api/v1/billing/invoices/:id/issue`
- `PATCH /api/v1/billing/invoices/:id/cancel`
- `PATCH /api/v1/billing/invoices/:id/write-off`
- `POST /api/v1/billing/quotations/:quotationId/convert-to-invoice`

Invoice statuses:

- `DRAFT`
- `ISSUED`
- `PARTIALLY_PAID`
- `PAID`
- `OVERDUE`
- `CANCELLED`
- `WRITTEN_OFF`

Invoices require `clientId` and support optional `projectId`, `opportunityId`, `quotationId`, and `seriesId`.

Invoice item APIs store tax and discount metadata only. They do not generate PDFs or post accounting ledger entries.

### Receipts And Allocation Routes

- `GET /api/v1/billing/payment-receipts`
- `POST /api/v1/billing/payment-receipts`
- `POST /api/v1/billing/payment-receipts/:id/allocations`

Payment modes reuse the finance payment mode enum:

- `CASH`
- `BANK_TRANSFER`
- `UPI`
- `CARD`
- `CHEQUE`
- `OTHER`

Receipt allocations update invoice `paidAmount`, `balanceAmount`, and status to `PARTIALLY_PAID` or `PAID` as applicable.

### Credit And Debit Note Routes

- `POST /api/v1/billing/credit-notes`
- `POST /api/v1/billing/debit-notes`

Credit note and debit note APIs store metadata only.

### Receivables Summary Routes

- `GET /api/v1/billing/receivables/summary`
- `GET /api/v1/billing/clients/:clientId/statement`
- `GET /api/v1/billing/receivables/aging`

### Billing List Query Parameters

All billing list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Invoice lists also support:

- `status`: invoice status
- `clientId`: UUID client ID
- `projectId`: UUID project ID
- `opportunityId`: UUID opportunity ID

### Billing Duplicate Rules

Invoice create rejects another invoice with the same `companyId` and `invoiceNumber`.

Invoice series create rejects another active series with the same `companyId` and `name`.

### Billing Exclusions

Billing APIs store records and metadata only. They do not generate invoice PDFs, send email or WhatsApp messages, post full accounting ledger entries, integrate payment gateways, create bank files, or implement frontend screens.

## Approvals Workflow APIs

Permission keys:

- `approvals.view`
- `approvals.manage`
- `approvals.approve`

### Workflow Routes

- `GET /api/v1/approvals/workflows`
- `POST /api/v1/approvals/workflows`
- `PATCH /api/v1/approvals/workflows/:id`
- `DELETE /api/v1/approvals/workflows/:id`

Workflow definitions contain ordered steps. Step approver types:

- `USER`
- `EMPLOYEE`
- `ROLE`
- `DEPARTMENT_HEAD`
- `REPORTING_MANAGER`
- `FINANCE_MANAGER`
- `HR_MANAGER`
- `ADMIN`

### Request Routes

- `GET /api/v1/approvals/requests`
- `POST /api/v1/approvals/requests`
- `PATCH /api/v1/approvals/requests/:id/approve`
- `PATCH /api/v1/approvals/requests/:id/reject`
- `PATCH /api/v1/approvals/requests/:id/cancel`
- `PATCH /api/v1/approvals/requests/:id/delegate`

Request statuses:

- `DRAFT`
- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

Step statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `SKIPPED`

Linked entity types:

- `LEAVE`
- `ATTENDANCE_CORRECTION`
- `EXPENSE_CLAIM`
- `PURCHASE_REQUEST`
- `PAYROLL_RUN`
- `VENDOR_BILL`
- `INVOICE`
- `QUOTATION`
- `ASSET_ASSIGNMENT`
- `DOCUMENT`
- `CUSTOM`

### Pending And History Routes

- `GET /api/v1/approvals/pending`
- `GET /api/v1/approvals/history/:entityType/:entityId`

### Approval List Query Parameters

All approval list endpoints support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Workflow lists also support:

- `status`: record status
- `entityType`: linked entity type

Request and pending lists also support:

- `status`: approval request status
- `entityType`: linked entity type
- `entityId`: linked entity ID
- `workflowDefinitionId`: UUID workflow definition ID

### Approval Duplicate Rules

Workflow create rejects another active workflow definition in the same company with the same `key`.

### Approval Exclusions

Approval APIs store reusable approval records and metadata only. They do not refactor existing local approval flows, send notifications, execute escalation workers, resolve dynamic approver types automatically, enqueue BullMQ jobs, or implement frontend screens yet.

## Dashboard, Reports & Analytics APIs

Permission keys:

- `dashboard.view`
- `reports.view`
- `reports.export`

### Dashboard Summary Routes

All dashboard summary routes support optional date range filters:

- `fromDate`: ISO date
- `toDate`: ISO date

Routes:

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/hr`
- `GET /api/v1/dashboard/projects-tasks`
- `GET /api/v1/dashboard/crm-sales`
- `GET /api/v1/dashboard/finance`
- `GET /api/v1/dashboard/inventory-assets`
- `GET /api/v1/dashboard/helpdesk`
- `GET /api/v1/dashboard/approvals`
- `GET /api/v1/dashboard/calendar`

### Reports Registry Routes

- `GET /api/v1/reports/registry`
- `GET /api/v1/reports/metadata/:reportType`

Registry entries include:

- `reportType`
- `name`
- `module`
- `description`
- `permissionKey`
- `availableFilters`

Current report types:

- `company_dashboard_summary`
- `hr_summary`
- `projects_tasks_summary`
- `crm_sales_summary`
- `finance_summary`
- `inventory_assets_summary`
- `helpdesk_summary`
- `approvals_summary`
- `calendar_summary`

### Export Request Metadata Routes

- `POST /api/v1/reports/export-requests`
- `GET /api/v1/reports/export-requests`

Create body:

```json
{
  "reportType": "hr_summary",
  "requestedFilters": {
    "fromDate": "2035-01-01",
    "toDate": "2035-12-31"
  },
  "format": "CSV"
}
```

Formats:

- `CSV`
- `XLSX`
- `PDF`

Statuses:

- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`

### Export Request List Query Parameters

Export request lists support standard list parameters:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

They also support:

- `reportType`
- `format`
- `status`
- `fromDate`
- `toDate`

### Dashboard And Report Exclusions

Dashboard/report APIs return summaries and metadata only. They do not generate CSV, XLSX, or PDF files, run BullMQ workers, provide real-time dashboard updates, store report configuration, integrate file storage, or implement frontend screens yet.
