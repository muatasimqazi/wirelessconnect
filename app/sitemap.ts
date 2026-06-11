/**
 * Dynamic sitemap — /sitemap.xml
 *
 * Generates URLs for:
 *  - Static storefront pages (both locales)
 *  - Legal pages (both locales)
 *  - Published products (from public_products view)
 *
 * Uses Next.js App Router MetadataRoute.Sitemap type.
 * Priority/changeFrequency follow SEO best practices.
 */

import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://wirelessconnectstore.com";
const LOCALES = ["en", "es"] as const;

// Static storefront paths (locale-aware)
const STATIC_PATHS = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/legal/returns", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/legal/warranty", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/legal/shipping", priority: 0.3, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ─────────────────────────────────────────────────────────
  for (const locale of LOCALES) {
    for (const { path, priority, changeFrequency } of STATIC_PATHS) {
      const url = `${BASE_URL}/${locale}${path}`;
      entries.push({
        url,
        priority,
        changeFrequency,
        alternates: {
          languages: {
            en: `${BASE_URL}/en${path}`,
            es: `${BASE_URL}/es${path}`,
          },
        },
      });
    }
  }

  // ── Product pages ─────────────────────────────────────────────────────────
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_products")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500); // sitemap limit guardrail

    const products = data as Array<{ slug: string | null; updated_at: string | null }> | null;

    if (products) {
      for (const product of products) {
        if (!product.slug) continue;
        const path = `/product/${product.slug}`;
        for (const locale of LOCALES) {
          entries.push({
            url: `${BASE_URL}/${locale}${path}`,
            lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
            priority: 0.8,
            changeFrequency: "weekly" as const,
            alternates: {
              languages: {
                en: `${BASE_URL}/en${path}`,
                es: `${BASE_URL}/es${path}`,
              },
            },
          });
        }
      }
    }
  } catch {
    // If DB is unavailable during build, return static entries only
  }

  return entries;
}
