/**
 * Admin Repairs List — server component.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminRepairs } from "@/features/admin/repairs/queries";

export const metadata = { title: "Repairs — Wireless Connect Admin" };

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  received: "Received",
  in_progress: "In Progress",
  waiting_on_parts: "Waiting on Parts",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  confirmed: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  received: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  waiting_on_parts: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  ready_for_pickup: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-muted text-muted-foreground",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "received", label: "Received" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "completed", label: "Completed" },
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminRepairsPage({ searchParams }: PageProps) {
  await requireStaff();
  const { status } = await searchParams;

  const repairs = await getAdminRepairs({ status, limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Repair Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {repairs.length} repair{repairs.length !== 1 ? "s" : ""}
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
              href={f.value ? `/admin/repairs?status=${f.value}` : "/admin/repairs"}
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

      {repairs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          No repair requests found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {repairs.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {[r.device_brand, r.device_model].filter(Boolean).join(" ") || "Unknown Device"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{r.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{r.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.requested_service ?? "Not specified"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/repairs/${r.id}`}
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
