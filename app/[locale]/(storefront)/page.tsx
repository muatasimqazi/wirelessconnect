/**
 * Homepage — /[locale]
 *
 * Server Component. Fetches featured products and categories server-side.
 * Sections:
 *  1. Hero
 *  2. Trust bar (4 trust indicators)
 *  3. Featured categories (6 category tiles)
 *  4. Featured products grid (up to 8 products)
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/store/empty-state";
import { getFeaturedProducts } from "@/lib/data/products";
import { getReviewSummaries } from "@/features/reviews/actions";
import { getCategories } from "@/lib/data/categories";
import { resolveLocalizedField } from "@/lib/i18n/resolve-localized-field";
import {
  ShieldCheckIcon,
  WrenchIcon,
  CheckCircleIcon,
  TruckIcon,
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
    description: t("hero.subheadline"),
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
            url: "https://wirelessconnectnw.com",
            logo: "https://wirelessconnectnw.com/logo.png",
            image: "https://wirelessconnectnw.com/og-image.jpg",
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

  return (
    <main className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-secondary px-4 py-20 text-white">
        <div className="mx-auto flex max-w-content flex-col items-center gap-6 text-center">
          <h1 className="text-h1-mobile font-bold md:text-h1-desktop">
            {t("hero.headline")}
          </h1>
          <p className="max-w-xl text-lg text-white/80">
            {t("hero.subheadline")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/shop">{t("hero.cta")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild>
              <Link href="/about" aria-label="Learn more about Wireless Connect">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface px-4 py-5">
        <ul className="mx-auto flex max-w-content flex-wrap justify-center gap-6 text-sm font-medium text-foreground/80">
          <TrustItem icon={ShieldCheckIcon} label={t("trustBar.cleanImei")} />
          <TrustItem icon={WrenchIcon} label={t("trustBar.testedDevices")} />
          <TrustItem icon={CheckCircleIcon} label={t("trustBar.warranty")} />
          <TrustItem icon={TruckIcon} label={t("trustBar.shipsNationwide")} />
        </ul>
      </section>

      {/* ── Featured categories ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="px-4 py-12 sm:px-6 lg:px-8">
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
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-4 py-6 text-center transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="text-3xl" aria-hidden="true">
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
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-h2-mobile font-bold md:text-h2-desktop">
              {t("featuredProducts")}
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/shop">View All</Link>
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
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TrustItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
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
