"use client";

/**
 * CartItemRow — client component.
 *
 * Renders a single line item in the cart:
 *  - Product thumbnail (with fallback)
 *  - Title linked to PDP, condition badge, storage/color specs
 *  - Unit price and line total (price × quantity)
 *  - Quantity stepper (−/+) and remove button
 *  - Low-stock / out-of-stock warning when cart qty ≥ stock
 *
 * Mutations go through CartContext → Server Actions with optimistic updates.
 */

import Image from "next/image";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/cart-context";
import { formatMoney } from "@/lib/utils/format-money";
import { ConditionBadge } from "@/components/store/condition-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MinusIcon, PlusIcon, Trash2Icon, LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartItemWithProduct } from "@/lib/cart/cart-queries";
import type { Database } from "@/types/database.types";

type DeviceCondition = Database["public"]["Enums"]["device_condition"];

interface CartItemRowProps {
  item: CartItemWithProduct;
  locale: string;
}

export function CartItemRow({ item, locale }: CartItemRowProps) {
  const { updateItem, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { product, quantity } = item;
  const stock = product.quantity ?? 0;
  const unitPrice = product.price ?? 0;
  const lineTotal = unitPrice * quantity;
  const isOutOfStock = stock === 0;
  const isAtStockLimit = quantity >= stock && stock > 0;

  const title = product.title ?? "Untitled Product";

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function handleQuantityChange(newQty: number) {
    if (newQty < 0 || newQty > stock) return;
    setIsUpdating(true);
    setError(null);
    const err = await updateItem(item.id, newQty);
    if (err) setError(err);
    setIsUpdating(false);
  }

  async function handleRemove() {
    setIsUpdating(true);
    setError(null);
    const err = await removeItem(item.id);
    if (err) {
      setError(err);
      setIsUpdating(false);
    }
    // If successful the item disappears from DOM — no need to reset
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn("relative", isUpdating && "opacity-60 pointer-events-none")}>
      {/* Loading overlay spinner */}
      {isUpdating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <LoaderCircleIcon className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        </div>
      )}

      <div className="grid grid-cols-[auto_1fr] gap-4 sm:grid-cols-[auto_1fr_auto_auto]">
        {/* Thumbnail */}
        <Link
          href={`/product/${product.slug}`}
          className="block shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`View ${title}`}
          tabIndex={0}
        >
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted sm:h-24 sm:w-24">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={title}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent"
                aria-hidden="true"
              >
                <span className="text-2xl text-muted-foreground/30">📱</span>
              </div>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* Condition badge */}
          {product.condition && (
            <ConditionBadge condition={product.condition as DeviceCondition} />
          )}

          {/* Title */}
          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {title}
          </Link>

          {/* Specs */}
          {(product.storage || product.color) && (
            <p className="text-xs text-muted-foreground">
              {[product.storage, product.color].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Mobile: price (shown below specs on small screens) */}
          <p className="text-sm font-medium sm:hidden">
            {formatMoney(unitPrice, locale)}
          </p>

          {/* Stock warning */}
          {isOutOfStock && (
            <p className="text-xs font-semibold text-destructive">Out of stock</p>
          )}
          {!isOutOfStock && isAtStockLimit && (
            <p className="text-xs font-medium text-amber-600">
              Only {stock} left — maximum reached
            </p>
          )}

          {/* Mobile: quantity controls */}
          <div className="flex items-center gap-2 sm:hidden">
            <QuantityStepper
              quantity={quantity}
              stock={stock}
              onDecrement={() => handleQuantityChange(quantity - 1)}
              onIncrement={() => handleQuantityChange(quantity + 1)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              aria-label={`Remove ${title} from cart`}
            >
              <Trash2Icon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Desktop: quantity stepper (hidden on mobile) */}
        <div className="hidden sm:flex sm:flex-col sm:items-center sm:justify-center sm:gap-2">
          <QuantityStepper
            quantity={quantity}
            stock={stock}
            onDecrement={() => handleQuantityChange(quantity - 1)}
            onIncrement={() => handleQuantityChange(quantity + 1)}
          />
        </div>

        {/* Desktop: price + remove (hidden on mobile) */}
        <div className="hidden sm:flex sm:flex-col sm:items-end sm:justify-between sm:gap-2">
          <div className="text-end">
            <p className="text-sm font-semibold">
              {formatMoney(lineTotal, locale)}
            </p>
            {quantity > 1 && (
              <p className="text-xs text-muted-foreground">
                {formatMoney(unitPrice, locale)} each
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            aria-label={`Remove ${title} from cart`}
          >
            <Trash2Icon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Separator className="mt-4" />
    </div>
  );
}

// ─── Quantity stepper ──────────────────────────────────────────────────────────

interface QuantityStepperProps {
  quantity: number;
  stock: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

function QuantityStepper({ quantity, stock, onDecrement, onIncrement }: QuantityStepperProps) {
  const canDecrement = quantity > 1;
  const canIncrement = quantity < stock;

  return (
    <div
      className="inline-flex items-center rounded-lg border border-border"
      role="group"
      aria-label="Quantity"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-r-none border-r border-border"
        onClick={onDecrement}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
      >
        <MinusIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>

      <span
        className="min-w-[2rem] select-none px-2 text-center text-sm font-semibold tabular-nums"
        aria-live="polite"
        aria-label={`Quantity: ${quantity}`}
      >
        {quantity}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-l-none border-l border-border"
        onClick={onIncrement}
        disabled={!canIncrement}
        aria-label="Increase quantity"
      >
        <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
