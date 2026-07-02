import { Module } from '@nestjs/common';
import { InvoicesBillingReceivablesController } from './invoices-billing-receivables.controller';
import { InvoicesBillingReceivablesService } from './invoices-billing-receivables.service';

@Module({
  controllers: [InvoicesBillingReceivablesController],
  providers: [InvoicesBillingReceivablesService],
})
export class InvoicesBillingReceivablesModule {}
