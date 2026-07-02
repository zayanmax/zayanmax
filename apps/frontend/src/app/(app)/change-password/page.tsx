import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { PageHeader } from "@/components/shared/page-header";

export default function ChangePasswordPage() {
  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Change Password"
        description="Changing your password revokes existing sessions and requires signing in again."
      />
      <div className="rounded-lg border border-border bg-card p-5">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
