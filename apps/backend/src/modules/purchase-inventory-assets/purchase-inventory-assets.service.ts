import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AssignAssetDto,
  AssetAssignmentQueryDto,
  AssetCategoryQueryDto,
  AssetMaintenanceQueryDto,
  AssetQueryDto,
  ChangePurchaseOrderStatusDto,
  ChangePurchaseRequestStatusDto,
  CreateAssetCategoryDto,
  CreateAssetDto,
  CreateAssetMaintenanceDto,
  CreateGoodsReceivedNoteDto,
  CreateInventoryCategoryDto,
  CreateInventoryItemDto,
  CreatePurchaseOrderDto,
  CreatePurchaseRequestDto,
  CreateStockAdjustmentDto,
  CreateStockMovementDto,
  GoodsReceivedNoteQueryDto,
  InventoryCategoryQueryDto,
  InventoryItemQueryDto,
  PurchaseOrderItemDto,
  PurchaseOrderQueryDto,
  PurchaseRequestItemDto,
  PurchaseRequestQueryDto,
  StockMovementQueryDto,
  UpdateAssetCategoryDto,
  UpdateAssetDto,
  UpdateInventoryCategoryDto,
  UpdateInventoryItemDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseRequestDto,
} from './dto/purchase-inventory-assets.dto';
import {
  AssetStatusDto,
  PurchaseOrderStatusDto,
  PurchaseRequestStatusDto,
  StockMovementTypeDto,
} from './dto/purchase-inventory-assets.enums';

