/**
 * Product detail page — /[locale]/product/[slug]
 *
 * Server Component. Queries `public_products` view (never base `products` table).
 * Private fields (IMEI, serial, cost, acquisition source) are excluded by the view.
 *
 * Includes:
 *  - JSON-LD Product structured data (SEO)
 *  - Open Graph image meta (Sprint 6)
 *  - Trust indicators (Clean IMEI, Tested, Warranty)
 *  - Condition badge, battery health, price
 *  - Add to Cart button (wired in Sprint 3)
 *  - Breadcrumb navigation
 *  - Related/similar products section (via category)
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProductBySlug, getProducts, getProductImages } from "@/lib/data/products";
import { getApprovedReviews } from "@/features/reviews/actions";
import { ProductReviews } from "@/components/store/product-reviews";
import { getCategories } from "@/lib/data/categories";
import { resolveLocalizedField } from "@/lib/i18n/resolve-localized-field";
import { ConditionBadge } from "@/components/store/condition-badge";
import { BatteryHealthIndicator } from "@/components/store/battery-health-indicator";
import { PriceDisplay } from "@/components/store/price-display";
import { TrustBadge } from "@/components/store/trust-badge";
import { Breadcrumb } from "@/components/store/breadcrumb";
import { ProductImageGallery } from "@/components/store/product-image-gallery";
import { ProductGrid } from "@/components/store/product-grid";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Separator } from "@/components/ui/separator";
import { StoreIcon, TruckIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  const title = resolveLocalizedField(
    product.translations as Record<string, unknown> | null,
    "title",
    product.title,
    locale as Locale,
  ) ?? product.title ?? slug;

  const description = resolveLocalizedField(
    product.translations as Record<string, unknown> | null,
    "description",
    product.description,
    locale as Locale,
  ) ?? product.description ?? undefined;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wirelessconnect.vercel.app").replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/product/${slug}`;
  const ogTitle = product.seo_title ?? title ?? "Wireless Connect";
  const ogDescription = product.seo_description ?? description;

  // OG image is served by the co-located opengraph-image.tsx file convention.
  // We reference it explicitly so Twitter card also picks it up.
  const ogImageUrl = `${siteUrl}/${locale}/product/${slug}/opengraph-image`;

  return {
    title: ogTitle,
    description: ogDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${siteUrl}/en/product/${slug}`,
        es: `${siteUrl}/es/product/${slug}`,
        "x-default": `${siteUrl}/en/product/${slug}`,
      },
    },
    openGraph: {
      type: "website",
      title: ogTitle ?? undefined,
      description: ogDescription,
      url: canonicalUrl,
      siteName: "Wireless Connect",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: ogTitle ?? "Product" }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? undefined,
      description: ogDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [product, categories] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
  ]);

  if (!product) notFound();

  const t = await getTranslations({ locale, namespace: "product" });
  const loc = locale as Locale;

  const title = resolveLocalizedField(
    product.translations as Record<string, unknown> | null,
    "title",
    product.title,
    loc,
  ) ?? product.title ?? "Untitled";

  const description = resolveLocalizedField(
    product.translations as Record<string, unknown> | null,
    "description",
    product.description,
    loc,
  );

  // Fetch images + related products in parallel
  const category = categories.find((c) => c.id === product.category_id);
  const [images, { products: relatedProducts }, reviews] = await Promise.all([
    product.id ? getProductImages(product.id) : Promise.resolve([]),
    getProducts({
      filters: { categoryId: product.category_id ?? undefined },
      sort: "featured",
      limit: 4,
    }),
    product.id ? getApprovedReviews(product.id) : Promise.resolve([]),
  ]);

  // Filter out the current product from related
  const related = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const isPhone = product.category_type === "phone";
  const isOutOfStock = (product.quantity ?? 0) === 0;

  const breadcrumbs = [
    { label: "Shop", href: "/shop" as const },
    ...(category ? [{ label: category.name, href: `/shop?category=${category.slug}` as const }] : []),
    { label: title },
  ];

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbs} className="mb-6" />

      {/* JSON-LD Product structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: title,
            description: description ?? undefined,
            sku: product.sku ?? undefined,
            brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
            offers: {
              "@type": "Offer",
              price: product.price != null ? (product.price / 100).toFixed(2) : undefined,
              priceCurrency: "USD",
              availability:
                isOutOfStock
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
              seller: { "@type": "Organization", name: "Wireless Connect" },
            },
            ...(images[0] ? { image: images[0].image_url } : {}),
          }),
        }}
      />

      {/* Product layout: image | details */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Images */}
        <ProductImageGallery images={images} title={title} />

        {/* Right: Details */}
        <div className="flex flex-col gap-5">
          {/* Brand + title */}
          {product.brand && (
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              {product.brand}
            </p>
          )}
          <h1 className="text-h2-mobile font-bold text-foreground md:text-h2-desktop">
            {title}
          </h1>

          {/* Condition + battery */}
          <div className="flex flex-wrap items-center gap-3">
            {product.condition && <ConditionBadge condition={product.condition} />}
            {isPhone && product.battery_health != null && (
              <BatteryHealthIndicator health={product.battery_health} />
            )}
          </div>

          {/* Price */}
          <PriceDisplay
            price={product.price ?? 0}
            compareAtPrice={product.compare_at_price}
            size="lg"
          />

          {/* Stock status */}
          {isOutOfStock && (
            <p className="text-sm font-semibold text-destructive">{t("outOfStock")}</p>
          )}

          {/* Specs chips */}
          <div className="flex flex-wrap gap-2 text-sm">
            {product.storage && (
              <Chip label={t("storage")} value={product.storage} />
            )}
            {product.color && (
              <Chip label={t("color")} value={product.color} />
            )}
            {product.carrier && (
              <Chip
                label={t("carrier")}
                value={product.carrier === "unlocked" ? "Unlocked" : product.carrier.toUpperCase()}
              />
            )}
            {product.warranty_days != null && product.warranty_days > 0 && (
              <Chip label={t("warranty")} value={t("warrantyDays", { days: product.warranty_days })} />
            )}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            {product.is_clean_imei && <TrustBadge type="cleanImei" />}
            {product.is_tested && <TrustBadge type="professionallyTested" />}
            {product.is_data_wiped && <TrustBadge type="factoryReset" />}
            {product.warranty_days != null && product.warranty_days > 0 && (
              <TrustBadge type="warrantyIncluded" />
            )}
            {product.allow_pickup && <TrustBadge type="pickupAvailable" />}
            {product.allow_shipping && <TrustBadge type="shipsNationwide" />}
          </div>

          <Separator />

          {/* Add to Cart */}
          <AddToCartButton
            productId={product.id ?? ""}
            outOfStock={isOutOfStock}
            size="lg"
            label={t("addToCart")}
            outOfStockLabel={t("outOfStock")}
          />

          {/* Fulfillment options */}
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            {product.allow_pickup && (
              <div className="flex items-center gap-2 text-foreground/80">
                <StoreIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Local pickup — 14723 Aurora Ave N, Shoreline, WA</span>
              </div>
            )}
            {product.allow_shipping && (
              <div className="flex items-center gap-2 text-foreground/80">
                <TruckIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Ships anywhere in the U.S.</span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="prose prose-sm max-w-none text-foreground/80">
              <h2 className="mb-1 text-sm font-semibold">About this device</h2>
              <p className="whitespace-pre-line">{description}</p>
            </div>
          )}

          {/* Includes */}
          {(product.includes_charger || product.includes_cable) && (
            <div>
              <h2 className="mb-1 text-sm font-semibold">{t("includes")}</h2>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-foreground/80">
                {product.includes_charger && <li>Charger</li>}
                {product.includes_cable && <li>Cable</li>}
              </ul>
            </div>
          )}

          {/* Network compatibility */}
          {product.network_compatibility && product.network_compatibility.length > 0 && (
            <div>
              <h2 className="mb-1 text-sm font-semibold">{t("network")}</h2>
              <p className="text-sm text-foreground/80">
                {product.network_compatibility.join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <ProductReviews
          productId={product.id ?? ""}
          reviews={reviews}
          locale={locale}
        />
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold">More in {category?.name ?? "this category"}</h2>
          <ProductGrid products={related} locale={loc} />
        </section>
      )}
    </div>
  );
}

// ─── Spec chip ─────────────────────────────────────────────────────────────────

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
