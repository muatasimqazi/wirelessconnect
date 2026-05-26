/**
 * Cart page — /[locale]/cart
 *
 * Renders the current cart contents, quantity controls, subtotal, and
 * a "Proceed to Checkout" button (wired in Sprint 4).
 *
 * Server Component: fetches the canonical cart from Supabase server-side.
 * Cart mutations (qty update / remove) happen via client CartItemRow
 * components that call Server Actions.
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCart } from "@/lib/cart/cart-queries";
import { formatMoney } from "@/lib/utils/format-money";
import { CartItemRow } from "@/app/[locale]/(storefront)/cart/cart-item-row";
import { EmptyState } from "@/components/store/empty-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCartIcon } from "lucide-react";

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title") };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "cart" });
  const cart = await getCart();

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShoppingCartIcon}
          title={t("empty")}
          description="Browse our selection of certified pre-owned devices."
          action={{ label: t("emptyAction"), href: "/shop" }}
          className="max-w-md mx-auto"
        />
      </div>
    );
  }

  const shipping = 0; // Calculated at checkout with Stripe Tax
  const total = cart.subtotal + shipping;

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{t("title")}</h1>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
        {/* ── Cart items ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          {/* Column headers — desktop only */}
          <div className="mb-3 hidden grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
            <span>{t("item")}</span>
            <span className="text-center">{t("quantity")}</span>
            <span className="text-end">{t("price")}</span>
          </div>

          <Separator className="mb-4 hidden sm:block" />

          <div className="space-y-4">
            {cart.items.map((item) => (
              <CartItemRow key={item.id} item={item} locale={locale} />
            ))}
          </div>
        </div>

        {/* ── Order summary ──────────────────────────────────────────────── */}
        <aside className="rounded-xl border border-border bg-surface p-6 h-fit">
          <h2 className="mb-4 text-base font-semibold">Order Summary</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("subtotal")}</dt>
              <dd className="font-medium">{formatMoney(cart.subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("shipping")}</dt>
              <dd className="font-medium">
                {shipping === 0 ? (
                  <span className="text-green-600">Calculated at checkout</span>
                ) : (
                  formatMoney(shipping, locale)
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="font-medium text-muted-foreground">Calculated at checkout</dd>
            </div>

            <Separator className="my-3" />

            <div className="flex justify-between text-base font-semibold">
              <dt>Estimated Total</dt>
              <dd>{formatMoney(total, locale)}</dd>
            </div>
          </dl>

          {/* Checkout CTA — wired in Sprint 4 */}
          <Button className="mt-6 w-full" size="lg" asChild>
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>

          <Button variant="outline" className="mt-2 w-full" size="sm" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>

          {/* Trust signals */}
          <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true">🔒</span> Secure checkout via Stripe
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true">🛡️</span> 30-Day Warranty included
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true">↩️</span> Returns accepted within policy
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
