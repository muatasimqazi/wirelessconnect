"use client";

/**
 * RepairClient — interactive portion of the repair detail page.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRepairStatus } from "@/features/admin/repairs/actions";
import type { AdminRepairDetail } from "@/features/admin/repairs/queries";

interface RepairClientProps {
  repair: AdminRepairDetail;
}

const STATUSES = [
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "received", label: "Received" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_parts", label: "Waiting on Parts" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type RepairStatus = (typeof STATUSES)[number]["value"];

export function RepairClient({ repair }: RepairClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState<RepairStatus>(repair.status as RepairStatus);
  const [message, setMessage] = useState("");
  const [visibleToCustomer, setVisibleToCustomer] = useState(true);
  const [internalNotes, setInternalNotes] = useState(repair.internal_notes ?? "");

  function handleUpdate() {
    if (!message.trim()) {
      setError("Please enter a message describing this update.");
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateRepairStatus(
        repair.id,
        newStatus,
        message,
        visibleToCustomer,
        internalNotes || undefined,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Repair updated" + (visibleToCustomer ? " and customer notified." : "."));
        setMessage("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold">Add Update / Change Status</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>New Status</Label>
          <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RepairStatus)}>
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
        <Label>Update Message *</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Describe what was done or the current status…"
        />
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="checkbox"
          id="visible_customer"
          className="h-4 w-4"
          checked={visibleToCustomer}
          onChange={(e) => setVisibleToCustomer(e.target.checked)}
        />
        <Label htmlFor="visible_customer" className="cursor-pointer">
          Notify customer by email
        </Label>
      </div>

      <div className="space-y-1.5">
        <Label>Internal Notes</Label>
        <Textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
          placeholder="Notes for staff only (not sent to customer)…"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button onClick={handleUpdate} disabled={isPending} size="sm">
        {isPending ? "Saving…" : "Save Update"}
      </Button>
    </div>
  );
}
