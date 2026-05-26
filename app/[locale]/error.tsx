"use client";

/**
 * Locale-aware error boundary page.
 *
 * Catches unhandled errors in locale routes.
 * Requirements per UX Guidelines §20 and Build Execution Plan:
 *  - Full layout (no header/footer in this file — error.tsx renders outside layout)
 *  - NO stack traces or technical error details exposed to users
 *  - "Try again" button using the reset() function from Next.js
 *  - "Return home" link for when reset won't help
 *
 * Security note: error.message is intentionally NOT displayed.
 * Stack traces and Supabase errors must never reach the browser HTML.
 * Errors are logged server-side (observability stack, Sprint 6).
 *
 * This is a Client Component (required by Next.js error boundary spec).
 */

"use client";

import { useEffect } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error for observability (Sprint 6 will wire this to PostHog/Sentry)
    // Never expose error.stack or error.message to the user
    console.error("[error-boundary]", error.digest ?? "unknown", error.message);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      <AlertTriangleIcon
        className="h-14 w-14 text-warning"
        aria-hidden="true"
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Something went wrong
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          We&apos;re looking into it. Please try again or return to the
          homepage.
        </p>
        {/* Display digest for support lookup — safe (no stack details) */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => { window.location.href = "/"; }}>
          Return to Homepage
        </Button>
      </div>
    </div>
  );
}
