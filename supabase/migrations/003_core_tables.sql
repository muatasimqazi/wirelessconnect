-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Core Tables
-- Database Schema Specification §6.1–§6.13
--
-- Tables: profiles, categories, products, product_images,
--         carts, cart_items, addresses, orders, order_items,
--         coupons, settings
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 6.1 profiles ────────────────────────────────────────────────────────────
-- Stores customer, staff, and admin profile data linked to Supabase Auth.
-- preferred_locale has NO CHECK constraint — validated at application layer only.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role user_role not null default 'customer',
  avatar_url text,
  preferred_locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles(email);
create index profiles_role_idx on public.profiles(role);

-- ─── 6.2 categories ──────────────────────────────────────────────────────────

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type product_category_type not null,
  description text,
  translations jsonb not null default '{}'::jsonb,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_slug_idx on public.categories(slug);
create index categories_active_idx on public.categories(active);

-- ─── 6.3 products ────────────────────────────────────────────────────────────
-- IMPORTANT PRIVACY RULE:
-- imei, serial_number, cost, acquisition_source, acquisition_date,
-- internal_device_notes are admin-only fields.
-- Public product queries MUST use the public_products view (migration 014).

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,

  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  translations jsonb not null default '{}'::jsonb,

  category_type product_category_type not null,
  brand text,
  model text,
  storage text,
  color text,
  carrier carrier_type default 'unknown',
  original_carrier carrier_type default 'unknown',
  condition device_condition,
  battery_health integer check (battery_health is null or (battery_health >= 0 and battery_health <= 100)),
  battery_cycle_count integer check (battery_cycle_count is null or battery_cycle_count >= 0),

  -- Network/band compatibility (important for nationwide customers)
  supported_bands text[],
  network_compatibility text[],

  -- Private fields — excluded from public_products view
  imei text,
  serial_number text,
  cost numeric(10,2) check (cost is null or cost >= 0),
  acquisition_source text,
  acquisition_date date,
  internal_device_notes text,

  is_clean_imei boolean default false,
  imei_verification_status verification_status not null default 'not_checked',
  imei_verified_at timestamptz,
  imei_verified_by uuid references auth.users(id) on delete set null,
  is_unlocked boolean default false,
  activation_lock_removed boolean not null default false,
  is_tested boolean not null default false,
  testing_status testing_status not null default 'not_started',
  tested_at timestamptz,
  tested_by uuid references auth.users(id) on delete set null,
  testing_notes text,
  is_data_wiped boolean not null default false,
  factory_reset_verified boolean not null default false,
  includes_charger boolean not null default false,
  includes_cable boolean not null default true,
  warranty_days integer not null default 30,

  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),

  quantity integer not null default 1 check (quantity >= 0),
  sku text unique,
  barcode text,

  status product_status not null default 'draft',
  featured boolean not null default false,
  allow_pickup boolean not null default true,
  allow_shipping boolean not null default true,

  seo_title text,
  seo_description text,
  seo_translations jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_slug_idx on public.products(slug);
create index products_status_idx on public.products(status);
create index products_featured_idx on public.products(featured);
create index products_brand_idx on public.products(brand);
create index products_model_idx on public.products(model);
create index products_price_idx on public.products(price);
create index products_condition_idx on public.products(condition);
create index products_carrier_idx on public.products(carrier);
create index products_sku_idx on public.products(sku);
create index products_imei_idx on public.products(imei);
create index products_testing_status_idx on public.products(testing_status);
create index products_imei_verification_status_idx on public.products(imei_verification_status);

-- Full-text search index — English fields only for MVP
create index products_search_idx on public.products using gin (
  to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(brand, '') || ' ' ||
    coalesce(model, '') || ' ' ||
    coalesce(storage, '') || ' ' ||
    coalesce(color, '')
  )
);

-- ─── 6.4 product_images ──────────────────────────────────────────────────────

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  alt_text_translations jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enforce one primary image per product
create unique index one_primary_image_per_product_idx
  on public.product_images(product_id)
  where is_primary = true;

create index product_images_product_id_idx on public.product_images(product_id);
create index product_images_sort_order_idx on public.product_images(sort_order);

-- ─── 6.7 carts ───────────────────────────────────────────────────────────────

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id text,
  currency text not null default 'usd',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create index carts_user_id_idx on public.carts(user_id);
create index carts_anonymous_id_idx on public.carts(anonymous_id);
create index carts_expires_at_idx on public.carts(expires_at);

-- ─── 6.8 cart_items ──────────────────────────────────────────────────────────

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, product_id)
);

create index cart_items_cart_id_idx on public.cart_items(cart_id);
create index cart_items_product_id_idx on public.cart_items(product_id);

