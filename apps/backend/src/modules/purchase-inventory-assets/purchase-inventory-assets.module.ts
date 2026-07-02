import { Module } from '@nestjs/common';
import { PurchaseInventoryAssetsController } from './purchase-inventory-assets.controller';
import { PurchaseInventoryAssetsService } from './purchase-inventory-assets.service';

@Module({
  controllers: [PurchaseInventoryAssetsController],
  providers: [PurchaseInventoryAssetsService],
})
export class PurchaseInventoryAssetsModule {}
