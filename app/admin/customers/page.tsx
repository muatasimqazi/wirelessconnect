import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminCustomers } from "@/features/admin/customers/queries";
import { formatMoney } from "@/lib/utils/format-money";

export const metadata = { title: "Customers — Wireless Connect Admin" };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default async function AdminCustomersPage() {
  await requireStaff();
  const customers = await getAdminCustomers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {customers.length} registered customer{customers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          No customers yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Orders</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Spent</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Order</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {c.fullName && (
                        <p className="font-medium text-foreground">{c.fullName}</p>
                      )}
                      <p className="text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                      {c.orderCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                      {c.totalSpent > 0 ? formatMoney(c.totalSpent) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.lastOrderAt ? timeAgo(c.lastOrderAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(c.joinedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders?customer=${encodeURIComponent(c.email)}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Orders →
                      </Link>
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
