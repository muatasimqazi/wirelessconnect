/**
 * Admin Warranties List — server component.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminWarranties } from "@/features/admin/warranties/queries";

export const metadata = { title: "Warranties — Wireless Connect Admin" };

const CLAIM_STATUS_LABELS: Record<string, string> = {
  none: "No Claim",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
  resolved: "Resolved",
};

const CLAIM_STATUS_COLORS: Record<string, string> = {
  none: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  under_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  denied: "bg-destructive/10 text-destructive",
  resolved: "bg-muted text-muted-foreground",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

interface PageProps {
  searchParams: Promise<{ claim?: string }>;
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "resolved", label: "Resolved" },
  { value: "none", label: "No Claim" },
];

export default async function AdminWarrantiesPage({ searchParams }: PageProps) {
  await requireStaff();
  const { claim } = await searchParams;

  const warranties = await getAdminWarranties({ claimStatus: claim, limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Warranties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {warranties.length} warranty record{warranties.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (claim ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/warranties?claim=${f.value}` : "/admin/warranties"}
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

      {warranties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          No warranties found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Claim Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {warranties.map((w) => {
                  const expired = new Date(w.expires_at) < new Date();
                  return (
                    <tr key={w.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{w.product_title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{w.customer_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{w.customer_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLAIM_STATUS_COLORS[w.claim_status] ?? "bg-muted"}`}
                        >
                          {CLAIM_STATUS_LABELS[w.claim_status] ?? w.claim_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {w.claim_submitted_at ? formatDate(w.claim_submitted_at) : "—"}
                      </td>
                      <td className={`px-4 py-3 text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                        {formatDate(w.expires_at)}
                        {expired && " (expired)"}
                      </td>
                      <td className="px-4 py-3">
                        {w.active ? (
                          <span className="text-xs text-green-600 dark:text-green-400">Active</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/warranties/${w.id}`}
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
