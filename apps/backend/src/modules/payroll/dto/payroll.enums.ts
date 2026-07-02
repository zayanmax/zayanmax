export enum PayrollComponentTypeDto {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
}

export enum PayrollCalculationTypeDto {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum SalaryAssignmentStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum SalaryAdvanceStatusDto {
  ACTIVE = 'ACTIVE',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
}

export enum PayrollRunStatusDto {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}
