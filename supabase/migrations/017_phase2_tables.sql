-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 017: Phase 2 Tables
-- Database Schema Specification §7
--
-- Creates:
--   - repairs            (repair appointment requests + tracking)
--   - repair_updates     (timeline updates per repair)
--   - trade_ins          (customer device trade-in submissions)
--   - trade_in_images    (photos submitted with trade-ins)
--   - reviews            (product reviews with admin approval gate)
--   - inventory_reservations  (timed checkout holds to prevent oversell)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 7.1 repairs ─────────────────────────────────────────────────────────────

create table if not exists public.repairs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_locale text not null default 'en',

  device_brand text,
  device_model text,
  device_color text,
  device_issue text not null,
  requested_service text,

  status repair_status not null default 'requested',
  estimated_price numeric(10,2),
  final_price numeric(10,2),

  appointment_start timestamptz,
  appointment_end timestamptz,

  internal_notes text,
  customer_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists repairs_user_id_idx on public.repairs(user_id);
create index if not exists repairs_customer_email_idx on public.repairs(customer_email);
create index if not exists repairs_status_idx on public.repairs(status);
create index if not exists repairs_appointment_start_idx on public.repairs(appointment_start);
create index if not exists repairs_created_at_idx on public.repairs(created_at desc);

-- ─── 7.2 repair_updates ──────────────────────────────────────────────────────

create table if not exists public.repair_updates (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references public.repairs(id) on delete cascade,
  status repair_status not null,
  message text not null,
  visible_to_customer boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists repair_updates_repair_id_idx on public.repair_updates(repair_id);
create index if not exists repair_updates_created_at_idx on public.repair_updates(created_at desc);

-- ─── 7.3 trade_ins ───────────────────────────────────────────────────────────
--
-- IMPORTANT: Online submissions are preliminary estimates only.
-- Final offers require in-person inspection. This must be disclosed in the UI.

create table if not exists public.trade_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_locale text not null default 'en',

  device_type product_category_type not null,
  brand text not null,
  model text not null,
  storage text,
  carrier carrier_type default 'unknown',
  condition device_condition,
  battery_health integer check (battery_health is null or (battery_health >= 0 and battery_health <= 100)),
  imei text,

  customer_description text,
  status trade_in_status not null default 'submitted',

  estimated_offer numeric(10,2),
  final_offer numeric(10,2),
  offer_expires_at timestamptz,

  admin_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trade_ins_user_id_idx on public.trade_ins(user_id);
create index if not exists trade_ins_customer_email_idx on public.trade_ins(customer_email);
create index if not exists trade_ins_status_idx on public.trade_ins(status);
create index if not exists trade_ins_created_at_idx on public.trade_ins(created_at desc);

-- ─── 7.4 trade_in_images ─────────────────────────────────────────────────────

create table if not exists public.trade_in_images (
  id uuid primary key default gen_random_uuid(),
  trade_in_id uuid not null references public.trade_ins(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists trade_in_images_trade_in_id_idx on public.trade_in_images(trade_in_id);

-- ─── 7.5 reviews ─────────────────────────────────────────────────────────────
--
-- Admin must approve (approved = true) before reviews appear on storefront.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,

  reviewer_name text,
  reviewer_email text,

  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  body text,
  approved boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_product_id_idx on public.reviews(product_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists reviews_approved_idx on public.reviews(approved);
create index if not exists reviews_created_at_idx on public.reviews(created_at desc);

-- ─── 7.6 inventory_reservations ──────────────────────────────────────────────
--
-- Timed checkout holds. Created when checkout session starts.
-- Released when payment completes (webhook) or expires.
-- Prevents two customers from buying the last unit simultaneously.

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  cart_id uuid references public.carts(id) on delete cascade,
  stripe_session_id text unique,            -- set when Stripe session is created
  quantity integer not null default 1 check (quantity > 0),
  expires_at timestamptz not null,          -- default: 15 minutes from creation
  released boolean not null default false,  -- true when paid or expired+released
  created_at timestamptz not null default now()
);

create index if not exists inventory_reservations_product_id_idx on public.inventory_reservations(product_id);
create index if not exists inventory_reservations_cart_id_idx on public.inventory_reservations(cart_id);
create index if not exists inventory_reservations_expires_at_idx on public.inventory_reservations(expires_at);
create index if not exists inventory_reservations_stripe_session_id_idx on public.inventory_reservations(stripe_session_id);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

-- Repairs: customers can read their own; staff/admin can read all
alter table public.repairs enable row level security;

create policy "repairs_customer_select" on public.repairs
  for select using (auth.uid() = user_id);

create policy "repairs_admin_all" on public.repairs
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

create policy "repairs_anon_insert" on public.repairs
  for insert with check (true);

-- repair_updates: customers can read visible ones for their repair
alter table public.repair_updates enable row level security;

create policy "repair_updates_customer_select" on public.repair_updates
  for select using (
    visible_to_customer = true and
    exists (
      select 1 from public.repairs r
      where r.id = repair_id and r.user_id = auth.uid()
    )
  );

create policy "repair_updates_admin_all" on public.repair_updates
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- trade_ins: customers can read their own; staff/admin can read all
alter table public.trade_ins enable row level security;

create policy "trade_ins_customer_select" on public.trade_ins
  for select using (auth.uid() = user_id);

create policy "trade_ins_admin_all" on public.trade_ins
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

create policy "trade_ins_anon_insert" on public.trade_ins
  for insert with check (true);

-- trade_in_images: customers can read images for their own trade-in
alter table public.trade_in_images enable row level security;

create policy "trade_in_images_customer_select" on public.trade_in_images
  for select using (
    exists (
      select 1 from public.trade_ins t
      where t.id = trade_in_id and t.user_id = auth.uid()
    )
  );

create policy "trade_in_images_admin_all" on public.trade_in_images
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- reviews: approved reviews are public; customers can insert; admin manages
alter table public.reviews enable row level security;

create policy "reviews_public_select" on public.reviews
  for select using (approved = true);

create policy "reviews_owner_select" on public.reviews
  for select using (auth.uid() = user_id);

create policy "reviews_insert" on public.reviews
  for insert with check (true);

create policy "reviews_admin_all" on public.reviews
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- inventory_reservations: service role only (managed by server actions)
alter table public.inventory_reservations enable row level security;

create policy "inventory_reservations_none" on public.inventory_reservations
  for all using (false);
