# Database Design

## Database

Use PostgreSQL with Prisma.

## Global Columns

Most tables should include:

```text
id UUID PRIMARY KEY
companyId UUID
branchId UUID NULL
createdAt TIMESTAMP
updatedAt TIMESTAMP
deletedAt TIMESTAMP NULL
createdById UUID NULL
updatedById UUID NULL
```

Use soft delete for business records.

## Core Tables

### companies
- id
- name
- legalName
- logoUrl
- email
- phone
- address
- timezone
- currency
- status

### branches
- id
- companyId
- name
- address
- phone
- status

### users
- id
- companyId
- employeeId
- email
- passwordHash
- isEmailVerified
- status
- lastLoginAt

### employees
- id
- companyId
- branchId
- employeeCode
- firstName
- lastName
- email
- phone
- departmentId
- designationId
- reportingManagerId
- joiningDate
- employmentType
- status

### roles
- id
- companyId
- name
- description
- isSystemRole

### permissions
- id
- key
- module
- action
- description

### role_permissions
- roleId
- permissionId

### attendance_records
- id
- employeeId
- date
- checkInAt
- checkOutAt
- status
- lateMinutes
- overtimeMinutes
- source
- location

### leave_requests
- id
- employeeId
- leaveTypeId
- fromDate
- toDate
- days
- reason
- status
- approvalRequestId

### approval_requests
- id
- companyId
- module
- entityType
- entityId
- requestedById
- status
- currentStep

### approval_steps
- id
- approvalRequestId
- stepOrder
- approverId
- approverRoleId
- status
- comment
- decidedAt

### clients
- id
- companyId
- type
- name
- email
- phone
- website
- industry
- companySize
- taxNumber
- billingAddress
- status
- ownerId

### client_contacts
- id
- clientId
- name
- designation
- email
- phone
- isPrimary

### projects
- id
- companyId
- clientId
- name
- description
- status
- startDate
- endDate
- managerId

### tasks
- id
- projectId
- title
- description
- status
- priority
- assigneeId
- dueDate

### invoices
- id
- companyId
- clientId
- invoiceNumber
- invoiceDate
- dueDate
- subtotal
- tax
- total
- paidAmount
- status

### expenses
- id
- companyId
- categoryId
- amount
- expenseDate
- description
- status
- approvalRequestId

### files
- id
- companyId
- originalName
- storageKey
- mimeType
- size
- uploadedById
- visibility

### notifications
- id
- companyId
- userId
- title
- message
- type
- channel
- readAt

### audit_logs
- id
- companyId
- actorId
- action
- entityType
- entityId
- oldValue
- newValue
- ipAddress
- userAgent
- createdAt

## Indexing Rules

Add indexes for:
- `companyId`
- `branchId`
- `status`
- `createdAt`
- `employeeId`
- `clientId`
- `projectId`
- `date`
- frequently searched fields like `email`, `phone`, `employeeCode`, `invoiceNumber`

## Data Isolation

Every query must scope records by `companyId` unless it is a system-level super admin action.
