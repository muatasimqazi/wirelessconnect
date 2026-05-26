"use client";

/**
 * Storefront Header — client component.
 *
 * Desktop: logo | nav links | search | language switcher | account | cart
 * Mobile:  logo | cart icon | hamburger (opens Sheet drawer)
 *
 * Accessibility:
 *  - landmark role="banner"
 *  - Skip-to-content link (visually hidden, shown on focus)
 *  - aria-label on icon-only buttons
 *  - Keyboard-navigable mobile menu (Sheet from shadcn/ui — traps focus)
 *
 * RTL-safe: uses logical CSS properties (ms-auto, ps-*, pe-*, gap-*).
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Separator } from "@/components/ui/separator";
import { MenuIcon, SearchIcon, ShoppingCartIcon, UserIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Number of items in cart — shown as badge on cart icon. */
  cartCount?: number;
}

const NAV_LINKS = [
  { href: "/shop", labelKey: "shop" },
  { href: "/repairs", labelKey: "repairs" },
  { href: "/trade-in", labelKey: "tradeIn" },
  { href: "/about", labelKey: "about" },
  { href: "/contact", labelKey: "contact" },
] as const;

export function Header({ cartCount = 0 }: HeaderProps) {
  const t = useTranslations("navigation");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm"
    >
      {/* Skip to main content — visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex h-16 max-w-container items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-lg font-bold text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Wireless Connect — Home"
        >
          Wireless Connect
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Main navigation"
          className="ms-auto hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="ms-auto flex items-center gap-1 md:ms-4">
          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden min-h-touch min-w-touch md:flex"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Language switcher — desktop only */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {/* Account */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden min-h-touch min-w-touch md:flex"
            aria-label={t("account")}
            asChild
          >
            <Link href="/account">
              <UserIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>

          {/* Cart */}
          <CartButton cartCount={cartCount} label={t("cart")} />

          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-touch min-w-touch md:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-4">
                <SheetTitle className="text-lg font-bold">Wireless Connect</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-touch min-w-touch"
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
    </header>
  );
}

// ─── Cart button with optional badge ─────────────────────────────────────────

function CartButton({ cartCount, label }: { cartCount: number; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative min-h-touch min-w-touch"
      aria-label={`${label}${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
      asChild
    >
      <Link href="/cart">
        <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
        {cartCount > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center",
              "rounded-full bg-primary text-[10px] font-bold text-white",
            )}
            aria-hidden="true"
          >
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>
    </Button>
  );
}

// ─── Mobile navigation drawer ─────────────────────────────────────────────────

type TranslationFn = ReturnType<typeof useTranslations<"navigation">>;

function MobileNav({
  t,
  onClose,
  cartCount,
}: {
  t: TranslationFn;
  onClose: () => void;
  cartCount: number;
}) {
  return (
    <div className="flex flex-col">
      <nav aria-label="Mobile navigation" className="flex flex-col py-2">
        {NAV_LINKS.map(({ href, labelKey }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            {t(labelKey)}
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Account + Cart */}
      <div className="flex flex-col py-2">
        <Link
          href="/account"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
        >
          <UserIcon className="h-5 w-5" aria-hidden="true" />
          {t("account")}
        </Link>
        <Link
          href="/cart"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
          {t("cart")}
          {cartCount > 0 && (
            <span className="ms-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      <Separator />

      {/* Language switcher */}
      <div className="px-4 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Language
        </p>
        <LanguageSwitcher className="w-full justify-start" />
      </div>
    </div>
  );
}
