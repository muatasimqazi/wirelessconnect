/**
 * Converts a product title or string to a URL-safe slug.
 *
 * @example
 * slugify("Apple iPhone 15 Pro Max 256GB — Natural Titanium")
 * // → "apple-iphone-15-pro-max-256gb-natural-titanium"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generates a unique product slug by appending a short unique suffix.
 * Use when a slug collision is detected.
 *
 * @example
 * uniqueSlug("iphone-15-pro", "abc123")
 * // → "iphone-15-pro-abc123"
 */
export function uniqueSlug(base: string, suffix: string): string {
  return `${slugify(base)}-${suffix.toLowerCase().slice(0, 8)}`;
}
