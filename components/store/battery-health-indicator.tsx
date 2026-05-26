/**
 * BatteryHealthIndicator — server component.
 *
 * Renders a colored battery health percentage with an icon.
 * Color thresholds per UX guidelines §12:
 *   ≥ 85% — Green  (excellent)
 *   70–84% — Yellow (good)
 *   < 70%  — Orange (fair — eligible for sale but buyer informed)
 *
 * Note: iOS reports battery health as a percentage; Android varies.
 * Null is valid — not all devices have a measurable battery health value.
 */

import { BatteryIcon, BatteryFullIcon, BatteryMediumIcon, BatteryLowIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatteryHealthIndicatorProps {
  /** Battery health percentage (0–100). Null if not available. */
  health: number | null;
  /** Whether to show the percentage label next to the icon. */
  showLabel?: boolean;
  className?: string;
}

function getBatteryStyle(health: number): {
  color: string;
  Icon: typeof BatteryFullIcon;
  label: string;
} {
  if (health >= 85) {
    return { color: "text-green-600", Icon: BatteryFullIcon, label: "Excellent" };
  }
  if (health >= 70) {
    return { color: "text-yellow-600", Icon: BatteryMediumIcon, label: "Good" };
  }
  return { color: "text-orange-600", Icon: BatteryLowIcon, label: "Fair" };
}

export function BatteryHealthIndicator({
  health,
  showLabel = true,
  className,
}: BatteryHealthIndicatorProps) {
  if (health === null) {
    return (
      <span className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
        <BatteryIcon className="h-4 w-4" aria-hidden="true" />
        {showLabel && <span>N/A</span>}
      </span>
    );
  }

  const { color, Icon, label } = getBatteryStyle(health);

  return (
    <span
      className={cn("flex items-center gap-1.5 text-sm font-medium", color, className)}
      title={`Battery health: ${health}% — ${label}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {showLabel && <span>{health}%</span>}
    </span>
  );
}
