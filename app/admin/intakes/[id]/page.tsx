/**
 * Admin Intake Detail — server component.
 *
 * Shows full device intake info:
 *  - Device specs + condition
 *  - Acquisition details
 *  - Seller identity (name only — ID number is encrypted and NOT displayed)
 *  - Testing status summary
 *  - IMEI verification status
 *  - Publishing gate statuses
 *  - Interactive client component for management actions
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminIntakeById } from "@/features/admin/intakes/queries";
import { formatMoney } from "@/lib/utils/format-money";
import { IntakeClient } from "./intake-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const intake = await getAdminIntakeById(id);
  return {
    title: intake
      ? `${intake.brand} ${intake.model} Intake — Admin`
      : "Intake — Admin",
  };
}

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  testing: "Testing",
  needs_imei_check: "Needs IMEI Check",
  needs_photos: "Needs Photos",
  hold_period: "Hold Period",
  ready_to_list: "Ready to List",
  converted_to_product: "Converted to Product",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  testing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  needs_imei_check: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  needs_photos: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  hold_period: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  ready_to_list: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  converted_to_product: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value ?? "—"}</span>
    </div>
  );
}

function Gate({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`text-base ${pass ? "text-green-500" : "text-muted-foreground"}`}>
        {pass ? "✓" : "○"}
      </span>
      <span className={`text-sm ${pass ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

export default async function AdminIntakeDetailPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  const intake = await getAdminIntakeById(id);
  if (!intake) notFound();

  const now = new Date();
  const holdCleared =
    intake.hold_period_waived ||
    (intake.hold_until_date !== null && new Date(intake.hold_until_date) <= now);

  // Publishing gates
  const gates = [
    { label: "Status: Ready to List", pass: intake.status === "ready_to_list" },
    { label: "Testing: Passed", pass: intake.testing_status === "passed" },
    {
      label: "IMEI: Passed or N/A",
      pass: !intake.imei || ["passed", "not_checked"].includes(intake.imei_verification_status),
    },
    { label: "Clean IMEI verified", pass: !intake.imei || intake.is_clean_imei === true },
    { label: "Seller declaration signed", pass: intake.seller_declaration_signed === true },
    { label: "Hold period cleared", pass: holdCleared },
    { label: "Price set", pass: (intake.price ?? 0) > 0 },
    { label: "Brand set", pass: !!intake.brand },
    { label: "Model set", pass: !!intake.model },
    { label: "Condition set", pass: !!intake.condition },
    { label: "Seller name recorded", pass: !!intake.seller_full_name },
    { label: "Seller ID recorded", pass: !!intake.seller_id_number_encrypted },
    { label: "Activation lock removed", pass: intake.activation_lock_removed === true },
    { label: "Factory reset verified", pass: intake.factory_reset_verified === true },
    { label: "Data wipe verified", pass: intake.data_wiped_verified === true },
  ];

  const gatesPassed = gates.filter((g) => g.pass).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/intakes" className="hover:text-foreground">
          Intakes
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {intake.brand} {intake.model}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {intake.brand} {intake.model}
            </h1>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[intake.status] ?? "bg-muted"}`}
            >
              {STATUS_LABELS[intake.status] ?? intake.status}
            </span>
          </div>
          {(intake.storage || intake.color || intake.condition) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {[intake.storage, intake.color, intake.condition?.replace(/_/g, " ")].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {intake.converted_to_product_at && intake.product_id && (
          <Link
            href={`/admin/products/${intake.product_id}`}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            View Product →
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left (2/3) ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Actions */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-foreground">Actions</h2>
            <IntakeClient intake={intake} />
          </div>

          {/* Testing notes */}
          {(intake.testing_notes || intake.functional_notes) && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
              <h2 className="font-semibold text-foreground">Testing Notes</h2>
              {intake.testing_notes && <p className="text-sm text-foreground">{intake.testing_notes}</p>}
              {intake.functional_notes && (
                <p className="text-sm text-muted-foreground">{intake.functional_notes}</p>
              )}
            </div>
          )}

          {/* Rejection info */}
          {intake.status === "rejected" && intake.rejection_reason && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
              <h2 className="mb-2 font-semibold text-destructive">Rejected</h2>
              <p className="text-sm text-foreground">{intake.rejection_reason}</p>
              {intake.rejected_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(intake.rejected_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Right (1/3) ──────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Publishing gates */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-foreground">
              Publishing Gates ({gatesPassed}/{gates.length})
            </h2>
            <div className="divide-y divide-border">
              {gates.map((g) => (
                <Gate key={g.label} label={g.label} pass={g.pass} />
              ))}
            </div>
          </div>

          {/* Device info */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-foreground">Device</h2>
            <div>
              <InfoRow label="IMEI" value={intake.imei ? <span className="font-mono">{intake.imei}</span> : null} />
              <InfoRow label="Serial" value={intake.serial_number ? <span className="font-mono">{intake.serial_number}</span> : null} />
              <InfoRow label="Battery" value={intake.battery_health ? `${intake.battery_health}%` : null} />
              <InfoRow label="Carrier" value={intake.carrier} />
              <InfoRow label="Accessories" value={intake.included_accessories} />
            </div>
          </div>

          {/* Acquisition */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-foreground">Acquisition</h2>
            <div>
              <InfoRow label="Date" value={intake.acquisition_date} />
              <InfoRow label="Payment" value={intake.acquisition_payment_method?.replace(/_/g, " ")} />
              <InfoRow label="Cost" value={intake.cost !== null ? formatMoney(intake.cost) : null} />
              <InfoRow label="List Price" value={intake.price !== null ? formatMoney(intake.price) : null} />
              <InfoRow label="Source" value={intake.acquisition_source} />
            </div>
          </div>

          {/* Seller (no ID number — encrypted) */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-foreground">Seller (RCW 19.60)</h2>
            <div>
              <InfoRow label="Name" value={intake.seller_full_name} />
              <InfoRow label="Phone" value={intake.seller_phone} />
              <InfoRow label="Email" value={intake.seller_email} />
              <InfoRow label="ID Type" value={intake.seller_id_type?.replace(/_/g, " ")} />
              <InfoRow
                label="ID Number"
                value={
                  intake.seller_id_number_encrypted ? (
                    <span className="italic text-muted-foreground">Encrypted ✓</span>
                  ) : (
                    <span className="text-destructive">Not recorded</span>
                  )
                }
              />
              <InfoRow
                label="Declaration"
                value={
                  intake.seller_declaration_signed ? (
                    <span className="text-green-600 dark:text-green-400">Signed ✓</span>
                  ) : (
                    <span className="text-destructive">Not signed</span>
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
