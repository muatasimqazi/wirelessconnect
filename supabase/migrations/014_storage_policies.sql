-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 014: Supabase Storage Bucket Policies
-- Database Schema Specification §9
--
-- Buckets must be created via Supabase Dashboard or CLI before running these policies.
-- This migration documents the required policies — run after bucket creation.
--
-- Required buckets:
--   product-images          (public read, staff/admin write)
--   device-intake-images    (private, staff/admin only)
--   warranty-claim-images   (private, customer own + staff/admin)
--
-- Future buckets (post-MVP):
--   trade-in-images
--   repair-images
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── product-images bucket policies ──────────────────────────────────────────
-- Public read: anyone can view product photos
-- Write: staff/admin only (via signed upload or server-side action)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,     -- Public bucket: product photos are public
  10485760, -- 10MB limit per file
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Public read policy for product images
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Staff/admin write policy for product images
create policy "product_images_staff_write"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images' AND
    public.is_admin_or_staff()
  );

create policy "product_images_staff_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images' AND
    public.is_admin_or_staff()
  );

create policy "product_images_staff_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images' AND
    public.is_admin_or_staff()
  );

-- ─── device-intake-images bucket policies ─────────────────────────────────────
-- Private bucket: staff/admin only.
-- Internal-only images must NEVER be exposed publicly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'device-intake-images',
  'device-intake-images',
  false,    -- Private bucket: intake photos are staff/admin only
  10485760, -- 10MB limit per file
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "device_intake_images_staff_all"
  on storage.objects for all
  using (
    bucket_id = 'device-intake-images' AND
    public.is_admin_or_staff()
  )
  with check (
    bucket_id = 'device-intake-images' AND
    public.is_admin_or_staff()
  );

-- ─── warranty-claim-images bucket policies ────────────────────────────────────
-- Private bucket: customers can manage their own, staff/admin can manage all.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'warranty-claim-images',
  'warranty-claim-images',
  false,    -- Private bucket
  10485760, -- 10MB limit per file
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Customers upload images for their own warranty claims
create policy "warranty_claim_images_customer_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'warranty-claim-images' AND
    auth.uid() is not null
  );

-- Customers can read their own warranty claim images
-- (ownership validated at application layer via warranty_claim_images table)
create policy "warranty_claim_images_customer_select"
  on storage.objects for select
  using (
    bucket_id = 'warranty-claim-images' AND
    auth.uid() is not null
  );

-- Staff/admin have full access
create policy "warranty_claim_images_staff_all"
  on storage.objects for all
  using (
    bucket_id = 'warranty-claim-images' AND
    public.is_admin_or_staff()
  )
  with check (
    bucket_id = 'warranty-claim-images' AND
    public.is_admin_or_staff()
  );
