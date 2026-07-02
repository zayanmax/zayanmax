# API Structure

## Base URL

```text
/api/v1
```

## Standard Controller Pattern

```text
GET    /resource
POST   /resource
GET    /resource/:id
PATCH  /resource/:id
DELETE /resource/:id
```

## Query Parameters

Common list APIs should support:

```text
?page=1
&limit=20
&search=keyword
&sortBy=createdAt
&sortOrder=desc
&status=ACTIVE
&fromDate=2026-01-01
&toDate=2026-01-31
```

## Response Format

### Success

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Permission denied",
  "errorCode": "FORBIDDEN",
  "details": null
}
```

## HTTP Status Usage

- `200` Success
- `201` Created
- `400` Bad request
- `401` Unauthorized
- `403` Forbidden
- `404` Not found
- `409` Conflict
- `422` Validation error
- `500` Server error

## API Naming Rules

Use plural nouns:

```text
/employees
/clients
/projects
/tasks
/invoices
/approvals
```

Use action routes only when necessary:

```text
/attendance/check-in
/attendance/check-out
/leads/:id/convert
/approvals/:id/approve
/approvals/:id/reject
```

## DTO Validation

Use `class-validator` and `class-transformer`.

Example:

```ts
export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

## Authentication Header

```text
Authorization: Bearer <access_token>
```

## Permission Decorator Example

```ts
@RequirePermissions('clients.create')
@Post()
create(@Body() dto: CreateClientDto) {}
```

## File Upload APIs

Use multipart form data:

```text
POST /api/v1/documents/upload
Content-Type: multipart/form-data
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "file_id",
    "url": "signed_or_public_url",
    "fileName": "contract.pdf",
    "mimeType": "application/pdf",
    "size": 120394
  }
}
```

## Audit Requirements

Create audit logs for:
- Login/logout
- Employee create/update/delete
- Payroll changes
- Finance actions
- Approval decisions
- Role/permission changes
- Document access changes
- Data exports
