# Clients And CRM Frontend

Last updated: 2026-07-02

## Scope

Implemented frontend screens for the Clients / CRM module.

Included:

- Client list.
- Client create and edit forms.
- Client detail page.
- Client status change action.
- Client soft-delete action.
- Contacts section.
- Activities section.
- Notes section.
- Document metadata section.

Not implemented in this pass:

- Projects.
- Sales pipeline screens.
- Invoices.
- Payments.
- File upload.

## Routes

- `/clients`
- `/clients/new`
- `/clients/[id]`
- `/clients/[id]/edit`

## Permissions

- `clients.view`
- `clients.create`
- `clients.update`
- `clients.delete`

Navigation shows Clients & CRM only when `/auth/me` returns `clients.view`.

## API Coverage

Client APIs:

- `GET /clients`
- `POST /clients`
- `GET /clients/:id`
- `PATCH /clients/:id`
- `PATCH /clients/:id/status`
- `DELETE /clients/:id`

Child APIs:

- `GET /clients/:id/contacts`
- `POST /clients/:id/contacts`
- `GET /clients/:id/activities`
- `POST /clients/:id/activities`
- `GET /clients/:id/notes`
- `POST /clients/:id/notes`
- `GET /clients/:id/documents`
- `POST /clients/:id/documents`

## Screens

The clients list page includes:

- name
- type
- status
- email
- phone
- owner
- location from billing address
- activity count
- created date
- view/edit/delete actions
- search
- status filter
- type filter
- owner filter from owners present in the current result set
- pagination
- loading, empty, and error states

The client form includes:

- basic client details
- contact and business details
- address/location details
- owner ID
- status and type

The client detail page includes:

- profile summary
- contact details
- business/address details
- owner/status/type metadata
- created/updated metadata
- edit action
- delete action
- status change action
- child record sections

## Backend Fit Notes

- The backend supports `ownerId` filtering. The frontend exposes owner options from owners included in the current page result because there is no dedicated clients-owner lookup endpoint.
- The backend client document API stores metadata only. The frontend does not implement file upload.
- The backend child routes currently support create/list only for contacts, activities, notes, and documents. The frontend does not show child edit/delete actions.
- The backend list response does not include a last activity timestamp. The frontend shows activity count on the list and the full activity list on detail.
