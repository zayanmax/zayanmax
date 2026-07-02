import { Suspense } from "react";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your backend account credentials.
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}
