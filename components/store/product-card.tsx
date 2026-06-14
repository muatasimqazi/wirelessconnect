/**
 * ProductCard — Back Market-inspired minimal vertical card.
 *
 * Always vertical (image top, content below) — no horizontal mobile layout.
 * Grid handles columns: 2-col mobile, 3-col md, 4-col xl.
 *
 * Shows: image, condition badge, title, storage·color, price, star rating.
 * Battery health and trust indicators are on the detail page, not the card.
 */

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { StarDisplay } from "@/components/store/star-display";
import { cn } from "@/lib/utils";
import { resolveLocalizedField } from "@/lib/i18n/resolve-localized-field";
import type { ProductWithImage } from "@/lib/data/products";
import type { Locale } from "@/i18n/routing";

interface ProductCardProps {
  product: ProductWithImage;
  locale: Locale;
  className?: string;
  avgRating?: number;
  reviewCount?: number;
  imagePriority?: boolean;
}

const CONDITION_STYLES: Record<string, { label: string; className: string }> = {
  like_new:  { label: "Like New",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  excellent: { label: "Excellent", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  good:      { label: "Good",      className: "bg-amber-50 text-amber-700 border border-amber-200" },
  fair:      { label: "Fair",      className: "bg-gray-100 text-gray-600 border border-gray-200" },
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function ProductCard({
  product,
  locale,
  className,
  avgRating,
  reviewCount,
  imagePriority,
}: ProductCardProps) {
  const t = useTranslations("product");

  const title = resolveLocalizedField(
    product.translations as Record<string, unknown> | null,
    "title",
    product.title,
    locale,
  ) ?? product.title ?? "Untitled Product";

  const imageUrl = product.primaryImageUrl ?? null;
  const condition = product.condition ? CONDITION_STYLES[product.condition] : null;
  const outOfStock = (product.quantity ?? 0) === 0;
  const hasDiscount = product.compare_at_price && product.compare_at_price > (product.price ?? 0);
  const savings = hasDiscount ? product.compare_at_price! - (product.price ?? 0) : 0;

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow hover:shadow-md",
        outOfStock && "opacity-60",
        className,
      )}
    >
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block overflow-hidden bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        aria-label={`View ${title}`}
        tabIndex={0}
      >
        <div className="aspect-square">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={imagePriority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-4xl" aria-hidden="true">📱</span>
            </div>
          )}
        </div>

        {/* Discount badge */}
        {hasDiscount && savings > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
            Save {formatPrice(savings)}
          </span>
        )}

        {/* Out-of-stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
              {t("outOfStock")}
            </span>
          </div>
        )}
      </Link>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Condition badge */}
        {condition && (
          <span className={cn("w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold", condition.className)}>
            {condition.label}
          </span>
        )}

        {/* Title */}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {title}
        </Link>

        {/* Storage · Color */}
        {(product.storage || product.color) && (
          <p className="text-xs text-gray-400">
            {[product.storage, product.color].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Stars */}
        {avgRating != null && reviewCount != null && reviewCount > 0 && (
          <StarDisplay rating={avgRating} count={reviewCount} size="sm" />
        )}

        {/* Price row — pushed to bottom */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-foreground">
              {formatPrice(product.price ?? 0)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>
        </div>

        {/* Add to cart */}
        <AddToCartButton
          productId={product.id ?? ""}
          outOfStock={outOfStock}
          size="sm"
          label={t("addToCart")}
          outOfStockLabel={t("outOfStock")}
          className="w-full"
        />
      </div>
    </div>
  );
}
