import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaveApi } from "@/features/leave/api";
import type {
  CreateLeaveRequestPayload,
  LeaveBalancePayload,
  LeaveBalanceQuery,
  LeaveRequestQuery,
  LeaveTypePayload,
  ReviewLeaveRequestPayload,
} from "@/features/leave/types";

export const leaveKeys = {
  all: ["leave"] as const,
  types: ["leave", "types"] as const,
  requestsRoot: ["leave", "requests"] as const,
  requests: (query: LeaveRequestQuery) => [...leaveKeys.requestsRoot, query] as const,
  balancesRoot: ["leave", "balances"] as const,
  balances: (query: LeaveBalanceQuery) => [...leaveKeys.balancesRoot, query] as const,
};

export function useLeaveTypes() {
  return useQuery({ queryKey: leaveKeys.types, queryFn: leaveApi.types });
}

export function useLeaveRequests(query: LeaveRequestQuery) {
  return useQuery({ queryKey: leaveKeys.requests(query), queryFn: () => leaveApi.requests(query) });
}

export function useLeaveBalances(query: LeaveBalanceQuery, enabled = true) {
  return useQuery({
    queryKey: leaveKeys.balances(query),
    queryFn: () => leaveApi.balances(query),
    enabled,
  });
}

function useInvalidateLeave() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: leaveKeys.requestsRoot }),
      queryClient.invalidateQueries({ queryKey: leaveKeys.balancesRoot }),
    ]);
  };
}

export function useCreateLeaveRequest() {
  const invalidate = useInvalidateLeave();
  return useMutation({ mutationFn: (data: CreateLeaveRequestPayload) => leaveApi.createRequest(data), onSuccess: invalidate });
}

export function useReviewLeaveRequest() {
  const invalidate = useInvalidateLeave();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewLeaveRequestPayload }) => leaveApi.reviewRequest(id, data),
    onSuccess: invalidate,
  });
}

export function useCancelLeaveRequest() {
  const invalidate = useInvalidateLeave();
  return useMutation({ mutationFn: (id: string) => leaveApi.cancelRequest(id), onSuccess: invalidate });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveTypePayload) => leaveApi.createType(data),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: leaveKeys.types }),
  });
}

export function useUpsertLeaveBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveBalancePayload) => leaveApi.upsertBalance(data),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: leaveKeys.balancesRoot }),
  });
}
