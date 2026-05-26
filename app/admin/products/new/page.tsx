/**
 * Admin — New Product page.
 * Server component shell; renders ProductForm client component.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { ProductForm } from "@/app/admin/products/product-form";

export const metadata = { title: "New Product — Wireless Connect Admin" };

export default async function NewProductPage() {
  await requireStaff();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/products" className="hover:text-foreground">
          Products
        </Link>
        <span>/</span>
        <span className="text-foreground">New Product</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details below. Images can be added after saving.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <ProductForm />
      </div>
    </div>
  );
}
