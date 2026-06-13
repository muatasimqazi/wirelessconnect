"use client";

/**
 * Wholesale Batch Intake — /admin/intakes/wholesale
 *
 * Captures supplier info once, then staff scans IMEIs one by one.
 * Each scan auto-fills device details and adds a row to the batch.
 * The IMEI input auto-refocuses after each scan for fast back-to-back scanning.
 * Submit creates all intake records at once.
 */

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { imeiLookupAction } from "@/features/admin/imei/actions";
import { createWholesaleBatch } from "@/features/admin/intakes/actions";
import type { WholesaleDevice, WholesaleSupplier } from "@/features/admin/intakes/actions";
import type { ImeiLookupResult } from "@/lib/imei/lookup";
import {
  ScanBarcodeIcon, LoaderIcon, XIcon, CheckCircleIcon,
  XCircleIcon, AlertCircleIcon, PackageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchRow extends WholesaleDevice {
  _key: string;
  _brand: string;
  _model: string;
  blacklistStatus: "clean" | "blacklisted" | "unknown";
  fmiOn?: boolean;
}

const CONDITIONS = [
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

// ─── Scanner input (inline, auto-refocuses after each scan) ──────────────────

function BatchScanner({
  onAdd,
  existingImeis,
}: {
  onAdd: (row: BatchRow) => void;
  existingImeis: Set<string>;
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runLookup = useCallback(
    (imei: string) => {
      const cleaned = imei.replace(/\D/g, "");
      if (!cleaned) return;
      if (existingImeis.has(cleaned)) {
        setError(`IMEI ${cleaned} already added.`);
        setValue("");
        inputRef.current?.focus();
        return;
      }
      setError(null);
      startTransition(async () => {
        const result: ImeiLookupResult = await imeiLookupAction(cleaned);
        if (!result.valid) {
          setError(result.error ?? "Invalid IMEI");
          setValue("");
          inputRef.current?.focus();
          return;
        }

        const row: BatchRow = {
          _key: `${cleaned}-${Date.now()}`,
          _brand: result.brand ?? "",
          _model: result.model ?? "",
          imei: cleaned,
          brand: result.brand ?? "",
          model: result.model ?? "",
          storage: result.storage ?? "",
          color: result.color ?? "",
          serialNumber: result.serialNumber ?? "",
          condition: "good",
          imeiVerificationStatus:
            result.blacklistStatus === "unknown" ? "needs_review"
            : result.blacklistStatus === "clean" ? "passed" : "failed",
          isCleanImei:
            result.blacklistStatus === "clean" ? true
            : result.blacklistStatus === "blacklisted" ? false : null,
          notes: "",
          blacklistStatus: result.blacklistStatus ?? "unknown",
          fmiOn: result.fmiOn,
        };
        onAdd(row);
        setValue("");
        // Auto-refocus for next scan
        setTimeout(() => inputRef.current?.focus(), 50);
      });
    },
    [existingImeis, onAdd],
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runLookup(value); } }}
          placeholder="Scan barcode or type IMEI…"
          maxLength={17}
          disabled={isPending}
          autoFocus
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => runLookup(value)}
          disabled={isPending || !value.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending
            ? <LoaderIcon className="h-4 w-4 animate-spin" />
            : <ScanBarcodeIcon className="h-4 w-4" />}
          {isPending ? "Checking…" : "Add"}
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Device row ───────────────────────────────────────────────────────────────

function DeviceRow({
  row,
  index,
  onChange,
  onRemove,
}: {
  row: BatchRow;
  index: number;
  onChange: (key: string, field: keyof BatchRow, value: string) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20">
      <td className="px-3 py-2.5 text-sm text-muted-foreground">{index + 1}</td>

      {/* Device identity */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          {row.blacklistStatus === "clean" && (
            <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-600" />
          )}
          {row.blacklistStatus === "blacklisted" && (
            <XCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
          )}
          {row.blacklistStatus === "unknown" && (
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-amber-500" />
          )}
          <div>
            <p className="font-medium text-foreground">
              {[row.brand, row.model].filter(Boolean).join(" ") || "Unknown"}
              {row.storage && <span className="ml-1 text-muted-foreground font-normal">{row.storage}</span>}
              {row.color && <span className="ml-1 text-muted-foreground font-normal">· {row.color}</span>}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{row.imei}</p>
          </div>
        </div>
        {row.fmiOn === true && (
          <p className="mt-0.5 text-xs font-semibold text-amber-700">⚠ Find My is ON</p>
        )}
        {row.blacklistStatus === "blacklisted" && (
          <p className="mt-0.5 text-xs font-semibold text-destructive">Blacklisted — intake for review/parts</p>
        )}
      </td>

      {/* Condition */}
      <td className="px-3 py-2.5">
        <select
          value={row.condition}
          onChange={(e) => onChange(row._key, "condition", e.target.value)}
          className="h-8 rounded border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </td>

      {/* Notes */}
      <td className="px-3 py-2.5">
        <input
          type="text"
          value={row.notes}
          onChange={(e) => onChange(row._key, "notes", e.target.value)}
          placeholder="Optional notes…"
          className="h-8 w-full min-w-[140px] rounded border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </td>

      {/* Remove */}
      <td className="px-3 py-2.5">
        <button
          type="button"
          onClick={() => onRemove(row._key)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
          aria-label="Remove device"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WholesaleBatchPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Supplier form
  const [supplier, setSupplier] = useState<WholesaleSupplier>({
    name: "",
    invoice: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "check",
    perUnitCost: 0,
    notes: "",
  });

  // Device batch
  const [devices, setDevices] = useState<BatchRow[]>([]);

  const existingImeis = new Set(devices.map((d) => d.imei));

  function addDevice(row: BatchRow) {
    setDevices((prev) => [...prev, row]);
  }

  function updateDevice(key: string, field: keyof BatchRow, value: string) {
    setDevices((prev) =>
      prev.map((d) => (d._key === key ? { ...d, [field]: value } : d)),
    );
  }

  function removeDevice(key: string) {
    setDevices((prev) => prev.filter((d) => d._key !== key));
  }

  function handleSupplierCost(raw: string) {
    const dollars = parseFloat(raw) || 0;
    setSupplier((s) => ({ ...s, perUnitCost: Math.round(dollars * 100) }));
  }

  function handleSubmit() {
    if (!supplier.name.trim()) { setServerError("Supplier name is required."); return; }
    if (devices.length === 0) { setServerError("Add at least one device."); return; }

    setServerError(null);
    startTransition(async () => {
      const result = await createWholesaleBatch(supplier, devices);
      if (result.error) { setServerError(result.error); return; }
      router.push("/admin/intakes");
    });
  }

  const totalCost = (supplier.perUnitCost * devices.length) / 100;
  const blacklisted = devices.filter((d) => d.blacklistStatus === "blacklisted").length;
  const fmiOn = devices.filter((d) => d.fmiOn === true).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/intakes" className="hover:text-foreground">Intakes</Link>
        <span>/</span>
        <span className="text-foreground">Wholesale Batch</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Wholesale Batch Intake</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter supplier info once, then scan each device. Submit creates all intake records.
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* ── Supplier Info ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Supplier Info
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium">Supplier / Business Name *</label>
            <input
              type="text"
              value={supplier.name}
              onChange={(e) => setSupplier((s) => ({ ...s, name: e.target.value }))}
              placeholder="ABC Wholesale LLC"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Invoice #</label>
            <input
              type="text"
              value={supplier.invoice}
              onChange={(e) => setSupplier((s) => ({ ...s, invoice: e.target.value }))}
              placeholder="INV-2024-001"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Purchase Date *</label>
            <input
              type="date"
              value={supplier.date}
              onChange={(e) => setSupplier((s) => ({ ...s, date: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Payment Method</label>
            <select
              value={supplier.paymentMethod}
              onChange={(e) => setSupplier((s) => ({ ...s, paymentMethod: e.target.value as WholesaleSupplier["paymentMethod"] }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="zelle">Zelle</option>
              <option value="venmo">Venmo</option>
              <option value="store_credit">Store Credit</option>
              <option value="other">Wire / Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Per-Unit Cost ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              defaultValue=""
              onChange={(e) => handleSupplierCost(e.target.value)}
              placeholder="0.00"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Notes</label>
            <input
              type="text"
              value={supplier.notes}
              onChange={(e) => setSupplier((s) => ({ ...s, notes: e.target.value }))}
              placeholder="Optional notes…"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* ── Scanner + Device list ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Devices — scan or type each IMEI
        </h2>

        <BatchScanner onAdd={addDevice} existingImeis={existingImeis} />

        {devices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <PackageIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No devices added yet — scan the first IMEI above.</p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted/40 px-4 py-2 text-sm">
              <span className="font-semibold">{devices.length} device{devices.length !== 1 ? "s" : ""}</span>
              {supplier.perUnitCost > 0 && (
                <span className="text-muted-foreground">
                  Total: ${totalCost.toFixed(2)}
                </span>
              )}
              {blacklisted > 0 && (
                <span className="font-medium text-destructive">{blacklisted} blacklisted</span>
              )}
              {fmiOn > 0 && (
                <span className="font-medium text-amber-700">⚠ {fmiOn} FMI on</span>
              )}
            </div>

            {/* Device table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8">#</th>
                    <th className="px-3 py-2 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Device</th>
                    <th className="px-3 py-2 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</th>
                    <th className="px-3 py-2 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {devices.map((row, i) => (
                    <DeviceRow
                      key={row._key}
                      row={row}
                      index={i}
                      onChange={updateDevice}
                      onRemove={removeDevice}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/intakes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Cancel
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || devices.length === 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50",
            "bg-primary hover:bg-primary/90",
          )}
        >
          {isPending && <LoaderIcon className="h-4 w-4 animate-spin" />}
          {isPending
            ? "Creating records…"
            : `Submit ${devices.length > 0 ? `${devices.length} ` : ""}Intake${devices.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
