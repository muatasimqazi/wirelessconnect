"use client";

/**
 * WarrantyClient — interactive claim management.
 * Receives pre-loaded warranty data from the server page.
 */

import { useState, useTransition } from "react";
import type { AdminWarranty } from "@/features/admin/warranties/queries";
import { updateWarrantyClaimStatus, updateWarrantyNotes } from "@/features/admin/warranties/actions";

const CLAIM_STATUSES = [
  "none",
  "submitted",
  "under_review",
  "approved",
  "denied",
  "resolved",
] as const;

const CLAIM_STATUS_LABELS: Record<string, string> = {
  none: "No Claim",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
  resolved: "Resolved",
};

export function WarrantyClient({ warranty }: { warranty: AdminWarranty }) {
  const [claimStatus, setClaimStatus] = useState(warranty.claim_status ?? "none");
  const [claimNotes, setClaimNotes] = useState(warranty.claim_notes ?? "");
  const [isPendingStatus, startStatusTransition] = useTransition();
  const [isPendingNotes, startNotesTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesSuccess, setNotesSuccess] = useState<string | null>(null);

  function handleSaveStatus() {
    setStatusError(null);
    setStatusSuccess(null);
    startStatusTransition(async () => {
      const result = await updateWarrantyClaimStatus(
        warranty.id,
        claimStatus as typeof CLAIM_STATUSES[number],
        claimNotes || undefined,
      );
      if (result.error) setStatusError(result.error);
      else setStatusSuccess("Status updated.");
    });
  }

  function handleSaveNotes() {
    setNotesError(null);
    setNotesSuccess(null);
    startNotesTransition(async () => {
      const result = await updateWarrantyNotes(warranty.id, claimNotes);
      if (result.error) setNotesError(result.error);
      else setNotesSuccess("Notes saved.");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      <h2 className="font-semibold text-foreground">Manage Claim</h2>

      {/* Status selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Claim Status</p>
        <div className="flex flex-wrap gap-2">
          {CLAIM_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setClaimStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                claimStatus === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {CLAIM_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={isPendingStatus}
          onClick={handleSaveStatus}
          className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isPendingStatus ? "Saving…" : "Update Status"}
        </button>
        {statusError && <p className="text-sm text-destructive">{statusError}</p>}
        {statusSuccess && <p className="text-sm text-green-600 dark:text-green-400">{statusSuccess}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground">Admin Notes</p>
        <textarea
          rows={4}
          value={claimNotes}
          onChange={(e) => setClaimNotes(e.target.value)}
          placeholder="Internal notes on this claim…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={isPendingNotes}
          onClick={handleSaveNotes}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isPendingNotes ? "Saving…" : "Save Notes"}
        </button>
        {notesError && <p className="text-sm text-destructive">{notesError}</p>}
        {notesSuccess && <p className="text-sm text-green-600 dark:text-green-400">{notesSuccess}</p>}
      </div>
    </div>
  );
}
