"use client";

import { departmentSchema } from "@/features/departments/schemas";
import type { DepartmentPayload } from "@/features/departments/types";
import {
  useCreateDepartment,
  useDepartments,
  useUpdateDepartment,
} from "@/features/departments/hooks";
import { MasterDataPage } from "@/features/hr-master-data/master-data-page";

export function DepartmentsPage() {
  const records = useDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  return (
    <MasterDataPage
      title="Departments"
      description="Manage HR departments for employee organization."
      records={records.data}
      isLoading={records.isLoading}
      error={records.error}
      schema={departmentSchema}
      permission="settings.manage"
      fields={[
        { name: "name", label: "Name", placeholder: "Operations" },
        {
          name: "description",
          label: "Description",
          placeholder: "Department notes",
        },
      ]}
      createRecord={async (payload) => {
        await createMutation.mutateAsync(payload as DepartmentPayload);
      }}
      updateRecord={async (id, payload) => {
        await updateMutation.mutateAsync({ id, payload: payload as DepartmentPayload });
      }}
    />
  );
}
