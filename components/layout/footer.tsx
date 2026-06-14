/**
 * Storefront Footer — async server component.
 *
 * All store info (name, address, phone, email, hours) is pulled live from
 * the settings table so admins can update it without a redeploy.
 */

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon } from "lucide-react";
import { getStoreSettings } from "@/lib/data/settings";

// ─── Hours helpers ────────────────────────────────────────────────────────────

function to12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${suffix}`;
}

function formatHoursRange(value: string): string {
  if (!value || value.toLowerCase() === "closed") return "Closed";
  const [start, end] = value.split("-");
  if (!start || !end) return value;
  return `${to12h(start)} – ${to12h(end)}`;
}

function buildHoursRows(hours: Record<string, string>): { label: string; value: string }[] {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed",
    thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
  };

  // Group consecutive days with identical hours
  const rows: { label: string; value: string }[] = [];
  let groupStart = 0;

  while (groupStart < days.length) {
    const day = days[groupStart];
    const value = hours[day] ?? "closed";
    let groupEnd = groupStart;

    while (
      groupEnd + 1 < days.length &&
      (hours[days[groupEnd + 1]] ?? "closed") === value
    ) {
      groupEnd++;
    }

    const label =
      groupStart === groupEnd
        ? dayLabels[day]
        : `${dayLabels[day]}–${dayLabels[days[groupEnd]]}`;

    rows.push({ label, value: formatHoursRange(value) });
    groupStart = groupEnd + 1;
  }

  return rows;
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export async function Footer() {
  const [t, tNav, tLegal, settings] = await Promise.all([
    getTranslations("footer"),
    getTranslations("navigation"),
    getTranslations("legal"),
    getStoreSettings(),
  ]);

  const year = new Date().getFullYear();
  const hoursRows = buildHoursRows(settings.store_hours ?? {});

  const phoneHref = settings.store_phone
    ? `tel:+1${settings.store_phone.replace(/\D/g, "")}`
    : undefined;

  const linkClass =
    "text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1";

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
              {settings.store_address && (
                <li className="flex items-start gap-2">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <address className="not-italic whitespace-pre-line">
                    {settings.store_address}
                  </address>
                </li>
              )}
              {settings.store_phone && phoneHref && (
                <li className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <a href={phoneHref} className={linkClass}>
                    {settings.store_phone}
                  </a>
                </li>
              )}
              {settings.store_email && (
                <li className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <a href={`mailto:${settings.store_email}`} className={`break-all ${linkClass}`}>
                    {settings.store_email}
                  </a>
                </li>
              )}
              {hoursRows.length > 0 && (
                <li className="flex items-start gap-2">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <dl className="space-y-0.5">
                    {hoursRows.map(({ label, value }) => (
                      <div key={label} className="flex gap-2">
                        <dt className="w-20 shrink-0">{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              )}
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
                  shop: "/shop", repairs: "/repairs",
                  tradeIn: "/trade-in", about: "/about", contact: "/contact",
                };
                return (
                  <li key={key}>
                    <Link href={hrefMap[key]} className={linkClass}>{tNav(key)}</Link>
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
              {[
                ["/legal/terms", tLegal("terms")],
                ["/legal/privacy", tLegal("privacy")],
                ["/legal/returns", tLegal("returns")],
                ["/legal/warranty", tLegal("warranty")],
                ["/legal/shipping", tLegal("shipping")],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>{label}</Link>
                </li>
              ))}
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
             * "Do Not Sell" must appear in BOTH English and Spanish regardless of locale.
             * See CCPA §1798.135(a)(1).
             */}
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/privacy/data-deletion" lang="en"
                  className="text-primary-foreground underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1">
                  Do Not Sell My Personal Information
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy/data-deletion" lang="es"
                  className="text-primary-foreground underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1">
                  No Vender Mi Información Personal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col items-center gap-2 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>{t("copyright", { year })}</p>
          {settings.store_address && <p>{settings.store_address}</p>}
        </div>
      </div>
    </footer>
  );
}
