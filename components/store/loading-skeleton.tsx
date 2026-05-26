/**
 * Loading skeleton components — server components.
 *
 * Used as Suspense fallbacks and loading.tsx content.
 * Matches the visual shape of their real counterparts to reduce layout shift.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Product card skeleton ────────────────────────────────────────────────────

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-xl border border-border", className)}
      aria-hidden="true"
    >
      {/* Image */}
      <Skeleton className="aspect-square w-full" />
      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-1 h-6 w-20" />
      </div>
      {/* CTA */}
      <div className="p-3 pt-0">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

// ─── Product grid skeleton ─────────────────────────────────────────────────────

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

export function ProductGridSkeleton({ count = 8, className }: ProductGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
      aria-label="Loading products…"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Page header skeleton ─────────────────────────────────────────────────────

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

// ─── Generic list skeleton ────────────────────────────────────────────────────

interface ListSkeletonProps {
  rows?: number;
  className?: string;
}

export function ListSkeleton({ rows = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
