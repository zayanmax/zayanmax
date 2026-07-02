import { ExpenseDetailPage } from "@/features/finance/expense-detail-page";

export default function ExpenseDetailRoute({ params }: { params: { id: string } }) {
  return <ExpenseDetailPage expenseId={params.id} />;
}
