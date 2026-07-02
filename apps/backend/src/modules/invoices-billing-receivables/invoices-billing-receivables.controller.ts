import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequestContextDecorator } from '../../common/decorators/request-context.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import type { RequestContext } from '../../common/types/request-context.type';
import {
  BillingListQueryDto,
  ConvertQuotationToInvoiceDto,
  CreateCreditNoteDto,
  CreateDebitNoteDto,
  CreateInvoiceDto,
  CreateInvoiceSeriesDto,
  CreatePaymentReceiptDto,
  CreateReceiptAllocationDto,
  InvoiceReasonDto,
  UpdateInvoiceDto,
} from './dto/invoices-billing-receivables.dto';
import { InvoicesBillingReceivablesService } from './invoices-billing-receivables.service';

@ApiTags('Billing & Receivables')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('billing')
export class InvoicesBillingReceivablesController {
  constructor(
    private readonly invoicesBillingReceivablesService: InvoicesBillingReceivablesService,
  ) {}

  @RequirePermissions('billing.view')
  @Get('invoice-series')
  findInvoiceSeries(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: BillingListQueryDto,
  ) {
    return this.invoicesBillingReceivablesService.findInvoiceSeries(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('billing.manage')
  @Post('invoice-series')
  createInvoiceSeries(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateInvoiceSeriesDto,
  ) {
    return this.invoicesBillingReceivablesService.createInvoiceSeries(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('billing.view')
  @Get('invoices')
  findInvoices(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: BillingListQueryDto,
  ) {
    return this.invoicesBillingReceivablesService.findInvoices(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('billing.manage')
  @Post('invoices')
  createInvoice(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateInvoiceDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.invoicesBillingReceivablesService.createInvoice(
      user.companyId,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('billing.manage')
  @Patch('invoices/:id')
  updateInvoice(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.invoicesBillingReceivablesService.updateInvoice(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('billing.manage')
  @Patch('invoices/:id/issue')
  issueInvoice(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.invoicesBillingReceivablesService.issueInvoice(
      user.companyId,
      id,
      user.id,
    );
  }

  @RequirePermissions('billing.manage')
  @Patch('invoices/:id/cancel')
  cancelInvoice(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: InvoiceReasonDto,
  ) {
    return this.invoicesBillingReceivablesService.cancelInvoice(
      user.companyId,
      id,
      user.id,
      dto,
    );
  }

  @RequirePermissions('billing.manage')
  @Patch('invoices/:id/write-off')
  writeOffInvoice(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: InvoiceReasonDto,
  ) {
    return this.invoicesBillingReceivablesService.writeOffInvoice(
      user.companyId,
      id,
      user.id,
      dto,
    );
  }

  @RequirePermissions('billing.manage')
  @Post('quotations/:quotationId/convert-to-invoice')
  convertQuotationToInvoice(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('quotationId') quotationId: string,
    @Body() dto: ConvertQuotationToInvoiceDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.invoicesBillingReceivablesService.convertQuotationToInvoice(
      user.companyId,
      quotationId,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('billing.manage')
  @Post('payment-receipts')
  createPaymentReceipt(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePaymentReceiptDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.invoicesBillingReceivablesService.createPaymentReceipt(
      user.companyId,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('billing.manage')
  @Post('payment-receipts/:id/allocations')
  addReceiptAllocation(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateReceiptAllocationDto,
  ) {
    return this.invoicesBillingReceivablesService.addReceiptAllocation(
      user.companyId,
      id,
      user.id,
      dto,
    );
  }

  @RequirePermissions('billing.manage')
  @Post('credit-notes')
  createCreditNote(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateCreditNoteDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.invoicesBillingReceivablesService.createCreditNote(
      user.companyId,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('billing.manage')
  @Post('debit-notes')
  createDebitNote(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateDebitNoteDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.invoicesBillingReceivablesService.createDebitNote(
      user.companyId,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('billing.view')
  @Get('receivables/summary')
  receivablesSummary(@CurrentUserDecorator() user: CurrentUser) {
    return this.invoicesBillingReceivablesService.receivablesSummary(
      user.companyId,
    );
  }

  @RequirePermissions('billing.view')
  @Get('clients/:clientId/statement')
  clientStatement(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('clientId') clientId: string,
  ) {
    return this.invoicesBillingReceivablesService.clientStatement(
      user.companyId,
      clientId,
    );
  }

  @RequirePermissions('billing.view')
  @Get('receivables/aging')
  invoiceAgingSummary(@CurrentUserDecorator() user: CurrentUser) {
    return this.invoicesBillingReceivablesService.invoiceAgingSummary(
      user.companyId,
    );
  }
}
