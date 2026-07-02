# Security and Permissions

## Authentication

Use JWT access token + refresh token.

Recommended expiry:
- Access token: 15 minutes
- Refresh token: 30 days

Store refresh token hashes in database.

## Password Rules

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional special character requirement

## Two-Factor Authentication

Support later through:
- Email OTP
- TOTP authenticator apps

## Role-Based Access Control

Use roles and permissions. Do not hardcode access by role name only.

Example permissions:

```text
employees.view
employees.create
employees.update
employees.delete
attendance.view
attendance.manage
leaves.approve
payroll.view
payroll.manage
clients.view
clients.create
clients.update
clients.delete
finance.view
finance.manage
settings.manage
```

## Default Roles

### Super Admin
Full system access.

### Admin
Full company-level access except dangerous system settings.

### HR Manager
Employee, attendance, leave, payroll-related access.

### Finance Manager
Finance, invoices, payments, expenses, payroll view/manage access.

### Project Manager
Projects, tasks, team view, approvals assigned to manager.

### Employee
Self-service access for attendance, leave, tasks, documents, tickets.

## Audit Logging

Audit all critical actions:
- Creating/updating/deleting employees
- Changing salary
- Running payroll
- Creating invoices
- Approving/rejecting requests
- Changing permissions
- Exporting reports
- Uploading/deleting documents

## Data Export Protection

Exports should require explicit permission:

```text
reports.export
```

## API Protection

Use:
- JWT guard
- Permission guard
- Rate limiting
- Request validation
- CORS allowlist
- Helmet security headers
- Input sanitization
