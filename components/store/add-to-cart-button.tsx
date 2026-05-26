"use client";

/**
 * AddToCartButton — client component.
 *
 * Calls the addToCart server action via CartContext with optimistic update.
 * Shows a loading state during the transition and an inline error toast if it fails.
 *
 * Used on:
 *  - ProductCard (compact)
 *  - Product detail page (full-size)
 */

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingCartIcon, CheckIcon, LoaderCircleIcon } from "lucide-react";
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
}

export function AddToCartButton({
  productId,
  disabled = false,
  outOfStock = false,
  size = "default",
  className,
  label = "Add to Cart",
  outOfStockLabel = "Out of Stock",
}: AddToCartButtonProps) {
  const { addToCart, isPending } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    const err = await addToCart(productId, 1);
    if (err) {
      setError(err);
      return;
    }
    // Show "Added" confirmation briefly
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  const isDisabled = disabled || outOfStock || isPending || justAdded;

  return (
    <div className="w-full">
      <Button
        size={size}
        className={cn(
          "w-full transition-all",
          justAdded && "bg-success hover:bg-success",
          className,
        )}
        disabled={isDisabled}
        onClick={handleClick}
        aria-label={outOfStock ? outOfStockLabel : label}
      >
        {isPending && !justAdded ? (
          <LoaderCircleIcon className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : justAdded ? (
          <CheckIcon className="me-2 h-4 w-4" aria-hidden="true" />
        ) : (
          <ShoppingCartIcon className="me-2 h-4 w-4" aria-hidden="true" />
        )}
        {outOfStock ? outOfStockLabel : justAdded ? "Added!" : label}
      </Button>

      {error && (
        <p role="alert" className="mt-1 text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
