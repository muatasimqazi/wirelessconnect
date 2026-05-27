/**
 * Account Orders — /[locale]/account/orders
 *
 * Shows a chronological list of the authenticated customer's orders.
 */

import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/empty-state";
import { getCustomerOrders } from "@/features/orders/queries";
import { formatMoney } from "@/lib/utils/format-money";
import { PackageIcon, ChevronRightIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const orders = await getCustomerOrders();

  return <OrdersList orders={orders} locale={locale as Locale} />;
}

function OrdersList({
  orders,
  locale,
}: {
  orders: Awaited<ReturnType<typeof getCustomerOrders>>;
  locale: Locale;
}) {
  const t = useTranslations("account");

  const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    paid: "secondary",
    processing: "secondary",
    ready_for_pickup: "default",
    shipped: "default",
    delivered: "default",
    picked_up: "default",
    cancelled: "destructive",
    refunded: "outline",
  };

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={PackageIcon}
        title={t("noOrders")}
        description={t("overview.noOrdersDesc")}
        action={{ label: t("browseDevices"), href: `/${locale}/shop` }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">#{order.order_number}</span>
              <Badge variant={statusColor[order.status] ?? "outline"} className="capitalize">
                {order.status.replace(/_/g, " ")}
              </Badge>
              {order.fulfillment_method === "pickup" && (
                <Badge variant="outline" className="text-xs">Pickup</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {" · "}
              {order.item_count} {order.item_count === 1 ? "item" : "items"}
              {" · "}
              {formatMoney(order.total)}
            </p>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/${locale}/account/orders/${order.order_number}`}
              aria-label={`View order #${order.order_number}`}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
