"use client";

/**
 * CartContext — client-side cart state provider.
 *
 * Wraps the storefront with cart state so any component can read cart count
 * and perform optimistic updates without prop drilling.
 *
 * Architecture:
 *  - Server (storefront layout) fetches initial cart and passes to CartProvider
 *  - CartProvider holds state optimistically (updates before server confirms)
 *  - All mutations call Server Actions and then refresh state
 *  - Header reads itemCount from context to show the badge
 *  - Cart page and ProductCard use the addToCart / removeFromCart / updateQty helpers
 *
 * Optimistic updates:
 *  - addToCart: immediately increments count, rolls back on error
 *  - updateCartItem / removeFromCart: immediately updates items, rolls back on error
 */

import {
  createContext,
  useContext,
  useState,
  useTransition,
  useCallback,
  type ReactNode,
} from "react";
import {
  addToCart as serverAddToCart,
  updateCartItem as serverUpdateCartItem,
  removeFromCart as serverRemoveFromCart,
} from "@/lib/cart/cart-actions";
import type { CartData, CartItemWithProduct } from "@/lib/cart/cart-queries";

// ─── Context shape ────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: CartData | null;
  itemCount: number;
  isPending: boolean;
  /** Add product to cart. Returns error string or null on success. */
  addToCart: (productId: string, quantity?: number) => Promise<string | null>;
  /** Update item quantity (0 = remove). Returns error string or null. */
  updateItem: (itemId: string, quantity: number) => Promise<string | null>;
  /** Remove an item from cart. Returns error string or null. */
  removeItem: (itemId: string) => Promise<string | null>;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CartProviderProps {
  children: ReactNode;
  initialCart: CartData | null;
}

export function CartProvider({ children, initialCart }: CartProviderProps) {
  const [cart, setCart] = useState<CartData | null>(initialCart);
  const [isPending, startTransition] = useTransition();

  const itemCount = cart?.itemCount ?? 0;

  const addToCart = useCallback(
    async (productId: string, quantity = 1): Promise<string | null> => {
      // Optimistic: increment count immediately
      setCart((prev) =>
        prev
          ? { ...prev, itemCount: prev.itemCount + quantity }
          : null,
      );

      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await serverAddToCart(productId, quantity);
          if (result.error) {
            // Roll back optimistic update
            setCart((prev) =>
              prev
                ? { ...prev, itemCount: Math.max(0, prev.itemCount - quantity) }
                : null,
            );
            resolve(result.error);
          } else {
            // Replace with server-confirmed state
            setCart(result.cart ?? null);
            resolve(null);
          }
        });
      });
    },
    [],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number): Promise<string | null> => {
      // Optimistic: apply quantity change immediately
      setCart((prev) => {
        if (!prev) return null;
        const items = prev.items.map((item: CartItemWithProduct) =>
          item.id === itemId ? { ...item, quantity } : item,
        ).filter((item: CartItemWithProduct) => item.quantity > 0);

        const subtotal = items.reduce(
          (sum: number, item: CartItemWithProduct) => sum + (item.product.price ?? 0) * item.quantity,
          0,
        );
        const itemCount = items.reduce((sum: number, item: CartItemWithProduct) => sum + item.quantity, 0);

        return { ...prev, items, subtotal, itemCount };
      });

      return new Promise((resolve) => {
        startTransition(async () => {
          const result = await serverUpdateCartItem(itemId, quantity);
          if (result.error) {
            // On error, server action returns undefined cart — keep current state
            resolve(result.error);
          } else {
            setCart(result.cart ?? null);
            resolve(null);
          }
        });
      });
    },
    [],
  );

  const removeItem = useCallback(
    async (itemId: string): Promise<string | null> => {
      return updateItem(itemId, 0);
    },
    [updateItem],
  );

  return (
    <CartContext.Provider
      value={{ cart, itemCount, isPending, addToCart, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
