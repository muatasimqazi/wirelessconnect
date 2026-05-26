import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Root layout — provides the required <html> and <body> tags.
 *
 * Next.js 15 requires the root layout to render <html> and <body>.
 * The locale-aware lang/dir attributes are applied client-side by
 * LocaleHtmlAttributes in app/[locale]/layout.tsx, which fires immediately
 * after hydration and before any paint on subsequent navigations.
 *
 * suppressHydrationWarning on <html> and <body> is required to prevent
 * React from complaining about attribute mismatches between the server
 * (which renders lang="en" as the safe default) and the client (which
 * sets the correct locale via LocaleHtmlAttributes).
 *
 * The Inter font is initialized here so the CSS variable is present on
 * the server-rendered <html> tag from the first request.
 */

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Wireless Connect",
    template: "%s | Wireless Connect",
  },
  description:
    "Certified pre-owned phones professionally tested with 30-day warranty. Local pickup in Shoreline, WA or ships anywhere in the U.S.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
