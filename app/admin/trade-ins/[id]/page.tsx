/**
 * Admin Trade-In Detail — server component.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminTradeInById } from "@/features/admin/trade-ins/queries";
import { TradeInClient } from "./trade-in-client";
import { formatMoney } from "@/lib/utils/format-money";

export const metadata = { title: "Trade-In Detail — Wireless Connect Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
}

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
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  offer_sent: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
  completed: "bg-green-100 text-green-800",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value ?? "—"}</dd>
    </div>
  );
}

export default async function AdminTradeInDetailPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  const tradeIn = await getAdminTradeInById(id);
  if (!tradeIn) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/trade-ins"
            className="mb-1 text-xs font-medium text-primary hover:underline"
          >
            ← All Trade-Ins
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {tradeIn.brand} {tradeIn.model}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[tradeIn.status] ?? "bg-muted"}`}
            >
              {STATUS_LABELS[tradeIn.status] ?? tradeIn.status}
            </span>
            <span className="text-xs text-muted-foreground">
              Submitted {formatDate(tradeIn.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Device details */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Device Information</h2>
          <dl className="space-y-2">
            <DetailRow label="Brand" value={tradeIn.brand} />
            <DetailRow label="Model" value={tradeIn.model} />
            <DetailRow label="Type" value={<span className="capitalize">{tradeIn.device_type}</span>} />
            <DetailRow label="Storage" value={tradeIn.storage} />
            <DetailRow label="Carrier" value={tradeIn.carrier} />
            <DetailRow label="Condition" value={
              tradeIn.condition ? (
                <span className="capitalize">{tradeIn.condition.replace(/_/g, " ")}</span>
              ) : null
            } />
            <DetailRow label="Battery Health" value={tradeIn.battery_health != null ? `${tradeIn.battery_health}%` : null} />
            <DetailRow label="IMEI" value={tradeIn.imei} />
          </dl>
          {tradeIn.customer_description && (
            <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Customer Notes</p>
              <p className="whitespace-pre-line">{tradeIn.customer_description}</p>
            </div>
          )}
        </div>

        {/* Customer + offer */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Customer</h2>
            <dl className="space-y-2">
              <DetailRow label="Name" value={tradeIn.customer_name} />
              <DetailRow label="Email" value={
                <a href={`mailto:${tradeIn.customer_email}`} className="text-primary hover:underline">
                  {tradeIn.customer_email}
                </a>
              } />
              <DetailRow label="Phone" value={
                tradeIn.customer_phone ? (
                  <a href={`tel:${tradeIn.customer_phone}`} className="text-primary hover:underline">
                    {tradeIn.customer_phone}
                  </a>
                ) : null
              } />
            </dl>
          </div>

          {(tradeIn.estimated_offer != null || tradeIn.final_offer != null) && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="font-semibold">Offer</h2>
              <dl className="space-y-2">
                {tradeIn.estimated_offer != null && (
                  <DetailRow label="Estimated" value={formatMoney(tradeIn.estimated_offer)} />
                )}
                {tradeIn.final_offer != null && (
                  <DetailRow label="Final Offer" value={formatMoney(tradeIn.final_offer)} />
                )}
                {tradeIn.offer_expires_at && (
                  <DetailRow label="Expires" value={formatDate(tradeIn.offer_expires_at)} />
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Interactive actions */}
      <TradeInClient tradeIn={tradeIn} />
    </div>
  );
}
