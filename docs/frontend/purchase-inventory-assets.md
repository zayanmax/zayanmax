# Purchase, Inventory & Asset Management Frontend

Last updated: 2026-07-02

## Scope

Implemented frontend screens for Purchase, Inventory, and Asset Management under `apps/frontend`.

Built:

- Purchase overview at `/purchase`.
- Purchase requests list, create, detail, edit, and status actions.
- Purchase orders list, create, detail, edit, and status actions.
- Goods received note list, create, and detail screens.
- Inventory overview, item list/create/detail/edit, categories, stock movements, and stock adjustment.
- Assets list/create/detail/edit, categories, assignments, and maintenance screens.
- Feature folders:
  - `apps/frontend/src/features/purchase`
  - `apps/frontend/src/features/inventory`
  - `apps/frontend/src/features/assets`

## Backend Contracts Used

Purchase:

- `GET /api/v1/purchases/requests`
- `POST /api/v1/purchases/requests`
- `GET /api/v1/purchases/requests/:id`
- `PATCH /api/v1/purchases/requests/:id`
- `PATCH /api/v1/purchases/requests/:id/status`
- `GET /api/v1/purchases/orders`
- `POST /api/v1/purchases/orders`
- `GET /api/v1/purchases/orders/:id`
- `PATCH /api/v1/purchases/orders/:id`
- `PATCH /api/v1/purchases/orders/:id/status`
- `GET /api/v1/purchases/goods-received-notes`
- `POST /api/v1/purchases/goods-received-notes`
- `GET /api/v1/purchases/goods-received-notes/:id`

Inventory:

- `GET /api/v1/inventory/categories`
- `POST /api/v1/inventory/categories`
- `GET /api/v1/inventory/categories/:id`
- `PATCH /api/v1/inventory/categories/:id`
- `GET /api/v1/inventory/items`
- `POST /api/v1/inventory/items`
- `GET /api/v1/inventory/items/:id`
- `PATCH /api/v1/inventory/items/:id`
- `GET /api/v1/inventory/movements`
- `GET /api/v1/inventory/movements/:id`
- `POST /api/v1/inventory/stock-adjustments`

Assets:

- `GET /api/v1/assets/categories`
- `POST /api/v1/assets/categories`
- `GET /api/v1/assets/categories/:id`
- `PATCH /api/v1/assets/categories/:id`
- `GET /api/v1/assets`
- `POST /api/v1/assets`
- `GET /api/v1/assets/:id`
- `PATCH /api/v1/assets/:id`
- `GET /api/v1/assets/assignments`
- `GET /api/v1/assets/maintenance`
- `POST /api/v1/assets/:id/assign`
- `POST /api/v1/assets/:id/maintenance`

## Permissions

- Purchase screens use `purchases.view` and `purchases.manage`.
- Inventory screens use `inventory.view` and `inventory.manage`.
- Asset screens use `assets.view` and `assets.manage`.

## Notes And Limits

- GRN creation records metadata and relies on backend stock movement creation.
- Stock adjustment supports manual positive or negative quantity changes.
- Assignment creation is supported; return/unassign actions are not exposed by the backend yet.
- Maintenance records are metadata only.
- Barcode scanning, file upload, accounting ledger posting, invoice posting, and PDF generation are intentionally out of scope.
