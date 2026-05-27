"use client";

/**
 * TradeInClient — interactive portion of the trade-in detail page.
 * Handles status updates and sending offers.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTradeInStatus, sendTradeInOffer } from "@/features/admin/trade-ins/actions";
import type { AdminTradeInDetail } from "@/features/admin/trade-ins/queries";

interface TradeInClientProps {
  tradeIn: AdminTradeInDetail;
}

const STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "completed", label: "Completed" },
] as const;

type TradeInStatus = (typeof STATUSES)[number]["value"];

export function TradeInClient({ tradeIn }: TradeInClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Status update
  const [newStatus, setNewStatus] = useState<TradeInStatus>(tradeIn.status as TradeInStatus);
  const [adminNotes, setAdminNotes] = useState(tradeIn.admin_notes ?? "");

  // Offer form
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [estimatedOfferInput, setEstimatedOfferInput] = useState(
    tradeIn.estimated_offer ? String(tradeIn.estimated_offer / 100) : "",
  );
  const [finalOfferInput, setFinalOfferInput] = useState(
    tradeIn.final_offer ? String(tradeIn.final_offer / 100) : "",
  );

  function handleStatusUpdate() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateTradeInStatus(tradeIn.id, newStatus, adminNotes || undefined);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Status updated.");
        router.refresh();
      }
    });
  }

  function handleSendOffer() {
    const estimated = Math.round(parseFloat(estimatedOfferInput) * 100);
    const final = Math.round(parseFloat(finalOfferInput) * 100);

    if (isNaN(estimated) || isNaN(final) || estimated <= 0 || final <= 0) {
      setError("Please enter valid offer amounts in dollars.");
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await sendTradeInOffer(tradeIn.id, estimated, final, adminNotes || undefined);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Offer sent to customer.");
        setShowOfferForm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Status update */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Update Status</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TradeInStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Admin Notes</Label>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes about this trade-in…"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex gap-2">
          <Button onClick={handleStatusUpdate} disabled={isPending} size="sm">
            {isPending ? "Saving…" : "Save Status"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOfferForm((v) => !v)}
          >
            {showOfferForm ? "Cancel Offer" : "Send Offer to Customer"}
          </Button>
        </div>
      </div>

      {/* Send offer form */}
      {showOfferForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Send Trade-In Offer</h2>
          <p className="text-sm text-muted-foreground">
            This will update the status to &ldquo;Offer Sent&rdquo; and email the customer with the offer amount.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Estimated Offer ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={estimatedOfferInput}
                onChange={(e) => setEstimatedOfferInput(e.target.value)}
                placeholder="50.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Final Offer ($) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={finalOfferInput}
                onChange={(e) => setFinalOfferInput(e.target.value)}
                placeholder="45.00"
              />
            </div>
          </div>

          <Button onClick={handleSendOffer} disabled={isPending} size="sm">
            {isPending ? "Sending…" : "Send Offer Email"}
          </Button>
        </div>
      )}
    </div>
  );
}
