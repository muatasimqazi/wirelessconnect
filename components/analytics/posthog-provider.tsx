"use client";

/**
 * PostHog analytics — two null-rendering client components.
 *
 * PostHogInit    — initializes posthog once on mount. Renders nothing.
 * PostHogPageview — captures pageview on route changes. Renders nothing.
 *                   Must be wrapped in <Suspense> in the layout because it
 *                   uses useSearchParams (Next.js 15 requirement).
 *
 * We intentionally do NOT use PHProvider or wrap {children} with a context
 * provider — that pattern breaks Next.js App Router's html/body tree detection
 * when combined with Suspense. Direct posthog.capture() calls work fine without
 * the context provider since we have no client-side posthog hooks in the app.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

// ─── Initializer ──────────────────────────────────────────────────────────────

export function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
      capture_pageview: false, // Managed by PostHogPageview below
      capture_pageleave: true,
      autocapture: false,
      persistence: "localStorage",
      respect_dnt: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.opt_out_capturing();
        }
      },
    });
  }, []);

  return null;
}

// ─── Pageview tracker ─────────────────────────────────────────────────────────

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
