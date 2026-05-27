"use client";

/**
 * ContactForm — client component.
 *
 * Simple name / email / subject / message form.
 * Sends via the sendContactEmail server action.
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactEmail } from "@/features/contact/actions";
import { CheckCircleIcon } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendContactEmail({ name, email, subject, message });
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
        <CheckCircleIcon className="h-10 w-10 text-green-600" aria-hidden="true" />
        <h3 className="font-semibold">{t("successTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("successMessage")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact_name">{t("name")}</Label>
          <Input
            id="contact_name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_email">{t("email")}</Label>
          <Input
            id="contact_email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact_subject">{t("subject")}</Label>
        <Input
          id="contact_subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Order question, product inquiry…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact_message">{t("message")}</Label>
        <Textarea
          id="contact_message"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          rows={5}
          minLength={10}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
