/**
 * Admin Intakes List — server component.
 *
 * Shows all device intakes with status, device info, seller, cost.
 * Supports ?status= filter.
 * Flags intakes whose hold period expires soon.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminIntakes } from "@/features/admin/intakes/queries";
import { formatMoney } from "@/lib/utils/format-money";

export const metadata = { title: "Device Intakes — Wireless Connect Admin" };

const INTAKE_STATUS_LABELS: Record<string, string> = {
  received: "Received",
  testing: "Testing",
  needs_imei_check: "Needs IMEI",
  needs_photos: "Needs Photos",
  hold_period: "Hold Period",
  ready_to_list: "Ready to List",
  converted_to_product: "Converted",
  rejected: "Rejected",
};

const INTAKE_STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  testing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  needs_imei_check: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  needs_photos: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  hold_period: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  ready_to_list: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  converted_to_product: "bg-muted text-muted-foreground",
  rejected: "bg-muted text-muted-foreground",
};

const TESTING_LABELS: Record<string, string> = {
  not_started: "—",
  in_progress: "Testing",
  passed: "Passed",
  failed: "Failed",
  needs_review: "Review",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(iso),
  );
}

function holdDaysRemaining(holdUntil: string | null): number | null {
  if (!holdUntil) return null;
  const diff = new Date(holdUntil).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const STATUS_FILTERS = [
  { value: "", label: "All Active" },
  { value: "received", label: "Received" },
  { value: "testing", label: "Testing" },
  { value: "needs_imei_check", label: "Needs IMEI" },
  { value: "needs_photos", label: "Needs Photos" },
  { value: "ready_to_list", label: "Ready to List" },
  { value: "converted_to_product", label: "Converted" },
  { value: "rejected", label: "Rejected" },
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminIntakesPage({ searchParams }: PageProps) {
  await requireStaff();
  const { status } = await searchParams;

  const intakes = await getAdminIntakes({ status, limit: 200 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Device Intakes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {intakes.length} device{intakes.length !== 1 ? "s" : ""}
            {status ? ` · ${INTAKE_STATUS_LABELS[status] ?? status}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/intakes/wholesale"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
          >
            Wholesale Batch
          </Link>
          <Link
            href="/admin/intakes/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            + New Intake
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/intakes?status=${f.value}` : "/admin/intakes"}
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

      {/* Table */}
      {intakes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          No intakes found.{" "}
          <Link href="/admin/intakes/new" className="underline">
            Log a new device
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Seller</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Testing</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hold</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {intakes.map((intake) => {
                  const holdDays = holdDaysRemaining(intake.hold_until_date);
                  return (
                    <tr key={intake.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {intake.brand} {intake.model}
                        </div>
                        {(intake.storage || intake.color) && (
                          <div className="text-xs text-muted-foreground">
                            {[intake.storage, intake.color].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {intake.seller_full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${INTAKE_STATUS_COLORS[intake.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {INTAKE_STATUS_LABELS[intake.status] ?? intake.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {TESTING_LABELS[intake.testing_status] ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {holdDays !== null ? (
                          <span
                            className={`text-xs font-medium ${
                              holdDays <= 0
                                ? "text-green-600 dark:text-green-400"
                                : holdDays <= 1
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {holdDays <= 0 ? "Cleared" : `${holdDays}d left`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {intake.cost !== null ? formatMoney(intake.cost) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {intake.price !== null ? formatMoney(intake.price) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(intake.acquisition_date)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/intakes/${intake.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
