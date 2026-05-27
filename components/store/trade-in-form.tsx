"use client";

/**
 * TradeInForm — client component.
 *
 * Multi-step trade-in submission form. Collects device details and customer info.
 * Disclaims that the online estimate is preliminary (not binding).
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
import { submitTradeIn } from "@/features/trade-in/actions";
import { CheckCircleIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface TradeInFormProps {
  locale: Locale;
}

const DEVICE_TYPES = [
  { value: "phone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "laptop", label: "Laptop" },
  { value: "accessory", label: "Accessory" },
  { value: "other", label: "Other" },
];

const CONDITIONS = [
  { value: "like_new", label: "Like New — no visible wear" },
  { value: "excellent", label: "Excellent — minimal wear" },
  { value: "good", label: "Good — light scratches" },
  { value: "fair", label: "Fair — noticeable wear" },
];

const CARRIERS = [
  { value: "unlocked", label: "Unlocked" },
  { value: "att", label: "AT&T" },
  { value: "verizon", label: "Verizon" },
  { value: "tmobile", label: "T-Mobile" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Not sure" },
];

export function TradeInForm({ locale }: TradeInFormProps) {
  const t = useTranslations("tradeIn.form");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    device_type: "phone" as "phone" | "tablet" | "laptop" | "accessory" | "other",
    brand: "",
    model: "",
    storage: "",
    carrier: "unknown",
    condition: "",
    battery_health: "",
    customer_description: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitTradeIn({
        ...form,
        customer_locale: locale,
        battery_health: form.battery_health ? parseInt(form.battery_health) : undefined,
        condition: form.condition || undefined,
        carrier: form.carrier || undefined,
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
      {/* Customer info */}
      <div className="space-y-1.5">
        <Label htmlFor="ti_name">{t("name")} *</Label>
        <Input id="ti_name" required value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="Jane Smith" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ti_email">{t("email")} *</Label>
          <Input id="ti_email" type="email" required value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} placeholder="jane@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ti_phone">{t("phone")}</Label>
          <Input id="ti_phone" type="tel" value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} placeholder="+1 (206) 555-0100" />
        </div>
      </div>

      {/* Device info */}
      <div className="space-y-1.5">
        <Label htmlFor="ti_type">{t("deviceType")} *</Label>
        <Select value={form.device_type} onValueChange={(v) => set("device_type", v)}>
          <SelectTrigger id="ti_type"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DEVICE_TYPES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ti_brand">{t("brand")} *</Label>
          <Input id="ti_brand" required value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Apple, Samsung, Google…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ti_model">{t("model")} *</Label>
          <Input id="ti_model" required value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="iPhone 14, Galaxy S23…" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ti_storage">{t("storage")}</Label>
          <Input id="ti_storage" value={form.storage} onChange={(e) => set("storage", e.target.value)} placeholder="128GB" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ti_carrier">{t("carrier")}</Label>
          <Select value={form.carrier} onValueChange={(v) => set("carrier", v)}>
            <SelectTrigger id="ti_carrier"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CARRIERS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ti_battery">{t("batteryHealth")}</Label>
          <Input
            id="ti_battery"
            type="number"
            min={0}
            max={100}
            value={form.battery_health}
            onChange={(e) => set("battery_health", e.target.value)}
            placeholder="85"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ti_condition">{t("condition")}</Label>
        <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
          <SelectTrigger id="ti_condition"><SelectValue placeholder="Select condition" /></SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ti_desc">{t("description")}</Label>
        <Textarea
          id="ti_desc"
          value={form.customer_description}
          onChange={(e) => set("customer_description", e.target.value)}
          placeholder="Describe the device condition, any damage, accessories included…"
          rows={4}
        />
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{t("disclaimerShort")}</p>
    </form>
  );
}
