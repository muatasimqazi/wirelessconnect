"use client";

/**
 * CheckoutForm — client component.
 *
 * Collects: contact info and fulfillment method.
 * Shipping address is collected by Stripe Checkout (via shipping_address_collection)
 * so Stripe Tax can compute the correct rate based on destination.
 *
 * On submit → calls createCheckoutSession → redirects to Stripe hosted page.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { createCheckoutSession } from "@/features/checkout/actions";
import { formatMoney } from "@/lib/utils/format-money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoaderCircleIcon, LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartData } from "@/lib/cart/cart-queries";

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  customerEmail: z.string().email("Enter a valid email address"),
  customerName: z.string().min(2, "Full name is required"),
  customerPhone: z.string().optional(),
  fulfillmentMethod: z.enum(["pickup", "shipping"]),
  couponCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CheckoutFormProps {
  cart: CartData;
  locale: string;
  defaultEmail?: string;
  defaultName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckoutForm({
  cart,
  locale,
  defaultEmail = "",
  defaultName = "",
}: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerEmail: defaultEmail,
      customerName: defaultName,
      fulfillmentMethod: "pickup",
    },
  });

  const fulfillmentMethod = watch("fulfillmentMethod");
  const isBusy = isSubmitting || isRedirecting;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await createCheckoutSession({
      ...values,
      customerLocale: locale,
    });

    if (result.error) {
      setServerError(result.error);
      return;
    }

    if (result.url) {
      setIsRedirecting(true);
      window.location.href = result.url;
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">

        {/* ── Left: form fields ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Contact */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">{t("contact")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label={t("fields.email")} error={errors.customerEmail?.message}>
                  <Input
                    type="email"
                    autoComplete="email"
                    {...register("customerEmail")}
                    aria-invalid={!!errors.customerEmail}
                  />
                </Field>
              </div>
              <Field label={t("fields.name")} error={errors.customerName?.message}>
                <Input
                  autoComplete="name"
                  {...register("customerName")}
                  aria-invalid={!!errors.customerName}
                />
              </Field>
              <Field label={t("fields.phone")} optional error={errors.customerPhone?.message}>
                <Input
                  type="tel"
                  autoComplete="tel"
                  {...register("customerPhone")}
                  placeholder="(206) 555-0100"
                />
              </Field>
            </div>
          </section>

          {/* Fulfillment */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">{t("fulfillment")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <FulfillmentOption
                value="pickup"
                current={fulfillmentMethod}
                {...register("fulfillmentMethod")}
                label={t("pickup")}
                icon="📍"
                description="Ready within 1 business day — Shoreline, WA"
              />
              <FulfillmentOption
                value="shipping"
                current={fulfillmentMethod}
                {...register("fulfillmentMethod")}
                label={t("shipping")}
                icon="📦"
                description="Ships anywhere in the U.S. — address at checkout"
              />
            </div>
            {fulfillmentMethod === "shipping" && (
              <p className="mt-3 text-sm text-muted-foreground">
                You&apos;ll enter your shipping address on the Stripe checkout page.
                Shipping cost and tax are calculated there.
              </p>
            )}
          </section>

          {/* Optional coupon */}
          <section>
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-primary hover:underline select-none">
                Have a coupon code?
              </summary>
              <div className="mt-3 flex gap-2 max-w-xs">
                <Input
                  placeholder="COUPON"
                  className="uppercase"
                  {...register("couponCode")}
                />
              </div>
            </details>
          </section>

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}
        </div>

        {/* ── Right: order summary ──────────────────────────────────────── */}
        <aside className="rounded-xl border border-border bg-surface p-6 h-fit lg:sticky lg:top-24">
          <h2 className="mb-4 text-base font-semibold">{t("orderSummary")}</h2>

          {/* Items */}
          <ul className="mb-4 space-y-2 text-sm">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="flex-1 text-foreground/80 line-clamp-1">
                  {item.product.title}
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground"> ×{item.quantity}</span>
                  )}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatMoney((item.product.price ?? 0) * item.quantity, locale)}
                </span>
              </li>
            ))}
          </ul>

          <Separator className="my-3" />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("subtotal")}</dt>
              <dd className="font-medium tabular-nums">
                {formatMoney(cart.subtotal, locale)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("shippingCost")}</dt>
              <dd className="text-green-600 font-medium text-xs">
                Calculated at checkout
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("tax")}</dt>
              <dd className="text-muted-foreground text-xs">
                Calculated at checkout
              </dd>
            </div>
          </dl>

          <Separator className="my-3" />

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            disabled={isBusy}
          >
            {isBusy ? (
              <LoaderCircleIcon
                className="me-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <LockIcon className="me-2 h-4 w-4" aria-hidden="true" />
            )}
            {isRedirecting ? "Redirecting…" : t("placeOrder")}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            🔒 {t("secureCheckout")}
          </p>
        </aside>
      </div>
    </form>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium">
        {label}
        {optional && (
          <span className="ms-1 text-xs text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Fulfillment option card ──────────────────────────────────────────────────

interface FulfillmentOptionProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  current: string;
  label: string;
  icon: string;
  description: string;
}

function FulfillmentOption({
  value,
  current,
  label,
  icon,
  description,
  ...props
}: FulfillmentOptionProps) {
  const isSelected = current === value;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-accent/50",
      )}
    >
      <input type="radio" value={value} className="sr-only" {...props} />
      <span
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
          isSelected ? "border-primary" : "border-muted-foreground",
        )}
        aria-hidden="true"
      >
        {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <div>
        <p className="font-medium leading-tight">
          <span aria-hidden="true" className="me-1">
            {icon}
          </span>
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </label>
  );
}
