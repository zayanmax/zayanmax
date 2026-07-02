import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  ExpenseClaimStatusDto,
  PaymentModeDto,
  PettyCashTransactionTypeDto,
  VendorBillStatusDto,
  VendorPaymentStatusDto,
} from './finance.enums';

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class FinanceListQueryDto extends PaginationQueryDto {}

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class VendorQueryDto extends PaginationQueryDto {}

export class ExpenseClaimItemDto {
  @IsOptional()
  @IsUUID()
  expenseCategoryId?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsISO8601({ strict: true })
  expenseDate!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;
}

export class ExpenseAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;
}

export class CreateExpenseClaimDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsISO8601({ strict: true })
  claimDate!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @ValidateNested({ each: true })
  @Type(() => ExpenseClaimItemDto)
  items!: ExpenseClaimItemDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExpenseAttachmentDto)
  attachments?: ExpenseAttachmentDto[];
}

export class ExpenseClaimQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(ExpenseClaimStatusDto)
  declare status?: ExpenseClaimStatusDto;

  @IsOptional()
  @IsISO8601({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  toDate?: string;
}

export class ChangeExpenseStatusDto {
  @IsEnum(ExpenseClaimStatusDto)
  status!: ExpenseClaimStatusDto;

  @IsOptional()
  @IsString()
  reviewComment?: string;
}

export class VendorBillItemDto {
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
  taxAmount?: number;
}

export class CreateVendorBillDto {
  @IsUUID()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  billNumber!: string;

  @IsISO8601({ strict: true })
  billDate!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested({ each: true })
  @Type(() => VendorBillItemDto)
  items!: VendorBillItemDto[];
}

export class VendorBillQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsEnum(VendorBillStatusDto)
  declare status?: VendorBillStatusDto;
}

export class CreateVendorPaymentDto {
  @IsUUID()
  vendorId!: string;

  @IsOptional()
  @IsUUID()
  vendorBillId?: string;

  @IsISO8601({ strict: true })
  paymentDate!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(PaymentModeDto)
  mode!: PaymentModeDto;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VendorPaymentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsUUID()
  vendorBillId?: string;

  @IsOptional()
  @IsEnum(VendorPaymentStatusDto)
  declare status?: VendorPaymentStatusDto;
}

export class CreatePettyCashAccountDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;
}

export class CreatePettyCashTransactionDto {
  @IsUUID()
  pettyCashAccountId!: string;

  @IsEnum(PettyCashTransactionTypeDto)
  type!: PettyCashTransactionTypeDto;

  @IsISO8601({ strict: true })
  transactionDate!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;
}

export class PettyCashTransactionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  pettyCashAccountId?: string;

  @IsOptional()
  @IsEnum(PettyCashTransactionTypeDto)
  type?: PettyCashTransactionTypeDto;
}
