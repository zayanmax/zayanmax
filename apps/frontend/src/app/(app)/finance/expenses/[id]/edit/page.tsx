import { ExpenseFormPage } from "@/features/finance/expense-form-page";

export default function EditExpensePage({ params }: { params: { id: string } }) {
  return <ExpenseFormPage expenseId={params.id} />;
}
