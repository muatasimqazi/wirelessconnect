/**
 * Admin Repair Detail — server component.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminRepairById } from "@/features/admin/repairs/queries";
import { RepairClient } from "./repair-client";

export const metadata = { title: "Repair Detail — Wireless Connect Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

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
  requested: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  received: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  waiting_on_parts: "bg-orange-100 text-orange-800",
  ready_for_pickup: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value ?? "—"}</dd>
    </div>
  );
}

export default async function AdminRepairDetailPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  const repair = await getAdminRepairById(id);
  if (!repair) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/repairs"
          className="mb-1 text-xs font-medium text-primary hover:underline"
        >
          ← All Repairs
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {[repair.device_brand, repair.device_model].filter(Boolean).join(" ") || "Repair Request"}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[repair.status] ?? "bg-muted"}`}
          >
            {STATUS_LABELS[repair.status] ?? repair.status}
          </span>
          <span className="text-xs text-muted-foreground">
            Submitted {formatDate(repair.created_at)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Device + issue */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Device Information</h2>
            <dl className="space-y-2">
              <DetailRow label="Brand" value={repair.device_brand} />
              <DetailRow label="Model" value={repair.device_model} />
              <DetailRow label="Service Requested" value={repair.requested_service} />
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Issue Description</h2>
            <p className="text-sm text-foreground whitespace-pre-line">{repair.device_issue}</p>
            {repair.customer_notes && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Additional Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{repair.customer_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Customer</h2>
          <dl className="space-y-2">
            <DetailRow label="Name" value={repair.customer_name} />
            <DetailRow label="Email" value={
              <a href={`mailto:${repair.customer_email}`} className="text-primary hover:underline">
                {repair.customer_email}
              </a>
            } />
            <DetailRow label="Phone" value={
              repair.customer_phone ? (
                <a href={`tel:${repair.customer_phone}`} className="text-primary hover:underline">
                  {repair.customer_phone}
                </a>
              ) : null
            } />
          </dl>
        </div>
      </div>

      {/* Update timeline */}
      {repair.updates.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Update Timeline</h2>
          <ol className="space-y-3">
            {repair.updates.map((u) => (
              <li key={u.id} className="flex gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground capitalize">{u.status.replace(/_/g, " ")}</span>
                    {!u.visible_to_customer && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Internal
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{u.message}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Interactive actions */}
      <RepairClient repair={repair} />
    </div>
  );
}
