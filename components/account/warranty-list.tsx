"use client";

/**
 * WarrantyList — client component.
 *
 * Shows the customer's warranty records. Active warranties with no claim
 * show a "Submit Claim" button that expands an inline form.
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitWarrantyClaim } from "@/features/account/actions";
import { ShieldCheckIcon, ShieldXIcon, CheckCircleIcon } from "lucide-react";
import type { CustomerWarranty } from "@/features/account/queries";
import type { Locale } from "@/i18n/routing";

interface WarrantyListProps {
  warranties: CustomerWarranty[];
  locale: Locale;
}

const CLAIM_STATUS_COLOR: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  none: "outline",
  submitted: "secondary",
  under_review: "secondary",
  approved: "default",
  denied: "destructive",
  resolved: "default",
};

export function WarrantyList({ warranties, locale }: WarrantyListProps) {
  const t = useTranslations("warranty");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClaim(warrantyId: string) {
    setClaimingId(warrantyId);
    setDescription("");
    setError(null);
  }

  function handleCancel() {
    setClaimingId(null);
    setDescription("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent, warrantyId: string) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitWarrantyClaim(warrantyId, description);
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setSubmitted((prev) => [...prev, warrantyId]);
      setClaimingId(null);
      setDescription("");
    });
  }

  if (warranties.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <ShieldCheckIcon className="h-10 w-10 text-muted-foreground/30" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t("noWarranties")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>

      {warranties.map((warranty) => {
        const isExpired = !warranty.active;
        const hasSubmittedNow = submitted.includes(warranty.id);
        const effectiveClaimStatus = hasSubmittedNow ? "submitted" : warranty.claim_status;
        const canClaim = warranty.active && warranty.claim_status === "none" && !hasSubmittedNow;
        const expireDate = new Date(warranty.expires_at).toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return (
          <div key={warranty.id} className="rounded-lg border border-border bg-surface p-4 space-y-3">
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {isExpired ? (
                  <ShieldXIcon className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
                ) : (
                  <ShieldCheckIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                )}
                <div>
                  <p className="font-semibold leading-snug">{warranty.product_title}</p>
                  {(warranty.device_brand || warranty.device_model) && (
                    <p className="text-xs text-muted-foreground">
                      {[warranty.device_brand, warranty.device_model].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={isExpired ? "outline" : "secondary"}>
                {isExpired ? t("expired") : t("active")}
              </Badge>
            </div>

            {/* Warranty details */}
            <div className="text-sm text-muted-foreground">
              <p>
                {warranty.warranty_days} days ·{" "}
                {isExpired ? "Expired" : t("expires")} {expireDate}
              </p>
            </div>

            {/* Claim status */}
            {effectiveClaimStatus !== "none" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Claim:</span>
                <Badge variant={CLAIM_STATUS_COLOR[effectiveClaimStatus] ?? "outline"} className="text-xs capitalize">
                  {t(`claimStatus.${effectiveClaimStatus}`)}
                </Badge>
              </div>
            )}

            {/* Claim description (if submitted) */}
            {warranty.claim_description && (
              <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                &ldquo;{warranty.claim_description}&rdquo;
              </p>
            )}

            {/* Submit claim form */}
            {claimingId === warranty.id ? (
              <form
                onSubmit={(e) => handleSubmit(e, warranty.id)}
                className="space-y-3 rounded-md border border-border p-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor={`claim_desc_${warranty.id}`}>{t("describeProblem")}</Label>
                  <Textarea
                    id={`claim_desc_${warranty.id}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    required
                    minLength={10}
                  />
                </div>
                {error && (
                  <p role="alert" className="text-sm text-destructive">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending ? "Submitting…" : t("submit")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : hasSubmittedNow ? (
              <p className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                Claim submitted! We will follow up within 3–5 business days.
              </p>
            ) : canClaim ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClaim(warranty.id)}
              >
                {t("submitClaim")}
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
