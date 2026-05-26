-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 009: Warranty Claim Images
-- Database Schema Specification §6.18
--
-- Customers may upload images only for warranty records they own.
-- Staff/admin can view all. No public access.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.warranty_claim_images (
  id uuid primary key default gen_random_uuid(),
  warranty_id uuid not null references public.warranties(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index warranty_claim_images_warranty_id_idx on public.warranty_claim_images(warranty_id);
create index warranty_claim_images_created_at_idx on public.warranty_claim_images(created_at desc);