-- ─── 6.9 addresses ───────────────────────────────────────────────────────────
-- Phone stored in E.164 format for international compatibility.

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  full_name text not null,
  phone text,  -- E.164 format: +12065551234
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,  -- 2-letter U.S. state code for domestic orders
  postal_code text not null,
  country text not null default 'US',

  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses(user_id);

-- ─── 6.12 coupons ────────────────────────────────────────────────────────────
-- ATOMIC REDEMPTION: Always use the single-UPDATE pattern from Schema §6.12.
-- Never validate and increment in separate statements.

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type coupon_type not null,
  value numeric(10,2) not null check (value >= 0),
  active boolean not null default true,
  usage_limit integer,
  used_count integer not null default 0 check (used_count >= 0),
  minimum_order_amount numeric(10,2),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index coupons_code_idx on public.coupons(code);
create index coupons_active_idx on public.coupons(active);

-- ─── 6.13 settings ───────────────────────────────────────────────────────────
-- Single-row settings object. Canonical key: 'store'.
-- Settings are read server-side; only safe keys are exposed to storefront.

create table public.settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

-- ─── 6.10 orders ─────────────────────────────────────────────────────────────
-- SECURITY: guest_access_token prevents IDOR on order confirmation pages.
-- Never expose orders by id or order_number alone for unauthenticated users.
-- customer_locale has NO CHECK constraint — validated at application layer only.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,

  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_name text,
  customer_phone text,
  customer_locale text not null default 'en',

  -- Secure guest access token — prevents IDOR on /order-confirmation?token=...
  guest_access_token uuid not null default gen_random_uuid(),

  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  fulfillment_method fulfillment_method not null,

  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  tax_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  currency text not null default 'usd',

  -- Shipping insurance for high-value orders (threshold configured in settings)
  shipping_insurance_amount numeric(10,2) not null default 0,

  shipping_address_id uuid references public.addresses(id) on delete set null,
  billing_address_id uuid references public.addresses(id) on delete set null,

  -- Shipping tracking (populated by admin when marking order shipped)
  tracking_number text,
  shipping_carrier text,  -- 'USPS', 'UPS', 'FedEx'
  shipped_at timestamptz,

  pickup_location_name text default 'Wireless Connect',
  pickup_location_address text default '14723 Aurora Ave N, Seattle, WA 98133',

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,

  -- Stripe Tax — required for nationwide multi-state compliance
  stripe_tax_calculation_id text,
  tax_jurisdiction text,  -- e.g., 'US-WA', 'US-CA'

  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,

  notes text,
  admin_notes text,  -- NEVER returned to customer-facing queries

  paid_at timestamptz,
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  warranty_started_at timestamptz,

  -- Customer cancellation request fields (never auto-cancel; staff must review)
  cancellation_requested_at timestamptz,
  cancellation_request_reason text,
  cancellation_request_status request_status,
  cancellation_reviewed_by uuid references auth.users(id) on delete set null,
  cancellation_reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders(user_id);
create index orders_customer_email_idx on public.orders(customer_email);
create index orders_status_idx on public.orders(status);
create index orders_payment_status_idx on public.orders(payment_status);
create index orders_created_at_idx on public.orders(created_at desc);
create index orders_guest_access_token_idx on public.orders(guest_access_token);
create index orders_stripe_checkout_session_id_idx on public.orders(stripe_checkout_session_id);
create index orders_order_number_idx on public.orders(order_number);

-- ─── 6.11 order_items ────────────────────────────────────────────────────────
-- Snapshots product details at checkout — old orders stay accurate if product changes.
-- product_imei and product_serial_number are ADMIN-ONLY.
-- Customer queries MUST use the customer_order_items view (migration 014).

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,

  product_title text not null,
  product_slug text,
  product_sku text,
  -- Admin-only fields for warranty/support
  product_serial_number text,
  product_imei text,
  product_image_url text,

  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  line_total numeric(10,2) not null check (line_total >= 0),

  device_brand text,
  device_model text,
  device_storage text,
  device_color text,
  device_condition device_condition,
  battery_health integer,
  -- Warranty duration copied from product at order time (immutable snapshot)
  warranty_days integer not null default 30,
  warranty_expires_at timestamptz,

  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);
create index order_items_product_imei_idx on public.order_items(product_imei);
create index order_items_product_serial_number_idx on public.order_items(product_serial_number);

-- ─── Order Number Sequence ────────────────────────────────────────────────────
-- WC-10001, WC-10002, etc. Generated server-side before order insert.

create sequence public.order_number_seq start 10001;
