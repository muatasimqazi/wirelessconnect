/**
 * Robots.txt — /robots.txt
 *
 * Blocks crawlers from:
 *  - Admin routes (no index)
 *  - API routes
 *  - Auth callback routes
 *
 * Allows all other content.
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/en/auth/", "/es/auth/"],
      },
    ],
    sitemap: "https://wirelessconnectstore.com/sitemap.xml",
    host: "https://wirelessconnectstore.com",
  };
}
