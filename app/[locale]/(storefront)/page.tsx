import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

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

/**
 * Homepage (storefront) — Sprint 0 placeholder.
 *
 * This page will be fully built in Sprint 2 (Product Catalog) with:
 * - Hero section
 * - Trust bar
 * - Featured categories
 * - Featured products grid
 *
 * All text is translated via next-intl — no hardcoded English strings.
 */
export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen">
      {/* Hero — placeholder; full implementation in Sprint 2 */}
      <section className="flex flex-col items-center justify-center bg-primary px-4 py-20 text-white">
        <h1 className="text-center text-3xl font-bold md:text-5xl">{t("hero.headline")}</h1>
        <p className="mt-4 max-w-xl text-center text-lg opacity-90">{t("hero.subheadline")}</p>
        <a
          href="shop"
          className="mt-8 rounded-lg bg-white px-8 py-3 font-semibold text-primary transition-opacity hover:opacity-90"
        >
          {t("hero.cta")}
        </a>
      </section>

      {/* Trust bar — placeholder */}
      <section className="border-b bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-content flex-wrap justify-center gap-6 text-sm font-medium">
          <span>✓ {t("trustBar.cleanImei")}</span>
          <span>✓ {t("trustBar.testedDevices")}</span>
          <span>✓ {t("trustBar.warranty")}</span>
          <span>✓ {t("trustBar.shipsNationwide")}</span>
        </div>
      </section>
    </main>
  );
}
