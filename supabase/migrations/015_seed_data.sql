-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 015: Seed Data
-- Database Schema Specification §16
--
-- Initial categories and store settings.
-- Run after all table and policy migrations.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Categories ──────────────────────────────────────────────────────────────

insert into public.categories (name, slug, type, sort_order, active, translations) values
('iPhones',       'iphones',       'phone',     1, true, '{"es": {"name": "iPhones", "description": "iPhones usados probados profesionalmente."}}'::jsonb),
('Samsung Phones','samsung-phones','phone',     2, true, '{"es": {"name": "Teléfonos Samsung", "description": "Teléfonos Samsung usados probados profesionalmente."}}'::jsonb),
('Google Pixel',  'google-pixel',  'phone',     3, true, '{"es": {"name": "Google Pixel", "description": "Teléfonos Google Pixel usados probados profesionalmente."}}'::jsonb),
('Tablets',       'tablets',       'tablet',    4, true, '{"es": {"name": "Tabletas", "description": "Tabletas usadas probadas profesionalmente."}}'::jsonb),
('Laptops',       'laptops',       'laptop',    5, true, '{"es": {"name": "Laptops", "description": "Laptops usados probados profesionalmente."}}'::jsonb),
('Accessories',   'accessories',   'accessory', 6, true, '{"es": {"name": "Accesorios", "description": "Accesorios para teléfonos y dispositivos."}}'::jsonb)
on conflict (slug) do nothing;

-- ─── Store Settings ───────────────────────────────────────────────────────────
-- Canonical settings key: 'store'
-- Public-safe keys: store_name, store_address, store_phone, store_email,
--   store_hours, whatsapp_enabled, whatsapp_number, default_locale,
--   supported_locales, pickup_enabled, shipping_enabled,
--   free_shipping_threshold, default_warranty_days
--
-- Private (server/admin only): stripe_tax_enabled, shipping_insurance_threshold,
--   shipping_signature_threshold, hold_period_days

insert into public.settings (key, value, description) values
(
  'store',
  '{
    "store_name": "Wireless Connect",
    "store_address": "14723 Aurora Ave N, Seattle, WA 98133",
    "store_phone": "206-423-2965",
    "store_email": "officialwirelessconnect@gmail.com",
    "store_hours": {
      "monday":    "10:00-19:00",
      "tuesday":   "10:00-19:00",
      "wednesday": "10:00-19:00",
      "thursday":  "10:00-19:00",
      "friday":    "10:00-19:00",
      "saturday":  "10:00-18:00",
      "sunday":    "closed"
    },
    "whatsapp_enabled": true,
    "whatsapp_number": "",
    "default_locale": "en",
    "supported_locales": ["en", "es"],
    "pickup_enabled": true,
    "shipping_enabled": true,
    "free_shipping_threshold": null,
    "default_warranty_days": 30,
    "hold_period_days": 5,
    "stripe_tax_enabled": true,
    "shipping_insurance_threshold": 200,
    "shipping_signature_threshold": 500
  }'::jsonb,
  'Main store settings'
)
on conflict (key) do nothing;
