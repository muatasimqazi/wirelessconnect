/**
 * Admin Order Detail — server component.
 *
 * Shows full order info: customer, items (with IMEI/serial), totals,
 * fulfillment details, payment info.
 * Embeds OrderClient for interactive status management.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminOrderById } from "@/features/admin/orders/queries";
import { formatMoney } from "@/lib/utils/format-money";
import { OrderClient } from "./order-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  return {
    title: order ? `Order ${order.order_number} — Admin` : "Order — Admin",
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  ready_for_pickup: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  picked_up: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-muted text-muted-foreground",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const statusLabel = order.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/orders" className="hover:text-foreground">
          Orders
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground">{order.order_number}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground font-mono">
              {order.order_number}
            </h1>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-muted"}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDate(order.created_at)} ·{" "}
            <span className="capitalize">{order.fulfillment_method}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column (2/3) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-foreground">Items</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="px-5 py-4 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{item.product_title}</p>
                      {item.product_sku && (
                        <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                      )}
                      {item.product_imei && (
                        <p className="text-xs font-mono text-muted-foreground">IMEI: {item.product_imei}</p>
                      )}
                      {item.product_serial_number && (
                        <p className="text-xs font-mono text-muted-foreground">
                          S/N: {item.product_serial_number}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Warranty: {item.warranty_days} days
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium tabular-nums">{formatMoney(item.line_total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatMoney(item.unit_price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="border-t border-border px-5 py-4 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(order.subtotal)}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>
                    Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                  </span>
                  <span className="tabular-nums">-{formatMoney(order.discount_total)}</span>
                </div>
              )}
              {order.shipping_total > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span className="tabular-nums">{formatMoney(order.shipping_total)}</span>
                </div>
              )}
              {order.tax_total > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span>
                  <span className="tabular-nums">{formatMoney(order.tax_total)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Interactive actions */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-6">
            <h2 className="font-semibold text-foreground">Actions</h2>
            <OrderClient order={order} />
          </div>

          {/* Cancellation history */}
          {order.cancellation_requests.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-foreground">Cancellation Requests</h2>
              <div className="space-y-3">
                {order.cancellation_requests.map((req) => (
                  <div key={req.id} className="rounded-lg border border-border p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize text-foreground">
                        {req.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{req.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column (1/3) ────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-foreground">Customer</h2>
            <div>
              <InfoRow label="Name" value={order.customer_name ?? "—"} />
              <InfoRow label="Email" value={<a href={`mailto:${order.customer_email}`} className="text-primary hover:underline">{order.customer_email}</a>} />
              <InfoRow label="Phone" value={order.customer_phone ?? "—"} />
              <InfoRow label="Locale" value={order.customer_locale.toUpperCase()} />
            </div>
          </div>

          {/* Fulfillment */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-foreground">Fulfillment</h2>
            <div>
              <InfoRow
                label="Method"
                value={<span className="capitalize">{order.fulfillment_method}</span>}
              />
              {order.fulfillment_method === "pickup" && (
                <>
                  <InfoRow label="Location" value={order.pickup_location_name ?? "—"} />
                  <InfoRow label="Address" value={order.pickup_location_address ?? "—"} />
                </>
              )}
              {order.fulfillment_method === "shipping" && (
                <>
                  <InfoRow label="Carrier" value={order.shipping_carrier ?? "—"} />
                  <InfoRow
                    label="Tracking"
                    value={
                      order.tracking_number ? (
                        <span className="font-mono">{order.tracking_number}</span>
                      ) : (
                        "—"
                      )
                    }
                  />
                </>
              )}
              <InfoRow label="Shipped At" value={formatDate(order.shipped_at)} />
              <InfoRow label="Cancelled At" value={formatDate(order.cancelled_at)} />
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-foreground">Payment</h2>
            <div>
              <InfoRow
                label="Status"
                value={<span className="capitalize">{order.payment_status.replace(/_/g, " ")}</span>}
              />
              <InfoRow label="Paid At" value={formatDate(order.paid_at)} />
              {order.stripe_payment_intent_id && (
                <InfoRow
                  label="Stripe PI"
                  value={
                    <a
                      href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {order.stripe_payment_intent_id.slice(0, 16)}…
                    </a>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
