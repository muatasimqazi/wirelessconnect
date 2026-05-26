-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005: Warranty Tables
-- Database Schema Specification §6.14
--
-- Warranty records are created after successful payment.
-- Warranty duration MUST be copied from order_items.warranty_days (immutable
-- snapshot), NOT from the current product record.
--
-- Customers may see safe fields only: claim_status, expires_at, active.
-- Staff/admin can see device_serial_number and device_imei for support.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.warranties (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,

  customer_email text not null,
  customer_name text,
  customer_phone text,
  customer_locale text not null default 'en',  -- NO CHECK constraint; app-layer validated

  product_title text not null,
  device_brand text,
  device_model text,
  -- Admin-only fields (staff/warranty support use only)
  device_serial_number text,
  device_imei text,

  warranty_days integer not null default 30 check (warranty_days >= 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  active boolean not null default true,

  -- Claim lifecycle
  claim_status warranty_claim_status not null default 'none',
  claim_submitted_at timestamptz,
  claim_description text,    -- Customer's description of the issue
  claim_notes text,          -- Staff notes (admin-only)
  claim_resolved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index warranties_order_id_idx on public.warranties(order_id);
create index warranties_order_item_id_idx on public.warranties(order_item_id);
create index warranties_user_id_idx on public.warranties(user_id);
create index warranties_customer_email_idx on public.warranties(customer_email);
create index warranties_expires_at_idx on public.warranties(expires_at);
create index warranties_active_idx on public.warranties(active);
create index warranties_device_imei_idx on public.warranties(device_imei);
create index warranties_device_serial_number_idx on public.warranties(device_serial_number);
create index warranties_claim_status_idx on public.warranties(claim_status);
