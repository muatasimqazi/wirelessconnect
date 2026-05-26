/**
 * Type-safe navigation helpers for next-intl.
 *
 * Use these instead of next/navigation for locale-aware routing:
 *   import { Link, useRouter, usePathname, redirect } from "@/i18n/navigation"
 *
 * This wraps next-intl's createNavigation so all route changes preserve
 * the current locale prefix (/en or /es).
 */

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
