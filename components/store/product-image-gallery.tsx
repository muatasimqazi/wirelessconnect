"use client";

/**
 * ProductImageGallery — client component.
 *
 * Displays product images with thumbnail strip on desktop.
 * Falls back to a branded placeholder when no images are available.
 *
 * Images come from product_images table (public bucket).
 * All images are from the `product-images` Supabase storage bucket (public read).
 */

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  title: string;
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-muted to-accent">
        <span className="text-7xl opacity-30" aria-hidden="true">📱</span>
        <span className="sr-only">{title} — no image available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <Image
          src={selected.image_url}
          alt={selected.alt_text ?? title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Thumbnail strip — only shown when multiple images */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="listbox"
          aria-label="Product images"
        >
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                idx === selectedIndex
                  ? "border-primary"
                  : "border-border hover:border-primary/50",
              )}
              role="option"
              aria-selected={idx === selectedIndex}
              aria-label={img.alt_text ?? `Image ${idx + 1}`}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text ?? `${title} — image ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
