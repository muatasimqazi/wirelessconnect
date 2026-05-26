/**
 * Storefront route group layout.
 *
 * All storefront pages (/, /shop, /product/[slug], /cart, /checkout, etc.)
 * share this layout which wraps them with the standard Header + Footer.
 *
 * The <main> element receives id="main-content" for the skip-to-content link
 * in the Header (keyboard accessibility / WCAG 2.1 §2.4.1).
 */

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Cart count will be wired to cart state in Sprint 3 */}
      <Header cartCount={0} />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>

      <Footer />
    </div>
  );
}
