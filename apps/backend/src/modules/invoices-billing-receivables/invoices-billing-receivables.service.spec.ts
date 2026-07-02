import { ConflictException } from '@nestjs/common';
import { InvoicesBillingReceivablesService } from './invoices-billing-receivables.service';
import { InvoiceStatusDto } from './dto/invoices-billing-receivables.enums';

describe('InvoicesBillingReceivablesService', () => {
  const prisma = {
    invoiceSeries: { findFirst: jest.fn(), create: jest.fn() },
    invoice: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    quotation: { findFirst: jest.fn() },
    paymentReceipt: { create: jest.fn(), findMany: jest.fn() },
    receiptAllocation: { create: jest.fn(), findMany: jest.fn() },
    creditNote: { create: jest.fn(), findMany: jest.fn() },
    debitNote: { create: jest.fn(), findMany: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('prevents duplicate invoice numbers per company', async () => {
    prisma.invoice.findFirst.mockResolvedValue({ id: 'invoice-id' });
    const service = new InvoicesBillingReceivablesService(prisma as never);

    await expect(
      service.createInvoice('company-id', 'actor-id', {
        clientId: 'client-id',
        invoiceNumber: 'INV-001',
        issueDate: '2035-01-01',
        items: [{ description: 'Service', quantity: 1, unitPrice: 1000 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates invoices and records issue, payment, cancel, and write-off audits', async () => {
    prisma.invoice.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'invoice-id',
        grandTotal: 1000,
        paidAmount: 0,
        balanceAmount: 1000,
        status: InvoiceStatusDto.DRAFT,
      })
      .mockResolvedValueOnce({
        id: 'invoice-id',
        grandTotal: 1000,
        paidAmount: 0,
        balanceAmount: 1000,
        status: InvoiceStatusDto.ISSUED,
      })
      .mockResolvedValueOnce({
        id: 'invoice-id',
        grandTotal: 1000,
        paidAmount: 400,
        balanceAmount: 600,
        status: InvoiceStatusDto.PARTIALLY_PAID,
      });
    prisma.invoice.create.mockResolvedValue({ id: 'invoice-id' });
    prisma.invoice.update
      .mockResolvedValueOnce({
        id: 'invoice-id',
        status: InvoiceStatusDto.ISSUED,
      })
      .mockResolvedValueOnce({
        id: 'invoice-id',
        status: InvoiceStatusDto.PARTIALLY_PAID,
        paidAmount: 400,
        balanceAmount: 600,
      })
      .mockResolvedValueOnce({
        id: 'invoice-id',
        status: InvoiceStatusDto.CANCELLED,
      })
      .mockResolvedValueOnce({
        id: 'invoice-id',
        status: InvoiceStatusDto.WRITTEN_OFF,
      });
    prisma.paymentReceipt.create.mockResolvedValue({ id: 'receipt-id' });
    prisma.receiptAllocation.create.mockResolvedValue({ id: 'allocation-id' });
    const service = new InvoicesBillingReceivablesService(prisma as never);

    await service.createInvoice('company-id', 'actor-id', {
      clientId: 'client-id',
      invoiceNumber: 'INV-001',
      issueDate: '2035-01-01',
      items: [{ description: 'Service', quantity: 1, unitPrice: 1000 }],
    });
    await service.issueInvoice('company-id', 'invoice-id', 'actor-id');
    await service.createPaymentReceipt('company-id', 'actor-id', {
      clientId: 'client-id',
      receiptNumber: 'RCT-001',
      receiptDate: '2035-01-10',
      amount: 400,
      allocations: [{ invoiceId: 'invoice-id', amount: 400 }],
    });
    await service.cancelInvoice('company-id', 'invoice-id', 'actor-id', {
      reason: 'Cancelled by client',
    });
    await service.writeOffInvoice('company-id', 'invoice-id', 'actor-id', {
      reason: 'Bad debt',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'billing.invoices.create' }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'billing.payments.create' }),
      }),
    );
  });

  it('converts quotations, stores notes, and returns receivable summaries', async () => {
    prisma.quotation.findFirst.mockResolvedValue({
      id: 'quotation-id',
      clientId: 'client-id',
      opportunityId: 'opportunity-id',
      title: 'Quotation',
      currency: 'INR',
      items: [{ description: 'Service', quantity: 1, unitPrice: 1000 }],
    });
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.invoice.create.mockResolvedValue({ id: 'invoice-id' });
    prisma.creditNote.create.mockResolvedValue({ id: 'credit-note-id' });
    prisma.debitNote.create.mockResolvedValue({ id: 'debit-note-id' });
    prisma.invoice.aggregate.mockResolvedValue({
      _sum: { grandTotal: 1000, paidAmount: 300, balanceAmount: 700 },
    });
    prisma.invoice.findMany.mockResolvedValue([
      { id: 'invoice-id', balanceAmount: 700, dueDate: new Date('2035-01-31') },
    ]);
    prisma.paymentReceipt.findMany.mockResolvedValue([{ id: 'receipt-id' }]);
    prisma.creditNote.findMany.mockResolvedValue([{ id: 'credit-note-id' }]);
    prisma.debitNote.findMany.mockResolvedValue([{ id: 'debit-note-id' }]);
    const service = new InvoicesBillingReceivablesService(prisma as never);

    await service.convertQuotationToInvoice(
      'company-id',
      'quotation-id',
      'actor-id',
      { invoiceNumber: 'INV-Q-001', issueDate: '2035-01-01' },
    );
    await service.createCreditNote('company-id', 'actor-id', {
      invoiceId: 'invoice-id',
      creditNoteNumber: 'CN-001',
      amount: 100,
      reason: 'Discount',
    });
    await service.createDebitNote('company-id', 'actor-id', {
      invoiceId: 'invoice-id',
      debitNoteNumber: 'DN-001',
      amount: 50,
      reason: 'Additional service',
    });
    const summary = await service.receivablesSummary('company-id');
    const statement = await service.clientStatement('company-id', 'client-id');
    const aging = await service.invoiceAgingSummary(
      'company-id',
      new Date('2035-02-15'),
    );

    expect(summary.outstandingAmount).toBe(700);
    expect(statement.invoices).toHaveLength(1);
    expect(aging.totalOutstanding).toBe(700);
  });
});
