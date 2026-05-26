import type { Metadata } from "next";
import "./globals.css";

/**
 * Root layout — minimal wrapper.
 *
 * The locale-aware layout lives at app/[locale]/layout.tsx.
 * This root layout exists only to satisfy Next.js App Router requirements.
 * It intentionally has no <html> or <body> — those are in the locale layout
 * where we can set the correct lang and dir attributes.
 */
export const metadata: Metadata = {
  title: {
    default: "Wireless Connect",
    template: "%s | Wireless Connect",
  },
  description:
    "Certified pre-owned phones professionally tested with 30-day warranty. Local pickup in Shoreline, WA or ships anywhere in the U.S.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
