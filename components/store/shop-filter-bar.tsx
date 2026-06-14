"use client";

/**
 * ShopFilterBar — horizontal filter chips above the product grid.
 *
 * Back Market-inspired: category pills + condition chips + "More Filters" button.
 * Replaces the desktop sidebar. Mobile still uses MobileFilterDrawer for full filters.
 */

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import type { Category } from "@/lib/data/categories";

interface CurrentFilters {
  brand?: string;
  storage?: string;
  carrier?: string;
  condition?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  pickup?: string;
  shipping?: string;
  q?: string;
}

interface ShopFilterBarProps {
  categories: Category[];
  currentFilters: CurrentFilters;
  activeFilterCount: number;
}

const CONDITIONS = [
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export function ShopFilterBar({
  categories,
  currentFilters,
  activeFilterCount,
}: ShopFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const chipBase = "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap";
  const chipActive = "border-primary bg-primary text-white";
  const chipInactive = "border-gray-200 bg-white text-foreground hover:border-gray-300 hover:bg-gray-50";

  return (
    <div className="space-y-2">
      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* All products chip */}
        <button
          onClick={() => clearAll()}
          className={cn(chipBase, !currentFilters.category && !currentFilters.condition ? chipActive : chipInactive)}
        >
          All
        </button>

        {/* Category chips */}
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() =>
              setFilter("category", currentFilters.category === cat.slug ? undefined : cat.slug)
            }
            className={cn(chipBase, currentFilters.category === cat.slug ? chipActive : chipInactive)}
          >
            {cat.name}
          </button>
        ))}

        {/* Divider */}
        <span className="mx-1 h-5 w-px shrink-0 bg-gray-200" aria-hidden="true" />

        {/* Condition chips */}
        {CONDITIONS.map((c) => (
          <button
            key={c.value}
            onClick={() =>
              setFilter("condition", currentFilters.condition === c.value ? undefined : c.value)
            }
            className={cn(chipBase, currentFilters.condition === c.value ? chipActive : chipInactive)}
          >
            {c.label}
          </button>
        ))}

      </div>

      {/* Active filter tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Active:</span>
          {currentFilters.brand && (
            <FilterTag label={`Brand: ${currentFilters.brand}`} onRemove={() => setFilter("brand", undefined)} />
          )}
          {currentFilters.storage && (
            <FilterTag label={currentFilters.storage} onRemove={() => setFilter("storage", undefined)} />
          )}
          {currentFilters.carrier && (
            <FilterTag label={currentFilters.carrier} onRemove={() => setFilter("carrier", undefined)} />
          )}
          {currentFilters.minPrice && (
            <FilterTag label={`From $${currentFilters.minPrice}`} onRemove={() => setFilter("min_price", undefined)} />
          )}
          {currentFilters.maxPrice && (
            <FilterTag label={`To $${currentFilters.maxPrice}`} onRemove={() => setFilter("max_price", undefined)} />
          )}
          {currentFilters.q && (
            <FilterTag label={`"${currentFilters.q}"`} onRemove={() => setFilter("q", undefined)} />
          )}
          <button
            onClick={clearAll}
            className="text-xs text-primary underline underline-offset-2 hover:no-underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      {label}
      <button onClick={onRemove} className="hover:opacity-70" aria-label={`Remove ${label} filter`}>
        <XIcon className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );
}
