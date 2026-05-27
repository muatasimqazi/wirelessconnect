"use client";

/**
 * ProductForm — shared client component for create and edit.
 *
 * Used by:
 *  - /admin/products/new  (no initial values, no images)
 *  - /admin/products/[id] (prefilled with existing product + images)
 *
 * Features:
 *  - All product fields organized in sections
 *  - Zod validation via react-hook-form
 *  - Image upload (signed URL → Supabase Storage) with primary selection
 *  - Status management (draft / active / archived / sold_out)
 *  - Network compatibility + supported bands (checkbox lists)
 */

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProductInput, StorageImage } from "@/features/admin/products/actions";
import {
  createProduct,
  updateProduct,
  addProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  getProductImageUploadUrl,
  listStorageImages,
} from "@/features/admin/products/actions";

// ─── Validation schema (mirrors server schema) ────────────────────────────────

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  storage: z.string().optional(),
  color: z.string().optional(),
  carrier: z.string().optional(),
  condition: z.string().optional(),
  battery_health: z.coerce.number().min(0).max(100).optional().nullable(),
  battery_cycle_count: z.coerce.number().min(0).optional().nullable(),
  price: z.coerce.number().min(0),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  quantity: z.coerce.number().min(0).int(),
  sku: z.string().optional(),
  warranty_days: z.coerce.number().min(0).int(),
  status: z.enum(["draft", "active", "archived", "sold_out"]),
  featured: z.boolean().default(false),
  allow_pickup: z.boolean().default(true),
  allow_shipping: z.boolean().default(true),
  is_clean_imei: z.boolean().default(false),
  is_tested: z.boolean().default(false),
  is_data_wiped: z.boolean().default(false),
  imei: z.string().optional(),
  serial_number: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  category_type: z.string().default("phone"),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  includes_charger: z.boolean().default(false),
  includes_cable: z.boolean().default(true),
  network_compatibility: z.array(z.string()).default([]),
  supported_bands: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const NETWORK_OPTIONS = ["GSM", "CDMA", "LTE", "5G", "Wi-Fi", "Bluetooth"];
const BAND_OPTIONS = ["B2", "B4", "B5", "B12", "B13", "B17", "B25", "B26", "B41", "n41", "n71", "n260", "n261"];
const CARRIER_OPTIONS = ["unlocked", "att", "verizon", "tmobile", "sprint", "other", "unknown"];
const CONDITION_OPTIONS = ["like_new", "excellent", "good", "fair"];
const CATEGORY_TYPES = ["phone", "tablet", "laptop", "accessory", "other"];

export interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

