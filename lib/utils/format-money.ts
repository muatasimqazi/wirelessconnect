/**
 * Formats a price stored in cents to a localized currency string.
 *
 * All prices in the database are stored as integer cents (e.g. $29.99 → 2999).
 * This function divides by 100 before formatting.
 *
 * @param cents   - Amount in cents (e.g., 2999 for $29.99)
 * @param locale  - Display locale for formatting (default: 'en')
 * @param currency - ISO 4217 currency code (default: 'USD')
 *
 * @example
 * formatMoney(2999)       // "$29.99"
 * formatMoney(2999, "es") // "$29.99" (es-US locale)
 * formatMoney(0)          // "$0.00"
 */
export function formatMoney(
  cents: number,
  locale: string = "en",
  currency: string = "USD",
): string {
  // Map app locales to BCP 47 locale identifiers for Intl
  const intlLocale = locale === "es" ? "es-US" : "en-US";

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Calculates discount percentage between original price and sale price.
 * Both values must be in cents. Returns 0 if no valid compare-at price.
 *
 * @example
 * calculateDiscountPercent(1999, 2999) // 33
 */
export function calculateDiscountPercent(
  priceCents: number,
  compareAtPriceCents: number | null | undefined,
): number {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) return 0;
  return Math.round(
    ((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100,
  );
}
