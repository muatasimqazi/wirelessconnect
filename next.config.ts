import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// HTTP security headers — required per Technical Architecture Document §31
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdn.vercel-insights.com https://us.posthog.com https://us-assets.i.posthog.com",
      "frame-src https://js.stripe.com",
      "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://us.posthog.com https://us-assets.i.posthog.com https://us.i.posthog.com",
      "img-src 'self' data: blob: https://*.supabase.co https://picsum.photos https://fastly.picsum.photos https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        // Supabase Storage — product and intake images
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // picsum.photos — seed/dev placeholder images (returns JPEG, optimizer-safe)
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },

  // Experimental features for Next.js 15
  experimental: {
    // Server Actions are stable in Next.js 15 — no flag needed
  },
};

export default withNextIntl(nextConfig);
