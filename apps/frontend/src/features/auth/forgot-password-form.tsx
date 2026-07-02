"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints";
import { ApiClientError } from "@/lib/api/client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setMessage(null);
    setError(null);
    try {
      await authApi.requestPasswordReset(values.email);
      setMessage("Password reset metadata was recorded. Email delivery is not enabled yet.");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Unable to request password reset",
      );
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormFieldWrapper
        label="Email"
        htmlFor="email"
        error={form.formState.errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@zayan.test"
          {...form.register("email")}
        />
      </FormFieldWrapper>

      {message ? (
        <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Submitting..." : "Request reset"}
      </Button>

      <Link href="/login" className="block text-center text-sm text-primary hover:underline">
        Back to login
      </Link>
    </form>
  );
}
