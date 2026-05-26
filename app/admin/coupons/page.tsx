"use client";

/**
 * Admin Coupons — combined list + create form (client component).
 * Server actions handle all mutations; list is refreshed after each.
 */

import { useState, useTransition, useEffect } from "react";
import { createCoupon, disableCoupon, enableCoupon } from "@/features/admin/coupons/actions";
import { getAdminCoupons } from "@/features/admin/coupons/queries";
import type { AdminCoupon } from "@/features/admin/coupons/queries";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

function CouponValue({ coupon }: { coupon: AdminCoupon }) {
  if (coupon.type === "percentage") return <>{coupon.value}%</>;
  if (coupon.type === "fixed_amount") return <>{formatMoney(coupon.value)}</>;
  return <>Free Shipping</>;
}

// ─── Create form ──────────────────────────────────────────────────────────────

function CreateCouponForm({ onCreated }: { onCreated: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [couponType, setCouponType] = useState<"percentage" | "fixed_amount" | "free_shipping">("percentage");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    const input = {
      code: String(fd.get("code") ?? ""),
      type: couponType,
      value: couponType === "free_shipping" ? 0 : Number(fd.get("value") ?? 0),
      minimum_order_amount: fd.get("minimum_order_amount")
        ? Number(fd.get("minimum_order_amount"))
        : null,
      usage_limit: fd.get("usage_limit") ? Number(fd.get("usage_limit")) : null,
      starts_at: (fd.get("starts_at") as string) || null,
      expires_at: (fd.get("expires_at") as string) || null,
      active: true,
    };

    startTransition(async () => {
      const result = await createCoupon(input);
      if (result.error) {
        setError(result.error);
      } else {
        form.reset();
        onCreated();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Code *</label>
          <input
            name="code"
            required
            placeholder="SAVE20"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Type *</label>
          <select
            value={couponType}
            onChange={(e) => setCouponType(e.target.value as typeof couponType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="percentage">Percentage %</option>
            <option value="fixed_amount">Fixed Amount ($)</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
        </div>
        {couponType !== "free_shipping" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Value {couponType === "percentage" ? "(%)" : "(cents)"}
            </label>
            <input
              name="value"
              type="number"
              min="0"
              required
              placeholder={couponType === "percentage" ? "20" : "1000"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Min Order (cents)</label>
          <input
            name="minimum_order_amount"
            type="number"
            min="0"
            placeholder="5000"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Usage Limit</label>
          <input
            name="usage_limit"
            type="number"
            min="1"
            placeholder="Unlimited"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Starts At</label>
          <input
            name="starts_at"
            type="date"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Expires At</label>
          <input
            name="expires_at"
            type="date"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create Coupon"}
      </button>
    </form>
  );
}

// ─── Coupon row ───────────────────────────────────────────────────────────────

function CouponRow({
  coupon,
  onToggle,
}: {
  coupon: AdminCoupon;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      if (coupon.active) {
        await disableCoupon(coupon.id);
      } else {
        await enableCoupon(coupon.id);
      }
      onToggle();
    });
  }

  const expired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;

  return (
    <tr className={`transition-colors hover:bg-muted/30 ${!coupon.active || expired ? "opacity-50" : ""}`}>
      <td className="px-4 py-3 font-mono font-bold text-foreground">{coupon.code}</td>
      <td className="px-4 py-3 capitalize text-muted-foreground">
        {coupon.type.replace(/_/g, " ")}
      </td>
      <td className="px-4 py-3 font-medium text-foreground tabular-nums">
        <CouponValue coupon={coupon} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {coupon.minimum_order_amount ? formatMoney(coupon.minimum_order_amount) : "None"}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {coupon.used_count} / {coupon.usage_limit ?? "∞"}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(coupon.expires_at)}
        {expired && <span className="ml-1 text-destructive">(expired)</span>}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            coupon.active && !expired
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {coupon.active && !expired ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
        >
          {coupon.active ? "Disable" : "Enable"}
        </button>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCoupons() {
    setLoading(true);
    const data = await getAdminCoupons();
    setCoupons(data);
    setLoading(false);
  }

  useEffect(() => {
    void loadCoupons();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
        <p className="mt-1 text-sm text-muted-foreground">{coupons.length} coupon codes</p>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-foreground">Create New Coupon</h2>
        <CreateCouponForm onCreated={loadCoupons} />
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          No coupons yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Min Order</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usage</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <CouponRow key={c.id} coupon={c} onToggle={loadCoupons} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
