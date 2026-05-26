"use client";

/**
 * DataDeletionForm — CCPA data deletion request form.
 *
 * Client component — handles form state and server action submission.
 */

import { useState, useTransition } from "react";
import { submitDataDeletionRequest } from "@/features/legal/data-deletion-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircleIcon } from "lucide-react";

interface DataDeletionFormProps {
  locale: string;
}

export function DataDeletionForm({ locale }: DataDeletionFormProps) {
  const isEs = locale === "es";
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await submitDataDeletionRequest(formData);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? (isEs ? "Ha ocurrido un error." : "An error occurred."));
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950/30">
        <CheckCircleIcon className="h-10 w-10 text-green-600" aria-hidden="true" />
        <div>
          <p className="text-lg font-semibold text-foreground">
            {isEs ? "Solicitud Enviada" : "Request Submitted"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEs
              ? "Hemos recibido su solicitud. Responderemos dentro de 45 días hábiles."
              : "We have received your request. We will respond within 45 business days."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name">
            {isEs ? "Nombre Completo" : "Full Name"}{" "}
            <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            placeholder={isEs ? "Su nombre completo" : "Your full name"}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">
            {isEs ? "Correo Electrónico" : "Email Address"}{" "}
            <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={isEs ? "su@email.com" : "you@example.com"}
          />
        </div>
      </div>

      {/* Order number (optional) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order_number">
          {isEs ? "Número de Orden (opcional)" : "Order Number (optional)"}
        </Label>
        <Input
          id="order_number"
          name="order_number"
          type="text"
          placeholder={isEs ? "ej. WC-12345" : "e.g. WC-12345"}
        />
      </div>

      {/* Reason (optional) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">
          {isEs ? "Motivo (opcional)" : "Reason (optional)"}
        </Label>
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          placeholder={
            isEs
              ? "Cuéntenos por qué desea que eliminemos sus datos..."
              : "Tell us why you'd like your data deleted..."
          }
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending
          ? isEs ? "Enviando..." : "Submitting..."
          : isEs ? "Enviar Solicitud" : "Submit Request"}
      </Button>

      <p className="text-xs text-muted-foreground">
        {isEs
          ? "Responderemos a su solicitud dentro de 45 días hábiles, como lo exige la CCPA de California."
          : "We will respond to your request within 45 business days as required by the California CCPA."}
      </p>
    </form>
  );
}
