/**
 * Admin Trade-Ins List — server component.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminTradeIns } from "@/features/admin/trade-ins/queries";
import { formatMoney } from "@/lib/utils/format-money";

export const metadata = { title: "Trade-Ins — Wireless Connect Admin" };

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  offer_sent: "Offer Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  under_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  offer_sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminTradeInsPage({ searchParams }: PageProps) {
  await requireStaff();
  const { status } = await searchParams;

  const tradeIns = await getAdminTradeIns({ status, limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trade-Ins</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tradeIns.length} submission{tradeIns.length !== 1 ? "s" : ""}
          {status ? ` · ${STATUS_LABELS[status] ?? status}` : ""}
        </p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/trade-ins?status=${f.value}` : "/admin/trade-ins"}
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

      {tradeIns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          No trade-in submissions found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condition</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Offer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tradeIns.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{t.brand} {t.model}</div>
                      <div className="text-xs text-muted-foreground capitalize">{t.device_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{t.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{t.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {t.condition?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {t.final_offer != null
                        ? formatMoney(t.final_offer)
                        : t.estimated_offer != null
                        ? `~${formatMoney(t.estimated_offer)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/trade-ins/${t.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View →
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
