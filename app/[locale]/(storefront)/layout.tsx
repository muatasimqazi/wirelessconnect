/**
 * Storefront route group layout.
 *
 * Fetches the initial cart server-side and passes it to CartProvider,
 * so all client components (Header, ProductCard, CartPage) share cart state
 * without redundant fetches.
 *
 * The <main> element receives id="main-content" for the skip-to-content link
 * in the Header (keyboard accessibility / WCAG 2.1 §2.4.1).
 */

import { getCart } from "@/lib/cart/cart-queries";
import { CartProvider } from "@/context/cart-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCurrentProfile, isStaffOrAdmin } from "@/lib/utils/permissions";

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export default async function StorefrontLayout({ children }: StorefrontLayoutProps) {
  const [cart, profile] = await Promise.all([getCart(), getCurrentProfile()]);

  return (
    <CartProvider initialCart={cart}>
      <div className="flex min-h-screen flex-col">
        <Header isStaff={isStaffOrAdmin(profile)} />

        <main id="main-content" className="flex-1" tabIndex={-1}>
          {children}
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}
