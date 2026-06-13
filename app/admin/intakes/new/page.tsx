/**
 * Admin — New Device Intake page.
 *
 * Collects:
 *  - Device details (brand, model, storage, color, carrier, condition)
 *  - Acquisition info (date, payment method, cost, source)
 *  - Seller identity (RCW 19.60 compliance — required by WA law)
 *    - Full name, phone, email, address
 *    - Government ID type, number (encrypted server-side), state, expiry
 *    - Declaration signature acknowledgment
 *
 * The seller_id_number field is a plaintext input — it is encrypted
 * server-side in createIntake() before being written to the database.
 * It is NEVER stored in plaintext.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createIntake } from "@/features/admin/intakes/actions";
import { ImeiScannerInput } from "@/components/admin/imei-scanner-input";
import type { ImeiLookupResult } from "@/lib/imei/lookup";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  // Device
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  storage: z.string().optional(),
  color: z.string().optional(),
  carrier: z.string().optional(),
  condition: z.string().optional(),
  imei: z.string().optional(),
  serial_number: z.string().optional(),
  imei_verification_status: z.enum(["not_checked", "passed", "failed", "needs_review"]).default("not_checked"),
  is_clean_imei: z.boolean().nullable().default(null),
  battery_health: z.coerce.number().min(0).max(100).optional().nullable(),
  battery_cycle_count: z.coerce.number().min(0).optional().nullable(),
  included_accessories: z.string().optional(),
  cosmetic_notes: z.string().optional(),
  defect_disclosure: z.string().optional(),

  // Acquisition
  acquisition_date: z.string().min(1, "Acquisition date is required"),
  acquisition_payment_method: z.enum(["cash", "check", "zelle", "venmo", "store_credit", "other"]),
  acquisition_source: z.string().optional(),
  cost: z.coerce.number().min(0).optional().nullable(),

  // Pricing (tentative)
  price: z.coerce.number().min(0).optional().nullable(),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  warranty_days: z.coerce.number().min(0).int().default(30),

  // Seller identity (RCW 19.60)
  seller_full_name: z.string().min(1, "Seller full name is required"),
  seller_phone: z.string().optional(),
  seller_email: z.string().optional(),
  seller_address: z.string().optional(),
  seller_id_type: z.enum(["drivers_license", "state_id", "passport", "military_id", "other"]),
  seller_id_number: z.string().min(1, "Government ID number is required"),
  seller_id_state: z.string().optional(),
  seller_id_expiry: z.string().optional(),
  seller_declaration_signed: z.literal(true, {
    errorMap: () => ({ message: "Seller must sign the declaration" }),
  }),
});

type FormValues = z.infer<typeof schema>;

// ─── UI helpers ───────────────────────────────────────────────────────────────

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
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      {...props}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      {...props}
    >
      {children}
    </select>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      {...props}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewIntakePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      acquisition_date: today,
      acquisition_payment_method: "cash",
      seller_id_type: "drivers_license",
      warranty_days: 30,
    },
  });

  function handleImeiResult(result: ImeiLookupResult) {
    if (result.imei) setValue("imei", result.imei);
    if (result.brand) setValue("brand", result.brand);
    if (result.model) setValue("model", result.model);
    if (result.storage) setValue("storage", result.storage);
    if (result.color) setValue("color", result.color);
    if (result.carrier) setValue("carrier", result.carrier as FormValues["carrier"]);
    if (result.serialNumber) setValue("serial_number", result.serialNumber);
    // Wire IMEI verification result — allows intake of blacklisted devices with proper status
    if (result.blacklistStatus !== undefined) {
      const isClean = result.blacklistStatus === "clean";
      setValue("is_clean_imei", isClean);
      setValue(
        "imei_verification_status",
        result.blacklistStatus === "unknown" ? "needs_review" : isClean ? "passed" : "failed",
      );
    }
  }

  function onSubmit(data: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await createIntake(data);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      router.push(`/admin/intakes/${result.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/intakes" className="hover:text-foreground">
          Intakes
        </Link>
        <span>/</span>
        <span className="text-foreground">New Intake</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Log Device Intake</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Required by RCW 19.60 — all seller identity information must be recorded.
          ID numbers are encrypted before storage.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {serverError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Device */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Device Details</SectionTitle>
            <button
              type="button"
              onClick={() => setScannerVisible((v) => !v)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {scannerVisible ? "Enter manually instead" : "Scan IMEI instead"}
            </button>
          </div>
          {scannerVisible && <ImeiScannerInput onResult={handleImeiResult} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand *" error={errors.brand?.message}>
              <Input {...register("brand")} placeholder="Apple" />
            </Field>
            <Field label="Model *" error={errors.model?.message}>
              <Input {...register("model")} placeholder="iPhone 14 Pro" />
            </Field>
            <Field label="Storage">
              <Input {...register("storage")} placeholder="256GB" />
            </Field>
            <Field label="Color">
              <Input {...register("color")} placeholder="Deep Purple" />
            </Field>
            <Field label="Carrier">
              <Select {...register("carrier")}>
                <option value="">— Select —</option>
                <option value="unlocked">Unlocked</option>
                <option value="att">AT&amp;T</option>
                <option value="verizon">Verizon</option>
                <option value="tmobile">T-Mobile</option>
                <option value="sprint">Sprint</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </Select>
            </Field>
            <Field label="Condition">
              <Select {...register("condition")}>
                <option value="">— Select —</option>
                <option value="like_new">Like New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </Select>
            </Field>
            <Field label="IMEI" hint="Leave blank if not applicable">
              <Input {...register("imei")} placeholder="352999…" />
            </Field>
            <Field label="Serial Number">
              <Input {...register("serial_number")} />
            </Field>
            <Field label="Battery Health (%)">
              <Input type="number" min="0" max="100" {...register("battery_health")} />
            </Field>
            <Field label="Battery Cycle Count">
              <Input type="number" min="0" {...register("battery_cycle_count")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Included Accessories">
                <Input {...register("included_accessories")} placeholder="Cable, charger, case…" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Cosmetic Notes / Defects">
                <Textarea {...register("cosmetic_notes")} placeholder="Describe any scratches, dents, cracks…" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Defect Disclosure" hint="Required for disclosed defects">
                <Textarea {...register("defect_disclosure")} placeholder="Any known functional issues…" />
              </Field>
            </div>
          </div>
        </div>

        {/* Acquisition */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <SectionTitle>Acquisition Details</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Acquisition Date *" error={errors.acquisition_date?.message}>
              <Input type="date" {...register("acquisition_date")} />
            </Field>
            <Field label="Payment Method *" error={errors.acquisition_payment_method?.message}>
              <Select {...register("acquisition_payment_method")}>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="zelle">Zelle</option>
                <option value="venmo">Venmo</option>
                <option value="store_credit">Store Credit</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Cost Paid (cents)" hint="e.g. 15000 = $150.00">
              <Input type="number" min="0" {...register("cost")} />
            </Field>
            <Field label="Acquisition Source">
              <Input {...register("acquisition_source")} placeholder="Walk-in, referral, trade-in…" />
            </Field>
            <Field label="Tentative Price (cents)">
              <Input type="number" min="0" {...register("price")} />
            </Field>
            <Field label="Compare-at Price (cents)">
              <Input type="number" min="0" {...register("compare_at_price")} />
            </Field>
            <Field label="Warranty Days">
              <Input type="number" min="0" {...register("warranty_days")} />
            </Field>
          </div>
        </div>

        {/* Seller Identity (RCW 19.60) */}
        <div className="rounded-xl border border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10 p-6 shadow-sm space-y-4">
          <div>
            <SectionTitle>Seller Identity — RCW 19.60 Required</SectionTitle>
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Washington State law requires recording seller identity for used electronics purchases.
              The government ID number is encrypted before storage and is never stored in plaintext.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Seller Full Name *" error={errors.seller_full_name?.message}>
                <Input {...register("seller_full_name")} placeholder="Jane Doe" />
              </Field>
            </div>
            <Field label="Phone">
              <Input type="tel" {...register("seller_phone")} placeholder="(206) 555-0100" />
            </Field>
            <Field label="Email">
              <Input type="email" {...register("seller_email")} placeholder="jane@example.com" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input {...register("seller_address")} placeholder="123 Main St, Seattle WA 98101" />
              </Field>
            </div>
            <Field label="ID Type *" error={errors.seller_id_type?.message}>
              <Select {...register("seller_id_type")}>
                <option value="drivers_license">Driver&apos;s License</option>
                <option value="state_id">State ID</option>
                <option value="passport">Passport</option>
                <option value="military_id">Military ID</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field
              label="ID Number *"
              error={errors.seller_id_number?.message}
              hint="Encrypted on save — not stored in plaintext"
            >
              <Input
                {...register("seller_id_number")}
                placeholder="License / passport number"
                autoComplete="off"
              />
            </Field>
            <Field label="Issuing State">
              <Input {...register("seller_id_state")} placeholder="WA" maxLength={2} />
            </Field>
            <Field label="ID Expiry">
              <Input type="date" {...register("seller_id_expiry")} />
            </Field>
          </div>

          <div className="rounded-lg border border-amber-400/40 bg-white dark:bg-amber-900/20 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Seller Declaration</p>
            <p className="text-xs text-muted-foreground">
              By checking below, the seller confirms that they are the rightful owner of
              this device, that it is not reported stolen, and that the information
              provided is accurate. This information is retained as required by RCW 19.60.
            </p>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                {...register("seller_declaration_signed")}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span className="text-sm font-medium text-foreground">
                Seller confirms declaration *
              </span>
            </label>
            {errors.seller_declaration_signed && (
              <p className="text-xs text-destructive">{errors.seller_declaration_signed.message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Create Intake Record"}
          </button>
          <Link
            href="/admin/intakes"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
