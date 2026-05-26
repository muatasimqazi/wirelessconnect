/**
 * Admin — Product Detail / Edit page.
 *
 * Server component. Loads full product data + images,
 * then renders ProductForm (client) pre-filled.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminProductById, getProductImages } from "@/features/admin/products/queries";
import { ProductForm } from "@/app/admin/products/product-form";
import { formatMoney } from "@/lib/utils/format-money";
import type { ProductInput } from "@/features/admin/products/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const product = await getAdminProductById(id);
  return {
    title: product ? `${product.title} — Admin` : "Product — Admin",
  };
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  await requireStaff();
  const { id } = await params;

  const [product, images] = await Promise.all([
    getAdminProductById(id),
    getProductImages(id),
  ]);

  if (!product) notFound();

  // Shape product into ProductInput defaults
  const defaultValues: Partial<ProductInput> = {
    title: product.title ?? "",
    subtitle: product.subtitle ?? undefined,
    description: product.description ?? undefined,
    brand: product.brand ?? undefined,
    model: product.model ?? undefined,
    storage: product.storage ?? undefined,
    color: product.color ?? undefined,
    carrier: product.carrier ?? undefined,
    condition: product.condition ?? undefined,
    battery_health: product.battery_health ?? undefined,
    battery_cycle_count: product.battery_cycle_count ?? undefined,
    price: product.price ?? 0,
    compare_at_price: product.compare_at_price ?? undefined,
    quantity: product.quantity ?? 0,
    sku: product.sku ?? undefined,
    warranty_days: product.warranty_days ?? 30,
    status: (product.status as ProductInput["status"]) ?? "draft",
    featured: product.featured ?? false,
    allow_pickup: product.allow_pickup ?? true,
    allow_shipping: product.allow_shipping ?? true,
    is_clean_imei: product.is_clean_imei ?? false,
    is_tested: product.is_tested ?? false,
    is_data_wiped: product.is_data_wiped ?? false,
    imei: product.imei ?? undefined,
    serial_number: product.serial_number ?? undefined,
    category_type: product.category_type ?? "phone",
    seo_title: product.seo_title ?? undefined,
    seo_description: product.seo_description ?? undefined,
    includes_charger: product.includes_charger ?? false,
    includes_cable: product.includes_cable ?? true,
    network_compatibility: (product.network_compatibility as string[]) ?? [],
    supported_bands: (product.supported_bands as string[]) ?? [],
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/products" className="hover:text-foreground">
          Products
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{product.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              {formatMoney(product.price ?? 0)} ·{" "}
              <span className={`font-medium ${(product.quantity ?? 0) <= 0 ? "text-destructive" : "text-foreground"}`}>
                Qty {product.quantity}
              </span>
            </span>
            {product.sku && <span>SKU: {product.sku}</span>}
          </div>
        </div>
        <Link
          href={`/en/products/${product.slug}`}
          target="_blank"
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          View Live ↗
        </Link>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <ProductForm
          productId={id}
          defaultValues={defaultValues}
          images={images}
        />
      </div>
    </div>
  );
}
