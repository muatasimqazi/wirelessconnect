"use client";

/**
 * StickyCheckoutBar — mobile-only sticky bottom bar for the cart page.
 *
 * Shows on screens < lg when the order summary is scrolled out of view.
 * Provides the primary checkout CTA always within reach on mobile.
 *
 * Spec §6: sticky cart button when items > 0.
 * WCAG 2.5.5: min 44px touch target.
 */

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/format-money";

interface StickyCheckoutBarProps {
  subtotal: number;
  locale: string;
  checkoutLabel?: string;
}

export function StickyCheckoutBar({
  subtotal,
  locale,
  checkoutLabel = "Proceed to Checkout",
}: StickyCheckoutBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden"
      aria-label="Checkout summary"
    >
      <div className="mx-auto flex max-w-container items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Subtotal</span>
          <span className="text-sm font-semibold">{formatMoney(subtotal, locale)}</span>
        </div>
        <Button size="lg" className="min-h-[44px] flex-1" asChild>
          <Link href="/checkout">{checkoutLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
