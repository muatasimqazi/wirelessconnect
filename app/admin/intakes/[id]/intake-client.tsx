"use client";

/**
 * IntakeClient — client component for device intake management actions.
 *
 * Features:
 *  - Status transitions
 *  - Testing checklist (all pass/fail/null for each test point)
 *  - IMEI verification panel
 *  - Hold period waiver
 *  - Publishing gates display
 *  - Convert to product / Reject
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminIntake } from "@/features/admin/intakes/queries";
import {
  updateIntakeStatus,
  updateIntakeTesting,
  updateIMEIVerification,
  waiveHoldPeriod,
  convertIntakeToProduct,
  rejectIntake,
} from "@/features/admin/intakes/actions";

// ─── Status Transitions ───────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, { value: string; label: string; variant: "default" | "danger" | "success" }[]> = {
  received: [
    { value: "testing", label: "Start Testing", variant: "default" },
    { value: "needs_imei_check", label: "Needs IMEI Check", variant: "default" },
    { value: "rejected", label: "Reject", variant: "danger" },
  ],
  testing: [
    { value: "needs_imei_check", label: "Needs IMEI Check", variant: "default" },
    { value: "needs_photos", label: "Needs Photos", variant: "default" },
    { value: "ready_to_list", label: "Ready to List", variant: "success" },
    { value: "rejected", label: "Reject", variant: "danger" },
  ],
  needs_imei_check: [
    { value: "testing", label: "Back to Testing", variant: "default" },
    { value: "needs_photos", label: "Needs Photos", variant: "default" },
    { value: "ready_to_list", label: "Ready to List", variant: "success" },
    { value: "rejected", label: "Reject", variant: "danger" },
  ],
  needs_photos: [
    { value: "ready_to_list", label: "Ready to List", variant: "success" },
    { value: "rejected", label: "Reject", variant: "danger" },
  ],
  ready_to_list: [
    { value: "rejected", label: "Reject", variant: "danger" },
  ],
};

function StatusPanel({ intake }: { intake: AdminIntake }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const options = STATUS_TRANSITIONS[intake.status] ?? [];
  if (options.length === 0) return null;

  function handleTransition(newStatus: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateIntakeStatus(intake.id, newStatus);
      if (result.error) setError(result.error);
      else setSuccess(`Status updated to ${newStatus.replace(/_/g, " ")}.`);
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Update Status</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() => handleTransition(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${
              opt.variant === "danger"
                ? "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                : opt.variant === "success"
                  ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
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

// ─── Testing Checklist ────────────────────────────────────────────────────────

type Tristate = true | false | null;

function TriButton({
  value,
  onChange,
}: {
  value: Tristate;
  onChange: (v: Tristate) => void;
}) {
  return (
    <div className="flex gap-1">
      {(["pass", "fail", "n/a"] as const).map((opt) => {
        const isActive =
          (opt === "pass" && value === true) ||
          (opt === "fail" && value === false) ||
          (opt === "n/a" && value === null);
        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onChange(opt === "pass" ? true : opt === "fail" ? false : null)
            }
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              isActive
                ? opt === "pass"
                  ? "bg-green-500 text-white"
                  : opt === "fail"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const TEST_POINTS: { key: keyof TestingState; label: string }[] = [
  { key: "power_on_passed", label: "Power On" },
  { key: "touchscreen_passed", label: "Touchscreen" },
  { key: "cameras_passed", label: "Cameras" },
  { key: "speakers_passed", label: "Speakers" },
  { key: "microphone_passed", label: "Microphone" },
  { key: "buttons_passed", label: "Buttons" },
  { key: "charging_port_passed", label: "Charging Port" },
  { key: "cellular_passed", label: "Cellular" },
  { key: "wifi_passed", label: "Wi-Fi" },
  { key: "bluetooth_passed", label: "Bluetooth" },
  { key: "face_or_touch_id_passed", label: "Face ID / Touch ID" },
  { key: "wireless_charging_passed", label: "Wireless Charging" },
];

interface TestingState {
  power_on_passed: Tristate;
  touchscreen_passed: Tristate;
  cameras_passed: Tristate;
  speakers_passed: Tristate;
  microphone_passed: Tristate;
  buttons_passed: Tristate;
  charging_port_passed: Tristate;
  cellular_passed: Tristate;
  wifi_passed: Tristate;
  bluetooth_passed: Tristate;
  face_or_touch_id_passed: Tristate;
  wireless_charging_passed: Tristate;
  activation_lock_removed: boolean;
  factory_reset_verified: boolean;
  data_wiped_verified: boolean;
}

function TestingPanel({ intake }: { intake: AdminIntake }) {
  const [state, setState] = useState<TestingState>({
    power_on_passed: intake.power_on_passed,
    touchscreen_passed: intake.touchscreen_passed,
    cameras_passed: intake.cameras_passed,
    speakers_passed: intake.speakers_passed,
    microphone_passed: intake.microphone_passed,
    buttons_passed: intake.buttons_passed,
    charging_port_passed: intake.charging_port_passed,
    cellular_passed: intake.cellular_passed,
    wifi_passed: intake.wifi_passed,
    bluetooth_passed: intake.bluetooth_passed,
    face_or_touch_id_passed: intake.face_or_touch_id_passed,
    wireless_charging_passed: intake.wireless_charging_passed,
    activation_lock_removed: intake.activation_lock_removed,
    factory_reset_verified: intake.factory_reset_verified,
    data_wiped_verified: intake.data_wiped_verified,
  });
  const [testingStatus, setTestingStatus] = useState<"not_started" | "in_progress" | "passed" | "failed" | "needs_review">(intake.testing_status as "not_started" | "in_progress" | "passed" | "failed" | "needs_review");
  const [notes, setNotes] = useState(intake.testing_notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateIntakeTesting(intake.id, {
        testing_status: testingStatus as "not_started" | "in_progress" | "passed" | "failed" | "needs_review",
        ...state,
        testing_notes: notes || undefined,
      });
      if (result.error) setError(result.error);
      else setSuccess("Testing results saved.");
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Testing Checklist</h3>

      {/* Test points */}
      <div className="rounded-lg border border-border divide-y divide-border">
        {TEST_POINTS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-foreground">{label}</span>
            <TriButton
              value={state[key] as Tristate}
              onChange={(v) => setState((s) => ({ ...s, [key]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Security checks */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Security</p>
        {(
          [
            { key: "activation_lock_removed" as const, label: "Activation Lock Removed" },
            { key: "factory_reset_verified" as const, label: "Factory Reset Verified" },
            { key: "data_wiped_verified" as const, label: "Data Wipe Verified" },
          ]
        ).map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={state[key]}
              onChange={(e) => setState((s) => ({ ...s, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>

      {/* Testing status */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Overall Testing Status</label>
        <select
          value={testingStatus}
          onChange={(e) => setTestingStatus(e.target.value as "not_started" | "in_progress" | "passed" | "failed" | "needs_review")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="needs_review">Needs Review</option>
        </select>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Testing Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note any issues or observations…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save Testing Results"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
    </div>
  );
}

// ─── IMEI Verification ────────────────────────────────────────────────────────

function IMEIPanel({ intake }: { intake: AdminIntake }) {
  const [status, setStatus] = useState<"not_checked" | "passed" | "failed" | "needs_review">(intake.imei_verification_status as "not_checked" | "passed" | "failed" | "needs_review");
  const [isClean, setIsClean] = useState<boolean | null>(intake.is_clean_imei);
  const [isBlacklisted, setIsBlacklisted] = useState<boolean | null>(intake.is_blacklisted);
  const [isFinanced, setIsFinanced] = useState<boolean | null>(intake.is_financed);
  const [service, setService] = useState(intake.imei_verification_service ?? "");
  const [notes, setNotes] = useState(intake.imei_verification_notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateIMEIVerification(intake.id, {
        imei_verification_status: status as "not_checked" | "passed" | "failed" | "needs_review",
        is_clean_imei: isClean,
        is_blacklisted: isBlacklisted,
        is_financed: isFinanced,
        imei_verification_service: service || undefined,
        imei_verification_notes: notes || undefined,
      });
      if (result.error) setError(result.error);
      else setSuccess("IMEI verification saved.");
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">IMEI Verification</h3>
      {intake.imei ? (
        <p className="font-mono text-sm text-foreground">IMEI: {intake.imei}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No IMEI recorded for this device.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Verification Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "not_checked" | "passed" | "failed" | "needs_review")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="not_checked">Not Checked</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="needs_review">Needs Review</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Service Used</label>
          <input
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="e.g. GSMA, CheckMEND…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {([
          { key: "isClean" as const, label: "Clean IMEI", get: isClean, set: setIsClean },
          { key: "isBlacklisted" as const, label: "Blacklisted", get: isBlacklisted, set: setIsBlacklisted },
          { key: "isFinanced" as const, label: "Financed (not paid off)", get: isFinanced, set: setIsFinanced },
        ]).map(({ label, get, set }) => (
          <div key={label} className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <div className="flex gap-1">
              {(["Yes", "No", "Unknown"] as const).map((opt) => {
                const isActive =
                  (opt === "Yes" && get === true) ||
                  (opt === "No" && get === false) ||
                  (opt === "Unknown" && get === null);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set(opt === "Yes" ? true : opt === "No" ? false : null)}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      isActive ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save IMEI Verification"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
    </div>
  );
}

// ─── Hold Period Waiver ───────────────────────────────────────────────────────

function HoldWaiverPanel({ intake }: { intake: AdminIntake }) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (intake.hold_period_waived) {
    return (
      <div className="text-sm text-muted-foreground">
        Hold waived: <em>{intake.hold_period_waived_reason}</em>
      </div>
    );
  }

  const holdUntil = intake.hold_until_date ? new Date(intake.hold_until_date) : null;
  const holdCleared = holdUntil ? holdUntil <= new Date() : false;

  if (holdCleared) {
    return <div className="text-sm text-green-600 dark:text-green-400">✓ Hold period has elapsed.</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Waive Hold Period</h3>
      {holdUntil && (
        <p className="text-sm text-muted-foreground">
          Hold until: <strong>{holdUntil.toLocaleDateString()}</strong>
        </p>
      )}
      <textarea
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for waiving (required)…"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={isPending || !reason.trim()}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await waiveHoldPeriod(intake.id, reason);
            if (result.error) setError(result.error);
            else setSuccess("Hold period waived.");
          });
        }}
        className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Waive Hold Period"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
    </div>
  );
}

// ─── Convert / Reject ─────────────────────────────────────────────────────────

function ConvertPanel({ intake }: { intake: AdminIntake }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  function handleConvert() {
    setError(null);
    startTransition(async () => {
      const result = await convertIntakeToProduct(intake.id);
      if (result.error) setError(result.error);
      else router.push(`/admin/products/${result.id}`);
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectIntake(intake.id, rejectReason);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  if (intake.status === "converted_to_product" || intake.status === "rejected") {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Convert to Product</h3>
      <p className="text-xs text-muted-foreground">
        All 15 publishing gates must pass before conversion. The action will report
        which gates are failing.
      </p>

      <button
        type="button"
        disabled={isPending}
        onClick={handleConvert}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "Converting…" : "Convert to Product →"}
      </button>

      {!showReject ? (
        <button
          type="button"
          onClick={() => setShowReject(true)}
          className="ml-2 text-xs text-destructive underline"
        >
          Reject intake
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">Reject Intake</p>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (required)…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending || !rejectReason.trim()}
              onClick={handleReject}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-60"
            >
              Confirm Rejection
            </button>
            <button
              type="button"
              onClick={() => setShowReject(false)}
              className="text-xs text-muted-foreground underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function IntakeClient({ intake }: { intake: AdminIntake }) {
  return (
    <div className="space-y-8">
      <StatusPanel intake={intake} />
      <div className="border-t border-border pt-6">
        <TestingPanel intake={intake} />
      </div>
      <div className="border-t border-border pt-6">
        <IMEIPanel intake={intake} />
      </div>
      <div className="border-t border-border pt-6">
        <HoldWaiverPanel intake={intake} />
      </div>
      {intake.status === "ready_to_list" && (
        <div className="border-t border-border pt-6">
          <ConvertPanel intake={intake} />
        </div>
      )}
    </div>
  );
}
