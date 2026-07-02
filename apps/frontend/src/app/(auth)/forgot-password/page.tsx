import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Password reset
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The backend stores reset metadata only. Email delivery is not enabled.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
