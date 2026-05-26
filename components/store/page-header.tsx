/**
 * PageHeader — server component.
 *
 * Consistent page title + description used across storefront and admin pages.
 * Renders as <header> landmark with h1 for SEO.
 *
 * The admin layout has its own page header variant for dashboard pages.
 */

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional content rendered inline with the title (e.g., action buttons). */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4", className)}>
      <div className="flex-1">
        <h1 className="text-h2-mobile font-bold text-foreground md:text-h2-desktop">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
