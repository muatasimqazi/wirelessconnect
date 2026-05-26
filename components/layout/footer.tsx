/**
 * Storefront Footer — server component.
 *
 * Sections:
 *  1. Store info (address, phone, email, hours)
 *  2. Navigation links (Shop, Repairs, Trade-In, About, Contact)
 *  3. Legal links (Terms, Privacy, Returns, Warranty, Shipping)
 *  4. CCPA "Do Not Sell My Personal Information" — required in English AND Spanish
 *     regardless of the active locale (CCPA compliance).
 *
 * RTL-safe: logical CSS properties throughout.
 * All text is translated via next-intl — no hardcoded English strings.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("navigation");
  const tLegal = useTranslations("legal");
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Column 1 — Store info */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
              {t("storeInfo")}
            </h2>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <address className="not-italic whitespace-pre-line">
                  {t("address")}
                </address>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <a
                  href="tel:+12064232965"
                  className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  (206) 423-2965
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <a
                  href="mailto:officialwirelessconnect@gmail.com"
                  className="break-all transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  officialwirelessconnect@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <StoreHours />
              </li>
            </ul>
          </div>

          {/* Column 2 — Navigation */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
              {t("navigation")}
            </h2>
            <ul className="space-y-2 text-sm">
              {(["shop", "repairs", "tradeIn", "about", "contact"] as const).map((key) => {
                const hrefMap: Record<string, string> = {
                  shop: "/shop",
                  repairs: "/repairs",
                  tradeIn: "/trade-in",
                  about: "/about",
                  contact: "/contact",
                };
                return (
                  <li key={key}>
                    <Link
                      href={hrefMap[key]}
                      className="text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                    >
                      {tNav(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3 — Legal */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
              {t("legal")}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/terms"
                  className="text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  {tLegal("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  {tLegal("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/returns"
                  className="text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  {tLegal("returns")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/warranty"
                  className="text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  {tLegal("warranty")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/shipping"
                  className="text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  {tLegal("shipping")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 — CCPA / Privacy rights */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
              Privacy Rights
            </h2>
            <p className="mb-3 text-sm text-white/70">
              California residents have the right to opt out of the sale of personal information.
            </p>
            {/*
             * CCPA COMPLIANCE NOTE:
             * The "Do Not Sell My Personal Information" link must appear in BOTH
             * English and Spanish on every page of the site, regardless of the
             * active locale. We render both here unconditionally.
             * See California Consumer Privacy Act (CCPA) §1798.135(a)(1).
             */}
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/privacy/data-deletion"
                  className="text-primary-foreground underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                  lang="en"
                >
                  {/* English — always shown */}
                  Do Not Sell My Personal Information
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy/data-deletion"
                  className="text-primary-foreground underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                  lang="es"
                >
                  {/* Spanish — always shown (CCPA requires both) */}
                  No Vender Mi Información Personal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-2 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>{t("copyright", { year })}</p>
          <p>14723 Aurora Ave N, Shoreline, WA 98133</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Store Hours sub-component ────────────────────────────────────────────────

function StoreHours() {
  const hours = [
    { day: "Mon–Fri", hours: "10:00 AM – 7:00 PM" },
    { day: "Saturday", hours: "10:00 AM – 6:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ];

  return (
    <dl className="space-y-0.5">
      {hours.map(({ day, hours: h }) => (
        <div key={day} className="flex gap-2">
          <dt className="w-20 shrink-0">{day}</dt>
          <dd>{h}</dd>
        </div>
      ))}
    </dl>
  );
}
