import type { Locale as SupportedLocale } from "@/i18n/routing";

/**
 * Resolves a localized field from a JSONB translations object.
 *
 * Used for product titles, descriptions, category names, etc.
 * Falls back to the English/default field when translation is missing.
 *
 * Per Database Schema Specification §6.3 (Localization Notes):
 * - English fields are the canonical/default fields.
 * - Localized content is stored in JSONB `translations` field.
 * - English fallback is required when Spanish translation is missing.
 *
 * @example
 * // Product with Spanish translation
 * resolveLocalizedField(product.translations, 'title', product.title, 'es')
 * // → Spanish title if available, English title otherwise
 *
 * @example
 * // Product without Spanish translation
 * resolveLocalizedField(product.translations, 'title', product.title, 'es')
 * // → English title (fallback)
 */
export function resolveLocalizedField(
  translations: Record<string, unknown> | null | undefined,
  field: string,
  defaultValue: string | null | undefined,
  locale: SupportedLocale
): string | null {
  // If English or no translations, return default
  if (locale === "en" || !translations) {
    return defaultValue ?? null;
  }

  // Try to find the translation for the requested locale
  const localeTranslations = translations[locale];
  if (
    localeTranslations &&
    typeof localeTranslations === "object" &&
    !Array.isArray(localeTranslations)
  ) {
    const translated = (localeTranslations as Record<string, unknown>)[field];
    if (typeof translated === "string" && translated.length > 0) {
      return translated;
    }
  }

  // Fall back to English/default value
  return defaultValue ?? null;
}

/**
 * Resolves multiple localized fields from translations at once.
 * Returns an object with all requested fields resolved to the correct locale.
 *
 * @example
 * const { title, description } = resolveLocalizedFields(
 *   product.translations,
 *   { title: product.title, description: product.description },
 *   'es'
 * )
 */
export function resolveLocalizedFields<T extends Record<string, string | null | undefined>>(
  translations: Record<string, unknown> | null | undefined,
  defaults: T,
  locale: SupportedLocale
): { [K in keyof T]: string | null } {
  const result = {} as { [K in keyof T]: string | null };
  for (const key in defaults) {
    result[key] = resolveLocalizedField(translations, key, defaults[key], locale);
  }
  return result;
}
