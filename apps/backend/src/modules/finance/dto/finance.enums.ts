export enum ExpenseClaimStatusDto {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum VendorBillStatusDto {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum VendorPaymentStatusDto {
  RECORDED = 'RECORDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentModeDto {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export enum PettyCashTransactionTypeDto {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}
