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
  ChangeExpenseStatusDto,
  CreateExpenseCategoryDto,
  CreateExpenseClaimDto,
  CreatePettyCashAccountDto,
  CreatePettyCashTransactionDto,
  CreateVendorBillDto,
  CreateVendorDto,
  CreateVendorPaymentDto,
  ExpenseClaimQueryDto,
  FinanceListQueryDto,
  PettyCashTransactionQueryDto,
  VendorBillQueryDto,
  VendorPaymentQueryDto,
  VendorQueryDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @RequirePermissions('finance.view')
  @Get('finance/dashboard-summary')
  dashboardSummary(@CurrentUserDecorator() user: CurrentUser) {
    return this.financeService.dashboardSummary(user.companyId);
  }

  @RequirePermissions('finance.view')
  @Get('finance/payment-modes')
  paymentModes() {
    return this.financeService.paymentModes();
  }

  @RequirePermissions('finance.view')
  @Get('finance/expense-categories')
  findExpenseCategories(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: FinanceListQueryDto,
  ) {
    return this.financeService.findExpenseCategories(user.companyId, query);
  }

  @RequirePermissions('finance.manage')
  @Post('finance/expense-categories')
  createExpenseCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateExpenseCategoryDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.financeService.createExpenseCategory(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('finance.view')
  @Get('finance/expenses')
  findExpenseClaims(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ExpenseClaimQueryDto,
  ) {
    return this.financeService.findExpenseClaims(user.companyId, query);
  }

  @RequirePermissions('finance.manage')
  @Post('finance/expenses')
  createExpenseClaim(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateExpenseClaimDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.financeService.createExpenseClaim(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('finance.manage')
  @Patch('finance/expenses/:id/status')
  changeExpenseStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeExpenseStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.financeService.changeExpenseStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('vendors.view')
  @Get('vendors')
  findVendors(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: VendorQueryDto,
  ) {
    return this.financeService.findVendors(user.companyId, query);
  }

  @RequirePermissions('vendors.manage')
  @Post('vendors')
  createVendor(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateVendorDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.financeService.createVendor(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('finance.view')
  @Get('finance/vendor-bills')
  findVendorBills(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: VendorBillQueryDto,
  ) {
    return this.financeService.findVendorBills(user.companyId, query);
  }

  @RequirePermissions('finance.manage')
  @Post('finance/vendor-bills')
  createVendorBill(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateVendorBillDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.financeService.createVendorBill(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('finance.view')
  @Get('finance/vendor-payments')
  findVendorPayments(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: VendorPaymentQueryDto,
  ) {
    return this.financeService.findVendorPayments(user.companyId, query);
  }

  @RequirePermissions('finance.manage')
  @Post('finance/vendor-payments')
  createVendorPayment(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateVendorPaymentDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.financeService.createVendorPayment(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('finance.view')
  @Get('finance/petty-cash-accounts')
  findPettyCashAccounts(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: FinanceListQueryDto,
  ) {
    return this.financeService.findPettyCashAccounts(user.companyId, query);
  }

  @RequirePermissions('finance.manage')
  @Post('finance/petty-cash-accounts')
  createPettyCashAccount(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePettyCashAccountDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.financeService.createPettyCashAccount(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('finance.view')
  @Get('finance/petty-cash-transactions')
  findPettyCashTransactions(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PettyCashTransactionQueryDto,
  ) {
    return this.financeService.findPettyCashTransactions(user.companyId, query);
  }

  @RequirePermissions('finance.manage')
  @Post('finance/petty-cash-transactions')
  createPettyCashTransaction(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePettyCashTransactionDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.financeService.createPettyCashTransaction(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
