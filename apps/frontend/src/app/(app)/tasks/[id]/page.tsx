import { TaskDetailPage } from "@/features/tasks/task-detail-page";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskDetailPage taskId={id} />;
}
