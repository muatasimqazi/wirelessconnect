/**
 * Admin Products List — server component.
 *
 * Shows all products with status, price, quantity, condition, testing status.
 * Supports ?status= filter.
 * Links to product detail/edit page.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminProducts } from "@/features/admin/products/queries";
import { formatMoney } from "@/lib/utils/format-money";

export const metadata = { title: "Products — Wireless Connect Admin" };

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
  sold_out: "Sold Out",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  archived: "bg-muted text-muted-foreground",
  sold_out: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const TESTING_LABELS: Record<string, string> = {
  not_started: "—",
  in_progress: "In progress",
  passed: "Passed",
  failed: "Failed",
  needs_review: "Review",
};

const TESTING_COLORS: Record<string, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-blue-600 dark:text-blue-400",
  passed: "text-green-600 dark:text-green-400",
  failed: "text-destructive",
  needs_review: "text-yellow-600 dark:text-yellow-400",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  await requireStaff();
  const { status } = await searchParams;

  const products = await getAdminProducts({ status, limit: 200 });

  const statusFilters = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "sold_out", label: "Sold Out" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""}
            {status ? ` · ${STATUS_LABELS[status] ?? status}` : ""}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          + Add Product
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/products?status=${f.value}` : "/admin/products"}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          No products found.{" "}
          <Link href="/admin/products/new" className="underline">
            Add one
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Condition
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Testing
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    IMEI
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.title}</div>
                      {(p.brand || p.model) && (
                        <div className="text-xs text-muted-foreground">
                          {[p.brand, p.model].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.sku ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(p.price)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-medium ${
                        p.quantity <= 0
                          ? "text-destructive"
                          : p.quantity <= 2
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-foreground"
                      }`}
                    >
                      {p.quantity}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {p.condition ?? "—"}
                    </td>
                    <td className={`px-4 py-3 ${TESTING_COLORS[p.testing_status] ?? ""}`}>
                      {TESTING_LABELS[p.testing_status] ?? p.testing_status}
                    </td>
                    <td className="px-4 py-3">
                      {p.is_clean_imei ? (
                        <span className="text-green-600 dark:text-green-400">✓ Clean</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
