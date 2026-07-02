import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Set a new password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the reset token details from the backend metadata flow.
        </p>
      </div>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
