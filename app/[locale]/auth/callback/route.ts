/**
 * Auth callback route.
 *
 * Handles:
 *  1. Email confirmation link (sign-up)
 *  2. Magic link sign-in
 *  3. Password reset confirmation
 *
 * Supabase sends the user to this URL with a `code` query parameter.
 * We exchange the code for a session using exchangeCodeForSession(), which
 * sets the auth cookies so subsequent requests are authenticated.
 *
 * After exchange:
 *  - On success → redirect to `next` param (or /)
 *  - On error   → redirect to /sign-in?error=<code>
 *
 * Route: /[locale]/auth/callback
 * This route is intentionally OUTSIDE the (storefront) route group so it
 * doesn't render the Header + Footer during the exchange redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? `/${locale}`;
  const errorCode = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle error from Supabase (e.g. expired link)
  if (errorCode) {
    console.error(`[auth/callback] Auth error: ${errorCode} — ${errorDescription}`);
    return NextResponse.redirect(
      `${origin}/${locale}/sign-in?error=${encodeURIComponent(errorCode)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Code exchange failed:", error.message);
      return NextResponse.redirect(
        `${origin}/${locale}/sign-in?error=code_exchange_failed`,
      );
    }

    // Successful exchange — redirect to intended destination
    // If `next` is an external URL, redirect to homepage for safety
    if (next.startsWith("/")) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code and no error — redirect to sign-in
  return NextResponse.redirect(`${origin}/${locale}/sign-in`);
}
