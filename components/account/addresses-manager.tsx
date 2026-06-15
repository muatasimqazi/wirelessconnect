"use client";

/**
 * AddressesManager — client component.
 *
 * Lists saved shipping addresses with edit/delete controls.
 * Inline form for adding or editing an address.
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createAddress, updateAddress, deleteAddress } from "@/features/account/actions";
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon } from "lucide-react";
import type { CustomerAddress } from "@/features/account/queries";
import type { Locale } from "@/i18n/routing";

interface AddressesManagerProps {
  addresses: CustomerAddress[];
  locale: Locale;
}

interface AddressFormState {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  is_default_shipping: boolean;
}

const emptyForm: AddressFormState = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  is_default_shipping: false,
};

export function AddressesManager({ addresses: initial, locale: _locale }: AddressesManagerProps) {
  const t = useTranslations("account");
  const [addresses, setAddresses] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowAdd(true);
    setError(null);
  }

  function openEdit(addr: CustomerAddress) {
    setEditingId(addr.id);
    setForm({
      full_name: addr.full_name,
      phone: addr.phone ?? "",
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      is_default_shipping: addr.is_default_shipping,
    });
    setShowAdd(false);
    setError(null);
  }

  function cancelForm() {
    setEditingId(null);
    setShowAdd(false);
    setForm(emptyForm);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const data = {
        full_name: form.full_name,
        phone: form.phone || undefined,
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        is_default_shipping: form.is_default_shipping,
        country: "US",
      };

      const result = editingId
        ? await updateAddress(editingId, data)
        : await createAddress(data);

      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      // Optimistic update (page will revalidate on next visit)
      if (editingId) {
        setAddresses((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? {
                  ...a,
                  ...data,
                  phone: form.phone || null,
                  line2: form.line2 || null,
                  is_default_billing: a.is_default_billing,
                  country: "US",
                }
              : form.is_default_shipping
              ? { ...a, is_default_shipping: false }
              : a,
          ),
        );
      } else {
        // Can't know the new ID without refetching — just clear form
        // and let the user see it on next load
        setAddresses((prev) =>
          form.is_default_shipping
            ? prev.map((a) => ({ ...a, is_default_shipping: false }))
            : prev,
        );
      }

      cancelForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddress(id);
      if (result.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  const addressForm = (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <h3 className="font-semibold text-sm">
        {editingId ? t("addresses.editAddress") : t("addresses.addAddress")}
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="addr_name">{t("addresses.fullName")}</Label>
          <Input
            id="addr_name"
            required
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Jane Smith"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addr_phone">{t("addresses.phone")}</Label>
          <Input
            id="addr_phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+1 (206) 555-0100"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="addr_line1">{t("addresses.line1")}</Label>
          <Input
            id="addr_line1"
            required
            value={form.line1}
            onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
            placeholder="123 Main St"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="addr_line2">{t("addresses.line2")}</Label>
          <Input
            id="addr_line2"
            value={form.line2}
            onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
            placeholder="Apt, suite, unit (optional)"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addr_city">{t("addresses.city")}</Label>
          <Input
            id="addr_city"
            required
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Seattle"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="addr_state">{t("addresses.state")}</Label>
            <Input
              id="addr_state"
              required
              maxLength={2}
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))}
              placeholder="WA"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="addr_zip">{t("addresses.postalCode")}</Label>
            <Input
              id="addr_zip"
              required
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
              placeholder="98133"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="addr_default"
          checked={form.is_default_shipping}
          onCheckedChange={(v) => setForm((f) => ({ ...f, is_default_shipping: !!v }))}
        />
        <Label htmlFor="addr_default" className="cursor-pointer text-sm">
          {t("addresses.setDefault")}
        </Label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("addresses.saving") : t("addresses.save")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={cancelForm}>
          {t("addresses.cancel")}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("addresses.title")}</h2>
        {!showAdd && !editingId && (
          <Button variant="outline" size="sm" onClick={openAdd}>
            <PlusIcon className="mr-1 h-4 w-4" aria-hidden="true" />
            {t("addresses.add")}
          </Button>
        )}
      </div>

      {showAdd && addressForm}

      {addresses.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
          <MapPinIcon className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t("addresses.noAddresses")}</p>
          <Button variant="outline" size="sm" onClick={openAdd}>
            {t("addresses.addFirst")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-lg border border-border bg-surface p-4 space-y-2">
              {editingId === addr.id ? (
                addressForm
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm">
                      <p className="font-medium">{addr.full_name}</p>
                      {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                      <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                      <p className="text-muted-foreground">{addr.country}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {addr.is_default_shipping && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(addr)}
                        aria-label="Edit address"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(addr.id)}
                        disabled={isPending}
                        aria-label="Delete address"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
