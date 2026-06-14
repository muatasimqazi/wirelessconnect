"use client";

/**
 * Wholesale Batch Intake — /admin/intakes/wholesale
 *
 * Supplier info captured once at the top.
 * Staff scans IMEIs one by one — each adds a device row.
 * IMEI input auto-refocuses after each scan for back-to-back scanning.
 *
 * API Lookup toggle:
 *  ON  — calls IMEICheck.com ($0.03–0.04/device) to auto-fill brand/model/blacklist
 *  OFF — Luhn validates the IMEI locally (free), device fields filled manually
 *
 * Submit creates all intake records in one DB insert.
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
  XCircleIcon, AlertCircleIcon, PackageIcon, ZapIcon, ZapOffIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Local Luhn check (no API cost) ──────────────────────────────────────────

function isValidImei(imei: string): boolean {
  if (imei.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = parseInt(imei[i], 10);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchRow extends WholesaleDevice {
  _key: string;
  blacklistStatus: "clean" | "blacklisted" | "unknown" | "not_checked";
  fmiOn?: boolean;
}

const CONDITIONS = [
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

// ─── Scanner ──────────────────────────────────────────────────────────────────

function BatchScanner({
  onAdd,
  existingImeis,
  apiEnabled,
}: {
  onAdd: (row: BatchRow) => void;
  existingImeis: Set<string>;
  apiEnabled: boolean;
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refocus = useCallback(() => setTimeout(() => inputRef.current?.focus(), 50), []);

  const addManual = useCallback(
    (cleaned: string) => {
      const row: BatchRow = {
        _key: `${cleaned}-${Date.now()}`,
        imei: cleaned,
        brand: "",
        model: "",
        storage: "",
        color: "",
        serialNumber: "",
        condition: "good",
        imeiVerificationStatus: "not_checked",
        isCleanImei: null,
        notes: "",
        blacklistStatus: "not_checked",
      };
      onAdd(row);
      setValue("");
      refocus();
    },
    [onAdd, refocus],
  );

  const runLookup = useCallback(
    (imei: string) => {
      const cleaned = imei.replace(/\D/g, "");
      if (!cleaned) return;

      if (existingImeis.has(cleaned)) {
        setError(`IMEI ${cleaned} already added.`);
        setValue("");
        refocus();
        return;
      }

      if (!isValidImei(cleaned)) {
        setError("Invalid IMEI — check the number and try again.");
        return;
      }

      setError(null);

      if (!apiEnabled) {
        addManual(cleaned);
        return;
      }

      startTransition(async () => {
        const result: ImeiLookupResult = await imeiLookupAction(cleaned);
        if (!result.valid) {
          setError(result.error ?? "Invalid IMEI");
          setValue("");
          refocus();
          return;
        }
        const row: BatchRow = {
          _key: `${cleaned}-${Date.now()}`,
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
        refocus();
      });
    },
    [existingImeis, apiEnabled, addManual, refocus],
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
          {isPending ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <ScanBarcodeIcon className="h-4 w-4" />}
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

// ─── Device row (all fields editable) ────────────────────────────────────────

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
  const cell = "h-8 w-full rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 align-top">
      <td className="px-3 py-3 text-sm text-muted-foreground">{index + 1}</td>

      {/* IMEI + status */}
      <td className="px-3 py-3 min-w-[140px]">
        <p className="font-mono text-xs text-foreground">{row.imei}</p>
        <span className={cn(
          "mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          row.blacklistStatus === "clean" && "bg-green-100 text-green-800",
          row.blacklistStatus === "blacklisted" && "bg-red-100 text-red-800",
          row.blacklistStatus === "unknown" && "bg-amber-100 text-amber-800",
          row.blacklistStatus === "not_checked" && "bg-muted text-muted-foreground",
        )}>
          {row.blacklistStatus === "clean" && <CheckCircleIcon className="h-2.5 w-2.5" />}
          {row.blacklistStatus === "blacklisted" && <XCircleIcon className="h-2.5 w-2.5" />}
          {row.blacklistStatus === "clean" ? "Clean"
            : row.blacklistStatus === "blacklisted" ? "Blacklisted"
            : row.blacklistStatus === "unknown" ? "Unknown"
            : "Not checked"}
        </span>
        {row.fmiOn === true && (
          <p className="mt-0.5 text-[10px] font-semibold text-amber-700">⚠ FMI ON</p>
        )}
      </td>

      {/* Brand */}
      <td className="px-3 py-3 min-w-[100px]">
        <input
          type="text"
          value={row.brand}
          onChange={(e) => onChange(row._key, "brand", e.target.value)}
          placeholder="Apple"
          className={cell}
        />
      </td>

      {/* Model */}
      <td className="px-3 py-3 min-w-[160px]">
        <input
          type="text"
          value={row.model}
          onChange={(e) => onChange(row._key, "model", e.target.value)}
          placeholder="iPhone 15 Pro"
          className={cell}
        />
      </td>

      {/* Storage */}
      <td className="px-3 py-3 min-w-[80px]">
        <input
          type="text"
          value={row.storage}
          onChange={(e) => onChange(row._key, "storage", e.target.value)}
          placeholder="256GB"
          className={cell}
        />
      </td>

      {/* Condition */}
      <td className="px-3 py-3">
        <select
          value={row.condition}
          onChange={(e) => onChange(row._key, "condition", e.target.value)}
          className={cell}
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </td>

      {/* Notes */}
      <td className="px-3 py-3 min-w-[140px]">
        <input
          type="text"
          value={row.notes}
          onChange={(e) => onChange(row._key, "notes", e.target.value)}
          placeholder="Optional…"
          className={cell}
        />
      </td>

      {/* Remove */}
      <td className="px-3 py-3">
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
  const [apiEnabled, setApiEnabled] = useState(true);

  const [supplier, setSupplier] = useState<WholesaleSupplier>({
    name: "",
    invoice: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "check",
    perUnitCost: 0,
    notes: "",
  });

  const [devices, setDevices] = useState<BatchRow[]>([]);
  const existingImeis = new Set(devices.map((d) => d.imei));

  function updateDevice(key: string, field: keyof BatchRow, value: string) {
    setDevices((prev) => prev.map((d) => (d._key === key ? { ...d, [field]: value } : d)));
  }

  function removeDevice(key: string) {
    setDevices((prev) => prev.filter((d) => d._key !== key));
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
              onChange={(e) => setSupplier((s) => ({ ...s, perUnitCost: Math.round((parseFloat(e.target.value) || 0) * 100) }))}
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
              placeholder="Optional…"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* ── Scanner + Devices ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        {/* Section header + API toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Devices
          </h2>
          <button
            type="button"
            onClick={() => setApiEnabled((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              apiEnabled
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {apiEnabled
              ? <><ZapIcon className="h-3.5 w-3.5" /> IMEI Lookup ON</>
              : <><ZapOffIcon className="h-3.5 w-3.5" /> IMEI Lookup OFF</>}
          </button>
        </div>

        {!apiEnabled && (
          <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Lookup is off — IMEIs are validated locally only (free). Fill brand, model, and storage manually in each row.
          </p>
        )}

        <BatchScanner
          onAdd={(row) => setDevices((prev) => [...prev, row])}
          existingImeis={existingImeis}
          apiEnabled={apiEnabled}
        />

        {devices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <PackageIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No devices yet — scan the first IMEI above.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted/40 px-4 py-2 text-sm">
              <span className="font-semibold">{devices.length} device{devices.length !== 1 ? "s" : ""}</span>
              {supplier.perUnitCost > 0 && <span className="text-muted-foreground">Total: ${totalCost.toFixed(2)}</span>}
              {blacklisted > 0 && <span className="font-medium text-destructive">{blacklisted} blacklisted</span>}
              {fmiOn > 0 && <span className="font-medium text-amber-700">⚠ {fmiOn} FMI on</span>}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["#", "IMEI / Status", "Brand", "Model", "Storage", "Condition", "Notes", ""].map((h) => (
                      <th key={h} className="px-3 py-2 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
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
        <Link href="/admin/intakes" className="text-sm text-muted-foreground hover:text-foreground">
          ← Cancel
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || devices.length === 0}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && <LoaderIcon className="h-4 w-4 animate-spin" />}
          {isPending ? "Creating records…" : `Submit ${devices.length > 0 ? `${devices.length} ` : ""}Intake${devices.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
