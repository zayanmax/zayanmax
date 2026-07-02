import { ConflictException } from '@nestjs/common';
import { PurchaseInventoryAssetsService } from './purchase-inventory-assets.service';
import {
  AssetStatusDto,
  PurchaseRequestStatusDto,
  StockMovementTypeDto,
} from './dto/purchase-inventory-assets.enums';

describe('PurchaseInventoryAssetsService', () => {
  const prisma = {
    inventoryCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    inventoryItem: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    stockMovement: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    purchaseRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    purchaseOrder: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    goodsReceivedNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    assetCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    asset: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    assetAssignment: { create: jest.fn() },
    assetMaintenanceRecord: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates inventory items and rejects duplicate SKU or item code', async () => {
    prisma.inventoryItem.findFirst.mockResolvedValueOnce(null);
    prisma.inventoryItem.create.mockResolvedValue({
      id: 'item-id',
      itemCode: 'ITM-001',
    });
    const service = new PurchaseInventoryAssetsService(prisma as never);

    const result = await service.createInventoryItem('company-id', 'actor-id', {
      name: 'Laptop',
      itemCode: 'ITM-001',
      sku: 'SKU-001',
      unit: 'pcs',
      lowStockThreshold: 5,
    });

    expect(result.id).toBe('item-id');
    expect(prisma.inventoryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          itemCode: 'ITM-001',
          sku: 'SKU-001',
        }),
      }),
    );

    prisma.inventoryItem.findFirst.mockResolvedValueOnce({
      id: 'existing-item',
    });
    await expect(
      service.createInventoryItem('company-id', 'actor-id', {
        name: 'Duplicate',
        itemCode: 'ITM-001',
        unit: 'pcs',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates purchase requests with items and audits status changes', async () => {
    prisma.purchaseRequest.create.mockResolvedValue({
      id: 'request-id',
      requestNumber: 'PR-001',
      status: 'DRAFT',
    });
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'request-id',
      status: PurchaseRequestStatusDto.SUBMITTED,
    });
    prisma.purchaseRequest.update.mockResolvedValue({
      id: 'request-id',
      status: PurchaseRequestStatusDto.APPROVED,
    });
    const service = new PurchaseInventoryAssetsService(prisma as never);

    await service.createPurchaseRequest('company-id', 'actor-id', {
      title: 'Buy laptops',
      items: [
        { description: 'Laptop', quantity: 2, estimatedUnitPrice: 50000 },
      ],
    });
    const updated = await service.changePurchaseRequestStatus(
      'company-id',
      'request-id',
      'actor-id',
      { status: PurchaseRequestStatusDto.APPROVED, reviewComment: 'Approved' },
    );

    expect(updated.status).toBe('APPROVED');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'purchases.requests.approve' }),
      }),
    );
  });

  it('creates purchase orders and rejects duplicate order numbers', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValueOnce(null);
    prisma.purchaseOrder.create.mockResolvedValue({
      id: 'po-id',
      orderNumber: 'PO-001',
    });
    const service = new PurchaseInventoryAssetsService(prisma as never);

    await service.createPurchaseOrder('company-id', 'actor-id', {
      orderNumber: 'PO-001',
      orderDate: '2026-06-13',
      items: [{ description: 'Laptop', quantity: 1, unitPrice: 50000 }],
    });

    prisma.purchaseOrder.findFirst.mockResolvedValueOnce({ id: 'existing-po' });
    await expect(
      service.createPurchaseOrder('company-id', 'actor-id', {
        orderNumber: 'PO-001',
        orderDate: '2026-06-13',
        items: [{ description: 'Laptop', quantity: 1, unitPrice: 50000 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('receives goods and creates stock movements', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'po-id',
      status: 'SENT',
    });
    prisma.goodsReceivedNote.create.mockResolvedValue({
      id: 'grn-id',
      grnNumber: 'GRN-001',
    });
    prisma.inventoryItem.findFirst.mockResolvedValue({
      id: 'item-id',
      currentStock: 10,
    });
    prisma.inventoryItem.update.mockResolvedValue({
      id: 'item-id',
      currentStock: 15,
    });
    prisma.stockMovement.create.mockResolvedValue({ id: 'movement-id' });
    const service = new PurchaseInventoryAssetsService(prisma as never);

    const result = await service.createGoodsReceivedNote(
      'company-id',
      'actor-id',
      {
        purchaseOrderId: 'po-id',
        grnNumber: 'GRN-001',
        receivedDate: '2026-06-13',
        items: [
          {
            inventoryItemId: 'item-id',
            description: 'Laptop',
            quantityReceived: 5,
          },
        ],
      },
    );

    expect(result.id).toBe('grn-id');
    expect(prisma.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: StockMovementTypeDto.IN,
          previousStock: 10,
          newStock: 15,
        }),
      }),
    );
  });

  it('creates stock adjustments and updates inventory quantity', async () => {
    prisma.inventoryItem.findFirst.mockResolvedValue({
      id: 'item-id',
      currentStock: 10,
    });
    prisma.inventoryItem.update.mockResolvedValue({
      id: 'item-id',
      currentStock: 7,
    });
    prisma.stockMovement.create.mockResolvedValue({ id: 'movement-id' });
    const service = new PurchaseInventoryAssetsService(prisma as never);

    const result = await service.createStockAdjustment(
      'company-id',
      'actor-id',
      {
        inventoryItemId: 'item-id',
        quantity: -3,
        reason: 'Damage',
        movementDate: '2026-06-13',
      },
    );

    expect(result.id).toBe('movement-id');
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currentStock: 7 }),
      }),
    );
  });

  it('creates assets and rejects duplicate asset tags or serial numbers', async () => {
    prisma.asset.findFirst.mockResolvedValueOnce(null);
    prisma.asset.create.mockResolvedValue({
      id: 'asset-id',
      assetTag: 'AST-001',
    });
    const service = new PurchaseInventoryAssetsService(prisma as never);

    await service.createAsset('company-id', 'actor-id', {
      name: 'Laptop Asset',
      assetTag: 'AST-001',
      serialNumber: 'SN-001',
      status: AssetStatusDto.AVAILABLE,
    });

    prisma.asset.findFirst.mockResolvedValueOnce({ id: 'existing-asset' });
    await expect(
      service.createAsset('company-id', 'actor-id', {
        name: 'Duplicate Asset',
        assetTag: 'AST-001',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('assigns assets to employees and records maintenance audit logs', async () => {
    prisma.asset.findFirst.mockResolvedValue({
      id: 'asset-id',
      status: 'AVAILABLE',
    });
    prisma.assetAssignment.create.mockResolvedValue({ id: 'assignment-id' });
    prisma.asset.update.mockResolvedValue({
      id: 'asset-id',
      status: 'ASSIGNED',
    });
    prisma.assetMaintenanceRecord.create.mockResolvedValue({
      id: 'maintenance-id',
    });
    const service = new PurchaseInventoryAssetsService(prisma as never);

    await service.assignAsset('company-id', 'asset-id', 'actor-id', {
      employeeId: 'employee-id',
      assignedAt: '2026-06-13',
    });
    await service.createAssetMaintenance('company-id', 'asset-id', 'actor-id', {
      maintenanceDate: '2026-06-14',
      description: 'Battery replacement',
      cost: 1000,
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'assets.maintenance.create' }),
      }),
    );
  });
});
