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
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.invoicesBillingReceivablesService.createInvoice(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('billing.manage')
  @Patch('invoices/:id')
  updateInvoice(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.invoicesBillingReceivablesService.updateInvoice(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
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
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.invoicesBillingReceivablesService.convertQuotationToInvoice(
      user.companyId,
      quotationId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('billing.manage')
  @Post('payment-receipts')
  createPaymentReceipt(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePaymentReceiptDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.invoicesBillingReceivablesService.createPaymentReceipt(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
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
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.invoicesBillingReceivablesService.createCreditNote(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('billing.manage')
  @Post('debit-notes')
  createDebitNote(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateDebitNoteDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.invoicesBillingReceivablesService.createDebitNote(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
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
