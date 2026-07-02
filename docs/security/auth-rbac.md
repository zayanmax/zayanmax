# Auth And RBAC

Last updated: 2026-07-02

## Auth Model

The backend uses JWT bearer authentication:

- Access token expiry: `JWT_ACCESS_EXPIRES_IN`, default example `15m`
- Refresh token expiry: `JWT_REFRESH_EXPIRES_IN`, default example `30d`
- Login route: `POST /api/v1/auth/login`
- Refresh route: `POST /api/v1/auth/refresh`
- Current user route: `GET /api/v1/auth/me`

Login returns:

- `accessToken`
- `refreshToken`
- `sessionId`
- `user`

## Session Foundation

Session/device metadata is stored in `UserSession`.

Tracked fields:

- `companyId`
- `userId`
- refresh token hash
- optional device name
- optional IP address
- optional user agent
- last used timestamp
- expiry timestamp
- revoked timestamp

Supported endpoints:

- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`

Refresh accepts optional `sessionId` and rotates the matching session refresh token hash when present.

## Password Management

Supported endpoints:

- `POST /api/v1/auth/change-password`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`

Password reset is metadata-only. The backend stores hashed reset tokens in `PasswordResetToken`, but it does not send email, SMS, or WhatsApp messages yet.

Password change:

- Requires the current password.
- Rejects reuse of the same password.
- Updates the password hash.
- Revokes active sessions.
- Writes an audit log action `auth.password.change`.

## RBAC Model

Controllers use permission-key guards through:

```ts
@RequirePermissions('employees.view')
```

The seed script provisions all permission keys used by implemented controllers. Latest audit result:

- Controller permission usages: 64.
- Seeded permission keys: 69.
- Missing seeded permission keys: 0.

## Seeded Permission Keys

| Key | Module | Action |
| --- | --- | --- |
| `dashboard.view` | dashboard | view |
| `employees.view` | employees | view |
| `employees.create` | employees | create |
| `employees.update` | employees | update |
| `employees.delete` | employees | delete |
| `attendance.view` | attendance | view |
| `attendance.manage` | attendance | manage |
| `leaves.view` | leaves | view |
| `leaves.request` | leaves | request |
| `leaves.approve` | leaves | approve |
| `payroll.view` | payroll | view |
| `payroll.manage` | payroll | manage |
| `performance.view` | performance | view |
| `performance.manage` | performance | manage |
| `recruitment.view` | recruitment | view |
| `recruitment.manage` | recruitment | manage |
| `projects.view` | projects | view |
| `projects.create` | projects | create |
| `projects.update` | projects | update |
| `projects.delete` | projects | delete |
| `tasks.view` | tasks | view |
| `tasks.create` | tasks | create |
| `tasks.update` | tasks | update |
| `tasks.delete` | tasks | delete |
| `clients.view` | clients | view |
| `clients.create` | clients | create |
| `clients.update` | clients | update |
| `clients.delete` | clients | delete |
| `leads.view` | leads | view |
| `leads.create` | leads | create |
| `leads.update` | leads | update |
| `leads.convert` | leads | convert |
| `sales.view` | sales | view |
| `sales.manage` | sales | manage |
| `billing.view` | billing | view |
| `billing.manage` | billing | manage |
| `finance.view` | finance | view |
| `finance.manage` | finance | manage |
| `purchases.view` | purchases | view |
| `purchases.manage` | purchases | manage |
| `vendors.view` | vendors | view |
| `vendors.manage` | vendors | manage |
| `inventory.view` | inventory | view |
| `inventory.manage` | inventory | manage |
| `assets.view` | assets | view |
| `assets.manage` | assets | manage |
| `documents.view` | documents | view |
| `documents.upload` | documents | upload |
| `documents.manage` | documents | manage |
| `calendar.view` | calendar | view |
| `calendar.manage` | calendar | manage |
| `communications.view` | communications | view |
| `communications.manage` | communications | manage |
| `notifications.view` | notifications | view |
| `notifications.manage` | notifications | manage |
| `approvals.view` | approvals | view |
| `approvals.manage` | approvals | manage |
| `approvals.approve` | approvals | approve |
| `reports.view` | reports | view |
| `reports.export` | reports | export |
| `helpdesk.view` | helpdesk | view |
| `helpdesk.manage` | helpdesk | manage |
| `settings.view` | settings | view |
| `settings.manage` | settings | manage |
| `roles.view` | roles | view |
| `roles.manage` | roles | manage |
| `permissions.view` | permissions | view |
| `permissions.manage` | permissions | manage |
| `audit_logs.view` | audit_logs | view |

## Current Exclusions

- No OAuth/social login.
- No 2FA.
- No real password reset delivery provider.
- No Redis-backed session cache.
- No frontend auth screens.
