"use client";

/**
 * LocaleHtmlAttributes — null-rendering client component.
 *
 * Sets the correct lang and dir attributes on the <html> element immediately
 * after hydration. This is needed because Next.js 15 requires the ROOT layout
 * to own the <html> and <body> tags (app/layout.tsx). The root layout uses
 * lang="en" as the safe SSR default; this component corrects it for other
 * locales (e.g., "es") on the client.
 *
 * suppressHydrationWarning on <html>/<body> in the root layout prevents React
 * from logging a mismatch when lang changes from "en" to "es" on hydration.
 *
 * Renders nothing — purely a side-effect component.
 */

import { useEffect } from "react";

interface LocaleHtmlAttributesProps {
  locale: string;
  dir: "ltr" | "rtl";
}

export function LocaleHtmlAttributes({ locale, dir }: LocaleHtmlAttributesProps) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = dir;
  }, [locale, dir]);

  return null;
}
