/**
 * Admin Dashboard — KPI widgets.
 *
 * Shows key metrics:
 *  - Active products / low inventory alerts
 *  - Orders today / revenue today
 *  - Intake pipeline (received, testing, needs IMEI, ready to list)
 *  - Open warranty claims
 *
 * All queries run server-side using the admin client (service role).
 * requireStaff() is called here AND in the layout — belt-and-suspenders.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/utils/format-money";

export const metadata = { title: "Dashboard — Wireless Connect Admin" };

// ─── KPI queries ──────────────────────────────────────────────────────────────

async function getDashboardKPIs() {
  const admin = supabaseAdmin();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [
    { count: activeProducts },
    { count: lowInventory },
    { data: todayOrders },
    { count: ordersInProgress },
    { count: intakeReceived },
    { count: intakeNeedsTesting },
    { count: intakeNeedsIMEI },
    { count: intakeReadyToList },
    { count: openWarrantyClaims },
    { count: pendingCancellations },
  ] = await Promise.all([
    // Active products for sale
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),

    // Low inventory (active, qty <= 2)
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .lte("quantity", 2),

    // Orders placed today (paid)
    admin
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("paid_at", todayISO),

    // Orders needing attention (processing or ready_for_pickup)
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["processing", "ready_for_pickup"]),

    // Intakes: received (just came in)
    admin
      .from("device_intakes")
      .select("id", { count: "exact", head: true })
      .eq("status", "received"),

    // Intakes: in testing
    admin
      .from("device_intakes")
      .select("id", { count: "exact", head: true })
      .eq("status", "testing"),

    // Intakes: needs IMEI check
    admin
      .from("device_intakes")
      .select("id", { count: "exact", head: true })
      .eq("status", "needs_imei_check"),

    // Intakes: ready to list
    admin
      .from("device_intakes")
      .select("id", { count: "exact", head: true })
      .eq("status", "ready_to_list"),

    // Open warranty claims
    admin
      .from("warranties")
      .select("id", { count: "exact", head: true })
      .in("claim_status", ["submitted", "under_review"]),

    // Pending cancellation requests
    admin
      .from("order_cancellation_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
  ]);

  const todayRevenue = (todayOrders ?? []).reduce(
    (sum, o) => sum + Number(o.total ?? 0),
    0,
  );

  return {
    activeProducts: activeProducts ?? 0,
    lowInventory: lowInventory ?? 0,
    ordersToday: (todayOrders ?? []).length,
    revenueToday: todayRevenue,
    ordersInProgress: ordersInProgress ?? 0,
    intakeReceived: intakeReceived ?? 0,
    intakeNeedsTesting: intakeNeedsTesting ?? 0,
    intakeNeedsIMEI: intakeNeedsIMEI ?? 0,
    intakeReadyToList: intakeReadyToList ?? 0,
    openWarrantyClaims: openWarrantyClaims ?? 0,
    pendingCancellations: pendingCancellations ?? 0,
  };
}

// ─── Components ───────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  href,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  alert?: boolean;
}) {
  const inner = (
    <div
      className={`rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
        alert ? "border-destructive/40 bg-destructive/5" : "border-border"
      }`}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold tracking-tight ${alert ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
  if (href)
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {inner}
      </Link>
    );
  return inner;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h2>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const [profile, kpis] = await Promise.all([requireStaff(), getDashboardKPIs()]);

  const intakePipelineTotal =
    kpis.intakeReceived +
    kpis.intakeNeedsTesting +
    kpis.intakeNeedsIMEI +
    kpis.intakeReadyToList;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {profile.full_name ?? "Admin"}. Here&apos;s what&apos;s
          happening today.
        </p>
      </div>

      {/* ── Inventory & Sales ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading>Inventory &amp; Sales</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Active Products"
            value={kpis.activeProducts}
            href="/admin/products?status=active"
          />
          <KpiCard
            label="Low / Out of Stock"
            value={kpis.lowInventory}
            sub="Active products with qty ≤ 2"
            href="/admin/products?status=active"
            alert={kpis.lowInventory > 0}
          />
          <KpiCard
            label="Orders Today"
            value={kpis.ordersToday}
            href="/admin/orders"
          />
          <KpiCard
            label="Revenue Today"
            value={formatMoney(kpis.revenueToday)}
            sub="Paid orders"
          />
        </div>
      </section>

      {/* ── Orders needing action ─────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading>Orders Needing Action</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="In Progress"
            value={kpis.ordersInProgress}
            sub="Processing or ready for pickup"
            href="/admin/orders?status=processing"
            alert={kpis.ordersInProgress > 0}
          />
          <KpiCard
            label="Cancellation Requests"
            value={kpis.pendingCancellations}
            sub="Awaiting review"
            href="/admin/orders"
            alert={kpis.pendingCancellations > 0}
          />
          <KpiCard
            label="Open Warranty Claims"
            value={kpis.openWarrantyClaims}
            sub="Submitted or under review"
            href="/admin/warranties"
            alert={kpis.openWarrantyClaims > 0}
          />
        </div>
      </section>

      {/* ── Device Intake Pipeline ────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading>
          Device Intake Pipeline ({intakePipelineTotal} active)
        </SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Just Received"
            value={kpis.intakeReceived}
            href="/admin/intakes?status=received"
          />
          <KpiCard
            label="In Testing"
            value={kpis.intakeNeedsTesting}
            href="/admin/intakes?status=testing"
            alert={kpis.intakeNeedsTesting > 0}
          />
          <KpiCard
            label="Needs IMEI Check"
            value={kpis.intakeNeedsIMEI}
            href="/admin/intakes?status=needs_imei_check"
            alert={kpis.intakeNeedsIMEI > 0}
          />
          <KpiCard
            label="Ready to List"
            value={kpis.intakeReadyToList}
            sub="Passed all gates"
            href="/admin/intakes?status=ready_to_list"
            alert={kpis.intakeReadyToList > 0}
          />
        </div>
      </section>

      {/* ── Quick links ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading>Quick Actions</SectionHeading>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "New Intake", href: "/admin/intakes/new" },
            { label: "Add Product", href: "/admin/products/new" },
            { label: "View Orders", href: "/admin/orders" },
            { label: "Manage Coupons", href: "/admin/coupons" },
            { label: "Store Settings", href: "/admin/settings" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
