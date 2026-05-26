"use client";

/**
 * LanguageSwitcher — client component.
 *
 * Renders a dropdown that switches between supported locales.
 * Uses next-intl's useRouter and usePathname to preserve the current path
 * while changing the locale prefix.
 *
 * RTL-safe: uses logical CSS properties (margin-inline-*).
 * Localization: labels come from localeConfig so each language displays its
 * native name (e.g. "Español" in Spanish, not "Spanish").
 */

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { localeConfig, type Locale, SUPPORTED_LOCALES } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  /** Extra classes for the trigger button. */
  className?: string;
  /** Whether to show only the globe icon (no label text). */
  iconOnly?: boolean;
}

export function LanguageSwitcher({ className, iconOnly = false }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function handleSelect(nextLocale: Locale) {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  }

  const currentConfig = localeConfig[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={iconOnly ? "icon" : "sm"}
          className={cn("min-h-touch min-w-touch gap-1.5", className)}
          aria-label={`Current language: ${currentConfig.nativeLabel}. Change language.`}
        >
          <GlobeIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!iconOnly && (
            <span className="hidden sm:inline">{currentConfig.nativeLabel}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((loc) => {
          const config = localeConfig[loc as Locale];
          return (
            <DropdownMenuItem
              key={loc}
              onSelect={() => handleSelect(loc as Locale)}
              className={cn(
                "cursor-pointer",
                loc === locale && "font-semibold text-primary",
              )}
            >
              {config.nativeLabel}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
