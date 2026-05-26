/**
 * Locale-aware 404 Not Found page.
 *
 * Requirements per UX Guidelines §20 and Build Execution Plan:
 *  - Full layout (Header + Footer) — users can navigate away
 *  - No stack traces or technical error details
 *  - Translated into the current locale
 *  - Clear CTA back to the shop
 *
 * Note: This file must be at app/[locale]/not-found.tsx so it renders
 * within the locale layout (which provides NextIntlClientProvider and
 * sets lang/dir on <html>).
 *
 * For routes outside the locale prefix, Next.js falls back to app/not-found.tsx.
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchXIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found — Wireless Connect",
};

export default async function NotFoundPage() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col">
      <Header cartCount={0} />

      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center"
        tabIndex={-1}
      >
        <SearchXIcon
          className="h-16 w-16 text-muted-foreground/40"
          aria-hidden="true"
        />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {t("notFound")}
          </h1>
          <p className="max-w-md text-base text-muted-foreground">
            {t("notFoundMessage")}
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/shop">{t("backToShop")}</Link>
        </Button>
      </main>

      <Footer />
    </div>
  );
}
