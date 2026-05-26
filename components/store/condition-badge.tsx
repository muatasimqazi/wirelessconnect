/**
 * ConditionBadge — server component.
 *
 * Renders a colored badge for each of the 5 device condition grades.
 * Colors are per UX guidelines §11 — must be consistent across all surfaces
 * (product cards, product detail, admin inventory).
 *
 * Grade scale (UX guidelines §11):
 *   like_new  — Blue    — No visible scratches or wear
 *   excellent — Green   — Light micro-scratches only
 *   good      — Yellow  — Minor scratches, fully functional
 *   fair      — Orange  — Visible wear, fully functional
 *   poor      — Red     — Heavy wear, may have issues
 */

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type ConditionGrade = Database["public"]["Enums"]["device_condition"];

const conditionStyles: Record<ConditionGrade, string> = {
  like_new:  "bg-blue-100 text-blue-800 border-blue-200",
  excellent: "bg-green-100 text-green-800 border-green-200",
  good:      "bg-yellow-100 text-yellow-800 border-yellow-200",
  fair:      "bg-orange-100 text-orange-800 border-orange-200",
};

interface ConditionBadgeProps {
  condition: ConditionGrade;
  className?: string;
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  const t = useTranslations("product.condition_grades");

  return (
    <Badge
      variant="outline"
      className={cn(conditionStyles[condition], "font-medium", className)}
    >
      {t(condition)}
    </Badge>
  );
}
