"use client";

/**
 * PostHogProvider — wraps the app with PostHog analytics.
 *
 * Initializes PostHog on the client side with:
 *  - Autocapture disabled (explicit events only)
 *  - Pageview capture on route changes via `usePathname`
 *  - Respects Do Not Track header
 *
 * Only initializes when NEXT_PUBLIC_POSTHOG_KEY is set.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com";

  useEffect(() => {
    if (!key) return;

    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // Managed manually below
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
  }, [key, host]);

  if (!key) return <>{children}</>;

  return <PHProvider client={posthog}>{children}<PostHogPageview /></PHProvider>;
}

// ─── Pageview tracker ─────────────────────────────────────────────────────────

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    const url =
      searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
