"use client";

/**
 * ShopPagination — client component.
 *
 * Renders prev / page numbers / next controls for the shop catalog.
 * Updates the `page` searchParam while preserving all filter params.
 */

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopPaginationProps {
  page: number;
  totalPages: number;
  className?: string;
}

export function ShopPagination({ page, totalPages, className }: ShopPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (target === 1) {
      params.delete("page");
    } else {
      params.set("page", String(target));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // Show at most 5 page numbers around the current page
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {/* Previous */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => goToPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="min-h-touch min-w-touch"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
      </Button>

      {/* Page numbers */}
      {pageNumbers.map((num, idx) =>
        num === "…" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Button
            key={num}
            variant={num === page ? "default" : "ghost"}
            size="sm"
            onClick={() => goToPage(num as number)}
            aria-label={`Page ${num}`}
            aria-current={num === page ? "page" : undefined}
            className="min-h-touch min-w-[2.5rem]"
          >
            {num}
          </Button>
        ),
      )}

      {/* Next */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => goToPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="min-h-touch min-w-touch"
      >
        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}
