import { ProjectFormPage } from "@/features/projects/project-form-page";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectFormPage projectId={id} />;
}
