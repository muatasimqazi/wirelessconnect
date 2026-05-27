"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "@/features/account/actions";
import { CheckCircleIcon } from "lucide-react";
import type { CustomerProfile } from "@/features/account/queries";

export function ProfileForm({ profile }: { profile: CustomerProfile | null }) {
  const t = useTranslations("account");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [locale, setLocale] = useState(profile?.preferred_locale ?? "en");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile({
        full_name: fullName,
        phone: phone || undefined,
        preferred_locale: locale,
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("profile")}</h2>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">{t("profile.fullName")}</Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("profile.phone")}</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (206) 555-0100"
            autoComplete="tel"
          />
          <p className="text-xs text-muted-foreground">{t("profile.phoneHint")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="locale">{t("preferredLanguage")}</Label>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger id="locale">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-green-700">
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
            {t("profile.saved")}
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? t("profile.saving") : t("profile.save")}
        </Button>
      </form>
    </div>
  );
}
