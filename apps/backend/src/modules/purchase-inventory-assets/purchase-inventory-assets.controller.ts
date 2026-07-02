import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import {
  AssignAssetDto,
  AssetCategoryQueryDto,
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
  PurchaseOrderQueryDto,
  PurchaseRequestQueryDto,
  StockMovementQueryDto,
} from './dto/purchase-inventory-assets.dto';
import { PurchaseInventoryAssetsService } from './purchase-inventory-assets.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PurchaseInventoryAssetsController {
  constructor(
    private readonly purchaseInventoryAssetsService: PurchaseInventoryAssetsService,
  ) {}

  @RequirePermissions('purchases.view')
  @Get('purchases/requests')
  findPurchaseRequests(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PurchaseRequestQueryDto,
  ) {
    return this.purchaseInventoryAssetsService.findPurchaseRequests(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('purchases.manage')
  @Post('purchases/requests')
  createPurchaseRequest(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePurchaseRequestDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createPurchaseRequest(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('purchases.manage')
  @Patch('purchases/requests/:id/status')
  changePurchaseRequestStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangePurchaseRequestStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.changePurchaseRequestStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('purchases.view')
  @Get('purchases/orders')
  findPurchaseOrders(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PurchaseOrderQueryDto,
  ) {
    return this.purchaseInventoryAssetsService.findPurchaseOrders(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('purchases.manage')
  @Post('purchases/orders')
  createPurchaseOrder(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePurchaseOrderDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createPurchaseOrder(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('purchases.manage')
  @Patch('purchases/orders/:id/status')
  changePurchaseOrderStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangePurchaseOrderStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.changePurchaseOrderStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('purchases.view')
  @Get('purchases/goods-received-notes')
  findGoodsReceivedNotes(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: GoodsReceivedNoteQueryDto,
  ) {
    return this.purchaseInventoryAssetsService.findGoodsReceivedNotes(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('purchases.manage')
  @Post('purchases/goods-received-notes')
  createGoodsReceivedNote(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateGoodsReceivedNoteDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createGoodsReceivedNote(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('inventory.view')
  @Get('inventory/categories')
  findInventoryCategories(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: InventoryCategoryQueryDto,
  ) {
    return this.purchaseInventoryAssetsService.findInventoryCategories(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('inventory.manage')
  @Post('inventory/categories')
  createInventoryCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateInventoryCategoryDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createInventoryCategory(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('inventory.view')
  @Get('inventory/items')
  findInventoryItems(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: InventoryItemQueryDto,
  ) {
    return this.purchaseInventoryAssetsService.findInventoryItems(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('inventory.manage')
  @Post('inventory/items')
  createInventoryItem(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateInventoryItemDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createInventoryItem(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('inventory.view')
  @Get('inventory/movements')
  findStockMovements(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: StockMovementQueryDto,
  ) {
    return this.purchaseInventoryAssetsService.findStockMovements(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('inventory.manage')
  @Post('inventory/movements')
  createStockMovement(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateStockMovementDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createStockMovement(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('inventory.manage')
  @Post('inventory/stock-adjustments')
  createStockAdjustment(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateStockAdjustmentDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createStockAdjustment(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('assets.view')
  @Get('assets/categories')
  findAssetCategories(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: AssetCategoryQueryDto,
  ) {
    return this.purchaseInventoryAssetsService.findAssetCategories(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('assets.manage')
  @Post('assets/categories')
  createAssetCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateAssetCategoryDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createAssetCategory(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('assets.view')
  @Get('assets')
  findAssets(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: AssetQueryDto,
  ) {
    return this.purchaseInventoryAssetsService.findAssets(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('assets.manage')
  @Post('assets')
  createAsset(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateAssetDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createAsset(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('assets.manage')
  @Post('assets/:id/assign')
  assignAsset(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AssignAssetDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.assignAsset(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('assets.manage')
  @Post('assets/:id/maintenance')
  createAssetMaintenance(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateAssetMaintenanceDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.purchaseInventoryAssetsService.createAssetMaintenance(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
