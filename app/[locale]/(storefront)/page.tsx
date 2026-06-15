/**
 * Homepage — /[locale]
 *
 * Server Component. Fetches featured products and categories server-side.
 * Sections:
 *  1. Hero carousel (4 auto-advancing slides — AI_TASKS P2-#3)
 *  2. Trust bar (6 trust indicators)
 *  3. Stats strip
 *  4. Featured categories
 *  5. Featured products grid
 *  6. Repair services
 *  7. Local advantage (in-store / why-shop-local split section)
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/store/empty-state";
import { HeroCarousel, type HeroSlideContent } from "@/components/store/hero-carousel";
import { getFeaturedProducts } from "@/lib/data/products";
import { getReviewSummaries } from "@/features/reviews/actions";
import { getCategories } from "@/lib/data/categories";
import { resolveLocalizedField } from "@/lib/i18n/resolve-localized-field";
import {
  ShieldCheckIcon,
  WrenchIcon,
  CheckCircleIcon,
  TruckIcon,
  HomeIcon,
  PhoneIcon,
  LockIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  SmartphoneIcon,
  BatteryIcon,
  HardDriveIcon,
  RefreshCwIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: "Wireless Connect — Certified Pre-Owned Phones",
    description: t("hero.metaDescription"),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ]);

  const featuredIds = featuredProducts.map((p) => p.id).filter(Boolean) as string[];
  const ratingMap = await getReviewSummaries(featuredIds);

  return (
    <>
      {/* LocalBusiness structured data — helps Google surface store info in search */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Wireless Connect",
            url: "https://wirelessconnectstore.com",
            logo: "https://wirelessconnectstore.com/logo.png",
            image: "https://wirelessconnectstore.com/og-image.jpg",
            description:
              "Certified pre-owned phones professionally tested with 30-day warranty. Local pickup in Shoreline, WA or ships anywhere in the U.S.",
            telephone: "+1-206-423-2965",
            email: "officialwirelessconnect@gmail.com",
            address: {
              "@type": "PostalAddress",
              streetAddress: "14723 Aurora Ave N",
              addressLocality: "Shoreline",
              addressRegion: "WA",
              postalCode: "98133",
              addressCountry: "US",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: 47.7516,
              longitude: -122.3441,
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                opens: "10:00",
                closes: "19:00",
              },
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Saturday"],
                opens: "10:00",
                closes: "18:00",
              },
            ],
            priceRange: "$$",
            currenciesAccepted: "USD",
            paymentAccepted: "Credit Card, Debit Card",
            hasMap: "https://maps.google.com/?q=14723+Aurora+Ave+N+Shoreline+WA+98133",
            sameAs: [],
          }),
        }}
      />
      <HomePageContent locale={locale as Locale} featuredProducts={featuredProducts} categories={categories} ratingMap={ratingMap} />
    </>
  );
}

// ─── Client-renderable content (uses useTranslations) ─────────────────────────

import type { ProductWithImage } from "@/lib/data/products";
import type { Category } from "@/lib/data/categories";

