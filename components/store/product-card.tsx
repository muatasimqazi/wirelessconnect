/**
 * ProductCard — server component.
 *
 * Renders a product in the catalog grid.
 * Uses data from the `public_products` view (never base tables).
 *
 * Card content:
 *  - Product image (with fallback placeholder)
 *  - Condition badge
 *  - Title (translated if available)
 *  - Battery health indicator (phones only)
 *  - Price (with compare-at price if present)
 *  - Trust indicators: Clean IMEI, Tested, Warranty
 *  - "Add to Cart" CTA (wired in Sprint 3)
 *
 * Accessibility:
 *  - Entire card is keyboard navigable via the title link
 *  - Image has meaningful alt text
 *  - Price announced with aria-label
 *
 * RTL-safe: logical CSS properties.
 */

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConditionBadge } from "@/components/store/condition-badge";
import { BatteryHealthIndicator } from "@/components/store/battery-health-indicator";
import { PriceDisplay } from "@/components/store/price-display";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { ShieldCheckIcon, WrenchIcon, CheckCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveLocalizedField } from "@/lib/i18n/resolve-localized-field";
import type { Database } from "@/types/database.types";
import type { Locale } from "@/i18n/routing";

type PublicProduct = Database["public"]["Views"]["public_products"]["Row"];

interface ProductCardProps {
  product: PublicProduct;
  locale: Locale;
  className?: string;
}

export function ProductCard({ product, locale, className }: ProductCardProps) {
  const t = useTranslations("product");

  // Resolve localized title from JSONB translations (falls back to default title)
  // Cast Json to the type resolveLocalizedField expects — safe because the DB
  // stores only objects in the translations JSONB column (never primitives).
  const title = resolveLocalizedField(
    product.translations as Record<string, unknown> | null,
    "title",
    product.title,
    locale,
  ) ?? product.title ?? "Untitled Product";

  // First product image URL (stored in product_images table, passed as image_url)
  // For now uses a placeholder — wired to real images in Sprint 2
  const imageUrl: string | null = null;

  const isPhone =
    product.category_type === "phone";

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md",
        product.quantity === 0 && "opacity-60",
        className,
      )}
    >
      {/* Product image */}
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`View ${title}`}
        tabIndex={0}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-normal group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent"
              aria-hidden="true"
            >
              <span className="text-4xl text-muted-foreground/30">📱</span>
            </div>
          )}

          {/* Out of stock overlay */}
          {product.quantity === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
                {t("outOfStock")}
              </span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 p-3">
        {/* Condition badge */}
        {product.condition && (
          <ConditionBadge condition={product.condition} />
        )}

        {/* Title */}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {title}
        </Link>

        {/* Storage + Color */}
        {(product.storage || product.color) && (
          <p className="text-xs text-muted-foreground">
            {[product.storage, product.color].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Battery health — phones only */}
        {isPhone && product.battery_health !== null && (
          <BatteryHealthIndicator health={product.battery_health} />
        )}

        {/* Price */}
        <PriceDisplay
          price={product.price ?? 0}
          compareAtPrice={product.compare_at_price}
          size="sm"
          className="mt-auto pt-1"
        />

        {/* Mini trust indicators */}
        <div className="flex flex-wrap gap-1 pt-1">
          {product.is_clean_imei && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-medium text-green-700"
              title={t("trustIndicators.cleanImei")}
            >
              <ShieldCheckIcon className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{t("trustIndicators.cleanImei")}</span>
            </span>
          )}
          {product.is_tested && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-medium text-green-700"
              title={t("trustIndicators.tested")}
            >
              <WrenchIcon className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{t("trustIndicators.tested")}</span>
            </span>
          )}
          {product.warranty_days != null && product.warranty_days > 0 && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-medium text-green-700"
              title={t("warrantyDays", { days: product.warranty_days })}
            >
              <CheckCircleIcon className="h-3 w-3" aria-hidden="true" />
              <span className="text-[10px]">{product.warranty_days}d</span>
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <AddToCartButton
          productId={product.id ?? ""}
          outOfStock={(product.quantity ?? 0) === 0}
          size="sm"
          label={t("addToCart")}
          outOfStockLabel={t("outOfStock")}
        />
      </CardFooter>
    </Card>
  );
}
