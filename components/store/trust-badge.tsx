/**
 * TrustBadge — server component.
 *
 * Renders individual trust indicators shown on product detail pages.
 * Each badge includes an icon, a translated label, and optional tooltip.
 *
 * Trust indicators are a key conversion driver — UX guidelines §16.
 * They surface the 15 publishing gates without exposing sensitive data.
 *
 * Usage:
 *   <TrustBadge type="cleanImei" />
 *   <TrustBadge type="tested" />
 */

import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  WifiIcon,
  TruckIcon,
  StoreIcon,
  RotateCcwIcon,
  ZapIcon,
  WrenchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TrustBadgeType =
  | "cleanImei"
  | "tested"
  | "warrantyIncluded"
  | "pickupAvailable"
  | "shipsNationwide"
  | "factoryReset"
  | "activationReady"
  | "professionallyTested";

const badgeIcons: Record<TrustBadgeType, React.ElementType> = {
  cleanImei:           ShieldCheckIcon,
  tested:              WrenchIcon,
  warrantyIncluded:    CheckCircleIcon,
  pickupAvailable:     StoreIcon,
  shipsNationwide:     TruckIcon,
  factoryReset:        RotateCcwIcon,
  activationReady:     ZapIcon,
  professionallyTested: WifiIcon,
};

interface TrustBadgeProps {
  type: TrustBadgeType;
  className?: string;
  /** Whether to show as a compact icon-only badge (no label). */
  compact?: boolean;
}

export function TrustBadge({ type, className, compact = false }: TrustBadgeProps) {
  const t = useTranslations("product.trustIndicators");
  const Icon = badgeIcons[type];
  const label = t(type);

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700",
        compact && "gap-0 px-1.5",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {!compact && <span>{label}</span>}
    </span>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span aria-label={label}>{content}</span>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
