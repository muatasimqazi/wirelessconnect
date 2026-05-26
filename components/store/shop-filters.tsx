"use client";

/**
 * ShopFilters — client component.
 *
 * Filter sidebar for the shop catalog page. All filters update the URL via
 * router.push (searchParams) so they are shareable, bookmarkable, and
 * server-rendered on load.
 *
 * Filters:
 *  - Search (text)
 *  - Category
 *  - Brand
 *  - Condition
 *  - Storage size
 *  - Carrier
 *  - Price range (min / max, in dollars — converted to cents when querying)
 *  - Fulfillment (Pickup / Shipping)
 */

import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ShopFiltersProps {
  brands: string[];
  storageSizes: string[];
  categories: Category[];
  currentFilters: CurrentFilters;
  className?: string;
  /** Called after any filter is applied — used by MobileFilterDrawer to close the sheet */
  onFilterChange?: () => void;
}

const CONDITIONS = ["like_new", "excellent", "good", "fair"] as const;
const CARRIERS = ["unlocked", "att", "verizon", "tmobile"] as const;
const CARRIER_LABELS: Record<string, string> = {
  unlocked: "Unlocked",
  att: "AT&T",
  verizon: "Verizon",
  tmobile: "T-Mobile",
};

export function ShopFilters({
  brands,
  storageSizes,
  categories,
  currentFilters,
  className,
  onFilterChange,
}: ShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("shop");
  const tProduct = useTranslations("product.condition_grades");

  const hasAnyFilter = Object.values(currentFilters).some(Boolean);

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams();

      // Preserve all current filters
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (v && k !== key && k !== "page") params.set(k, v);
      });

      // Apply new value
      if (value) params.set(key, value);

      // Reset to page 1 on any filter change
      router.push(`${pathname}?${params.toString()}`);
      onFilterChange?.();
    },
    [currentFilters, router, pathname, onFilterChange],
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
    onFilterChange?.();
  }, [router, pathname, onFilterChange]);

  return (
    <div className={cn("space-y-5 text-sm", className)}>
      {/* Clear filters */}
      {hasAnyFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="flex w-full items-center justify-between text-xs text-muted-foreground"
        >
          {t("clearFilters")}
          <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      )}

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="shop-search" className="font-semibold uppercase tracking-wider text-xs text-muted-foreground">
          {t("search")}
        </Label>
        <Input
          id="shop-search"
          type="search"
          placeholder={t("search")}
          defaultValue={currentFilters.q ?? ""}
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilter("q", (e.target as HTMLInputElement).value || undefined);
            }
          }}
          onBlur={(e) => updateFilter("q", e.target.value || undefined)}
        />
      </div>

      <Separator />

      {/* Category */}
      {categories.length > 0 && (
        <FilterSection label={t("filters_by.brand")}>
          <FilterPills
            options={categories.map((c) => ({ value: c.slug, label: c.name }))}
            selected={currentFilters.category}
            onSelect={(v) => updateFilter("category", v)}
          />
        </FilterSection>
      )}

      {/* Brand */}
      {brands.length > 0 && (
        <FilterSection label={t("filters_by.brand")}>
          <FilterPills
            options={brands.map((b) => ({ value: b, label: b }))}
            selected={currentFilters.brand}
            onSelect={(v) => updateFilter("brand", v)}
          />
        </FilterSection>
      )}

      <Separator />

      {/* Condition */}
      <FilterSection label={t("filters_by.condition")}>
        <FilterPills
          options={CONDITIONS.map((c) => ({ value: c, label: tProduct(c) }))}
          selected={currentFilters.condition}
          onSelect={(v) => updateFilter("condition", v)}
        />
      </FilterSection>

      <Separator />

      {/* Storage */}
      {storageSizes.length > 0 && (
        <FilterSection label={t("filters_by.storage")}>
          <FilterPills
            options={storageSizes.map((s) => ({ value: s, label: s }))}
            selected={currentFilters.storage}
            onSelect={(v) => updateFilter("storage", v)}
          />
        </FilterSection>
      )}

      <Separator />

      {/* Carrier */}
      <FilterSection label={t("filters_by.carrier")}>
        <FilterPills
          options={CARRIERS.map((c) => ({ value: c, label: CARRIER_LABELS[c] }))}
          selected={currentFilters.carrier}
          onSelect={(v) => updateFilter("carrier", v)}
        />
      </FilterSection>

      <Separator />

      {/* Price range */}
      <FilterSection label={t("filters_by.price")}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min $"
            min={0}
            defaultValue={currentFilters.minPrice ?? ""}
            className="h-8 w-full text-sm"
            onBlur={(e) => updateFilter("min_price", e.target.value || undefined)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max $"
            min={0}
            defaultValue={currentFilters.maxPrice ?? ""}
            className="h-8 w-full text-sm"
            onBlur={(e) => updateFilter("max_price", e.target.value || undefined)}
          />
        </div>
      </FilterSection>

      <Separator />

      {/* Fulfillment */}
      <FilterSection label={t("filters_by.fulfillment")}>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={currentFilters.pickup === "true"}
              onCheckedChange={(checked) =>
                updateFilter("pickup", checked ? "true" : undefined)
              }
            />
            <span>Local Pickup</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={currentFilters.shipping === "true"}
              onCheckedChange={(checked) =>
                updateFilter("shipping", checked ? "true" : undefined)
              }
            />
            <span>Ships Nationwide</span>
          </label>
        </div>
      </FilterSection>
    </div>
  );
}

// ─── FilterSection ────────────────────────────────────────────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── FilterPills ──────────────────────────────────────────────────────────────

function FilterPills({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected?: string;
  onSelect: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(({ value, label }) => {
        const isActive = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(isActive ? undefined : value)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              isActive
                ? "border-primary bg-primary text-white"
                : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent",
            )}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
