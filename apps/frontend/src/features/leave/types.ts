import type { PaginatedResult } from "@/types/api";

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type LeaveEmployee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
};

export type LeaveType = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  annualAllowance: number | string;
  requiresApproval: boolean;
  paid: boolean;
  status: string;
  createdAt: string;
};

export type LeaveBalance = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  openingBalance: number | string;
  accrued: number | string;
  used: number | string;
  remaining: number | string;
  employee?: LeaveEmployee;
  leaveType?: Pick<LeaveType, "id" | "name" | "code">;
};

export type LeaveRequest = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  days: number | string;
  reason?: string | null;
  status: LeaveRequestStatus;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  createdAt: string;
  employee?: LeaveEmployee;
  leaveType?: Pick<LeaveType, "id" | "name" | "code">;
};

export type LeaveRequestQuery = {
  page?: number;
  limit?: number;
  employeeId?: string;
  leaveTypeId?: string;
  status?: LeaveRequestStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type LeaveBalanceQuery = {
  page?: number;
  limit?: number;
  employeeId?: string;
  leaveTypeId?: string;
  year?: number;
};

export type CreateLeaveRequestPayload = {
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  reason?: string;
};

export type ReviewLeaveRequestPayload = {
  status: "APPROVED" | "REJECTED";
  reviewComment?: string;
};

export type LeaveTypePayload = {
  name: string;
  code: string;
  annualAllowance?: number;
  requiresApproval?: boolean;
  paid?: boolean;
};

export type LeaveBalancePayload = {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  openingBalance?: number;
  accrued?: number;
  used?: number;
};

export type LeaveRequestResult = PaginatedResult<LeaveRequest>;
export type LeaveBalanceResult = PaginatedResult<LeaveBalance>;
