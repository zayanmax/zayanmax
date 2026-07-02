"use client";

import { designationSchema } from "@/features/designations/schemas";
import type { DesignationPayload } from "@/features/designations/types";
import {
  useCreateDesignation,
  useDesignations,
  useUpdateDesignation,
} from "@/features/designations/hooks";
import { MasterDataPage } from "@/features/hr-master-data/master-data-page";

export function DesignationsPage() {
  const records = useDesignations();
  const createMutation = useCreateDesignation();
  const updateMutation = useUpdateDesignation();

  return (
    <MasterDataPage
      title="Designations"
      description="Manage employee designation labels."
      records={records.data}
      isLoading={records.isLoading}
      error={records.error}
      schema={designationSchema}
      permission="settings.manage"
      fields={[
        { name: "name", label: "Name", placeholder: "Manager" },
        {
          name: "description",
          label: "Description",
          placeholder: "Designation notes",
        },
      ]}
      createRecord={async (payload) => {
        await createMutation.mutateAsync(payload as DesignationPayload);
      }}
      updateRecord={async (id, payload) => {
        await updateMutation.mutateAsync({ id, payload: payload as DesignationPayload });
      }}
    />
  );
}
