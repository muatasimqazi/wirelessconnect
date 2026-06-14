"use client";

/**
 * Storefront Header — client component.
 *
 * Two-level layout:
 *  Top bar:      Logo | Nav links | Search | Language | Account | Cart
 *  Category bar: Quick links to shop categories (desktop + mobile scroll)
 *
 * White background, Back Market-inspired minimal design.
 * Logo placeholder uses WiFi icon + text — replace with <Image> when file arrives.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { MenuIcon, ShoppingCartIcon, UserIcon, XIcon, WifiIcon, SmartphoneIcon, TabletIcon, HeadphonesIcon, LaptopIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";

const NAV_LINKS = [
  { href: "/shop", labelKey: "shop" },
  { href: "/repairs", labelKey: "repairs" },
  { href: "/trade-in", labelKey: "tradeIn" },
  { href: "/about", labelKey: "about" },
  { href: "/contact", labelKey: "contact" },
] as const;

const CATEGORY_LINKS = [
  { href: "/shop?category=iphones", label: "iPhones", icon: SmartphoneIcon },
  { href: "/shop?category=samsung-phones", label: "Samsung", icon: SmartphoneIcon },
  { href: "/shop?category=google-pixel", label: "Google Pixel", icon: SmartphoneIcon },
  { href: "/shop?category=tablets", label: "Tablets", icon: TabletIcon },
  { href: "/shop?category=laptops", label: "Laptops", icon: LaptopIcon },
  { href: "/shop?category=accessories", label: "Accessories", icon: HeadphonesIcon },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────
// Replace this component body with <Image> once the logo file is provided.

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label="Wireless Connect — Home"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
        <WifiIcon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">Wireless Connect</p>
        <p className="hidden text-[10px] font-medium text-muted-foreground sm:block">Since 2010</p>
      </div>
    </Link>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount: cartCount } = useCart();

  return (
    <header role="banner" className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="ms-8 hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-gray-50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  pathname === href
                    ? "text-primary font-semibold"
                    : "text-foreground/70",
                )}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="ms-auto flex items-center gap-1">
            {/* Language switcher — desktop only */}
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>

            {/* Account — desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden min-h-[44px] min-w-[44px] lg:flex"
              aria-label={t("account")}
              asChild
            >
              <Link href="/account">
                <UserIcon className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>

            {/* Cart */}
            <CartButton cartCount={cartCount} label={t("cart")} />

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] lg:hidden"
                  aria-label="Open menu"
                >
                  <MenuIcon className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-80 p-0">
                <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-4">
                  <Logo onClick={() => setMobileOpen(false)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    className="min-h-[44px] min-w-[44px]"
                    aria-label="Close menu"
                  >
                    <XIcon className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </SheetHeader>
                <MobileNav t={t} onClose={() => setMobileOpen(false)} cartCount={cartCount} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* ── Category bar ────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto border-b border-gray-100 bg-white scrollbar-hide">
        <div className="mx-auto flex max-w-[1280px] items-center gap-1 px-4 sm:px-6 lg:px-8">
          {CATEGORY_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors",
                "border-b-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                pathname.includes(href.split("?")[1] ?? "__none__")
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/70 hover:border-gray-200",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

// ─── Cart button ──────────────────────────────────────────────────────────────

function CartButton({ cartCount, label }: { cartCount: number; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative min-h-[44px] min-w-[44px]"
      aria-label={`${label}${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
      asChild
    >
      <Link href="/cart">
        <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
        {cartCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>
    </Button>
  );
}

// ─── Mobile nav drawer ────────────────────────────────────────────────────────

type TFn = ReturnType<typeof useTranslations<"navigation">>;

function MobileNav({ t, onClose, cartCount }: { t: TFn; onClose: () => void; cartCount: number }) {
  return (
    <div className="flex flex-col">
      {/* Main nav */}
      <nav aria-label="Mobile navigation" className="flex flex-col border-b py-2">
        {NAV_LINKS.map(({ href, labelKey }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-gray-50 hover:text-foreground"
          >
            {t(labelKey)}
          </Link>
        ))}
      </nav>

      {/* Categories */}
      <div className="border-b py-2">
        <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Shop by Category
        </p>
        {CATEGORY_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center px-4 py-2.5 text-sm text-foreground/80 hover:bg-gray-50"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Account + Language */}
      <div className="flex flex-col py-2">
        <Link
          href="/account"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-gray-50"
        >
          <UserIcon className="h-4 w-4" aria-hidden="true" />
          {t("account")}
        </Link>
        <Link
          href="/cart"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-gray-50"
        >
          <ShoppingCartIcon className="h-4 w-4" aria-hidden="true" />
          {t("cart")}{cartCount > 0 && ` (${cartCount})`}
        </Link>
        <div className="px-4 py-3">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
