"use client";

/**
 * SignUpForm — client component.
 *
 * Email + password registration with Zod validation.
 * Shows a confirmation notice after successful submission
 * (user must check email before signing in).
 */

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction } from "./actions";
import { CheckCircleIcon } from "lucide-react";

const SignUpSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required.").max(100),
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof SignUpSchema>;

export function SignUpForm() {
  const t = useTranslations("auth");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
  });

  function onSubmit(values: SignUpFormValues) {
    startTransition(async () => {
      const result = await signUpAction(values.fullName, values.email, values.password);

      if (result?.error) {
        setError("root", {
          message:
            result.error === "email_exists"
              ? "An account with that email already exists. Try signing in."
              : "Something went wrong. Please try again.",
        });
        return;
      }

      setSubmitted(true);
    });
  }

  // Confirmation screen after successful sign-up
  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircleIcon className="mx-auto mb-3 h-10 w-10 text-green-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-green-900">Check your email!</h2>
        <p className="mt-2 text-sm text-green-800">
          We sent a confirmation link to your email address. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Root error */}
      {errors.root && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errors.root.message}
        </div>
      )}

      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName">{t("name")}</Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          disabled={isPending}
          {...register("fullName")}
        />
        {errors.fullName && (
          <p id="fullName-error" role="alert" className="text-xs text-destructive">
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          inputMode="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          disabled={isPending}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          disabled={isPending}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
          disabled={isPending}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p id="confirm-error" role="alert" className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms notice */}
      <p className="text-xs text-muted-foreground">{t("terms")}</p>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account…" : t("signUp")}
      </Button>
    </form>
  );
}