interface ProductFormProps {
  productId?: string;
  defaultValues?: Partial<ProductInput>;
  images?: ProductImage[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${className ?? ""}`}
      {...props}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      {...props}
    />
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
}) {
  return (
    <select
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      {...props}
    >
      {children}
    </select>
  );
}

function CheckboxField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 rounded border-input" {...props} />
      {label}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

// ─── Storage Image Picker ─────────────────────────────────────────────────────

function StorageImagePicker({
  productId,
  existingCount,
  onPick,
}: {
  productId: string;
  existingCount: number;
  onPick: (img: StorageImage) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<StorageImage[]>([]);
  const [filtered, setFiltered] = useState<StorageImage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (images.length > 0) return; // already loaded
    setLoading(true);
    const result = await listStorageImages("phones");
    setImages(result.images);
    setFiltered(result.images);
    setLoading(false);
  }, [images.length]);

  // Load when dialog opens
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Filter on search
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? images.filter((i) => i.name.toLowerCase().includes(q)) : images);
  }, [search, images]);

  async function handlePick(img: StorageImage) {
    setPicking(img.url);
    await onPick(img);
    setPicking(null);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          📂 Pick from library
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Phone Image Library</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <input
          type="search"
          placeholder="Search images…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Grid */}
        <div className="mt-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading images…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No images found.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {filtered.map((img) => (
                <button
                  key={img.url}
                  type="button"
                  disabled={picking !== null}
                  onClick={() => handlePick(img)}
                  className="group relative overflow-hidden rounded-lg border-2 border-transparent bg-muted/30 transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="aspect-square w-full object-contain p-1"
                    loading="lazy"
                  />
                  <div className="bg-background/90 px-1.5 py-1 text-center text-[10px] leading-tight text-muted-foreground">
                    {img.name.replace(".jpg", "").replace(/-/g, " ")}
                  </div>
                  {picking === img.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-xs text-white">Adding…</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Image Manager ────────────────────────────────────────────────────────────

function ImageManager({
  productId,
  images,
  onImagesChange,
}: {
  productId: string;
  images: ProductImage[];
  onImagesChange: (imgs: ProductImage[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePickFromStorage(img: StorageImage) {
    const isPrimary = images.length === 0;
    const result = await addProductImage(productId, img.url, img.name.replace(/\.\w+$/, "").replace(/-/g, " "), isPrimary);
    if (!result.error) {
      onImagesChange([
        ...images,
        {
          id: crypto.randomUUID(),
          image_url: img.url,
          alt_text: img.name.replace(/\.\w+$/, "").replace(/-/g, " "),
          is_primary: isPrimary,
          sort_order: images.length,
        },
      ]);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const { url, path, error } = await getProductImageUploadUrl(productId, file.name);
    if (error || !url || !path) {
      setUploadError(error ?? "Upload failed");
      setUploading(false);
      return;
    }

    // PUT directly to Supabase Storage
    const res = await fetch(url, {
      method: "PUT",
      headers: { "content-type": file.type },
      body: file,
    });
    if (!res.ok) {
      setUploadError("Upload to storage failed");
      setUploading(false);
      return;
    }

    // Get public URL (construct from path)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;

    const isPrimary = images.length === 0;
    const result = await addProductImage(productId, publicUrl, undefined, isPrimary);
    if (result.error) {
      setUploadError(result.error);
    } else {
      // Optimistically add image
      onImagesChange([
        ...images,
        {
          id: crypto.randomUUID(),
          image_url: publicUrl,
          alt_text: null,
          is_primary: isPrimary,
          sort_order: images.length,
        },
      ]);
    }

    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(imageId: string) {
    const res = await deleteProductImage(imageId, productId);
    if (!res.error) {
      onImagesChange(images.filter((i) => i.id !== imageId));
    }
  }

  async function handleSetPrimary(imageId: string) {
    const res = await setPrimaryProductImage(imageId, productId);
    if (!res.error) {
      onImagesChange(images.map((i) => ({ ...i, is_primary: i.id === imageId })));
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar: pick from library + upload */}
      <div className="flex items-center gap-2">
        <StorageImagePicker
          productId={productId}
          existingCount={images.length}
          onPick={handlePickFromStorage}
        />
        <span className="text-xs text-muted-foreground">or upload a custom photo below</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border w-28 h-28 bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.image_url}
              alt={img.alt_text ?? "Product image"}
              className="w-full h-full object-contain p-1"
            />
            {img.is_primary && (
              <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Primary
              </span>
            )}
            <div className="absolute inset-0 hidden group-hover:flex flex-col gap-1 items-center justify-center bg-black/50 p-1">
              {!img.is_primary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(img.id)}
                  className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-900"
                >
                  Set Primary
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="rounded bg-destructive px-2 py-0.5 text-[10px] font-medium text-destructive-foreground"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Upload button */}
        <label className="flex w-28 h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60">
          {uploading ? (
            <span className="text-xs">Uploading…</span>
          ) : (
            <>
              <span className="text-2xl">+</span>
              <span className="text-xs">Upload photo</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ProductForm({ productId, defaultValues, images: initialImages = [] }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImage[]>(initialImages);

  const isEdit = !!productId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "draft",
      quantity: 1,
      warranty_days: 30,
      category_type: "phone",
      allow_pickup: true,
      allow_shipping: true,
      includes_cable: true,
      is_clean_imei: false,
      is_tested: false,
      is_data_wiped: false,
      featured: false,
      includes_charger: false,
      network_compatibility: [],
      supported_bands: [],
      ...defaultValues,
    },
  });

  const networkCompat = watch("network_compatibility") ?? [];
  const supportedBands = watch("supported_bands") ?? [];

  function toggleArray(field: "network_compatibility" | "supported_bands", value: string) {
    const current = field === "network_compatibility" ? networkCompat : supportedBands;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, next);
  }

  function onSubmit(data: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const input = data as ProductInput;
      const result = isEdit
        ? await updateProduct(productId, input)
        : await createProduct(input);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      router.push(isEdit ? `/admin/products/${productId}` : `/admin/products/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* ── Basic Info ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Basic Information</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title *" error={errors.title?.message}>
              <Input {...register("title")} placeholder="iPhone 14 Pro 256GB" />
            </Field>
          </div>
          <Field label="Brand" error={errors.brand?.message}>
            <Input {...register("brand")} placeholder="Apple" />
          </Field>
          <Field label="Model" error={errors.model?.message}>
            <Input {...register("model")} placeholder="iPhone 14 Pro" />
          </Field>
          <Field label="Storage">
            <Input {...register("storage")} placeholder="256GB" />
          </Field>
          <Field label="Color">
            <Input {...register("color")} placeholder="Space Black" />
          </Field>
          <Field label="Carrier">
            <Select {...register("carrier")}>
              <option value="">— Select carrier —</option>
              {CARRIER_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Condition">
            <Select {...register("condition")}>
              <option value="">— Select condition —</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Subtitle / Tagline">
              <Input {...register("subtitle")} placeholder="Optional short description for listings" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea {...register("description")} rows={4} placeholder="Detailed product description…" />
            </Field>
          </div>
        </div>
      </section>

      {/* ── Pricing & Inventory ─────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Pricing &amp; Inventory</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (cents) *" error={errors.price?.message} hint="e.g. 29900 = $299.00">
            <Input type="number" min="0" {...register("price")} />
          </Field>
          <Field label="Compare-at Price (cents)" hint="Original / crossed-out price">
            <Input type="number" min="0" {...register("compare_at_price")} />
          </Field>
          <Field label="Quantity *" error={errors.quantity?.message}>
            <Input type="number" min="0" {...register("quantity")} />
          </Field>
          <Field label="SKU">
            <Input {...register("sku")} placeholder="WC-001" />
          </Field>
          <Field label="Warranty Days *" error={errors.warranty_days?.message}>
            <Input type="number" min="0" {...register("warranty_days")} />
          </Field>
          <Field label="Status *" error={errors.status?.message}>
            <Select {...register("status")}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="sold_out">Sold Out</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
        </div>
      </section>

      {/* ── Device Details ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Device Details</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="IMEI" hint="Stored admin-only, never shown to customers">
            <Input {...register("imei")} placeholder="352999……" />
          </Field>
          <Field label="Serial Number">
            <Input {...register("serial_number")} />
          </Field>
          <Field label="Battery Health (%)" error={errors.battery_health?.message}>
            <Input type="number" min="0" max="100" {...register("battery_health")} />
          </Field>
          <Field label="Battery Cycle Count">
            <Input type="number" min="0" {...register("battery_cycle_count")} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <CheckboxField label="Clean IMEI verified" {...register("is_clean_imei")} />
          <CheckboxField label="Tested &amp; Passed" {...register("is_tested")} />
          <CheckboxField label="Data Wiped" {...register("is_data_wiped")} />
        </div>
      </section>

      {/* ── Accessories ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Accessories &amp; In The Box</SectionTitle>
        <div className="flex flex-wrap gap-4">
          <CheckboxField label="Includes Charger" {...register("includes_charger")} />
          <CheckboxField label="Includes Cable" {...register("includes_cable")} />
        </div>
      </section>

      {/* ── Fulfillment ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Fulfillment Options</SectionTitle>
        <div className="flex flex-wrap gap-4">
          <CheckboxField label="Allow Pickup" {...register("allow_pickup")} />
          <CheckboxField label="Allow Shipping" {...register("allow_shipping")} />
          <CheckboxField label="Featured Product" {...register("featured")} />
        </div>
      </section>

      {/* ── Category ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Category</SectionTitle>
        <Field label="Category Type">
          <Select {...register("category_type")}>
            {CATEGORY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      {/* ── Network Compatibility ─────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>Network &amp; Bands</SectionTitle>
        <Field label="Network Compatibility">
          <div className="flex flex-wrap gap-3">
            {NETWORK_OPTIONS.map((n) => (
              <CheckboxField
                key={n}
                label={n}
                checked={networkCompat.includes(n)}
                onChange={() => toggleArray("network_compatibility", n)}
              />
            ))}
          </div>
        </Field>
        <Field label="Supported Bands">
          <div className="flex flex-wrap gap-3">
            {BAND_OPTIONS.map((b) => (
              <CheckboxField
                key={b}
                label={b}
                checked={supportedBands.includes(b)}
                onChange={() => toggleArray("supported_bands", b)}
              />
            ))}
          </div>
        </Field>
      </section>

      {/* ── SEO ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>SEO (optional)</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO Title">
            <Input {...register("seo_title")} placeholder="Override page title…" />
          </Field>
          <Field label="SEO Description">
            <Input {...register("seo_description")} placeholder="Override meta description…" />
          </Field>
        </div>
      </section>

      {/* ── Images (edit only) ───────────────────────────────────────── */}
      {isEdit && (
        <section className="space-y-4">
          <SectionTitle>Product Images</SectionTitle>
          <ImageManager
            productId={productId}
            images={images}
            onImagesChange={setImages}
          />
        </section>
      )}

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
