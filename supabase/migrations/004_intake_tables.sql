-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Device Intake Tables
-- Database Schema Specification §6.5–§6.6
--
-- These tables are STAFF/ADMIN-ONLY.
-- IMEI, serial number, acquisition source, cost, seller identity,
-- and internal notes must NEVER be exposed publicly.
--
-- Seller identity fields are required for Washington State RCW 19.60
-- secondhand dealer compliance.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 6.5 device_intakes ──────────────────────────────────────────────────────

create table public.device_intakes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,

  status intake_status not null default 'hold_period',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,

  brand text not null,
  model text not null,
  storage text,
  color text,
  carrier carrier_type default 'unknown',
  original_carrier carrier_type default 'unknown',
  sku text unique,
  imei text,
  serial_number text,

  -- ── Seller Identity Fields (RCW 19.60 Compliance) ──
  -- Required for all individual purchases. Record before acquisition.
  -- seller_id_number_encrypted MUST use pgp_sym_encrypt with SELLER_ID_ENCRYPTION_KEY.
  -- NEVER store plaintext government ID numbers.
  seller_full_name text,
  seller_phone text,
  seller_email text,
  seller_id_type seller_id_type,
  seller_id_number_encrypted text,   -- pgp_sym_encrypt(id_number, key) — never stored plaintext
  seller_id_state text,              -- issuing state/country
  seller_id_expiry date,
  seller_address text,
  seller_declaration_signed boolean not null default false,
  seller_declaration_signed_at timestamptz,

  -- ── Acquisition Details ──
  -- acquisition_source allowed values: individual_purchase, wholesale_supplier,
  -- trade_in, consignment, donation, other
  acquisition_source text,
  acquisition_date date not null default current_date,
  acquisition_payment_method acquisition_payment_method,
  cost numeric(10,2) check (cost is null or cost >= 0),
  supplier_notes text,

  -- ── Hold Period Compliance (RCW 19.60) ──
  -- hold_until_date must be in the past before status can be 'ready_to_list'.
  -- Enforced by DB trigger (migration 013) AND server-side gate.
  hold_until_date date,
  hold_period_days integer not null default 5,
  hold_period_waived boolean not null default false,
  hold_period_waived_reason text,

  -- ── IMEI Verification ──
  imei_verification_status verification_status not null default 'not_checked',
  is_clean_imei boolean,
  is_blacklisted boolean,
  is_financed boolean,
  activation_lock_removed boolean not null default false,
  imei_verified_at timestamptz,
  imei_verified_by uuid references auth.users(id) on delete set null,
  imei_verification_service text,    -- 'CTIA', 'GSMA', 'carrier_direct', 'checkmend'
  imei_verification_notes text,

  -- ── Testing Checklist (14 functional tests) ──
  testing_status testing_status not null default 'not_started',
  power_on_passed boolean,
  touchscreen_passed boolean,
  face_or_touch_id_passed boolean,
  cameras_passed boolean,
  speakers_passed boolean,
  microphone_passed boolean,
  charging_port_passed boolean,
  wireless_charging_passed boolean,
  bluetooth_passed boolean,
  wifi_passed boolean,
  cellular_passed boolean,
  buttons_passed boolean,
  battery_health integer check (battery_health is null or (battery_health >= 0 and battery_health <= 100)),
  battery_cycle_count integer check (battery_cycle_count is null or battery_cycle_count >= 0),
  factory_reset_verified boolean not null default false,
  data_wiped_verified boolean not null default false,
  tested_at timestamptz,
  tested_by uuid references auth.users(id) on delete set null,
  testing_notes text,

  -- ── Grading ──
  condition device_condition,
  cosmetic_notes text,
  functional_notes text,
  defect_disclosure text,
  included_accessories text,

  -- ── Listing Details ──
  price numeric(10,2) check (price is null or price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  warranty_days integer not null default 30 check (warranty_days >= 0),
  allow_pickup boolean not null default true,
  allow_shipping boolean not null default true,
  featured_candidate boolean not null default false,

  -- ── Lifecycle ──
  converted_to_product_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Canonical Publishing Gates (all 15 must pass for used phone → active product) ──
-- Enforced server-side in convertIntakeToProduct() — see API Spec §...
-- 1. imei_verification_status = 'passed'
-- 2. is_clean_imei = true
-- 3. is_blacklisted = false
-- 4. activation_lock_removed = true
-- 5. testing_status = 'passed'
-- 6. factory_reset_verified = true
-- 7. data_wiped_verified = true
-- 8. battery_health between 0 and 100
-- 9. condition is not null
-- 10. price > 0
-- 11. hold_until_date is null OR hold_until_date <= current_date
-- 12. seller_declaration_signed = true (for individual purchases)
-- 13. cost > 0 (for individual purchases)
-- 14. At least 6 customer-facing product images
-- 15. No outstanding misleading staff flags in notes/disclosure fields

create index device_intakes_status_idx on public.device_intakes(status);
create index device_intakes_sku_idx on public.device_intakes(sku);
create index device_intakes_imei_idx on public.device_intakes(imei);
create index device_intakes_serial_number_idx on public.device_intakes(serial_number);
create index device_intakes_testing_status_idx on public.device_intakes(testing_status);
create index device_intakes_imei_verification_status_idx on public.device_intakes(imei_verification_status);
create index device_intakes_created_at_idx on public.device_intakes(created_at desc);
create index device_intakes_hold_until_date_idx on public.device_intakes(hold_until_date);
create index device_intakes_seller_full_name_idx on public.device_intakes(seller_full_name);
create index device_intakes_acquisition_date_idx on public.device_intakes(acquisition_date);

-- ─── 6.6 device_intake_images ────────────────────────────────────────────────
-- Intake-stage photos. internal_only = true images MUST NEVER appear publicly.
-- Only safe customer-facing images are copied to product_images during publishing.

create table public.device_intake_images (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.device_intakes(id) on delete cascade,
  image_url text not null,
  image_type text,
  alt_text text,
  alt_text_translations jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  internal_only boolean not null default false,
  created_at timestamptz not null default now()
);

create index device_intake_images_intake_id_idx on public.device_intake_images(intake_id);
create index device_intake_images_sort_order_idx on public.device_intake_images(sort_order);
