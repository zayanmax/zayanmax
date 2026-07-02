"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints";
import { ApiClientError } from "@/lib/api/client";

const resetPasswordSchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),
    token: z.string().min(1, "Reset token is required"),
    resetTokenId: z.string().optional(),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm the new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      userId: searchParams.get("userId") ?? "",
      token: searchParams.get("token") ?? "",
      resetTokenId: searchParams.get("resetTokenId") ?? "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setMessage(null);
    setError(null);
    try {
      await authApi.confirmPasswordReset({
        userId: values.userId,
        token: values.token,
        resetTokenId: values.resetTokenId || undefined,
        newPassword: values.newPassword,
      });
      setMessage("Password reset completed. You can sign in with the new password.");
      form.reset({ ...values, newPassword: "", confirmPassword: "" });
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Unable to reset password",
      );
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormFieldWrapper
        label="User ID"
        htmlFor="userId"
        error={form.formState.errors.userId?.message}
      >
        <Input id="userId" {...form.register("userId")} />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Reset token"
        htmlFor="token"
        error={form.formState.errors.token?.message}
      >
        <Input id="token" {...form.register("token")} />
      </FormFieldWrapper>
      <FormFieldWrapper label="Reset token ID" htmlFor="resetTokenId">
        <Input id="resetTokenId" {...form.register("resetTokenId")} />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="New password"
        htmlFor="newPassword"
        error={form.formState.errors.newPassword?.message}
      >
        <Input id="newPassword" type="password" {...form.register("newPassword")} />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Confirm password"
        htmlFor="confirmPassword"
        error={form.formState.errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          {...form.register("confirmPassword")}
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

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
      </Button>
      <Link href="/login" className="block text-center text-sm text-primary hover:underline">
        Back to login
      </Link>
    </form>
  );
}
