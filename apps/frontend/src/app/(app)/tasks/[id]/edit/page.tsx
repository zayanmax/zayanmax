import { TaskFormPage } from "@/features/tasks/task-form-page";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskFormPage taskId={id} />;
}
