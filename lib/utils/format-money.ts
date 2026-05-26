/**
 * Formats a price in cents or dollars to a localized currency string.
 *
 * @param amount - Amount in dollars (e.g., 299.99)
 * @param locale - Display locale for formatting (e.g., 'en', 'es')
 * @param currency - ISO 4217 currency code (default: 'USD')
 */
export function formatMoney(
  amount: number,
  locale: string = "en",
  currency: string = "USD"
): string {
  // Map app locales to BCP 47 locale identifiers for Intl
  const intlLocale = locale === "es" ? "es-US" : "en-US";

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculates discount percentage between original price and sale price.
 * Returns 0 if no valid compare-at price.
 */
export function calculateDiscountPercent(
  price: number,
  compareAtPrice: number | null | undefined
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
