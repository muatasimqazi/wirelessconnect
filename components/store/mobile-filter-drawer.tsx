"use client";

/**
 * MobileFilterDrawer — Sheet-based filter panel for screens < lg.
 *
 * Opens via a "Filters" button in the shop toolbar.
 * The ShopFilters component is rendered inside the sheet so all filter
 * logic remains unchanged — only the container changes.
 *
 * Accessibility: focus is trapped inside the sheet when open (Radix Sheet).
 */

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShopFilters } from "@/components/store/shop-filters";
import type { Category } from "@/lib/data/categories";

interface MobileFilterDrawerProps {
  brands: string[];
  storageSizes: string[];
  categories: Category[];
  currentFilters: {
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
  };
  /** Active filter count for badge display */
  activeFilterCount: number;
}

export function MobileFilterDrawer({
  brands,
  storageSizes,
  categories,
  currentFilters,
  activeFilterCount,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative min-h-[44px] gap-2 lg:hidden"
          aria-label={activeFilterCount > 0 ? `Filters — ${activeFilterCount} active` : "Filters"}
        >
          <SlidersHorizontalIcon className="h-4 w-4" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              aria-hidden="true"
            >
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 overflow-y-auto p-0">
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-4">
          <ShopFilters
            brands={brands}
            storageSizes={storageSizes}
            categories={categories}
            currentFilters={currentFilters}
            onFilterChange={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
