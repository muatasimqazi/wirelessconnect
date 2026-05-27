/**
 * StarDisplay — server-safe static star rating component.
 *
 * Renders filled/half/empty stars purely from CSS — no client state.
 * Used in ProductCard and product detail page (both server components).
 * The interactive version (for the review form) is in product-reviews.tsx.
 */

import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarDisplayProps {
  /** Average rating 0–5, supports decimals */
  rating: number;
  /** Number of reviews */
  count?: number;
  /** "sm" for product cards, "md" for product detail */
  size?: "sm" | "md";
  className?: string;
}

export function StarDisplay({ rating, count, size = "sm", className }: StarDisplayProps) {
  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-[10px]" : "text-sm";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const half = !filled && rating >= star - 0.5;
          return (
            <span key={star} className="relative inline-block">
              {/* Background (empty) star */}
              <StarIcon
                className={cn(starSize, "fill-none text-muted-foreground/30")}
                aria-hidden="true"
              />
              {/* Foreground (filled) star — clipped to a percentage */}
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  <StarIcon
                    className={cn(starSize, "fill-yellow-400 text-yellow-400")}
                    aria-hidden="true"
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {count !== undefined && (
        <span className={cn(textSize, "text-muted-foreground")}>
          {rating.toFixed(1)}
          {count > 0 && ` (${count})`}
        </span>
      )}
    </div>
  );
}
