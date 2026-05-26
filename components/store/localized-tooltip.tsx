/**
 * LocalizedTooltip — client component.
 *
 * A thin wrapper around shadcn/ui Tooltip that accepts a translation key
 * and renders the translated string as the tooltip content.
 *
 * Used for trust indicators, helper text on product attributes (IMEI, battery
 * health, network compatibility), and any other UI where short contextual help
 * is needed.
 *
 * RTL-safe: uses CSS logical properties in TooltipContent.
 */

"use client";

import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TooltipContentProps } from "@radix-ui/react-tooltip";

type TranslationNamespace = "product.helpers" | "product.trustIndicators";

interface LocalizedTooltipProps {
  /** The child element that triggers the tooltip (must accept ref). */
  children: React.ReactElement;
  /** next-intl translation namespace. */
  namespace: TranslationNamespace;
  /** Translation key within the namespace. */
  messageKey: string;
  /** Tooltip position. */
  side?: TooltipContentProps["side"];
  /** Tooltip alignment. */
  align?: TooltipContentProps["align"];
}

export function LocalizedTooltip({
  children,
  namespace,
  messageKey,
  side = "top",
  align = "center",
}: LocalizedTooltipProps) {
  // Namespace must be a static string for next-intl
  // We use separate hooks based on namespace
  const tHelpers = useTranslations("product.helpers");
  const tTrust = useTranslations("product.trustIndicators");

  const message =
    namespace === "product.helpers"
      ? tHelpers(messageKey as Parameters<typeof tHelpers>[0])
      : tTrust(messageKey as Parameters<typeof tTrust>[0]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-[200px] text-center text-xs">
          {message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
