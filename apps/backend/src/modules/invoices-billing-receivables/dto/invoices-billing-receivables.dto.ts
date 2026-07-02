import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  BillingPaymentModeDto,
  InvoiceStatusDto,
} from './invoices-billing-receivables.enums';

export class CreateInvoiceSeriesDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  prefix!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  nextNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  padding?: number;

  @IsOptional()
  @IsString()
  suffix?: string;

  @IsOptional()
  @IsString()
  financialYear?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class BillingListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(InvoiceStatusDto)
  declare status?: InvoiceStatusDto;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;
}

export class InvoiceItemDto {
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
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsObject()
  taxMetadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  discountMetadata?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  clientId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsISO8601({ strict: true })
  issueDate!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  adjustmentTotal?: number;

  @IsOptional()
  @IsObject()
  taxMetadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  discountMetadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  taxMetadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  discountMetadata?: Record<string, unknown>;
}

export class InvoiceReasonDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConvertQuotationToInvoiceDto {
  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @IsISO8601({ strict: true })
  issueDate!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  seriesId?: string;
}

export class ReceiptAllocationDto {
  @IsUUID()
  invoiceId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

export class CreatePaymentReceiptDto {
  @IsUUID()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  receiptNumber!: string;

  @IsISO8601({ strict: true })
  receiptDate!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsEnum(BillingPaymentModeDto)
  paymentMode?: BillingPaymentModeDto;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptAllocationDto)
  allocations?: ReceiptAllocationDto[];
}

export class CreateReceiptAllocationDto extends ReceiptAllocationDto {}

export class CreateCreditNoteDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsString()
  @IsNotEmpty()
  creditNoteNumber!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateDebitNoteDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsString()
  @IsNotEmpty()
  debitNoteNumber!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
