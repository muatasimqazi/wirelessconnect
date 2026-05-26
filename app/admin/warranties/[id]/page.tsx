/**
 * Admin Warranty Detail — server component.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminWarrantyById } from "@/features/admin/warranties/queries";
import { WarrantyClient } from "./warranty-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const w = await getAdminWarrantyById(id);
  return { title: w ? `Warranty — ${w.product_title}` : "Warranty — Admin" };
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

export default async function AdminWarrantyDetailPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  const warranty = await getAdminWarrantyById(id);
  if (!warranty) notFound();

  const expired = new Date(warranty.expires_at) < new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/warranties" className="hover:text-foreground">
          Warranties
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{warranty.product_title}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{warranty.product_title}</h1>
        <p className={`mt-1 text-sm ${expired ? "text-destructive" : "text-muted-foreground"}`}>
          {expired ? "EXPIRED · " : ""}
          {formatDate(warranty.starts_at)} – {formatDate(warranty.expires_at)} ({warranty.warranty_days} days)
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-foreground">Customer</h2>
          <InfoRow label="Name" value={warranty.customer_name} />
          <InfoRow label="Email" value={<a href={`mailto:${warranty.customer_email}`} className="text-primary hover:underline">{warranty.customer_email}</a>} />
          <InfoRow label="Phone" value={warranty.customer_phone} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-foreground">Device</h2>
          <InfoRow label="Brand" value={warranty.device_brand} />
          <InfoRow label="Model" value={warranty.device_model} />
          <InfoRow label="IMEI" value={warranty.device_imei ? <span className="font-mono">{warranty.device_imei}</span> : null} />
          <InfoRow label="S/N" value={warranty.device_serial_number ? <span className="font-mono">{warranty.device_serial_number}</span> : null} />
        </div>
      </div>

      {warranty.claim_description && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 font-semibold text-foreground">Claim Description</h2>
          <p className="text-sm text-foreground">{warranty.claim_description}</p>
          {warranty.claim_submitted_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {formatDate(warranty.claim_submitted_at)}
            </p>
          )}
          {warranty.claim_resolved_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Resolved {formatDate(warranty.claim_resolved_at)}
            </p>
          )}
        </div>
      )}

      <WarrantyClient warranty={warranty} />

      {warranty.order_id && (
        <div className="text-sm">
          <Link
            href={`/admin/orders/${warranty.order_id}`}
            className="text-primary hover:underline"
          >
            View original order →
          </Link>
        </div>
      )}
    </div>
  );
}
