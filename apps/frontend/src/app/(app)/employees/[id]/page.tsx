import { EmployeeDetailPage } from "@/features/employees/employee-detail-page";

export default async function EmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeDetailPage employeeId={id} />;
}
