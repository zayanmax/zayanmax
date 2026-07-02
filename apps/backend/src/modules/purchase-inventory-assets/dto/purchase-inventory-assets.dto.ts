import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  AssetAssignmentStatusDto,
  AssetStatusDto,
  PurchaseOrderStatusDto,
  PurchaseRequestStatusDto,
  StockMovementTypeDto,
} from './purchase-inventory-assets.enums';

export class CreateInventoryCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateInventoryCategoryDto extends PartialType(
  CreateInventoryCategoryDto,
) {}

export class InventoryCategoryQueryDto extends PaginationQueryDto {}

export class CreateInventoryItemDto {
  @IsOptional()
  @IsUUID()
  inventoryCategoryId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  itemCode!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}

export class UpdateInventoryItemDto extends PartialType(
  CreateInventoryItemDto,
) {}

export class InventoryItemQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  inventoryCategoryId?: string;

  @IsOptional()
  @Type(() => Boolean)
  lowStockOnly?: boolean;
}

export class CreateStockMovementDto {
  @IsUUID()
  inventoryItemId!: string;

  @IsEnum(StockMovementTypeDto)
  type!: StockMovementTypeDto;

  @IsNumber()
  quantity!: number;

  @IsISO8601({ strict: true })
  movementDate!: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateStockAdjustmentDto {
  @IsUUID()
  inventoryItemId!: string;

  @IsNumber()
  quantity!: number;

  @IsISO8601({ strict: true })
  movementDate!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class StockMovementQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsOptional()
  @IsEnum(StockMovementTypeDto)
  type?: StockMovementTypeDto;
}

export class PurchaseRequestItemDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedUnitPrice?: number;
}

export class CreatePurchaseRequestDto {
  @IsOptional()
  @IsUUID()
  requesterEmployeeId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  neededByDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemDto)
  items!: PurchaseRequestItemDto[];
}

export class UpdatePurchaseRequestDto extends PartialType(
  CreatePurchaseRequestDto,
) {}

export class PurchaseRequestQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  requesterEmployeeId?: string;

  @IsOptional()
  @IsEnum(PurchaseRequestStatusDto)
  declare status?: PurchaseRequestStatusDto;
}

export class ChangePurchaseRequestStatusDto {
  @IsEnum(PurchaseRequestStatusDto)
  status!: PurchaseRequestStatusDto;

  @IsOptional()
  @IsString()
  reviewComment?: string;
}

export class PurchaseOrderItemDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;
}

export class CreatePurchaseOrderDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsUUID()
  purchaseRequestId?: string;

  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsISO8601({ strict: true })
  orderDate!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {}

export class PurchaseOrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsUUID()
  purchaseRequestId?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatusDto)
  declare status?: PurchaseOrderStatusDto;
}

export class ChangePurchaseOrderStatusDto {
  @IsEnum(PurchaseOrderStatusDto)
  status!: PurchaseOrderStatusDto;
}

export class GoodsReceivedNoteItemDto {
  @IsOptional()
  @IsUUID()
  purchaseOrderItemId?: string;

  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  quantityReceived!: number;
}

export class CreateGoodsReceivedNoteDto {
  @IsUUID()
  purchaseOrderId!: string;

  @IsOptional()
  @IsString()
  grnNumber?: string;

  @IsISO8601({ strict: true })
  receivedDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested({ each: true })
  @Type(() => GoodsReceivedNoteItemDto)
  items!: GoodsReceivedNoteItemDto[];
}

export class GoodsReceivedNoteQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;
}

export class CreateAssetCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAssetCategoryDto extends PartialType(
  CreateAssetCategoryDto,
) {}

export class AssetCategoryQueryDto extends PaginationQueryDto {}

export class CreateAssetDto {
  @IsOptional()
  @IsUUID()
  assetCategoryId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  assetTag!: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  purchaseDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  warrantyExpiryDate?: string;

  @IsOptional()
  @IsEnum(AssetStatusDto)
  status?: AssetStatusDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssetDto extends PartialType(CreateAssetDto) {}

export class AssetQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  assetCategoryId?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;

  @IsOptional()
  @IsEnum(AssetStatusDto)
  declare status?: AssetStatusDto;
}

export class AssetAssignmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(AssetAssignmentStatusDto)
  declare status?: AssetAssignmentStatusDto;
}

export class AssignAssetDto {
  @IsUUID()
  employeeId!: string;

  @IsISO8601({ strict: true })
  assignedAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAssetMaintenanceDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsISO8601({ strict: true })
  maintenanceDate!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  nextMaintenanceDate?: string;
}

export class AssetMaintenanceQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
