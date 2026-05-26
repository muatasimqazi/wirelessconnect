"use client";

/**
 * SignInForm — client component.
 *
 * Handles the email + password sign-in form with:
 *  - React Hook Form + Zod validation (client-side)
 *  - Server Action for actual authentication (Supabase)
 *  - Inline error messages (no page reload on failure)
 *  - Loading state on the submit button
 *
 * The actual Supabase sign-in call is in the Server Action
 * `/app/[locale]/(storefront)/sign-in/actions.ts` to keep credentials
 * server-side and avoid exposing them in client bundles.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { signInAction } from "./actions";

const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type SignInFormValues = z.infer<typeof SignInSchema>;

interface SignInFormProps {
  returnTo?: string;
}

export function SignInForm({ returnTo }: SignInFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(SignInSchema),
  });

  function onSubmit(values: SignInFormValues) {
    startTransition(async () => {
      const result = await signInAction(values.email, values.password);

      if (result?.error) {
        setError("root", {
          message:
            result.error === "invalid_credentials"
              ? "Incorrect email or password."
              : "Something went wrong. Please try again.",
        });
        return;
      }

      // Redirect to returnTo or homepage after successful sign-in
      router.push(returnTo ?? "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Root error */}
      {errors.root && (
        <div
          role="alert"
          id="form-error"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errors.root.message}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          inputMode="email"
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={!!errors.email}
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("password")}</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-describedby={errors.password ? "password-error" : undefined}
          aria-invalid={!!errors.password}
          disabled={isPending}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : t("signIn")}
      </Button>
    </form>
  );
}
