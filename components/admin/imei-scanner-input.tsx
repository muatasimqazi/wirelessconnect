"use client";

/**
 * ImeiScannerInput — admin component.
 *
 * Works with Zebra (and any HID barcode) scanners — they keyboard-wedge the
 * barcode string followed by Enter, so we listen for Enter on the input to
 * auto-trigger the lookup.
 *
 * Props:
 *  onResult — called with the lookup result so the parent form can
 *             setValue() the relevant fields.
 */

import { useState, useTransition, useRef } from "react";
import { imeiLookupAction } from "@/features/admin/imei/actions";
import type { ImeiLookupResult } from "@/lib/imei/lookup";
import {
  ScanBarcodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImeiScannerInputProps {
  onResult?: (result: ImeiLookupResult) => void;
}

export function ImeiScannerInput({ onResult }: ImeiScannerInputProps) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ImeiLookupResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function runLookup(imei: string) {
    const cleaned = imei.replace(/\D/g, "");
    if (!cleaned) return;

    startTransition(async () => {
      const res = await imeiLookupAction(cleaned);
      setResult(res);
      if (res.valid && !res.error && onResult) {
        onResult(res);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Zebra scanners send Enter after the barcode
    if (e.key === "Enter") {
      e.preventDefault();
      runLookup(value);
    }
  }

  function handleFill() {
    if (result && onResult) onResult(result);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ScanBarcodeIcon className="h-4 w-4 text-primary" aria-hidden="true" />
        IMEI Scanner Lookup
      </div>

      {/* Input + button */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or type IMEI…"
          maxLength={17}
          disabled={isPending}
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          aria-label="IMEI input"
        />
        <button
          type="button"
          onClick={() => runLookup(value)}
          disabled={isPending || !value.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? (
            <LoaderIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ScanBarcodeIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {isPending ? "Checking…" : "Lookup"}
        </button>
      </div>

      {/* Result */}
      {result && !isPending && (
        <div
          className={cn(
            "rounded-md border p-3 text-sm",
            result.error && !result.valid
              ? "border-destructive/30 bg-destructive/10"
              : result.blacklistStatus === "blacklisted"
              ? "border-destructive/30 bg-destructive/10"
              : "border-green-200 bg-green-50",
          )}
        >
          {/* Invalid IMEI */}
          {!result.valid && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{result.error ?? "Invalid IMEI"}</span>
            </div>
          )}

          {/* API error but IMEI is structurally valid */}
          {result.valid && result.error && (
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{result.error}</span>
            </div>
          )}

          {/* Device result — shown for any valid IMEI, clean or not */}
          {result.valid && !result.error && (
            <div className="space-y-2">
              {/* Device identity */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {[result.brand, result.model].filter(Boolean).join(" ") || "Unknown device"}
                    {(result.storage || result.color) && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        · {[result.storage, result.color].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{result.imei}</p>
                </div>

                {/* Blacklist badge */}
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                    result.blacklistStatus === "clean" && "bg-green-100 text-green-800",
                    result.blacklistStatus === "blacklisted" && "bg-red-100 text-red-800",
                    result.blacklistStatus === "unknown" && "bg-muted text-muted-foreground",
                  )}
                >
                  {result.blacklistStatus === "clean" && (
                    <CheckCircleIcon className="h-3 w-3" aria-hidden="true" />
                  )}
                  {result.blacklistStatus === "blacklisted" && (
                    <XCircleIcon className="h-3 w-3" aria-hidden="true" />
                  )}
                  {result.blacklistStatus === "clean"
                    ? "Clean IMEI"
                    : result.blacklistStatus === "blacklisted"
                    ? "BLACKLISTED"
                    : "Status unknown"}
                </span>
              </div>

              {/* Extra details */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {result.carrier && <span>Carrier: {result.carrier}</span>}
                {result.simLock && <span>SIM lock: {result.simLock}</span>}
                {result.serialNumber && <span>S/N: {result.serialNumber}</span>}
                {result.fmiOn === true && (
                  <span className="font-semibold text-amber-700">⚠ Find My is ON</span>
                )}
                {result.fmiOn === false && (
                  <span className="text-green-700">Find My: Off</span>
                )}
              </div>

              {/* Blacklisted warning — intake still allowed (e.g. buying for parts) */}
              {result.blacklistStatus === "blacklisted" && (
                <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  ⚠ Blacklisted IMEI — you can still intake for parts or further review.
                  Verification status will be recorded as failed.
                </p>
              )}

              {/* Fill form button — always shown regardless of blacklist status */}
              <button
                type="button"
                onClick={handleFill}
                className="mt-1 text-xs font-medium text-primary underline underline-offset-2 hover:no-underline"
              >
                ↑ Fill device fields with this data
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
