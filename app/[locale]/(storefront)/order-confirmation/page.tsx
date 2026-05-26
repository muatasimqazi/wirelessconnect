/**
 * Order Confirmation page — /[locale]/order-confirmation?token=<uuid>
 *
 * Accessible to:
 *  - Guests: via guest_access_token UUID in the URL (sent in confirmation email)
 *  - Authenticated users: same URL (token is still present from success_url)
 *
 * Security: order is looked up ONLY by guest_access_token — never by order_id
 * or order_number alone. Token is a UUID (2^122 entropy).
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { lookupGuestOrder } from "@/features/orders/queries";
import { formatMoney } from "@/lib/utils/format-money";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircleIcon, PackageIcon, StoreIcon } from "lucide-react";

interface OrderConfirmationPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: "Order Confirmed — Wireless Connect",
  robots: { index: false }, // Order pages should not be indexed
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  const order = token ? await lookupGuestOrder(token) : null;

  // ── Token missing or invalid ────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8 text-center">
        <p className="text-lg text-muted-foreground">
          Order not found. Check your confirmation email for the order link.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const isPickup = order.fulfillment_method === "pickup";
  const isPaid = order.payment_status === "paid";

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <CheckCircleIcon
            className="h-16 w-16 text-green-500"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-bold md:text-3xl">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you{order.customer_name ? `, ${order.customer_name}` : ""}! Your order has been received.
          </p>
          <p className="rounded-full bg-muted px-4 py-1.5 font-mono text-sm font-semibold">
            {order.order_number}
          </p>
        </div>

        {/* Fulfillment info */}
        <div className="mb-6 rounded-xl border border-border bg-surface p-5">
          {isPickup ? (
            <div className="flex items-start gap-3">
              <StoreIcon className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">
                  {order.pickup_location_name ?? "Wireless Connect"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.pickup_location_address ?? "14723 Aurora Ave N, Seattle, WA 98133"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We will contact you when your order is ready for pickup.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <PackageIcon className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Ships to your address</p>
                {order.tracking_number ? (
                  <p className="text-sm text-muted-foreground">
                    Tracking: {order.shipping_carrier ? `${order.shipping_carrier} — ` : ""}
                    <span className="font-mono">{order.tracking_number}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    We will send you a tracking number when your order ships.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold">Order Summary</h2>

          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.product_title}</p>
                  {(item.device_storage || item.device_color) && (
                    <p className="text-xs text-muted-foreground">
                      {[item.device_storage, item.device_color].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {item.warranty_days > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {item.warranty_days}-Day Warranty
                    </p>
                  )}
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-medium tabular-nums">
                    {formatMoney(item.line_total, locale)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Qty {item.quantity}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(order.subtotal, locale)}</dd>
            </div>
            {order.discount_total > 0 && (
              <div className="flex justify-between text-green-600">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatMoney(order.discount_total, locale)}</dd>
              </div>
            )}
            {order.shipping_total > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">{formatMoney(order.shipping_total, locale)}</dd>
              </div>
            )}
            {order.tax_total > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="tabular-nums">{formatMoney(order.tax_total, locale)}</dd>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(order.total, locale)}</dd>
            </div>
          </dl>
        </div>

        {/* Payment status */}
        {!isPaid && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Payment is pending. You will receive a confirmation email once payment is confirmed.
          </div>
        )}

        {/* Confirmation email note */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          A confirmation email has been sent to{" "}
          <span className="font-medium">{order.customer_email}</span>.
        </p>

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
