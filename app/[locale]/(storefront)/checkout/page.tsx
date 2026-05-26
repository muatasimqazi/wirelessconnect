/**
 * Checkout page — /[locale]/checkout
 *
 * Server Component: loads cart + auth user, then delegates to CheckoutForm
 * (client component that handles form state and calls createCheckoutSession).
 *
 * Redirects to /cart if the cart is empty.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCart } from "@/lib/cart/cart-queries";
import { getCurrentProfile } from "@/lib/utils/permissions";
import { CheckoutForm } from "@/app/[locale]/(storefront)/checkout/checkout-form";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title") };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [cart, profile] = await Promise.all([getCart(), getCurrentProfile()]);

  // Redirect to cart if empty
  if (!cart || cart.items.length === 0) {
    redirect(`/${locale}/cart`);
  }

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold md:text-3xl">Checkout</h1>

      <CheckoutForm
        cart={cart}
        locale={locale}
        defaultEmail={profile?.email ?? ""}
        defaultName={profile?.full_name ?? ""}
      />
    </div>
  );
}
