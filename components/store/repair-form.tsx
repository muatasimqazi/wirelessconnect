"use client";

/**
 * RepairForm — client component.
 *
 * Appointment request form for device repairs.
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
import { submitRepairRequest } from "@/features/repairs/actions";
import { CheckCircleIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface RepairFormProps {
  locale: Locale;
}

const SERVICES = [
  "Screen Replacement",
  "Battery Replacement",
  "Charging Port Repair",
  "Camera Repair",
  "Water Damage Repair",
  "Software Issues / Factory Reset",
  "Speaker / Microphone",
  "Other",
];

export function RepairForm({ locale }: RepairFormProps) {
  const t = useTranslations("repairs.form");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    device_brand: "",
    device_model: "",
    requested_service: "",
    device_issue: "",
    customer_notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitRepairRequest({
        ...form,
        customer_locale: locale,
      });
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-10 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-600" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold">{t("successTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("successMessage")}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="r_name">{t("name")} *</Label>
          <Input id="r_name" required value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="Jane Smith" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r_email">{t("email")} *</Label>
          <Input id="r_email" type="email" required value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} placeholder="jane@example.com" autoComplete="email" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="r_phone">{t("phone")}</Label>
        <Input id="r_phone" type="tel" value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} placeholder="+1 (206) 555-0100" autoComplete="tel" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="r_brand">{t("brand")}</Label>
          <Input id="r_brand" value={form.device_brand} onChange={(e) => set("device_brand", e.target.value)} placeholder="Apple, Samsung…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r_model">{t("model")}</Label>
          <Input id="r_model" value={form.device_model} onChange={(e) => set("device_model", e.target.value)} placeholder="iPhone 14, Galaxy S23…" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="r_service">{t("service")}</Label>
        <Select value={form.requested_service} onValueChange={(v) => set("requested_service", v)}>
          <SelectTrigger id="r_service"><SelectValue placeholder="Select a service" /></SelectTrigger>
          <SelectContent>
            {SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="r_issue">{t("issue")} *</Label>
        <Textarea
          id="r_issue"
          required
          value={form.device_issue}
          onChange={(e) => set("device_issue", e.target.value)}
          placeholder="Describe the problem in detail…"
          rows={3}
          minLength={10}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="r_notes">{t("notes")}</Label>
        <Textarea
          id="r_notes"
          value={form.customer_notes}
          onChange={(e) => set("customer_notes", e.target.value)}
          placeholder="Any other details, questions, or preferred times…"
          rows={2}
        />
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
