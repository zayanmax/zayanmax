import { ExpenseDetailPage } from "@/features/finance/expense-detail-page";

export default async function ExpenseDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExpenseDetailPage expenseId={id} />;
}
