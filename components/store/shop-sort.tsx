"use client";

/**
 * ShopSort — client component.
 *
 * Sort dropdown for the shop page. Updates the `sort` searchParam in the URL
 * via router.push, preserving all existing filters.
 */

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductSortOption } from "@/lib/data/products";

interface ShopSortProps {
  currentSort: ProductSortOption;
}

const SORT_OPTIONS: { value: ProductSortOption; labelKey: string }[] = [
  { value: "featured",       labelKey: "featured" },
  { value: "newest",         labelKey: "newest" },
  { value: "price_asc",      labelKey: "priceLow" },
  { value: "price_desc",     labelKey: "priceHigh" },
  { value: "best_condition", labelKey: "bestCondition" },
];

export function ShopSort({ currentSort }: ShopSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("shop.sort");

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page"); // reset to page 1 on sort change
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">{t("label")}:</span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-transparent text-sm font-medium shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {SORT_OPTIONS.map(({ value, labelKey }) => (
            <SelectItem key={value} value={value}>
              {t(labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
