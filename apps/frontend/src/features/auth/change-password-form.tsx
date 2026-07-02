"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints";
import { ApiClientError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/auth-store";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm the new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    setError(null);
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      clearAuth();
      router.replace("/login");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Unable to change password",
      );
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormFieldWrapper
        label="Current password"
        htmlFor="currentPassword"
        error={form.formState.errors.currentPassword?.message}
      >
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...form.register("currentPassword")}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="New password"
        htmlFor="newPassword"
        error={form.formState.errors.newPassword?.message}
      >
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...form.register("newPassword")}
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        label="Confirm password"
        htmlFor="confirmPassword"
        error={form.formState.errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
      </FormFieldWrapper>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}
