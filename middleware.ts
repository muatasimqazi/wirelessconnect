import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { routing } from "./i18n/routing";

/**
 * next-intl middleware for locale routing.
 *
 * Handles:
 * - Redirecting / → /en (default locale)
 * - Validating and normalizing /[locale]/... routes
 * - Setting locale cookies for persistence
 *
 * Admin routes (/admin/...) are excluded from locale middleware —
 * they are English-only and use their own auth guard.
 */
const intlMiddleware = createMiddleware(routing);

/**
 * Main middleware — combines Supabase session refresh with next-intl locale routing.
 *
 * Architecture note (from Technical Architecture Document §24):
 * - Middleware refreshes the Supabase auth session only.
 * - Admin authorization is NOT handled here — it is enforced server-side
 *   in app/admin/layout.tsx via requireStaff().
 * - Heavy logic should NOT live in middleware to keep it fast.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: skip locale middleware, only refresh Supabase session
  if (pathname.startsWith("/admin")) {
    return await refreshSupabaseSession(request);
  }

  // API routes: skip locale middleware, only refresh Supabase session
  if (pathname.startsWith("/api")) {
    return await refreshSupabaseSession(request);
  }

  // Storefront routes: apply locale middleware first, then refresh Supabase session
  const response = intlMiddleware(request);

  // Refresh Supabase session on the locale-processed response
  return await refreshSupabaseSession(request, response);
}

/**
 * Refreshes the Supabase auth session cookie.
 * This is required to keep the user signed in across Server Component renders.
 */
async function refreshSupabaseSession(
  request: NextRequest,
  response?: NextResponse
): Promise<NextResponse> {
  const res = response ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — this is the primary purpose of middleware
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.json
     * - Any static file extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
