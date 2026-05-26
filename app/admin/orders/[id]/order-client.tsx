"use client";

/**
 * OrderClient — client component for order management actions.
 *
 * Features:
 *  - Status transition buttons (valid next statuses only)
 *  - Shipping details form (tracking number + carrier)
 *  - Admin notes editor
 *  - Cancellation request review (approve / deny)
 */

import { useState, useTransition } from "react";
import type { AdminOrderDetail } from "@/features/admin/orders/queries";
import {
  updateOrderStatus,
  updateShippingDetails,
  updateOrderAdminNotes,
  reviewCancellationRequest,
} from "@/features/admin/orders/actions";
import type { Database } from "@/types/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

// Valid next statuses for each current status
const NEXT_STATUSES: Partial<Record<OrderStatus, { value: OrderStatus; label: string; variant: "default" | "danger" }[]>> = {
  paid: [
    { value: "processing", label: "Mark Processing", variant: "default" },
    { value: "ready_for_pickup", label: "Ready for Pickup", variant: "default" },
    { value: "cancelled", label: "Cancel Order", variant: "danger" },
  ],
  processing: [
    { value: "ready_for_pickup", label: "Ready for Pickup", variant: "default" },
    { value: "shipped", label: "Mark Shipped", variant: "default" },
    { value: "cancelled", label: "Cancel Order", variant: "danger" },
  ],
  ready_for_pickup: [
    { value: "picked_up", label: "Mark Picked Up", variant: "default" },
    { value: "cancelled", label: "Cancel Order", variant: "danger" },
  ],
  shipped: [
    { value: "delivered", label: "Mark Delivered", variant: "default" },
    { value: "cancelled", label: "Cancel Order", variant: "danger" },
  ],
};

const CARRIERS = [
  "USPS",
  "UPS",
  "FedEx",
  "DHL",
  "OnTrac",
  "LSO",
  "Other",
];

// ─── Status Panel ─────────────────────────────────────────────────────────────

function StatusPanel({ order }: { order: AdminOrderDetail }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const nextOptions = NEXT_STATUSES[order.status as OrderStatus] ?? [];

  function handleTransition(newStatus: OrderStatus) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus);
      if (result.error) setError(result.error);
      else setSuccess(`Status updated to ${newStatus.replace(/_/g, " ")}.`);
    });
  }

  if (nextOptions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Update Status</h3>
      <div className="flex flex-wrap gap-2">
        {nextOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() => handleTransition(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-60 ${
              opt.variant === "danger"
                ? "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
    </div>
  );
}

// ─── Shipping Panel ───────────────────────────────────────────────────────────

function ShippingPanel({ order }: { order: AdminOrderDetail }) {
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [carrier, setCarrier] = useState(order.shipping_carrier ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateShippingDetails(order.id, {
        tracking_number: tracking,
        shipping_carrier: carrier,
      });
      if (result.error) setError(result.error);
      else setSuccess("Shipping details saved.");
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Shipping Details</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tracking Number</label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="9400111…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Carrier</label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Select carrier —</option>
            {CARRIERS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save Shipping Details"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
    </div>
  );
}

// ─── Admin Notes ──────────────────────────────────────────────────────────────

function AdminNotesPanel({ order }: { order: AdminOrderDetail }) {
  const [notes, setNotes] = useState(order.admin_notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateOrderAdminNotes(order.id, notes);
      if (result.error) setError(result.error);
      else setSuccess("Notes saved.");
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Admin Notes</h3>
      <textarea
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Internal notes (not visible to customer)…"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save Notes"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
    </div>
  );
}

// ─── Cancellation Request Panel ───────────────────────────────────────────────

function CancellationPanel({ order }: { order: AdminOrderDetail }) {
  const pendingReq = order.cancellation_requests.find((r) => r.status === "submitted");
  const [adminNotes, setAdminNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!pendingReq) return null;

  function handleDecision(decision: "approved" | "denied") {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await reviewCancellationRequest(pendingReq!.id, decision, adminNotes || undefined);
      if (result.error) setError(result.error);
      else setSuccess(`Cancellation request ${decision}.`);
    });
  }

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-destructive">⚠ Cancellation Request</h3>
      <div className="text-sm text-foreground">
        <p className="text-xs text-muted-foreground mb-1">Customer reason:</p>
        <p className="font-medium">{pendingReq.reason}</p>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Admin Notes (optional)
        </label>
        <textarea
          rows={2}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Reason for approval/denial…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleDecision("approved")}
          className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
        >
          Approve Cancellation
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleDecision("denied")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          Deny
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OrderClient({ order }: { order: AdminOrderDetail }) {
  return (
    <div className="space-y-6">
      {/* Cancellation request (at the top if pending) */}
      <CancellationPanel order={order} />

      {/* Status actions */}
      <StatusPanel order={order} />

      {/* Shipping details (only for shipping orders) */}
      {order.fulfillment_method === "shipping" && <ShippingPanel order={order} />}

      {/* Admin notes */}
      <AdminNotesPanel order={order} />
    </div>
  );
}
