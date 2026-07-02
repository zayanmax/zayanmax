# Purchase, Inventory & Asset Management Module

Last updated: 2026-07-02

## Scope

Implemented Purchase, Inventory & Asset Management backend foundation and frontend screens.

Included:

- Purchase requests and purchase request items.
- Purchase request status flow: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `ORDERED`, `CANCELLED`.
- Purchase orders and purchase order items.
- Purchase order status flow: `DRAFT`, `SENT`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`.
- Goods received notes and received item metadata.
- Inventory categories and inventory items.
- Stock movements and stock adjustments.
- Low stock threshold field support on inventory items.
- Asset categories and assets.
- Asset assignment to employees.
- Asset maintenance records.
- Warranty expiry and serial number fields.
- Search, filters, sorting, and pagination.
- Duplicate protection for inventory item codes, SKUs, asset tags, and serial numbers where sensible.
- Audit logs for purchase requests, purchase orders, goods received notes, stock movements, asset assignments, and maintenance.

Excluded for now:

- Accounting ledger or invoice posting.
- Full approval workflow engine.
- PDF generation.
- Bank/payment posting.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `PurchaseRequest`
- `PurchaseRequestItem`
- `PurchaseOrder`
- `PurchaseOrderItem`
- `GoodsReceivedNote`
- `GoodsReceivedNoteItem`
- `InventoryCategory`
- `InventoryItem`
- `StockMovement`
- `AssetCategory`
- `Asset`
- `AssetAssignment`
- `AssetMaintenanceRecord`

Added enums:

- `PurchaseRequestStatus`
- `PurchaseOrderStatus`
- `StockMovementType`
- `AssetStatus`
- `AssetAssignmentStatus`

Migration:

```text
apps/backend/prisma/migrations/20260613083953_purchase_inventory_assets
```

## Permissions

Uses existing seeded permissions:

- `purchases.view`
- `purchases.manage`
- `inventory.view`
- `inventory.manage`
- `assets.view`
- `assets.manage`

No role names are hardcoded for access checks.

## Endpoints

Purchase request routes:

- `GET /api/v1/purchases/requests`
- `POST /api/v1/purchases/requests`
- `GET /api/v1/purchases/requests/:id`
- `PATCH /api/v1/purchases/requests/:id`
- `PATCH /api/v1/purchases/requests/:id/status`

Purchase order routes:

- `GET /api/v1/purchases/orders`
- `POST /api/v1/purchases/orders`
- `GET /api/v1/purchases/orders/:id`
- `PATCH /api/v1/purchases/orders/:id`
- `PATCH /api/v1/purchases/orders/:id/status`

Goods received note routes:

- `GET /api/v1/purchases/goods-received-notes`
- `POST /api/v1/purchases/goods-received-notes`
- `GET /api/v1/purchases/goods-received-notes/:id`

Inventory routes:

- `GET /api/v1/inventory/categories`
- `POST /api/v1/inventory/categories`
- `GET /api/v1/inventory/categories/:id`
- `PATCH /api/v1/inventory/categories/:id`
- `GET /api/v1/inventory/items`
- `POST /api/v1/inventory/items`
- `GET /api/v1/inventory/items/:id`
- `PATCH /api/v1/inventory/items/:id`
- `GET /api/v1/inventory/movements`
- `POST /api/v1/inventory/movements`
- `GET /api/v1/inventory/movements/:id`
- `POST /api/v1/inventory/stock-adjustments`

Asset routes:

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

## Filters

All list endpoints support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Purchase requests also support:

- `requesterEmployeeId`
- `status`

Purchase orders also support:

- `vendorId`
- `purchaseRequestId`
- `status`

Goods received notes also support:

- `purchaseOrderId`

Inventory items also support:

- `inventoryCategoryId`
- `status`

Stock movements also support:

- `inventoryItemId`
- `type`

Assets also support:

- `assetCategoryId`
- `assignedEmployeeId`
- `status`

Asset assignments also support:

- `assetId`
- `employeeId`
- `status`

Asset maintenance records also support:

- `assetId`
- `vendorId`

## Status Flows

Purchase requests:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REJECTED`
- `ORDERED`
- `CANCELLED`

Purchase orders:

- `DRAFT`
- `SENT`
- `PARTIALLY_RECEIVED`
- `RECEIVED`
- `CANCELLED`

Stock movements:

- `IN`
- `OUT`
- `ADJUSTMENT`

Assets:

- `AVAILABLE`
- `ASSIGNED`
- `UNDER_MAINTENANCE`
- `RETIRED`
- `LOST`

## Duplicate Rules

- Inventory item create rejects another active item in the same `companyId` with matching `itemCode` or `sku`.
- Asset create rejects another active asset in the same `companyId` with matching `assetTag` or `serialNumber`.
- Purchase order create rejects another active order in the same `companyId` with the same `orderNumber`.
- Inventory category and asset category create reject active duplicates by `companyId + name`.

## Stock Behavior

- Goods received notes create `IN` stock movements for received inventory items.
- Stock adjustments create `ADJUSTMENT` stock movements.
- Inventory item `currentStock` is updated from each stock movement.
- `lowStockThreshold` is stored on inventory items for future reporting/UI alerts.

## Audit Logging

Audit actions:

- `purchases.requests.create`
- `purchases.requests.submit`
- `purchases.requests.approve`
- `purchases.requests.reject`
- `purchases.requests.order`
- `purchases.requests.cancel`
- `purchases.orders.create`
- `purchases.orders.send`
- `purchases.orders.partially_receive`
- `purchases.orders.receive`
- `purchases.orders.cancel`
- `purchases.goods_received.create`
- `inventory.categories.create`
- `inventory.items.create`
- `inventory.stock_movements.create`
- `assets.categories.create`
- `assets.create`
- `assets.assignments.create`
- `assets.maintenance.create`

## Tests

Unit tests:

```text
apps/backend/src/modules/purchase-inventory-assets/purchase-inventory-assets.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

Covered flows include inventory duplicate checks, purchase request status transitions, purchase order creation/status update, goods received stock increment, stock adjustment, asset duplicate checks, asset assignment, and asset maintenance creation.
