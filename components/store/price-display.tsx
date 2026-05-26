/**
 * PriceDisplay — server component.
 *
 * Renders a price (in cents) in a consistent format across the storefront.
 * Uses formatMoney from lib/utils/format-money which formats to USD.
 *
 * If compare_at_price is provided and higher than the current price,
 * renders the original price as struck-through alongside the sale price.
 *
 * All prices stored as cents (integer) per DB schema §5.1.
 */

import { formatMoney } from "@/lib/utils/format-money";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  /** Current price in cents. */
  price: number;
  /** Original / compare-at price in cents. If > price, shows as strikethrough. */
  compareAtPrice?: number | null;
  /** Visual size variant. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { price: "text-base font-semibold", compare: "text-sm" },
  md: { price: "text-xl font-semibold", compare: "text-base" },
  lg: { price: "text-2xl font-bold", compare: "text-lg" },
};

export function PriceDisplay({
  price,
  compareAtPrice,
  size = "md",
  className,
}: PriceDisplayProps) {
  const hasSale = compareAtPrice != null && compareAtPrice > price;
  const classes = sizeClasses[size];

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          classes.price,
          hasSale ? "text-error" : "text-foreground",
        )}
        aria-label={`Price: ${formatMoney(price)}`}
      >
        {formatMoney(price)}
      </span>

      {hasSale && (
        <span
          className={cn(classes.compare, "text-muted-foreground line-through")}
          aria-label={`Original price: ${formatMoney(compareAtPrice)}`}
        >
          {formatMoney(compareAtPrice)}
        </span>
      )}
    </div>
  );
}
