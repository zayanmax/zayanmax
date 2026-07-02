"use client";

import { branchSchema } from "@/features/branches/schemas";
import type { BranchPayload } from "@/features/branches/types";
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
} from "@/features/branches/hooks";
import { MasterDataPage } from "@/features/hr-master-data/master-data-page";

export function BranchesPage() {
  const records = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();

  return (
    <MasterDataPage
      title="Branches"
      description="Manage company branch records for employee assignments."
      records={records.data}
      isLoading={records.isLoading}
      error={records.error}
      schema={branchSchema}
      permission="settings.manage"
      fields={[
        { name: "name", label: "Name", placeholder: "Head Office" },
        { name: "address", label: "Address", placeholder: "Local address" },
        { name: "phone", label: "Phone", placeholder: "9000000000" },
      ]}
      createRecord={async (payload) => {
        await createMutation.mutateAsync(payload as BranchPayload);
      }}
      updateRecord={async (id, payload) => {
        await updateMutation.mutateAsync({ id, payload: payload as BranchPayload });
      }}
    />
  );
}
