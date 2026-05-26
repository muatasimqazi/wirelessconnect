import { defineRouting } from "next-intl/routing";

/**
 * Locale routing configuration for next-intl.
 *
 * MVP supported locales: English (en) and Spanish (es).
 * Future RTL languages (Arabic, Urdu, Dari, Pashto) are architecturally
 * supported — see localeConfig below and the layout's dir attribute.
 *
 * Locale validation happens at the application layer only.
 * No database CHECK constraints restrict locale values.
 */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  // Preserve locale when navigating between pages
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

/**
 * Locale metadata including text direction.
 * RTL languages (Arabic, Urdu, Dari, Pashto) require dir="rtl" on <html>.
 * Build with logical CSS properties from day one to avoid layout rewrites later.
 */
export const localeConfig = {
  en: { direction: "ltr" as const, label: "English", nativeLabel: "English" },
  es: { direction: "ltr" as const, label: "Spanish", nativeLabel: "Español" },
  // Future RTL languages (not active yet — architecture is prepared):
  // ar: { direction: "rtl" as const, label: "Arabic", nativeLabel: "العربية" },
  // ur: { direction: "rtl" as const, label: "Urdu", nativeLabel: "اردو" },
};

/** Supported locale values for application-layer validation (no DB CHECK constraints). */
export const SUPPORTED_LOCALES = routing.locales;

/** Default locale used as fallback when translation is missing. */
export const DEFAULT_LOCALE = routing.defaultLocale;
