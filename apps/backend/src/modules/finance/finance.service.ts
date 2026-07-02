import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
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
  UpdateExpenseClaimDto,
  UpdateVendorBillDto,
  UpdateVendorDto,
  VendorBillQueryDto,
  VendorBillItemDto,
  VendorPaymentQueryDto,
  VendorQueryDto,
} from './dto/finance.dto';
import {
  ExpenseClaimStatusDto,
  PettyCashTransactionTypeDto,
  VendorBillStatusDto,
} from './dto/finance.enums';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createExpenseCategory(
    companyId: string,
    actorId: string,
    dto: CreateExpenseCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.expenseCategory.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing)
      throw new ConflictException('Expense category already exists');

    const category = await this.prisma.expenseCategory.create({
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
      'finance.expense_categories.create',
      'ExpenseCategory',
      category.id,
      undefined,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async findExpenseCategories(companyId: string, query: FinanceListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ExpenseCategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.expenseCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.expenseCategory.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createVendor(
    companyId: string,
    actorId: string,
    dto: CreateVendorDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureNoDuplicateVendor(companyId, dto);
    const vendor = await this.prisma.vendor.create({
      data: {
        companyId,
        name: dto.name,
        email: this.normalizeEmail(dto.email),
        phone: dto.phone,
        gstin: dto.gstin?.toUpperCase(),
        address: dto.address,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'finance.vendors.create',
      'Vendor',
      vendor.id,
      undefined,
      vendor,
      ipAddress,
      userAgent,
    );
    return vendor;
  }

  async findVendors(companyId: string, query: VendorQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.VendorWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { gstin: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findVendor(companyId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        bills: {
          where: { deletedAt: null },
          include: { items: true },
          orderBy: { billDate: 'desc' },
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updateVendor(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateVendorDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.prisma.vendor.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!oldValue) throw new NotFoundException('Vendor not found');
    await this.ensureNoDuplicateVendor(companyId, dto, id);
    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email ? this.normalizeEmail(dto.email) : undefined,
        phone: dto.phone,
        gstin: dto.gstin ? dto.gstin.toUpperCase() : undefined,
        address: dto.address,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'finance.vendors.update',
      'Vendor',
      id,
      oldValue,
      vendor,
      ipAddress,
      userAgent,
    );
    return vendor;
  }

  async createExpenseClaim(
    companyId: string,
    actorId: string,
    dto: CreateExpenseClaimDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const claimNumber = `EXP-${Date.now()}`;
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.amount + (item.taxAmount ?? 0),
      0,
    );
    const claim = await this.prisma.expenseClaim.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        claimNumber,
        title: dto.title,
        claimDate: this.toDateOnly(dto.claimDate)!,
        totalAmount: this.money(totalAmount),
        createdById: actorId,
        items: {
          create: dto.items.map((item) => ({
            companyId,
            expenseCategoryId: item.expenseCategoryId,
            description: item.description,
            expenseDate: this.toDateOnly(item.expenseDate)!,
            amount: item.amount,
            taxAmount: item.taxAmount ?? 0,
          })),
        },
        attachments: dto.attachments
          ? {
              create: dto.attachments.map((attachment) => ({
                companyId,
                fileName: attachment.fileName,
                storageKey: attachment.storageKey,
                mimeType: attachment.mimeType,
                size: attachment.size,
                createdById: actorId,
              })),
            }
          : undefined,
      },
      include: { items: true, attachments: true },
    });
    await this.audit(
      companyId,
      actorId,
      'finance.expenses.create',
      'ExpenseClaim',
      claim.id,
      undefined,
      claim,
      ipAddress,
      userAgent,
    );
    return claim;
  }

  async findExpenseClaims(companyId: string, query: ExpenseClaimQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ExpenseClaimWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.fromDate || query.toDate
        ? {
            claimDate: {
              ...(query.fromDate
                ? { gte: this.toDateOnly(query.fromDate) }
                : {}),
              ...(query.toDate ? { lte: this.toDateOnly(query.toDate) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { claimNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.expenseClaim.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              email: true,
            },
          },
          items: { include: { expenseCategory: true } },
          attachments: true,
        },
      }),
      this.prisma.expenseClaim.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findExpenseClaim(companyId: string, id: string) {
    const claim = await this.prisma.expenseClaim.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
          },
        },
        items: {
          include: { expenseCategory: true },
          orderBy: { expenseDate: 'asc' },
        },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!claim) throw new NotFoundException('Expense claim not found');
    return claim;
  }

  async updateExpenseClaim(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateExpenseClaimDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.prisma.expenseClaim.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: true, attachments: true },
    });
    if (!oldValue) throw new NotFoundException('Expense claim not found');
    const totalAmount = dto.items
      ? dto.items.reduce(
          (sum, item) => sum + item.amount + (item.taxAmount ?? 0),
          0,
        )
      : undefined;
    const claim = await this.prisma.expenseClaim.update({
      where: { id },
      data: {
        employeeId: dto.employeeId,
        title: dto.title,
        claimDate: dto.claimDate ? this.toDateOnly(dto.claimDate)! : undefined,
        totalAmount:
          totalAmount !== undefined ? this.money(totalAmount) : undefined,
        updatedById: actorId,
        items: dto.items
          ? {
              deleteMany: {},
              create: dto.items.map((item) => ({
                companyId,
                expenseCategoryId: item.expenseCategoryId,
                description: item.description,
                expenseDate: this.toDateOnly(item.expenseDate)!,
                amount: item.amount,
                taxAmount: item.taxAmount ?? 0,
              })),
            }
          : undefined,
        attachments: dto.attachments
          ? {
              deleteMany: {},
              create: dto.attachments.map((attachment) => ({
                companyId,
                fileName: attachment.fileName,
                storageKey: attachment.storageKey,
                mimeType: attachment.mimeType,
                size: attachment.size,
                createdById: actorId,
              })),
            }
          : undefined,
      },
      include: { items: true, attachments: true },
    });
    await this.audit(
      companyId,
      actorId,
      'finance.expenses.update',
      'ExpenseClaim',
      id,
      oldValue,
      claim,
      ipAddress,
      userAgent,
    );
    return claim;
  }

  async changeExpenseStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeExpenseStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.prisma.expenseClaim.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!oldValue) throw new NotFoundException('Expense claim not found');
    const now = new Date();
    const claim = await this.prisma.expenseClaim.update({
      where: { id },
      data: {
        status: dto.status,
        submittedAt:
          dto.status === ExpenseClaimStatusDto.SUBMITTED ? now : undefined,
        reviewedById: ['APPROVED', 'REJECTED'].includes(dto.status)
          ? actorId
          : undefined,
        reviewedAt: ['APPROVED', 'REJECTED'].includes(dto.status)
          ? now
          : undefined,
        reviewComment: dto.reviewComment,
        paidAt: dto.status === ExpenseClaimStatusDto.PAID ? now : undefined,
        cancelledAt:
          dto.status === ExpenseClaimStatusDto.CANCELLED ? now : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      this.expenseStatusAuditAction(dto.status),
      'ExpenseClaim',
      id,
      oldValue,
      claim,
      ipAddress,
      userAgent,
    );
    return claim;
  }

  async createVendorBill(
    companyId: string,
    actorId: string,
    dto: CreateVendorBillDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.vendorBill.findFirst({
      where: {
        companyId,
        vendorId: dto.vendorId,
        billNumber: dto.billNumber,
        deletedAt: null,
      },
    });
    if (existing) throw new ConflictException('Vendor bill already exists');

    const computedItems = dto.items.map((item) => {
      const lineTotal = item.quantity * item.unitPrice + (item.taxAmount ?? 0);
      return {
        companyId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: item.taxAmount ?? 0,
        lineTotal: this.money(lineTotal),
      };
    });
    const subTotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = dto.items.reduce(
      (sum, item) => sum + (item.taxAmount ?? 0),
      0,
    );
    const totalAmount = this.money(subTotal + taxAmount);

    const bill = await this.prisma.vendorBill.create({
      data: {
        companyId,
        vendorId: dto.vendorId,
        billNumber: dto.billNumber,
        billDate: this.toDateOnly(dto.billDate)!,
        dueDate: this.toDateOnly(dto.dueDate),
        subTotal: this.money(subTotal),
        taxAmount: this.money(taxAmount),
        totalAmount,
        balanceAmount: totalAmount,
        notes: dto.notes,
        createdById: actorId,
        items: { create: computedItems },
      },
      include: { items: true },
    });
    await this.audit(
      companyId,
      actorId,
      'finance.vendor_bills.create',
      'VendorBill',
      bill.id,
      undefined,
      bill,
      ipAddress,
      userAgent,
    );
    return bill;
  }

  async findVendorBills(companyId: string, query: VendorBillQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.VendorBillWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { billNumber: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.vendorBill.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: { vendor: { select: { id: true, name: true } }, items: true },
      }),
      this.prisma.vendorBill.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findVendorBill(companyId: string, id: string) {
    const bill = await this.prisma.vendorBill.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        payments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    if (!bill) throw new NotFoundException('Vendor bill not found');
    return bill;
  }

  async updateVendorBill(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateVendorBillDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.prisma.vendorBill.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { items: true },
    });
    if (!oldValue) throw new NotFoundException('Vendor bill not found');
    if (dto.billNumber || dto.vendorId) {
      const existing = await this.prisma.vendorBill.findFirst({
        where: {
          id: { not: id },
          companyId,
          vendorId: dto.vendorId ?? oldValue.vendorId,
          billNumber: dto.billNumber ?? oldValue.billNumber,
          deletedAt: null,
        },
      });
      if (existing) throw new ConflictException('Vendor bill already exists');
    }
    const totals = dto.items ? this.vendorBillTotals(dto.items) : undefined;
    const paidAmount = Number(oldValue.paidAmount);
    const totalAmount = totals?.totalAmount ?? Number(oldValue.totalAmount);
    const bill = await this.prisma.vendorBill.update({
      where: { id },
      data: {
        vendorId: dto.vendorId,
        billNumber: dto.billNumber,
        billDate: dto.billDate ? this.toDateOnly(dto.billDate)! : undefined,
        dueDate: dto.dueDate ? this.toDateOnly(dto.dueDate) : undefined,
        notes: dto.notes,
        subTotal: totals?.subTotal,
        taxAmount: totals?.taxAmount,
        totalAmount: totals?.totalAmount,
        balanceAmount:
          totals !== undefined
            ? this.money(Math.max(totalAmount - paidAmount, 0))
            : undefined,
        updatedById: actorId,
        items: dto.items
          ? {
              deleteMany: {},
              create: this.vendorBillItemCreates(dto.items, companyId),
            }
          : undefined,
      },
      include: { items: true },
    });
    await this.audit(
      companyId,
      actorId,
      'finance.vendor_bills.update',
      'VendorBill',
      id,
      oldValue,
      bill,
      ipAddress,
      userAgent,
    );
    return bill;
  }

  async createVendorPayment(
    companyId: string,
    actorId: string,
    dto: CreateVendorPaymentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const bill = dto.vendorBillId
      ? await this.prisma.vendorBill.findFirst({
          where: { id: dto.vendorBillId, companyId, deletedAt: null },
        })
      : null;
    if (dto.vendorBillId && !bill)
      throw new NotFoundException('Vendor bill not found');

    const payment = await this.prisma.vendorPayment.create({
      data: {
        companyId,
        vendorId: dto.vendorId,
        vendorBillId: dto.vendorBillId,
        paymentDate: this.toDateOnly(dto.paymentDate)!,
        amount: dto.amount,
        mode: dto.mode,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
        createdById: actorId,
      },
    });

    if (bill) {
      const paidAmount = Number(bill.paidAmount) + dto.amount;
      const totalAmount = Number(bill.totalAmount);
      await this.prisma.vendorBill.update({
        where: { id: bill.id },
        data: {
          paidAmount: this.money(paidAmount),
          balanceAmount: this.money(Math.max(totalAmount - paidAmount, 0)),
          status:
            paidAmount >= totalAmount
              ? VendorBillStatusDto.PAID
              : VendorBillStatusDto.PARTIALLY_PAID,
          updatedById: actorId,
        },
      });
    }

    await this.audit(
      companyId,
      actorId,
      'finance.vendor_payments.create',
      'VendorPayment',
      payment.id,
      undefined,
      payment,
      ipAddress,
      userAgent,
    );
    return payment;
  }

  async findVendorPayments(companyId: string, query: VendorPaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.VendorPaymentWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.vendorBillId ? { vendorBillId: query.vendorBillId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.vendorPayment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'paymentDate']: query.sortOrder ?? 'desc' },
        include: {
          vendor: { select: { id: true, name: true } },
          vendorBill: { select: { id: true, billNumber: true } },
        },
      }),
      this.prisma.vendorPayment.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createPettyCashAccount(
    companyId: string,
    actorId: string,
    dto: CreatePettyCashAccountDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.pettyCashAccount.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing)
      throw new ConflictException('Petty cash account already exists');

    const account = await this.prisma.pettyCashAccount.create({
      data: {
        companyId,
        name: dto.name,
        currentBalance: dto.openingBalance ?? 0,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'finance.petty_cash_accounts.create',
      'PettyCashAccount',
      account.id,
      undefined,
      account,
      ipAddress,
      userAgent,
    );
    return account;
  }

  async findPettyCashAccounts(companyId: string, query: FinanceListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PettyCashAccountWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.pettyCashAccount.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.pettyCashAccount.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createPettyCashTransaction(
    companyId: string,
    actorId: string,
    dto: CreatePettyCashTransactionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const account = await this.prisma.pettyCashAccount.findFirst({
      where: { id: dto.pettyCashAccountId, companyId, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Petty cash account not found');

    const transaction = await this.prisma.pettyCashTransaction.create({
      data: {
        companyId,
        pettyCashAccountId: dto.pettyCashAccountId,
        type: dto.type,
        transactionDate: this.toDateOnly(dto.transactionDate)!,
        amount: dto.amount,
        description: dto.description,
        referenceNumber: dto.referenceNumber,
        createdById: actorId,
      },
    });
    const currentBalance = Number(account.currentBalance);
    const nextBalance =
      dto.type === PettyCashTransactionTypeDto.INFLOW
        ? currentBalance + dto.amount
        : currentBalance - dto.amount;
    await this.prisma.pettyCashAccount.update({
      where: { id: account.id },
      data: { currentBalance: this.money(nextBalance), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'finance.petty_cash_transactions.create',
      'PettyCashTransaction',
      transaction.id,
      undefined,
      transaction,
      ipAddress,
      userAgent,
    );
    return transaction;
  }

  async findPettyCashTransactions(
    companyId: string,
    query: PettyCashTransactionQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PettyCashTransactionWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.pettyCashAccountId
        ? { pettyCashAccountId: query.pettyCashAccountId }
        : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.pettyCashTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [query.sortBy ?? 'transactionDate']: query.sortOrder ?? 'desc',
        },
        include: { pettyCashAccount: { select: { id: true, name: true } } },
      }),
      this.prisma.pettyCashTransaction.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  paymentModes() {
    return ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'OTHER'];
  }

  async dashboardSummary(companyId: string) {
    const [
      expenseTotal,
      expenses,
      vendorOutstanding,
      vendorPayments,
      pettyCash,
    ] = await Promise.all([
      this.prisma.expenseClaim.count({
        where: { companyId, deletedAt: null },
      }),
      this.prisma.expenseClaim.findMany({
        where: { companyId, deletedAt: null },
        select: { status: true, totalAmount: true },
      }),
      this.prisma.vendorBill.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { balanceAmount: true },
      }),
      this.prisma.vendorPayment.aggregate({
        where: { companyId, deletedAt: null, status: 'RECORDED' },
        _sum: { amount: true },
      }),
      this.prisma.pettyCashTransaction.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    return {
      expenseClaims: {
        total: expenseTotal,
        approvedAmount: this.sumByStatus(expenses, 'APPROVED'),
        paidAmount: this.sumByStatus(expenses, 'PAID'),
      },
      vendorBills: {
        outstandingAmount: Number(vendorOutstanding._sum.balanceAmount ?? 0),
      },
      vendorPayments: {
        paidAmount: Number(vendorPayments._sum.amount ?? 0),
      },
      pettyCash: {
        transactionAmount: Number(pettyCash._sum.amount ?? 0),
      },
    };
  }

  private async ensureNoDuplicateVendor(
    companyId: string,
    dto: CreateVendorDto | UpdateVendorDto,
    excludeId?: string,
  ) {
    const or: Prisma.VendorWhereInput[] = [];
    if (dto.email) or.push({ email: this.normalizeEmail(dto.email) });
    if (dto.phone) or.push({ phone: dto.phone });
    if (dto.gstin) or.push({ gstin: dto.gstin.toUpperCase() });
    if (or.length === 0) return;

    const existing = await this.prisma.vendor.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: or,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Vendor already exists with same email, phone, or GSTIN',
      );
    }
  }

  private expenseStatusAuditAction(status: ExpenseClaimStatusDto) {
    const map: Record<ExpenseClaimStatusDto, string> = {
      DRAFT: 'finance.expenses.update',
      SUBMITTED: 'finance.expenses.submit',
      APPROVED: 'finance.expenses.approve',
      REJECTED: 'finance.expenses.reject',
      PAID: 'finance.expenses.pay',
      CANCELLED: 'finance.expenses.cancel',
    };
    return map[status];
  }

  private sumByStatus(
    records: Array<{ status: string; totalAmount: Prisma.Decimal | number }>,
    status: string,
  ) {
    return records
      .filter((record) => record.status === status)
      .reduce((sum, record) => sum + Number(record.totalAmount), 0);
  }

  private vendorBillItemCreates(items: VendorBillItemDto[], companyId: string) {
    return items.map((item) => {
      const lineTotal = item.quantity * item.unitPrice + (item.taxAmount ?? 0);
      return {
        companyId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: item.taxAmount ?? 0,
        lineTotal: this.money(lineTotal),
      };
    });
  }

  private vendorBillTotals(items: VendorBillItemDto[]) {
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

  private normalizeEmail(email?: string) {
    return email?.toLowerCase();
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
