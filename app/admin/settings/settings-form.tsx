"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saveStoreSettings } from "@/features/admin/settings/actions";
import type { StoreSettings } from "@/lib/data/settings";

const schema = z.object({
  hold_period_days: z.coerce.number().min(1).max(30).int(),
  stripe_tax_enabled: z.boolean(),
  shipping_insurance_threshold: z.coerce.number().min(0).int(),
  shipping_insurance_amount: z.coerce.number().min(0).int(),
  store_phone: z.string().optional(),
  store_email: z.string().optional(),
  whatsapp_number: z.string().optional(),
  default_warranty_days: z.coerce.number().min(0).int(),
});

type FormValues = z.infer<typeof schema>;

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      {...props}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

export function SettingsForm({
  defaultValues,
}: {
  defaultValues: Partial<StoreSettings>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hold_period_days: defaultValues.hold_period_days ?? 3,
      stripe_tax_enabled: defaultValues.stripe_tax_enabled ?? true,
      shipping_insurance_threshold: defaultValues.shipping_insurance_threshold ?? 50000,
      shipping_insurance_amount: defaultValues.shipping_insurance_amount ?? 499,
      store_phone: defaultValues.store_phone ?? "",
      store_email: defaultValues.store_email ?? "",
      whatsapp_number: defaultValues.whatsapp_number ?? "",
      default_warranty_days: defaultValues.default_warranty_days ?? 30,
    },
  });

  function onSubmit(data: FormValues) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await saveStoreSettings(data);
      if (result.error) setError(result.error);
      else setSuccess("Settings saved successfully.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-400/40 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* ── Compliance ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>RCW 19.60 Compliance</SectionTitle>
        <Field
          label="Hold Period (days)"
          error={errors.hold_period_days?.message}
          hint="Minimum days a device must be held before listing. Default: 3"
        >
          <Input type="number" min="1" max="30" {...register("hold_period_days")} />
        </Field>
      </section>

      {/* ── Payments ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Payments &amp; Tax</SectionTitle>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            {...register("stripe_tax_enabled")}
          />
          <div>
            <p className="text-sm font-medium text-foreground">Enable Stripe Tax</p>
            <p className="text-xs text-muted-foreground">
              Overridden by <code className="font-mono">STRIPE_TAX_ENABLED</code> env var
            </p>
          </div>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Shipping Insurance Threshold (cents)"
            hint="Orders above this amount get insurance. e.g. 50000 = $500"
            error={errors.shipping_insurance_threshold?.message}
          >
            <Input type="number" min="0" {...register("shipping_insurance_threshold")} />
          </Field>
          <Field
            label="Insurance Fee (cents)"
            hint="Fee added for high-value shipping. e.g. 499 = $4.99"
            error={errors.shipping_insurance_amount?.message}
          >
            <Input type="number" min="0" {...register("shipping_insurance_amount")} />
          </Field>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Store Contact</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store Phone" error={errors.store_phone?.message}>
            <Input type="tel" {...register("store_phone")} placeholder="(206) 555-0100" />
          </Field>
          <Field label="Store Email" error={errors.store_email?.message}>
            <Input type="email" {...register("store_email")} placeholder="info@wirelessconnectnw.com" />
          </Field>
          <Field label="WhatsApp Number" hint="Include country code, e.g. +12065550100">
            <Input {...register("whatsapp_number")} placeholder="+12065550100" />
          </Field>
        </div>
      </section>

      {/* ── Defaults ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Defaults</SectionTitle>
        <Field
          label="Default Warranty Days"
          hint="Applied when a product has no warranty_days set"
          error={errors.default_warranty_days?.message}
        >
          <Input type="number" min="0" {...register("default_warranty_days")} />
        </Field>
      </section>

      <div className="border-t border-border pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