function HomePageContent({
  locale,
  featuredProducts,
  categories,
  ratingMap,
}: {
  locale: Locale;
  featuredProducts: ProductWithImage[];
  categories: Category[];
  ratingMap: Map<string, { avgRating: number; reviewCount: number }>;
}) {
  const t = useTranslations("home");
  const heroSlides = t.raw("hero.slides") as HeroSlideContent[];
  const repairItems = t.raw("repairServices.items") as { title: string; description: string }[];
  const checklist = t.raw("localAdvantage.checklist") as string[];

  const STAT_ICONS = [ClockIcon, UsersIcon, HomeIcon, MapPinIcon];
  const REPAIR_ICONS = [SmartphoneIcon, WrenchIcon, BatteryIcon, HardDriveIcon, RefreshCwIcon];

  return (
    <main className="min-h-screen">
      {/* ── Hero carousel ────────────────────────────────────────────────── */}
      <HeroCarousel slides={heroSlides} />

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-surface px-4 py-5">
        <ul className="mx-auto flex max-w-content flex-wrap justify-center gap-6 text-sm font-medium text-foreground/70">
          <TrustItem icon={ShieldCheckIcon} label={t("trustBar.cleanImei")} />
          <TrustItem icon={WrenchIcon} label={t("trustBar.testedDevices")} />
          <TrustItem icon={CheckCircleIcon} label={t("trustBar.warranty")} />
          <TrustItem icon={TruckIcon} label={t("trustBar.shipsNationwide")} />
          <TrustItem icon={HomeIcon} label={t("trustBar.locallyOwned")} />
          <TrustItem icon={LockIcon} label={t("trustBar.securePayment")} />
        </ul>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white px-4 py-10">
        <dl className="mx-auto grid max-w-content grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: t("stats.years"), label: t("stats.yearsLabel") },
            { value: t("stats.customers"), label: t("stats.customersLabel") },
            { value: t("stats.locallyOwned"), label: t("stats.locallyOwnedLabel") },
            { value: t("stats.area"), label: t("stats.areaLabel") },
          ].map(({ value, label }, i) => {
            const Icon = STAT_ICONS[i];
            return (
              <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-6 text-center">
                <Icon className="h-5 w-5 text-wc-blue" aria-hidden="true" />
                <dt className="text-2xl font-bold text-foreground sm:text-3xl">{value}</dt>
                <dd className="text-sm text-muted-foreground">{label}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      {/* ── Featured categories ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-content">
            <h2 className="mb-6 text-h2-mobile font-bold md:text-h2-desktop">
              {t("featuredCategories")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {categories.map((cat) => {
                const name = resolveLocalizedField(
                  cat.translations as Record<string, unknown> | null,
                  "name",
                  cat.name,
                  locale,
                ) ?? cat.name;

                return (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-white px-4 py-6 text-center shadow-sm transition-colors hover:border-secondary hover:bg-secondary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="text-3xl transition-transform group-hover:scale-110" aria-hidden="true">
                      {CATEGORY_EMOJI[cat.slug] ?? "📦"}
                    </span>
                    <span className="text-sm font-semibold">{name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured products ─────────────────────────────────────────────── */}
      <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-content">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-h2-mobile font-bold md:text-h2-desktop">
                {t("featuredProducts")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("featuredProductsSubtitle")}</p>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/shop">{t("viewAll")}</Link>
            </Button>
          </div>

          {featuredProducts.length === 0 ? (
            <EmptyState
              title="No products yet"
              description="Check back soon — we're adding inventory."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredProducts.map((product) => {
                const rating = product.id ? ratingMap.get(product.id) : undefined;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    avgRating={rating?.avgRating}
                    reviewCount={rating?.reviewCount}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Repair services ──────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-content">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-h2-mobile font-bold md:text-h2-desktop">{t("repairServices.heading")}</h2>
            <p className="mt-2 text-muted-foreground">{t("repairServices.subheading")}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {repairItems.map((item, i) => {
              const Icon = REPAIR_ICONS[i];
              const href = i === 4 ? "/trade-in" : "/repairs";
              return (
                <Link
                  key={item.title}
                  href={href}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-secondary hover:bg-secondary hover:text-white"
                >
                  <Icon className="h-6 w-6 text-slate-600 group-hover:text-wc-blue" aria-hidden="true" />
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-white/70">{item.description}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href="/repairs">{t("repairServices.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Local advantage ──────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-content">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left: copy */}
              <div className="px-8 py-12 lg:px-12">
                <span className="text-xs font-semibold uppercase tracking-wide text-wc-blue">
                  {t("localAdvantage.badge")}
                </span>
                <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">{t("localAdvantage.heading")}</h2>
                <p className="mt-4 text-muted-foreground">{t("localAdvantage.body")}</p>
                <p className="mt-3 text-sm font-semibold text-wc-blue">{t("localAdvantage.serviceArea")}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="secondary" asChild>
                    <Link href="/repairs">{t("localAdvantage.repair")}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contact">{t("localAdvantage.visit")}</Link>
                  </Button>
                  <a
                    href="tel:+12064232965"
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50"
                  >
                    <PhoneIcon className="h-4 w-4 text-wc-blue" aria-hidden="true" />
                    {t("localAdvantage.callNow")}
                  </a>
                </div>
              </div>

              {/* Right: why-shop-local checklist */}
              <div className="flex flex-col justify-center gap-4 bg-secondary px-8 py-12 text-white lg:px-12">
                {checklist.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
                    <span className="text-sm text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TrustItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-wc-blue" aria-hidden="true" />
      <span>{label}</span>
    </li>
  );
}

const CATEGORY_EMOJI: Record<string, string> = {
  iphones:        "🍎",
  "samsung-phones": "📱",
  "google-pixel": "📱",
  tablets:        "📟",
  laptops:        "💻",
  accessories:    "🎧",
};
