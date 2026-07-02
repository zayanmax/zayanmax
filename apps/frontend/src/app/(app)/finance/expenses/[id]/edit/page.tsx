import { ExpenseFormPage } from "@/features/finance/expense-form-page";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExpenseFormPage expenseId={id} />;
}
