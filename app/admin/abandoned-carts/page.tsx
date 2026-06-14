/**
 * Admin Abandoned Carts — /admin/abandoned-carts
 *
 * Shows authenticated customers who have items in their cart but have not
 * checked out within the selected time window. Use this page to manually
 * reach out via email.
 *
 * Guest carts are excluded — no email address is available for them.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAbandonedCarts } from "@/features/admin/abandoned-carts/queries";
import { formatMoney } from "@/lib/utils/format-money";

export const metadata = { title: "Abandoned Carts — Wireless Connect Admin" };

const HOUR_FILTERS = [
  { value: "1", label: "1 h" },
  { value: "6", label: "6 h" },
  { value: "24", label: "24 h" },
  { value: "48", label: "48 h" },
  { value: "168", label: "7 d" },
];

interface PageProps {
  searchParams: Promise<{ hours?: string }>;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function buildMailto(email: string, name: string | null): string {
  const firstName = name?.split(" ")[0] ?? "there";
  const subject = encodeURIComponent("Your Wireless Connect cart");
  const body = encodeURIComponent(
    `Hi ${firstName},\n\nWe noticed you left some items in your cart at Wireless Connect. ` +
    `If you have any questions or need help completing your order, we're happy to help!\n\n` +
    `Shop: https://wirelessconnectstore.com/shop\n\nThanks,\nWireless Connect Team`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default async function AbandonedCartsPage({ searchParams }: PageProps) {
  await requireStaff();
  const { hours: hoursParam } = await searchParams;
  const hours = Math.max(1, Math.min(720, parseInt(hoursParam ?? "24", 10) || 24));

  const carts = await getAbandonedCarts(hours);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Abandoned Carts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {carts.length} customer{carts.length !== 1 ? "s" : ""} with items added more than{" "}
          {hours >= 168 ? `${hours / 24}d` : `${hours}h`} ago and no checkout.
          Guest carts are not shown (no email available).
        </p>
      </div>

      {/* Time window filter */}
      <div className="flex flex-wrap gap-2">
        {HOUR_FILTERS.map((f) => {
          const active = String(hours) === f.value;
          return (
            <Link
              key={f.value}
              href={`/admin/abandoned-carts?hours=${f.value}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {carts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          No abandoned carts for this time window.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Items</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Active</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reach Out</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr
                    key={cart.cartId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                  >
                    {/* Customer */}
                    <td className="px-4 py-3">
                      {cart.fullName && (
                        <p className="font-medium text-foreground">{cart.fullName}</p>
                      )}
                      <p className="text-muted-foreground">{cart.email}</p>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""}
                      </p>
                      <ul className="mt-0.5 space-y-0.5">
                        {cart.items.map((item) => (
                          <li key={item.id} className="text-xs text-muted-foreground">
                            {item.quantity > 1 && (
                              <span className="font-medium">{item.quantity}× </span>
                            )}
                            {item.slug ? (
                              <a
                                href={`/en/product/${item.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2 hover:text-foreground"
                              >
                                {item.title}
                              </a>
                            ) : (
                              item.title
                            )}
                            {" "}
                            <span className="text-muted-foreground/70">
                              ({formatMoney(item.price)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {formatMoney(cart.estimatedValue)}
                    </td>

                    {/* Last active */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {timeAgo(cart.lastActivity)}
                    </td>

                    {/* Reach out */}
                    <td className="px-4 py-3">
                      <a
                        href={buildMailto(cart.email, cart.fullName)}
                        className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        Email
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
