"use client";

/**
 * AddToCartButton — client component.
 *
 * Visible states:
 *  1. Normal            — "Add to Cart" with cart icon
 *  2. Loading           — spinner while the server action is in flight
 *  3. In Cart (compact) — green "In Cart ✓" (disabled); used on product cards
 *  4. In Cart + CTA     — "In Cart ✓" + "Continue to Checkout →" row; used on detail page (showCheckoutCTA)
 *  5. Out of Stock      — grey disabled button
 *
 * Uses its own `isLoading` state rather than the global `isPending` from CartContext,
 * so that clicking one button does NOT disable every other button on the page.
 *
 * Used on:
 *  - ProductCard (compact, size="sm")
 *  - Product detail page (full-size, size="lg")
 */

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCartIcon, CheckIcon, LoaderCircleIcon, ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
  outOfStock?: boolean;
  /** "sm" for product card, "lg" for product detail page */
  size?: "sm" | "lg" | "default";
  className?: string;
  label?: string;
  outOfStockLabel?: string;
  /**
   * When true (product detail page), shows "In Cart ✓" + "Continue to Checkout →"
   * side by side once the item is in the cart.
   * Omit or false on product cards where space is limited.
   */
  showCheckoutCTA?: boolean;
}

export function AddToCartButton({
  productId,
  disabled = false,
  outOfStock = false,
  size = "default",
  className,
  label = "Add to Cart",
  outOfStockLabel = "Out of Stock",
  showCheckoutCTA = false,
}: AddToCartButtonProps) {
  const { addToCart, cart } = useCart();
  // Local loading state — does NOT affect other buttons on the page
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive in-cart status from context cart items
  const inCart = cart?.items.some((i) => i.product_id === productId) ?? false;

  async function handleClick() {
    setError(null);
    setIsLoading(true);
    const err = await addToCart(productId, 1);
    setIsLoading(false);
    if (err) setError(err);
    // On success the cart context updates items → inCart becomes true automatically
  }

  // ── Out of stock ─────────────────────────────────────────────────────────────
  if (outOfStock) {
    return (
      <Button
        size={size}
        className={cn("w-full cursor-not-allowed opacity-60", className)}
        disabled
        aria-label={outOfStockLabel}
      >
        {outOfStockLabel}
      </Button>
    );
  }

  // ── Already in cart ──────────────────────────────────────────────────────────
  if (inCart) {
    // Detail page: two-button row — "In Cart ✓" (secondary) + "Continue to Checkout" (primary)
    if (showCheckoutCTA) {
      return (
        <div className={cn("flex w-full gap-3", className)}>
          <Button
            size={size}
            variant="outline"
            className="flex-1 border-green-200 bg-green-50 text-green-700 hover:bg-green-50 focus-visible:ring-green-600"
            disabled
            aria-label="Item already in your cart"
          >
            <CheckIcon className="me-2 h-4 w-4" aria-hidden="true" />
            In Cart
          </Button>
          <Button size={size} className="flex-1" asChild>
            <Link href="/cart">
              Continue to Checkout
              <ArrowRightIcon className="ms-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      );
    }

    // Card / compact: single disabled "In Cart ✓" button
    return (
      <Button
        size={size}
        className={cn(
          "w-full bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600",
          className,
        )}
        disabled
        aria-label="Item already in your cart"
      >
        <CheckIcon className="me-2 h-4 w-4" aria-hidden="true" />
        In Cart
      </Button>
    );
  }

  // ── Normal / Loading ─────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <Button
        size={size}
        className={cn("w-full transition-all", className)}
        disabled={disabled || isLoading}
        onClick={handleClick}
        aria-label={label}
      >
        {isLoading ? (
          <LoaderCircleIcon className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingCartIcon className="me-2 h-4 w-4" aria-hidden="true" />
        )}
        {isLoading ? "Adding…" : label}
      </Button>

      {error && (
        <p role="alert" className="mt-1 text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
