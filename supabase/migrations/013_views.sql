-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 013: Database Views
-- Database Schema Specification §8
--
-- These views are the REQUIRED interface for customer-facing queries.
-- Never query the base tables directly for storefront/customer pages.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 8.1 public_products ─────────────────────────────────────────────────────
-- Safe public view of active products. Intentionally excludes all private fields.
--
-- EXCLUDED (never expose to public):
--   imei, serial_number, cost, acquisition_source, acquisition_date,
--   internal_device_notes, imei_verified_by, tested_by
--
-- SAFE indicators exposed (verification status without actual values):
--   is_clean_imei, is_tested, is_data_wiped, factory_reset_verified,
--   imei_verification_status (indicator only — not actual IMEI)

create or replace view public.public_products as
select
  id,
  category_id,
  slug,
  title,
  subtitle,
  description,
  translations,
  category_type,
  brand,
  model,
  storage,
  color,
  carrier,
  original_carrier,
  condition,
  battery_health,
  battery_cycle_count,
  supported_bands,
  network_compatibility,
  is_clean_imei,
  imei_verification_status,
  is_unlocked,
  activation_lock_removed,
  is_tested,
  testing_status,
  is_data_wiped,
  factory_reset_verified,
  includes_charger,
  includes_cable,
  warranty_days,
  price,
  compare_at_price,
  quantity,
  sku,
  status,
  featured,
  allow_pickup,
  allow_shipping,
  seo_title,
  seo_description,
  seo_translations,
  created_at,
  updated_at
from public.products
where status = 'active';

-- ─── 8.2 customer_order_items ────────────────────────────────────────────────
-- Safe customer-facing view of order items.
-- Intentionally excludes product_imei and product_serial_number.
-- ALL customer-facing order detail queries MUST use this view.

create or replace view public.customer_order_items as
select
  id,
  order_id,
  product_id,
  product_title,
  product_slug,
  product_sku,
  product_image_url,
  unit_price,
  quantity,
  line_total,
  device_brand,
  device_model,
  device_storage,
  device_color,
  device_condition,
  battery_health,
  warranty_days,
  warranty_expires_at,
  created_at
from public.order_items;
-- NOTE: product_imei and product_serial_number intentionally excluded
