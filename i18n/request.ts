import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * next-intl server-side request configuration.
 * Loads the correct message file for the active locale.
 * Falls back to English when a translation is missing.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming locale is one we support
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
