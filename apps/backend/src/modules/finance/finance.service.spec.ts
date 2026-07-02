import { ConflictException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  ExpenseClaimStatusDto,
  PaymentModeDto,
  PettyCashTransactionTypeDto,
  VendorBillStatusDto,
} from './dto/finance.enums';

describe('FinanceService', () => {
  const prisma = {
    vendor: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    expenseCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    expenseClaim: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    vendorBill: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    vendorPayment: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    pettyCashAccount: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    pettyCashTransaction: {
      create: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates vendors and rejects duplicate email, phone, or GSTIN in a company', async () => {
    prisma.vendor.findFirst.mockResolvedValueOnce(null);
    prisma.vendor.create.mockResolvedValue({
      id: 'vendor-id',
      companyId: 'company-id',
      name: 'Acme Vendor',
      email: 'vendor@acme.test',
    });

    const service = new FinanceService(prisma as never);
    const created = await service.createVendor('company-id', 'actor-id', {
      name: 'Acme Vendor',
      email: 'Vendor@Acme.Test',
      phone: '9999999999',
      gstin: '29ABCDE1234F1Z5',
    });

    expect(created.id).toBe('vendor-id');
    expect(prisma.vendor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'vendor@acme.test',
          gstin: '29ABCDE1234F1Z5',
        }),
      }),
    );

    prisma.vendor.findFirst.mockResolvedValueOnce({ id: 'existing-vendor-id' });
    await expect(
      service.createVendor('company-id', 'actor-id', {
        name: 'Duplicate Vendor',
        email: 'vendor@acme.test',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates expense claims with items and attachment metadata and audits the action', async () => {
    prisma.expenseClaim.create.mockResolvedValue({
      id: 'expense-id',
      claimNumber: 'EXP-001',
      status: 'DRAFT',
    });
    const service = new FinanceService(prisma as never);

    const result = await service.createExpenseClaim('company-id', 'actor-id', {
      employeeId: 'employee-id',
      claimDate: '2026-06-13',
      title: 'Travel claim',
      items: [
        {
          expenseCategoryId: 'category-id',
          description: 'Cab fare',
          expenseDate: '2026-06-13',
          amount: 500,
        },
      ],
      attachments: [
        {
          fileName: 'receipt.jpg',
          storageKey: 'expenses/receipt.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
        },
      ],
    });

    expect(result.id).toBe('expense-id');
    expect(prisma.expenseClaim.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 500,
          items: expect.objectContaining({ create: expect.any(Array) }),
          attachments: expect.objectContaining({ create: expect.any(Array) }),
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'finance.expenses.create',
          entityType: 'ExpenseClaim',
          entityId: 'expense-id',
        }),
      }),
    );
  });

  it('updates expense status with approval/rejection audit actions', async () => {
    prisma.expenseClaim.findFirst.mockResolvedValue({
      id: 'expense-id',
      status: ExpenseClaimStatusDto.SUBMITTED,
    });
    prisma.expenseClaim.update.mockResolvedValue({
      id: 'expense-id',
      status: ExpenseClaimStatusDto.APPROVED,
    });
    const service = new FinanceService(prisma as never);

    const result = await service.changeExpenseStatus(
      'company-id',
      'expense-id',
      'actor-id',
      { status: ExpenseClaimStatusDto.APPROVED, reviewComment: 'Approved' },
    );

    expect(result.status).toBe('APPROVED');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'finance.expenses.approve',
        }),
      }),
    );
  });

  it('rejects duplicate vendor bills by vendor and bill number', async () => {
    prisma.vendorBill.findFirst.mockResolvedValue({ id: 'existing-bill-id' });
    const service = new FinanceService(prisma as never);

    await expect(
      service.createVendorBill('company-id', 'actor-id', {
        vendorId: 'vendor-id',
        billNumber: 'BILL-001',
        billDate: '2026-06-13',
        dueDate: '2026-06-30',
        items: [{ description: 'Service', quantity: 1, unitPrice: 1000 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates vendor payments and updates bill paid amount/status', async () => {
    prisma.vendorBill.findFirst.mockResolvedValue({
      id: 'bill-id',
      totalAmount: 1000,
      paidAmount: 0,
      status: VendorBillStatusDto.APPROVED,
    });
    prisma.vendorPayment.create.mockResolvedValue({
      id: 'payment-id',
      amount: 1000,
    });
    prisma.vendorBill.update.mockResolvedValue({
      id: 'bill-id',
      paidAmount: 1000,
      status: VendorBillStatusDto.PAID,
    });
    const service = new FinanceService(prisma as never);

    const result = await service.createVendorPayment('company-id', 'actor-id', {
      vendorId: 'vendor-id',
      vendorBillId: 'bill-id',
      paymentDate: '2026-06-13',
      amount: 1000,
      mode: PaymentModeDto.BANK_TRANSFER,
      referenceNumber: 'UTR123',
    });

    expect(result.id).toBe('payment-id');
    expect(prisma.vendorBill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paidAmount: 1000, status: 'PAID' }),
      }),
    );
  });

  it('creates petty cash transactions and updates account balance', async () => {
    prisma.pettyCashAccount.findFirst.mockResolvedValue({
      id: 'cash-id',
      currentBalance: 1000,
    });
    prisma.pettyCashTransaction.create.mockResolvedValue({
      id: 'cash-transaction-id',
      amount: 250,
    });
    prisma.pettyCashAccount.update.mockResolvedValue({
      id: 'cash-id',
      currentBalance: 750,
    });
    const service = new FinanceService(prisma as never);

    const result = await service.createPettyCashTransaction(
      'company-id',
      'actor-id',
      {
        pettyCashAccountId: 'cash-id',
        type: PettyCashTransactionTypeDto.OUTFLOW,
        transactionDate: '2026-06-13',
        amount: 250,
        description: 'Office supplies',
      },
    );

    expect(result.id).toBe('cash-transaction-id');
    expect(prisma.pettyCashAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cash-id' },
        data: expect.objectContaining({ currentBalance: 750 }),
      }),
    );
  });

  it('returns basic finance dashboard summary totals', async () => {
    prisma.expenseClaim.count.mockResolvedValue(2);
    prisma.expenseClaim.findMany.mockResolvedValue([
      { status: 'APPROVED', totalAmount: 500 },
      { status: 'PAID', totalAmount: 300 },
    ]);
    prisma.vendorBill.aggregate.mockResolvedValue({
      _sum: { balanceAmount: 700 },
    });
    prisma.vendorPayment.aggregate.mockResolvedValue({ _sum: { amount: 400 } });
    prisma.pettyCashTransaction.aggregate.mockResolvedValue({
      _sum: { amount: 250 },
    });
    const service = new FinanceService(prisma as never);

    const summary = await service.dashboardSummary('company-id');

    expect(summary).toEqual({
      expenseClaims: { total: 2, approvedAmount: 500, paidAmount: 300 },
      vendorBills: { outstandingAmount: 700 },
      vendorPayments: { paidAmount: 400 },
      pettyCash: { transactionAmount: 250 },
    });
  });
});