@Injectable()
export class PurchaseInventoryAssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInventoryCategory(
    companyId: string,
    actorId: string,
    dto: CreateInventoryCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.inventoryCategory.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Inventory category exists');

    const category = await this.prisma.inventoryCategory.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'inventory.categories.create',
      'InventoryCategory',
      category.id,
      undefined,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async findInventoryCategories(
    companyId: string,
    query: InventoryCategoryQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InventoryCategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.inventoryCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.inventoryCategory.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findInventoryCategory(companyId: string, id: string) {
    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: { where: { deletedAt: null }, take: 20 } },
    });
    if (!category) throw new NotFoundException('Inventory category not found');
    return category;
  }

  async updateInventoryCategory(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateInventoryCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.inventoryCategory.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Inventory category not found');
    if (dto.name && dto.name !== current.name) {
      const existing = await this.prisma.inventoryCategory.findFirst({
        where: { companyId, name: dto.name, deletedAt: null, NOT: { id } },
      });
      if (existing) throw new ConflictException('Inventory category exists');
    }
    const category = await this.prisma.inventoryCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'inventory.categories.update',
      'InventoryCategory',
      category.id,
      current,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async createInventoryItem(
    companyId: string,
    actorId: string,
    dto: CreateInventoryItemDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureNoDuplicateInventoryItem(companyId, dto);
    const item = await this.prisma.inventoryItem.create({
      data: {
        companyId,
        inventoryCategoryId: dto.inventoryCategoryId,
        name: dto.name,
        itemCode: dto.itemCode,
        sku: dto.sku,
        unit: dto.unit,
        lowStockThreshold: dto.lowStockThreshold ?? 0,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'inventory.items.create',
      'InventoryItem',
      item.id,
      undefined,
      item,
      ipAddress,
      userAgent,
    );
    return item;
  }

  async findInventoryItems(companyId: string, query: InventoryItemQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InventoryItemWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.inventoryCategoryId
        ? { inventoryCategoryId: query.inventoryCategoryId }
        : {}),
      ...(query.status
        ? { status: query.status as Prisma.EnumRecordStatusFilter }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { itemCode: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        include: { inventoryCategory: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findInventoryItem(companyId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        inventoryCategory: true,
        stockMovements: {
          orderBy: { movementDate: 'desc' },
          take: 20,
        },
      },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async updateInventoryItem(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateInventoryItemDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.inventoryItem.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Inventory item not found');
    await this.ensureNoDuplicateInventoryItem(companyId, dto, id);
    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        inventoryCategoryId: dto.inventoryCategoryId,
        name: dto.name,
        itemCode: dto.itemCode,
        sku: dto.sku,
        unit: dto.unit,
        lowStockThreshold: dto.lowStockThreshold,
        updatedById: actorId,
      },
      include: { inventoryCategory: true },
    });
    await this.audit(
      companyId,
      actorId,
      'inventory.items.update',
      'InventoryItem',
      item.id,
      current,
      item,
      ipAddress,
      userAgent,
    );
    return item;
  }

  async createStockMovement(
    companyId: string,
    actorId: string,
    dto: CreateStockMovementDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.recordStockMovement(
      companyId,
      actorId,
      dto.inventoryItemId,
      dto.type,
      dto.quantity,
      dto.movementDate,
      dto.reason,
      dto.referenceType,
      dto.referenceId,
      ipAddress,
      userAgent,
    );
  }

  async createStockAdjustment(
    companyId: string,
    actorId: string,
    dto: CreateStockAdjustmentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.recordStockMovement(
      companyId,
      actorId,
      dto.inventoryItemId,
      StockMovementTypeDto.ADJUSTMENT,
      dto.quantity,
      dto.movementDate,
      dto.reason,
      'StockAdjustment',
      undefined,
      ipAddress,
      userAgent,
    );
  }

  async findStockMovements(companyId: string, query: StockMovementQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.StockMovementWhereInput = {
      companyId,
      ...(query.inventoryItemId
        ? { inventoryItemId: query.inventoryItemId }
        : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? { reason: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: { inventoryItem: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [query.sortBy ?? 'movementDate']: query.sortOrder ?? 'desc',
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findStockMovement(companyId: string, id: string) {
    const movement = await this.prisma.stockMovement.findFirst({
      where: { id, companyId },
      include: { inventoryItem: true },
    });
    if (!movement) throw new NotFoundException('Stock movement not found');
    return movement;
  }

  async createPurchaseRequest(
    companyId: string,
    actorId: string,
    dto: CreatePurchaseRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const request = await this.prisma.purchaseRequest.create({
      data: {
        companyId,
        requesterEmployeeId: dto.requesterEmployeeId,
        requestNumber: `PR-${Date.now()}`,
        title: dto.title,
        neededByDate: this.toDateOnly(dto.neededByDate),
        notes: dto.notes,
        createdById: actorId,
        items: {
          create: dto.items.map((item) => ({
            companyId,
            inventoryItemId: item.inventoryItemId,
            description: item.description,
            quantity: item.quantity,
            estimatedUnitPrice: item.estimatedUnitPrice ?? 0,
            estimatedTotal: this.money(
              item.quantity * (item.estimatedUnitPrice ?? 0),
            ),
          })),
        },
      },
      include: { items: true },
    });
    await this.audit(
      companyId,
      actorId,
      'purchases.requests.create',
      'PurchaseRequest',
      request.id,
      undefined,
      request,
      ipAddress,
      userAgent,
    );
    return request;
  }

  async findPurchaseRequests(
    companyId: string,
    query: PurchaseRequestQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PurchaseRequestWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.requesterEmployeeId
        ? { requesterEmployeeId: query.requesterEmployeeId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                requestNumber: { contains: query.search, mode: 'insensitive' },
              },
              { title: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        include: {
          requesterEmployee: this.employeeInclude(),
          items: { include: { inventoryItem: true } },
          purchaseOrders: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findPurchaseRequest(companyId: string, id: string) {
    const request = await this.prisma.purchaseRequest.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        requesterEmployee: this.employeeInclude(),
        items: { include: { inventoryItem: true } },
        purchaseOrders: { include: { vendor: true, items: true } },
      },
    });
    if (!request) throw new NotFoundException('Purchase request not found');
    return request;
  }

  async updatePurchaseRequest(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdatePurchaseRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.purchaseRequest.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: true },
    });
    if (!current) throw new NotFoundException('Purchase request not found');

    const request = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        requesterEmployeeId: dto.requesterEmployeeId,
        title: dto.title,
        neededByDate:
          dto.neededByDate === undefined
            ? undefined
            : this.toDateOnly(dto.neededByDate),
        notes: dto.notes,
        updatedById: actorId,
        ...(dto.items
          ? {
              items: {
                deleteMany: { purchaseRequestId: id },
                create: this.purchaseRequestItemCreates(dto.items, companyId),
              },
            }
          : {}),
      },
      include: {
        requesterEmployee: this.employeeInclude(),
        items: { include: { inventoryItem: true } },
        purchaseOrders: true,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'purchases.requests.update',
      'PurchaseRequest',
      request.id,
      current,
      request,
      ipAddress,
      userAgent,
    );
    return request;
  }

  async changePurchaseRequestStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangePurchaseRequestStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.purchaseRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Purchase request not found');

    const request = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: dto.status,
        reviewComment: dto.reviewComment,
        reviewedById:
          dto.status === PurchaseRequestStatusDto.APPROVED ||
          dto.status === PurchaseRequestStatusDto.REJECTED
            ? actorId
            : current.reviewedById,
        reviewedAt:
          dto.status === PurchaseRequestStatusDto.APPROVED ||
          dto.status === PurchaseRequestStatusDto.REJECTED
            ? new Date()
            : current.reviewedAt,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      this.purchaseRequestStatusAuditAction(dto.status),
      'PurchaseRequest',
      request.id,
      current,
      request,
      ipAddress,
      userAgent,
    );
    return request;
  }

  async createPurchaseOrder(
    companyId: string,
    actorId: string,
    dto: CreatePurchaseOrderDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const orderNumber = dto.orderNumber ?? `PO-${Date.now()}`;
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { companyId, orderNumber, deletedAt: null },
    });
    if (existing) throw new ConflictException('Purchase order exists');

    const items = dto.items.map((item) => {
      const taxAmount = item.taxAmount ?? 0;
      const lineTotal = this.money(item.quantity * item.unitPrice + taxAmount);
      return { ...item, taxAmount, lineTotal };
    });
    const subTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const order = await this.prisma.purchaseOrder.create({
      data: {
        companyId,
        vendorId: dto.vendorId,
        purchaseRequestId: dto.purchaseRequestId,
        orderNumber,
        orderDate: this.toDateOnly(dto.orderDate)!,
        expectedDeliveryDate: this.toDateOnly(dto.expectedDeliveryDate),
        subTotal: this.money(subTotal),
        taxAmount: this.money(taxAmount),
        totalAmount: this.money(subTotal + taxAmount),
        notes: dto.notes,
        createdById: actorId,
        items: {
          create: items.map((item) => ({
            companyId,
            inventoryItemId: item.inventoryItemId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { items: true },
    });
    await this.audit(
      companyId,
      actorId,
      'purchases.orders.create',
      'PurchaseOrder',
      order.id,
      undefined,
      order,
      ipAddress,
      userAgent,
    );
    return order;
  }

  async findPurchaseOrders(companyId: string, query: PurchaseOrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PurchaseOrderWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.purchaseRequestId
        ? { purchaseRequestId: query.purchaseRequestId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: true,
          purchaseRequest: true,
          items: { include: { inventoryItem: true } },
          goodsReceivedNotes: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findPurchaseOrder(companyId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vendor: true,
        purchaseRequest: true,
        items: { include: { inventoryItem: true } },
        goodsReceivedNotes: { include: { items: true } },
      },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    return order;
  }

  async updatePurchaseOrder(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdatePurchaseOrderDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: true },
    });
    if (!current) throw new NotFoundException('Purchase order not found');
    if (dto.orderNumber && dto.orderNumber !== current.orderNumber) {
      const existing = await this.prisma.purchaseOrder.findFirst({
        where: {
          companyId,
          orderNumber: dto.orderNumber,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (existing) throw new ConflictException('Purchase order exists');
    }
    const totals = dto.items ? this.purchaseOrderTotals(dto.items) : undefined;
    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        vendorId: dto.vendorId,
        purchaseRequestId: dto.purchaseRequestId,
        orderNumber: dto.orderNumber,
        orderDate:
          dto.orderDate === undefined
            ? undefined
            : this.toDateOnly(dto.orderDate)!,
        expectedDeliveryDate:
          dto.expectedDeliveryDate === undefined
            ? undefined
            : this.toDateOnly(dto.expectedDeliveryDate),
        notes: dto.notes,
        subTotal: totals?.subTotal,
        taxAmount: totals?.taxAmount,
        totalAmount: totals?.totalAmount,
        updatedById: actorId,
        ...(dto.items
          ? {
              items: {
                deleteMany: { purchaseOrderId: id },
                create: this.purchaseOrderItemCreates(dto.items, companyId),
              },
            }
          : {}),
      },
      include: {
        vendor: true,
        purchaseRequest: true,
        items: { include: { inventoryItem: true } },
        goodsReceivedNotes: true,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'purchases.orders.update',
      'PurchaseOrder',
      order.id,
      current,
      order,
      ipAddress,
      userAgent,
    );
    return order;
  }

  async changePurchaseOrderStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangePurchaseOrderStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Purchase order not found');

    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: dto.status, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      this.purchaseOrderStatusAuditAction(dto.status),
      'PurchaseOrder',
      order.id,
      current,
      order,
      ipAddress,
      userAgent,
    );
    return order;
  }

  async createGoodsReceivedNote(
    companyId: string,
    actorId: string,
    dto: CreateGoodsReceivedNoteDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, companyId, deletedAt: null },
    });
    if (!order) throw new NotFoundException('Purchase order not found');

    const grnNumber = dto.grnNumber ?? `GRN-${Date.now()}`;
    const note = await this.prisma.goodsReceivedNote.create({
      data: {
        companyId,
        purchaseOrderId: dto.purchaseOrderId,
        grnNumber,
        receivedDate: this.toDateOnly(dto.receivedDate)!,
        notes: dto.notes,
        createdById: actorId,
        items: {
          create: dto.items.map((item) => ({
            companyId,
            purchaseOrderItemId: item.purchaseOrderItemId,
            inventoryItemId: item.inventoryItemId,
            description: item.description,
            quantityReceived: item.quantityReceived,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of dto.items) {
      if (item.inventoryItemId) {
        await this.recordStockMovement(
          companyId,
          actorId,
          item.inventoryItemId,
          StockMovementTypeDto.IN,
          item.quantityReceived,
          dto.receivedDate,
          'Goods received',
          'GoodsReceivedNote',
          note.id,
          ipAddress,
          userAgent,
        );
      }
      if (item.purchaseOrderItemId) {
        await this.prisma.purchaseOrderItem.update({
          where: { id: item.purchaseOrderItemId },
          data: { receivedQuantity: { increment: item.quantityReceived } },
        });
      }
    }

    await this.prisma.purchaseOrder.update({
      where: { id: dto.purchaseOrderId },
      data: { status: PurchaseOrderStatusDto.RECEIVED, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'purchases.goods_received.create',
      'GoodsReceivedNote',
      note.id,
      undefined,
      note,
      ipAddress,
      userAgent,
    );
    return note;
  }

  async findGoodsReceivedNotes(
    companyId: string,
    query: GoodsReceivedNoteQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.GoodsReceivedNoteWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.purchaseOrderId
        ? { purchaseOrderId: query.purchaseOrderId }
        : {}),
      ...(query.search
        ? { grnNumber: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.goodsReceivedNote.findMany({
        where,
        include: {
          purchaseOrder: { include: { vendor: true } },
          items: { include: { inventoryItem: true, purchaseOrderItem: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [query.sortBy ?? 'receivedDate']: query.sortOrder ?? 'desc',
        },
      }),
      this.prisma.goodsReceivedNote.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findGoodsReceivedNote(companyId: string, id: string) {
    const note = await this.prisma.goodsReceivedNote.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        purchaseOrder: { include: { vendor: true, items: true } },
        items: { include: { inventoryItem: true, purchaseOrderItem: true } },
      },
    });
    if (!note) throw new NotFoundException('Goods received note not found');
    return note;
  }

  async createAssetCategory(
    companyId: string,
    actorId: string,
    dto: CreateAssetCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.assetCategory.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Asset category exists');

    const category = await this.prisma.assetCategory.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'assets.categories.create',
      'AssetCategory',
      category.id,
      undefined,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async findAssetCategories(companyId: string, query: AssetCategoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AssetCategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.assetCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.assetCategory.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findAssetCategory(companyId: string, id: string) {
    const category = await this.prisma.assetCategory.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { assets: { where: { deletedAt: null }, take: 20 } },
    });
    if (!category) throw new NotFoundException('Asset category not found');
    return category;
  }

  async updateAssetCategory(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateAssetCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.assetCategory.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Asset category not found');
    if (dto.name && dto.name !== current.name) {
      const existing = await this.prisma.assetCategory.findFirst({
        where: { companyId, name: dto.name, deletedAt: null, NOT: { id } },
      });
      if (existing) throw new ConflictException('Asset category exists');
    }
    const category = await this.prisma.assetCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'assets.categories.update',
      'AssetCategory',
      category.id,
      current,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async createAsset(
    companyId: string,
    actorId: string,
    dto: CreateAssetDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureNoDuplicateAsset(companyId, dto);
    const asset = await this.prisma.asset.create({
      data: {
        companyId,
        assetCategoryId: dto.assetCategoryId,
        name: dto.name,
        assetTag: dto.assetTag,
        serialNumber: dto.serialNumber,
        purchaseDate: this.toDateOnly(dto.purchaseDate),
        warrantyExpiryDate: this.toDateOnly(dto.warrantyExpiryDate),
        status: dto.status ?? AssetStatusDto.AVAILABLE,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'assets.create',
      'Asset',
      asset.id,
      undefined,
      asset,
      ipAddress,
      userAgent,
    );
    return asset;
  }

  async findAssets(companyId: string, query: AssetQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AssetWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.assetCategoryId
        ? { assetCategoryId: query.assetCategoryId }
        : {}),
      ...(query.assignedEmployeeId
        ? { assignedEmployeeId: query.assignedEmployeeId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { assetTag: { contains: query.search, mode: 'insensitive' } },
              { serialNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: {
          assetCategory: true,
          assignedEmployee: this.employeeInclude(),
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findAsset(companyId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        assetCategory: true,
        assignedEmployee: this.employeeInclude(),
        assignments: {
          include: { employee: this.employeeInclude() },
          orderBy: { assignedAt: 'desc' },
        },
        maintenanceRecords: {
          include: { vendor: true },
          orderBy: { maintenanceDate: 'desc' },
        },
      },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async updateAsset(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateAssetDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Asset not found');
    await this.ensureNoDuplicateAsset(companyId, dto, id);
    const asset = await this.prisma.asset.update({
      where: { id },
      data: {
        assetCategoryId: dto.assetCategoryId,
        name: dto.name,
        assetTag: dto.assetTag,
        serialNumber: dto.serialNumber,
        purchaseDate:
          dto.purchaseDate === undefined
            ? undefined
            : this.toDateOnly(dto.purchaseDate),
        warrantyExpiryDate:
          dto.warrantyExpiryDate === undefined
            ? undefined
            : this.toDateOnly(dto.warrantyExpiryDate),
        status: dto.status,
        notes: dto.notes,
        updatedById: actorId,
      },
      include: {
        assetCategory: true,
        assignedEmployee: this.employeeInclude(),
      },
    });
    await this.audit(
      companyId,
      actorId,
      'assets.update',
      'Asset',
      asset.id,
      current,
      asset,
      ipAddress,
      userAgent,
    );
    return asset;
  }

  async findAssetAssignments(
    companyId: string,
    query: AssetAssignmentQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AssetAssignmentWhereInput = {
      companyId,
      ...(query.assetId ? { assetId: query.assetId } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { notes: { contains: query.search, mode: 'insensitive' } },
              {
                asset: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                employee: {
                  firstName: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.assetAssignment.findMany({
        where,
        include: {
          asset: { include: { assetCategory: true } },
          employee: this.employeeInclude(),
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'assignedAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.assetAssignment.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findAssetMaintenanceRecords(
    companyId: string,
    query: AssetMaintenanceQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AssetMaintenanceRecordWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.assetId ? { assetId: query.assetId } : {}),
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: 'insensitive' } },
              {
                asset: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                vendor: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.assetMaintenanceRecord.findMany({
        where,
        include: { asset: true, vendor: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [query.sortBy ?? 'maintenanceDate']: query.sortOrder ?? 'desc',
        },
      }),
      this.prisma.assetMaintenanceRecord.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async assignAsset(
    companyId: string,
    assetId: string,
    actorId: string,
    dto: AssignAssetDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, companyId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const assignment = await this.prisma.assetAssignment.create({
      data: {
        companyId,
        assetId,
        employeeId: dto.employeeId,
        assignedAt: this.toDateOnly(dto.assignedAt)!,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        assignedEmployeeId: dto.employeeId,
        status: AssetStatusDto.ASSIGNED,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'assets.assignments.create',
      'AssetAssignment',
      assignment.id,
      asset,
      assignment,
      ipAddress,
      userAgent,
    );
    return assignment;
  }

  async createAssetMaintenance(
    companyId: string,
    assetId: string,
    actorId: string,
    dto: CreateAssetMaintenanceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, companyId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const record = await this.prisma.assetMaintenanceRecord.create({
      data: {
        companyId,
        assetId,
        vendorId: dto.vendorId,
        maintenanceDate: this.toDateOnly(dto.maintenanceDate)!,
        description: dto.description,
        cost: dto.cost ?? 0,
        nextMaintenanceDate: this.toDateOnly(dto.nextMaintenanceDate),
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'assets.maintenance.create',
      'AssetMaintenanceRecord',
      record.id,
      undefined,
      record,
      ipAddress,
      userAgent,
    );
    return record;
  }

  private async recordStockMovement(
    companyId: string,
    actorId: string,
    inventoryItemId: string,
    type: StockMovementTypeDto,
    quantity: number,
    movementDate: string,
    reason?: string,
    referenceType?: string,
    referenceId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, companyId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const previousStock = Number(item.currentStock);
    const newStock =
      type === StockMovementTypeDto.OUT
        ? previousStock - quantity
        : previousStock + quantity;
    const movement = await this.prisma.stockMovement.create({
      data: {
        companyId,
        inventoryItemId,
        type,
        quantity,
        previousStock: this.money(previousStock),
        newStock: this.money(newStock),
        movementDate: this.toDateOnly(movementDate)!,
        referenceType,
        referenceId,
        reason,
        createdById: actorId,
      },
    });
    await this.prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { currentStock: this.money(newStock), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'inventory.stock_movements.create',
      'StockMovement',
      movement.id,
      item,
      movement,
      ipAddress,
      userAgent,
    );
    return movement;
  }

  private purchaseRequestItemCreates(
    items: PurchaseRequestItemDto[],
    companyId: string,
  ) {
    return items.map((item) => ({
      companyId,
      inventoryItemId: item.inventoryItemId,
      description: item.description,
      quantity: item.quantity,
      estimatedUnitPrice: item.estimatedUnitPrice ?? 0,
      estimatedTotal: this.money(
        item.quantity * (item.estimatedUnitPrice ?? 0),
      ),
    }));
  }

  private purchaseOrderItemCreates(
    items: PurchaseOrderItemDto[],
    companyId: string,
  ) {
    return items.map((item) => {
      const taxAmount = item.taxAmount ?? 0;
      const lineTotal = this.money(item.quantity * item.unitPrice + taxAmount);
      return {
        companyId,
        inventoryItemId: item.inventoryItemId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount,
        lineTotal,
      };
    });
  }

  private purchaseOrderTotals(items: PurchaseOrderItemDto[]) {
    const subTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = items.reduce(
      (sum, item) => sum + (item.taxAmount ?? 0),
      0,
    );
    return {
      subTotal: this.money(subTotal),
      taxAmount: this.money(taxAmount),
      totalAmount: this.money(subTotal + taxAmount),
    };
  }

  private employeeInclude() {
    return {
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    } satisfies Prisma.EmployeeDefaultArgs;
  }

  private async ensureNoDuplicateInventoryItem(
    companyId: string,
    dto: Partial<CreateInventoryItemDto>,
    excludeId?: string,
  ) {
    const or: Prisma.InventoryItemWhereInput[] = [];
    if (dto.itemCode) or.push({ itemCode: dto.itemCode });
    if (dto.sku) or.push({ sku: dto.sku });
    if (!or.length) return;
    const existing = await this.prisma.inventoryItem.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: or,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(
        'Inventory item already exists with same item code or SKU',
      );
    }
  }

  private async ensureNoDuplicateAsset(
    companyId: string,
    dto: Partial<CreateAssetDto>,
    excludeId?: string,
  ) {
    const or: Prisma.AssetWhereInput[] = [];
    if (dto.assetTag) or.push({ assetTag: dto.assetTag });
    if (dto.serialNumber) or.push({ serialNumber: dto.serialNumber });
    if (!or.length) return;
    const existing = await this.prisma.asset.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: or,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(
        'Asset already exists with same asset tag or serial number',
      );
    }
  }

  private purchaseRequestStatusAuditAction(status: PurchaseRequestStatusDto) {
    const map: Record<PurchaseRequestStatusDto, string> = {
      DRAFT: 'purchases.requests.update',
      SUBMITTED: 'purchases.requests.submit',
      APPROVED: 'purchases.requests.approve',
      REJECTED: 'purchases.requests.reject',
      ORDERED: 'purchases.requests.order',
      CANCELLED: 'purchases.requests.cancel',
    };
    return map[status];
  }

  private purchaseOrderStatusAuditAction(status: PurchaseOrderStatusDto) {
    const map: Record<PurchaseOrderStatusDto, string> = {
      DRAFT: 'purchases.orders.update',
      SENT: 'purchases.orders.send',
      PARTIALLY_RECEIVED: 'purchases.orders.partially_receive',
      RECEIVED: 'purchases.orders.receive',
      CANCELLED: 'purchases.orders.cancel',
    };
    return map[status];
  }

  private toDateOnly(value?: string) {
    if (!value) return undefined;
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private money(value: number) {
    return Math.round(value * 100) / 100;
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async audit(
    companyId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: unknown,
    newValue?: unknown,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action,
        entityType,
        entityId,
        oldValue: oldValue as Prisma.InputJsonValue,
        newValue: newValue as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  }
}
