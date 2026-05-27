/**
 * ProductCard — server component.
 *
 * Mobile layout  (< sm): horizontal row — image left (112px), content right.
 * Desktop layout (sm+):  vertical card  — image top, content below.
 *
 * This avoids the cramped 2-column mobile grid where vertical cards pack
 * too much content into ~175px-wide cells.
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
import type { ProductWithImage } from "@/lib/data/products";
import type { Locale } from "@/i18n/routing";

interface ProductCardProps {
  product: ProductWithImage;
  locale: Locale;
  className?: string;
}

export function ProductCard({ product, locale, className }: ProductCardProps) {
  const t = useTranslations("product");

  const title = resolveLocalizedField(
    product.translations as Record<string, unknown> | null,
    "title",
    product.title,
    locale,
  ) ?? product.title ?? "Untitled Product";

  const imageUrl: string | null = product.primaryImageUrl ?? null;
  const isPhone = product.category_type === "phone";

  return (
    <Card
      className={cn(
        // Mobile: horizontal row. sm+: vertical column.
        "group relative flex flex-row sm:flex-col overflow-hidden transition-shadow hover:shadow-md",
        product.quantity === 0 && "opacity-60",
        className,
      )}
    >
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      {/* Mobile: fixed 112px wide, full height (flex-stretch).              */}
      {/* sm+: full width, 1:1 aspect ratio.                                 */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block w-28 shrink-0 sm:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`View ${title}`}
        tabIndex={0}
      >
        <div className="relative h-full overflow-hidden bg-muted sm:aspect-square">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 112px, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent"
              aria-hidden="true"
            >
              <span className="text-3xl text-muted-foreground/30 sm:text-4xl">📱</span>
            </div>
          )}

          {/* Out-of-stock overlay */}
          {product.quantity === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:px-3 sm:py-1 sm:text-sm">
                {t("outOfStock")}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Content + footer column ────────────────────────────────────────── */}
      {/* Wraps both so they stack vertically inside the flex-row card.       */}
      <div className="flex min-w-0 flex-1 flex-col">
        <CardContent className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3">
          {/* Condition badge */}
          {product.condition && (
            <ConditionBadge condition={product.condition} />
          )}

          {/* Title */}
          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-2 text-xs font-medium leading-snug text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
          >
            {title}
          </Link>

          {/* Storage · Color — visible at all sizes */}
          {(product.storage || product.color) && (
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {[product.storage, product.color].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Battery — hidden on mobile (shown on detail page) */}
          {isPhone && product.battery_health !== null && (
            <div className="hidden sm:block">
              <BatteryHealthIndicator health={product.battery_health} />
            </div>
          )}

          {/* Price */}
          <PriceDisplay
            price={product.price ?? 0}
            compareAtPrice={product.compare_at_price}
            size="sm"
            className="mt-auto pt-1"
          />

          {/* Trust indicators — hidden on mobile, shown sm+ */}
          <div className="hidden flex-wrap gap-1 pt-1 sm:flex">
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

        <CardFooter className="p-2.5 pt-0 sm:p-3 sm:pt-0">
          <AddToCartButton
            productId={product.id ?? ""}
            outOfStock={(product.quantity ?? 0) === 0}
            size="sm"
            label={t("addToCart")}
            outOfStockLabel={t("outOfStock")}
          />
        </CardFooter>
      </div>
    </Card>
  );
}
