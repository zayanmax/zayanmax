import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  BillingListQueryDto,
  ConvertQuotationToInvoiceDto,
  CreateCreditNoteDto,
  CreateDebitNoteDto,
  CreateInvoiceDto,
  CreateInvoiceSeriesDto,
  CreatePaymentReceiptDto,
  CreateReceiptAllocationDto,
  InvoiceItemDto,
  InvoiceReasonDto,
  UpdateInvoiceDto,
} from './dto/invoices-billing-receivables.dto';
import { InvoiceStatusDto } from './dto/invoices-billing-receivables.enums';

@Injectable()
export class InvoicesBillingReceivablesService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoiceSeries(
    companyId: string,
    actorId: string,
    dto: CreateInvoiceSeriesDto,
  ) {
    const existing = await this.prisma.invoiceSeries.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Invoice series exists');

    const series = await this.prisma.invoiceSeries.create({
      data: {
        companyId,
        name: dto.name,
        prefix: dto.prefix,
        nextNumber: dto.nextNumber ?? 1,
        padding: dto.padding ?? 4,
        suffix: dto.suffix,
        financialYear: dto.financialYear,
        isDefault: dto.isDefault ?? false,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'billing.invoice_series.create',
      'InvoiceSeries',
      series.id,
      undefined,
      series,
    );
    return series;
  }

  async findInvoiceSeries(companyId: string, query: BillingListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InvoiceSeriesWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.invoiceSeries.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.invoiceSeries.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createInvoice(
    companyId: string,
    actorId: string,
    dto: CreateInvoiceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureNoDuplicateInvoice(companyId, dto.invoiceNumber);
    const totals = this.calculateTotals(dto.items, dto.adjustmentTotal ?? 0);
    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        clientId: dto.clientId,
        projectId: dto.projectId,
        opportunityId: dto.opportunityId,
        quotationId: dto.quotationId,
        seriesId: dto.seriesId,
        invoiceNumber: dto.invoiceNumber,
        title: dto.title,
        currency: dto.currency ?? 'INR',
        issueDate: this.toDateOnly(dto.issueDate),
        dueDate: dto.dueDate ? this.toDateOnly(dto.dueDate) : undefined,
        adjustmentTotal: dto.adjustmentTotal ?? 0,
        taxMetadata: dto.taxMetadata as Prisma.InputJsonValue,
        discountMetadata: dto.discountMetadata as Prisma.InputJsonValue,
        terms: dto.terms,
        notes: dto.notes,
        ...totals,
        balanceAmount: totals.grandTotal,
        createdById: actorId,
        items: {
          create: dto.items.map((item) =>
            this.invoiceItemCreate(item, companyId, actorId),
          ),
        },
      },
      include: { items: true },
    });
    await this.audit(
      companyId,
      actorId,
      'billing.invoices.create',
      'Invoice',
      invoice.id,
      undefined,
      invoice,
      ipAddress,
      userAgent,
    );
    return invoice;
  }

  async findInvoices(companyId: string, query: BillingListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InvoiceWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.opportunityId ? { opportunityId: query.opportunityId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                invoiceNumber: { contains: query.search, mode: 'insensitive' },
              },
              { title: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          client: true,
          project: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true } },
          quotation: {
            select: { id: true, quotationNumber: true, title: true },
          },
          items: true,
          allocations: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findInvoice(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId, deletedAt: null },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        opportunity: { select: { id: true, name: true } },
        quotation: { select: { id: true, quotationNumber: true, title: true } },
        series: true,
        items: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        allocations: {
          include: { receipt: true },
          orderBy: { allocatedAt: 'desc' },
        },
        creditNotes: {
          where: { deletedAt: null },
          orderBy: { noteDate: 'desc' },
        },
        debitNotes: {
          where: { deletedAt: null },
          orderBy: { noteDate: 'desc' },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updateInvoice(
    companyId: string,
    invoiceId: string,
    actorId: string,
    dto: UpdateInvoiceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findInvoiceOrThrow(companyId, invoiceId);
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        title: dto.title,
        dueDate: dto.dueDate ? this.toDateOnly(dto.dueDate) : undefined,
        terms: dto.terms,
        notes: dto.notes,
        taxMetadata: dto.taxMetadata as Prisma.InputJsonValue,
        discountMetadata: dto.discountMetadata as Prisma.InputJsonValue,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'billing.invoices.update',
      'Invoice',
      invoiceId,
      current,
      invoice,
      ipAddress,
      userAgent,
    );
    return invoice;
  }

  async issueInvoice(companyId: string, invoiceId: string, actorId: string) {
    return this.setInvoiceStatus(
      companyId,
      invoiceId,
      actorId,
      InvoiceStatusDto.ISSUED,
      'billing.invoices.issue',
      { issuedAt: new Date() },
    );
  }

  async cancelInvoice(
    companyId: string,
    invoiceId: string,
    actorId: string,
    dto: InvoiceReasonDto,
  ) {
    return this.setInvoiceStatus(
      companyId,
      invoiceId,
      actorId,
      InvoiceStatusDto.CANCELLED,
      'billing.invoices.cancel',
      { cancelledAt: new Date(), cancelReason: dto.reason },
    );
  }

  async writeOffInvoice(
    companyId: string,
    invoiceId: string,
    actorId: string,
    dto: InvoiceReasonDto,
  ) {
    return this.setInvoiceStatus(
      companyId,
      invoiceId,
      actorId,
      InvoiceStatusDto.WRITTEN_OFF,
      'billing.invoices.write_off',
      { writtenOffAt: new Date(), writeOffReason: dto.reason },
    );
  }

  async convertQuotationToInvoice(
    companyId: string,
    quotationId: string,
    actorId: string,
    dto: ConvertQuotationToInvoiceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id: quotationId, companyId, deletedAt: null },
      include: { items: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    if (!quotation.clientId) {
      throw new ConflictException('Quotation must have a client to invoice');
    }
    const invoice = await this.createInvoice(
      companyId,
      actorId,
      {
        clientId: quotation.clientId,
        opportunityId: quotation.opportunityId ?? undefined,
        quotationId,
        seriesId: dto.seriesId,
        invoiceNumber: dto.invoiceNumber,
        title: quotation.title,
        currency: quotation.currency,
        issueDate: dto.issueDate,
        dueDate: dto.dueDate,
        items: quotation.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount),
          taxAmount: Number(item.taxAmount),
          sortOrder: item.sortOrder,
        })),
      },
      ipAddress,
      userAgent,
    );
    await this.audit(
      companyId,
      actorId,
      'billing.invoices.convert_from_quotation',
      'Invoice',
      invoice.id,
      quotation,
      invoice,
      ipAddress,
      userAgent,
    );
    return invoice;
  }

  async createPaymentReceipt(
    companyId: string,
    actorId: string,
    dto: CreatePaymentReceiptDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const receipt = await this.prisma.paymentReceipt.create({
      data: {
        companyId,
        clientId: dto.clientId,
        receiptNumber: dto.receiptNumber,
        receiptDate: this.toDateOnly(dto.receiptDate),
        amount: dto.amount,
        paymentMode: dto.paymentMode,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
        metadata: dto.metadata as Prisma.InputJsonValue,
        createdById: actorId,
      },
    });
    const allocations: unknown[] = [];
    for (const allocation of dto.allocations ?? []) {
      allocations.push(
        await this.allocateReceipt(companyId, receipt.id, actorId, allocation),
      );
    }
    await this.audit(
      companyId,
      actorId,
      'billing.payments.create',
      'PaymentReceipt',
      receipt.id,
      undefined,
      { receipt, allocations },
      ipAddress,
      userAgent,
    );
    return { ...receipt, allocations };
  }

  async findPaymentReceipts(companyId: string, query: BillingListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PaymentReceiptWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                receiptNumber: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                referenceNumber: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.paymentReceipt.findMany({
        where,
        include: { client: true, allocations: { include: { invoice: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'receiptDate']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.paymentReceipt.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async addReceiptAllocation(
    companyId: string,
    receiptId: string,
    actorId: string,
    dto: CreateReceiptAllocationDto,
  ) {
    return this.allocateReceipt(companyId, receiptId, actorId, dto);
  }

  async createCreditNote(
    companyId: string,
    actorId: string,
    dto: CreateCreditNoteDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const note = await this.prisma.creditNote.create({
      data: {
        companyId,
        clientId: dto.clientId,
        invoiceId: dto.invoiceId,
        creditNoteNumber: dto.creditNoteNumber,
        amount: dto.amount,
        reason: dto.reason,
        metadata: dto.metadata as Prisma.InputJsonValue,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'billing.credit_notes.create',
      'CreditNote',
      note.id,
      undefined,
      note,
      ipAddress,
      userAgent,
    );
    return note;
  }

  async createDebitNote(
    companyId: string,
    actorId: string,
    dto: CreateDebitNoteDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const note = await this.prisma.debitNote.create({
      data: {
        companyId,
        clientId: dto.clientId,
        invoiceId: dto.invoiceId,
        debitNoteNumber: dto.debitNoteNumber,
        amount: dto.amount,
        reason: dto.reason,
        metadata: dto.metadata as Prisma.InputJsonValue,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'billing.debit_notes.create',
      'DebitNote',
      note.id,
      undefined,
      note,
      ipAddress,
      userAgent,
    );
    return note;
  }

  async receivablesSummary(companyId: string) {
    const result = await this.prisma.invoice.aggregate({
      where: {
        companyId,
        deletedAt: null,
        status: {
          notIn: [InvoiceStatusDto.CANCELLED, InvoiceStatusDto.WRITTEN_OFF],
        },
      },
      _sum: { grandTotal: true, paidAmount: true, balanceAmount: true },
    });
    return {
      invoiceAmount: Number(result._sum.grandTotal ?? 0),
      paidAmount: Number(result._sum.paidAmount ?? 0),
      outstandingAmount: Number(result._sum.balanceAmount ?? 0),
    };
  }

  async clientStatement(companyId: string, clientId: string) {
    const [invoices, receipts, creditNotes, debitNotes] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { companyId, clientId, deletedAt: null },
        include: { allocations: true },
        orderBy: { issueDate: 'asc' },
      }),
      this.prisma.paymentReceipt.findMany({
        where: { companyId, clientId, deletedAt: null },
        include: { allocations: true },
        orderBy: { receiptDate: 'asc' },
      }),
      this.prisma.creditNote.findMany({
        where: { companyId, clientId, deletedAt: null },
        orderBy: { noteDate: 'asc' },
      }),
      this.prisma.debitNote.findMany({
        where: { companyId, clientId, deletedAt: null },
        orderBy: { noteDate: 'asc' },
      }),
    ]);
    return { clientId, invoices, receipts, creditNotes, debitNotes };
  }

  async invoiceAgingSummary(companyId: string, asOf = new Date()) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        deletedAt: null,
        balanceAmount: { gt: 0 },
        status: {
          notIn: [InvoiceStatusDto.CANCELLED, InvoiceStatusDto.WRITTEN_OFF],
        },
      },
      select: { id: true, balanceAmount: true, dueDate: true },
    });
    const buckets = {
      current: 0,
      days1To30: 0,
      days31To60: 0,
      days61To90: 0,
      over90: 0,
    };
    for (const invoice of invoices) {
      const amount = Number(invoice.balanceAmount);
      const days = invoice.dueDate
        ? Math.floor((asOf.getTime() - invoice.dueDate.getTime()) / 86400000)
        : 0;
      if (days <= 0) buckets.current += amount;
      else if (days <= 30) buckets.days1To30 += amount;
      else if (days <= 60) buckets.days31To60 += amount;
      else if (days <= 90) buckets.days61To90 += amount;
      else buckets.over90 += amount;
    }
    return {
      buckets,
      totalOutstanding: Object.values(buckets).reduce(
        (sum, value) => sum + value,
        0,
      ),
    };
  }

  private async allocateReceipt(
    companyId: string,
    receiptId: string,
    actorId: string,
    dto: CreateReceiptAllocationDto,
  ) {
    const invoice = await this.findInvoiceOrThrow(companyId, dto.invoiceId);
    const allocation = await this.prisma.receiptAllocation.create({
      data: {
        companyId,
        receiptId,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        createdById: actorId,
      },
    });
    const paidAmount = Number(invoice.paidAmount) + dto.amount;
    const grandTotal = Number(invoice.grandTotal);
    const balanceAmount = Math.max(grandTotal - paidAmount, 0);
    const status =
      balanceAmount === 0
        ? InvoiceStatusDto.PAID
        : paidAmount > 0
          ? InvoiceStatusDto.PARTIALLY_PAID
          : invoice.status;
    await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        paidAmount,
        balanceAmount,
        status,
        paidAt: status === InvoiceStatusDto.PAID ? new Date() : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'billing.receipt_allocations.create',
      'ReceiptAllocation',
      allocation.id,
      invoice,
      allocation,
    );
    return allocation;
  }

  private async setInvoiceStatus(
    companyId: string,
    invoiceId: string,
    actorId: string,
    status: InvoiceStatusDto,
    action: string,
    extra: Prisma.InvoiceUpdateInput,
  ) {
    const current = await this.findInvoiceOrThrow(companyId, invoiceId);
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status, ...extra, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      action,
      'Invoice',
      invoiceId,
      current,
      invoice,
    );
    return invoice;
  }

  private async ensureNoDuplicateInvoice(
    companyId: string,
    invoiceNumber: string,
  ) {
    const existing = await this.prisma.invoice.findFirst({
      where: { companyId, invoiceNumber },
    });
    if (existing) throw new ConflictException('Invoice number already exists');
  }

  private async findInvoiceOrThrow(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private invoiceItemCreate(
    item: InvoiceItemDto,
    companyId: string,
    actorId: string,
  ) {
    const lineTotal =
      item.quantity * item.unitPrice -
      (item.discountAmount ?? 0) +
      (item.taxAmount ?? 0);
    return {
      companyId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount ?? 0,
      taxAmount: item.taxAmount ?? 0,
      lineTotal,
      taxMetadata: item.taxMetadata as Prisma.InputJsonValue,
      discountMetadata: item.discountMetadata as Prisma.InputJsonValue,
      sortOrder: item.sortOrder ?? 0,
      createdById: actorId,
    };
  }

  private calculateTotals(items: InvoiceItemDto[], adjustmentTotal: number) {
    const subTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const discountTotal = items.reduce(
      (sum, item) => sum + (item.discountAmount ?? 0),
      0,
    );
    const taxTotal = items.reduce(
      (sum, item) => sum + (item.taxAmount ?? 0),
      0,
    );
    const grandTotal = subTotal - discountTotal + taxTotal + adjustmentTotal;
    return { subTotal, discountTotal, taxTotal, grandTotal };
  }

  private toDateOnly(value: string) {
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async audit(
    companyId: string,
    actorId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    oldValue?: unknown,
    newValue?: unknown,
    ipAddress?: string,
    userAgent?: string | string[],
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
        userAgent: Array.isArray(userAgent) ? userAgent.join(',') : userAgent,
      },
    });
  }
}
