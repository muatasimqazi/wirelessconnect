/**
 * Account Order Detail — /[locale]/account/orders/[orderNumber]
 *
 * Shows full order details for the authenticated customer.
 * IDOR protected — always verifies user_id server-side.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCustomerOrderByNumber } from "@/features/orders/queries";
import { formatMoney } from "@/lib/utils/format-money";
import { ArrowLeftIcon, PackageIcon, TruckIcon, StoreIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface OrderDetailPageProps {
  params: Promise<{ locale: string; orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);

  const order = await getCustomerOrderByNumber(orderNumber);
  if (!order) notFound();

  return <OrderDetailView order={order} locale={locale as Locale} />;
}

function OrderDetailView({
  order,
  locale,
}: {
  order: Awaited<ReturnType<typeof getCustomerOrderByNumber>>;
  locale: Locale;
}) {
  const t = useTranslations("orderConfirmation");
  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href={`/${locale}/account/orders`}>
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          All Orders
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-mono text-xl font-bold">#{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge className="capitalize text-sm">{order.status.replace(/_/g, " ")}</Badge>
      </div>

      {/* Fulfillment info */}
      <div className="rounded-lg border border-border bg-surface p-4">
        {order.fulfillment_method === "pickup" ? (
          <div className="flex items-start gap-3">
            <StoreIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium">{t("pickup")}</p>
              {order.pickup_location_name && (
                <p className="text-sm text-muted-foreground">{order.pickup_location_name}</p>
              )}
              {order.pickup_location_address && (
                <p className="text-sm text-muted-foreground">{order.pickup_location_address}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium">{t("shipping")}</p>
              {order.tracking_number ? (
                <p className="text-sm text-muted-foreground">
                  {order.shipping_carrier} — {order.tracking_number}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Tracking number will be provided when shipped.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3">
        <h3 className="font-semibold">Items</h3>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3"
          >
            {/* Image */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.product_image_url ? (
                <Image
                  src={item.product_image_url}
                  alt={item.product_title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PackageIcon className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">
                {item.product_slug ? (
                  <Link
                    href={`/${locale}/product/${item.product_slug}`}
                    className="hover:text-primary"
                  >
                    {item.product_title}
                  </Link>
                ) : (
                  item.product_title
                )}
              </p>
              {(item.device_storage || item.device_color) && (
                <p className="text-sm text-muted-foreground">
                  {[item.device_storage, item.device_color].filter(Boolean).join(" · ")}
                </p>
              )}
              {item.warranty_days > 0 && (
                <p className="text-xs text-muted-foreground">
                  {item.warranty_days}-day warranty
                  {item.warranty_expires_at &&
                    ` · Expires ${new Date(item.warranty_expires_at).toLocaleDateString(locale)}`}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="font-semibold">{formatMoney(item.line_total)}</p>
              {item.quantity > 1 && (
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatMoney(item.unit_price)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
        {order.discount_total > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>−{formatMoney(order.discount_total)}</span>
          </div>
        )}
        {order.shipping_total > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatMoney(order.shipping_total)}</span>
          </div>
        )}
        {order.tax_total > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatMoney(order.tax_total)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
