import { apiRequest } from "@/lib/api/client";
import type {
  CreateLeaveRequestPayload,
  LeaveBalance,
  LeaveBalancePayload,
  LeaveBalanceQuery,
  LeaveBalanceResult,
  LeaveRequest,
  LeaveRequestQuery,
  LeaveRequestResult,
  LeaveType,
  LeaveTypePayload,
  ReviewLeaveRequestPayload,
} from "@/features/leave/types";

export const leaveApi = {
  types: () => apiRequest<LeaveType[]>({ url: "/leaves/types", method: "GET" }),
  createType: (data: LeaveTypePayload) =>
    apiRequest<LeaveType>({ url: "/leaves/types", method: "POST", data }),
  balances: (params: LeaveBalanceQuery) =>
    apiRequest<LeaveBalanceResult>({ url: "/leaves/balances", method: "GET", params }),
  upsertBalance: (data: LeaveBalancePayload) =>
    apiRequest<LeaveBalance>({ url: "/leaves/balances", method: "POST", data }),
  requests: (params: LeaveRequestQuery) =>
    apiRequest<LeaveRequestResult>({ url: "/leaves/requests", method: "GET", params }),
  createRequest: (data: CreateLeaveRequestPayload) =>
    apiRequest<LeaveRequest>({ url: "/leaves/requests", method: "POST", data }),
  reviewRequest: (id: string, data: ReviewLeaveRequestPayload) =>
    apiRequest<LeaveRequest>({ url: `/leaves/requests/${id}/review`, method: "PATCH", data }),
  cancelRequest: (id: string) =>
    apiRequest<LeaveRequest>({ url: `/leaves/requests/${id}/cancel`, method: "PATCH" }),
};
