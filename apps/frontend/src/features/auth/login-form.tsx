"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { authApi } from "@/lib/api/endpoints";
import { ApiClientError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/auth-store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      const response = await authApi.login(values);
      setAuthenticated(response);
      router.replace(searchParams.get("next") ?? "/dashboard");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Unable to sign in",
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

      <FormFieldWrapper
        label="Password"
        htmlFor="password"
        error={form.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          {...form.register("password")}
        />
      </FormFieldWrapper>

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
        {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <div className="text-center text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
