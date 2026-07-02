import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            ZM
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Zayan Max</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Internal office management workspace
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
