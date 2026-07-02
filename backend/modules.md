# Modules Documentation

## 1. Authentication

Features:
- Login
- Logout
- Refresh token
- Password reset
- 2FA
- Session tracking
- Device tracking
- Login history

Core APIs:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

## 2. Employees / HR

Features:
- Employee profiles
- Department and designation mapping
- Document records
- Emergency contacts
- Joining details
- Exit management
- Probation tracking
- Employment status

Core APIs:
- `GET /api/v1/employees`
- `POST /api/v1/employees`
- `GET /api/v1/employees/:id`
- `PATCH /api/v1/employees/:id`
- `DELETE /api/v1/employees/:id`
- `POST /api/v1/employees/:id/documents`

## 3. Attendance

Features:
- Check-in/check-out
- Daily attendance
- Late marks
- Overtime
- Shift assignment
- Location/device metadata
- Monthly reports

Core APIs:
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/check-out`
- `GET /api/v1/attendance/today`
- `GET /api/v1/attendance/monthly`
- `GET /api/v1/attendance/employees/:employeeId`

## 4. Leave Management

Features:
- Leave types
- Leave balance
- Leave requests
- Approval workflow
- Holiday calendar
- Leave reports

Core APIs:
- `GET /api/v1/leaves/types`
- `POST /api/v1/leaves/request`
- `GET /api/v1/leaves/requests`
- `PATCH /api/v1/leaves/requests/:id/approve`
- `PATCH /api/v1/leaves/requests/:id/reject`

## 5. Payroll

Features:
- Salary structures
- Monthly payroll runs
- Allowances
- Deductions
- Advances
- Payslips
- Payroll reports

Core APIs:
- `GET /api/v1/payroll/salary-structures`
- `POST /api/v1/payroll/salary-structures`
- `POST /api/v1/payroll/runs`
- `GET /api/v1/payroll/runs/:id`
- `GET /api/v1/payroll/payslips/:employeeId`

## 6. Projects & Tasks

Features:
- Projects
- Milestones
- Tasks
- Subtasks
- Priorities
- Status boards
- Comments
- Attachments
- Time logs

Core APIs:
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `POST /api/v1/projects/:id/tasks`
- `PATCH /api/v1/tasks/:id/status`
- `POST /api/v1/tasks/:id/comments`

## 7. Clients / CRM

Features:
- Company and individual clients
- Client contacts
- Client documents
- Activities timeline
- Notes
- Projects
- Invoices
- Payments
- Follow-ups

Core APIs:
- `GET /api/v1/clients`
- `POST /api/v1/clients`
- `GET /api/v1/clients/:id`
- `PATCH /api/v1/clients/:id`
- `DELETE /api/v1/clients/:id`
- `GET /api/v1/clients/:id/activities`
- `POST /api/v1/clients/:id/contacts`
- `POST /api/v1/clients/:id/notes`

## 8. Sales / Leads

Features:
- Lead capture
- Pipeline stages
- Follow-ups
- Quotations
- Conversion tracking
- Sales reports

Core APIs:
- `GET /api/v1/leads`
- `POST /api/v1/leads`
- `PATCH /api/v1/leads/:id/stage`
- `POST /api/v1/leads/:id/follow-ups`
- `POST /api/v1/leads/:id/convert`

## 9. Finance

Features:
- Income
- Expenses
- Invoices
- Receipts
- Payments
- Outstanding amounts
- Petty cash
- Financial reports

Core APIs:
- `GET /api/v1/finance/invoices`
- `POST /api/v1/finance/invoices`
- `PATCH /api/v1/finance/invoices/:id/status`
- `GET /api/v1/finance/expenses`
- `POST /api/v1/finance/expenses`
- `GET /api/v1/finance/reports/summary`

## 10. Purchases & Vendors

Features:
- Vendor profiles
- Purchase requests
- Quotations
- Purchase orders
- Bills
- Payment status

Core APIs:
- `GET /api/v1/vendors`
- `POST /api/v1/vendors`
- `GET /api/v1/purchases/requests`
- `POST /api/v1/purchases/requests`
- `POST /api/v1/purchases/orders`

## 11. Inventory & Assets

Features:
- Office assets
- Consumables
- Asset assignment
- Maintenance
- Warranty tracking
- Depreciation
- Stock movement

Core APIs:
- `GET /api/v1/assets`
- `POST /api/v1/assets`
- `POST /api/v1/assets/:id/assign`
- `POST /api/v1/assets/:id/maintenance`
- `GET /api/v1/inventory/items`
- `POST /api/v1/inventory/movements`

## 12. Documents

Features:
- Folder structure
- File upload
- Versioning
- Permissions
- Expiry alerts
- Document categories

Core APIs:
- `POST /api/v1/documents/upload`
- `GET /api/v1/documents`
- `GET /api/v1/documents/:id`
- `PATCH /api/v1/documents/:id/permissions`
- `POST /api/v1/documents/:id/versions`

## 13. Approvals

Features:
- Generic approval requests
- Multi-step approval rules
- Approver assignment
- Approval comments
- Approval audit trail

Core APIs:
- `GET /api/v1/approvals/pending`
- `POST /api/v1/approvals/requests`
- `PATCH /api/v1/approvals/requests/:id/approve`
- `PATCH /api/v1/approvals/requests/:id/reject`
- `GET /api/v1/approvals/rules`
- `POST /api/v1/approvals/rules`

## 14. Helpdesk

Features:
- Internal tickets
- Categories
- Priority
- Assignment
- SLA
- Comments
- Attachments

Core APIs:
- `GET /api/v1/helpdesk/tickets`
- `POST /api/v1/helpdesk/tickets`
- `PATCH /api/v1/helpdesk/tickets/:id/status`
- `POST /api/v1/helpdesk/tickets/:id/comments`

## 15. Reports

Features:
- Attendance reports
- Payroll reports
- Finance reports
- Client reports
- Task reports
- Asset reports
- Export to CSV/PDF

Core APIs:
- `GET /api/v1/reports/attendance`
- `GET /api/v1/reports/payroll`
- `GET /api/v1/reports/finance`
- `POST /api/v1/reports/export`
