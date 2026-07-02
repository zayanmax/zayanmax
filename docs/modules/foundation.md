# Foundation Module Notes

The foundation is the first backend milestone.

## Modules

### Auth

Responsibilities:

- Login
- Logout
- Refresh token
- Password reset later
- `GET /api/v1/auth/me`
- Session/device tracking where practical

Important rules:

- Store refresh token hashes, not raw refresh tokens.
- Access token expiry: 15 minutes.
- Refresh token expiry: 30 days.

### Users

Responsibilities:

- User account records.
- Email/password authentication identity.
- Link to employee records where applicable.
- Status and email verification fields.

### Roles and Permissions

Responsibilities:

- Seed permission keys from `backend/permissions-seed.md`.
- Assign permissions to roles through `role_permissions`.
- Use permission keys for guards.
- Do not hardcode role names inside permission checks.

### Companies and Branches

Responsibilities:

- Company identity and settings.
- Branch records.
- Provide `companyId` and optional `branchId` scoping for other modules.

### Departments and Designations

Responsibilities:

- HR organization structure.
- Employee mapping support.

### Employees

Responsibilities:

- Employee profiles.
- Department/designation assignment.
- Reporting manager.
- Employment status.
- Joining date and employment type.

### Audit Logs

Responsibilities:

- Record critical changes.
- Store actor, action, entity type, entity ID, old value, new value, IP, and user agent.

## Initial API Surface

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- Standard CRUD routes for employees.
- Standard CRUD routes for companies, branches, departments, and designations.
- Role and permission management routes for admins.
