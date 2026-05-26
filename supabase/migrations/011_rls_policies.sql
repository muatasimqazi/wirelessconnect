-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 011: Row Level Security Policies
-- Database Schema Specification §10–§11
--
-- RLS is enabled on all public tables.
-- Service-role server actions bypass RLS for trusted writes.
-- Customer-facing reads must use safe views and ownership checks.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enable RLS on all tables ────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.device_intakes enable row level security;
alter table public.device_intake_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.warranties enable row level security;
alter table public.coupons enable row level security;
alter table public.settings enable row level security;
alter table public.webhook_events enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.order_cancellation_requests enable row level security;
alter table public.data_deletion_requests enable row level security;
alter table public.warranty_claim_images enable row level security;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Users can view and update their own profile.
-- role field updates require service role (enforced by trigger in migration 012).

create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_staff_select_all
  on public.profiles for select
  using (public.is_admin_or_staff());

-- ─── categories ──────────────────────────────────────────────────────────────
-- Everyone can read active categories.
-- Staff/admin can manage all categories.

create policy categories_public_select
  on public.categories for select
  using (active = true);

create policy categories_staff_all
  on public.categories for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── products ────────────────────────────────────────────────────────────────
-- Public reads only active products (via public_products view — private fields excluded).
-- Staff/admin can read all products including IMEI, cost, serial number.

create policy products_public_select
  on public.products for select
  using (status = 'active');

create policy products_staff_select_all
  on public.products for select
  using (public.is_admin_or_staff());

create policy products_staff_write
  on public.products for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── product_images ──────────────────────────────────────────────────────────
-- Everyone can read images for active products.
-- Staff/admin can manage all images.

create policy product_images_public_select
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
      and p.status = 'active'
    )
  );

create policy product_images_staff_all
  on public.product_images for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── device_intakes ──────────────────────────────────────────────────────────
-- Staff/admin only. Customers and public users cannot access intake records.

create policy device_intakes_staff_all
  on public.device_intakes for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── device_intake_images ────────────────────────────────────────────────────
-- Staff/admin only. Internal-only images must NEVER appear publicly.

create policy device_intake_images_staff_all
  on public.device_intake_images for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── carts ───────────────────────────────────────────────────────────────────
-- Authenticated users can manage their own cart.
-- Guest cart access handled via server actions using anonymous cookie IDs.

create policy carts_user_select_own
  on public.carts for select
  using (auth.uid() = user_id);

create policy carts_user_insert_own
  on public.carts for insert
  with check (auth.uid() = user_id OR auth.uid() is null);

create policy carts_user_update_own
  on public.carts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy carts_user_delete_own
  on public.carts for delete
  using (auth.uid() = user_id);

-- ─── cart_items ───────────────────────────────────────────────────────────────

create policy cart_items_user_all
  on public.cart_items for all
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
    )
  );

-- ─── addresses ───────────────────────────────────────────────────────────────

create policy addresses_user_all
  on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy addresses_staff_select
  on public.addresses for select
  using (public.is_admin_or_staff());

-- ─── orders ──────────────────────────────────────────────────────────────────
-- Authenticated customers can view their own orders.
-- Guest order access: handled via server actions using guest_access_token.
-- admin_notes is never returned to customer-facing queries (enforced at query level).

create policy orders_customer_select_own
  on public.orders for select
  using (auth.uid() = user_id);

create policy orders_staff_select_all
  on public.orders for select
  using (public.is_admin_or_staff());

create policy orders_staff_update_all
  on public.orders for update
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── order_items ─────────────────────────────────────────────────────────────
-- Customers MUST use customer_order_items view (migration 013).
-- Staff/admin can access base table including IMEI and serial number.

create policy order_items_customer_select
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and o.user_id = auth.uid()
    )
  );

create policy order_items_staff_all
  on public.order_items for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── warranties ──────────────────────────────────────────────────────────────
-- Customers can view safe warranty fields (claim_status, expires_at, active).
-- Only staff/admin can update claim_status, claim_notes, claim_resolved_at.
-- device_imei and device_serial_number are staff/admin only.

create policy warranties_customer_select_own
  on public.warranties for select
  using (auth.uid() = user_id);

create policy warranties_staff_all
  on public.warranties for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- Allow customers to insert warranty claim description (submit a claim)
create policy warranties_customer_claim_update
  on public.warranties for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── coupons ─────────────────────────────────────────────────────────────────
-- Public can validate active coupons through rate-limited server actions only.
-- used_count increments via atomic UPDATE only — never direct client update.
-- Staff/admin manage coupons.

create policy coupons_public_select_active
  on public.coupons for select
  using (active = true);

create policy coupons_staff_all
  on public.coupons for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── settings ────────────────────────────────────────────────────────────────
-- Public can read (storefront reads safe keys only — enforced at query layer).
-- Staff/admin can manage all settings.

create policy settings_public_select
  on public.settings for select
  using (true);

create policy settings_staff_all
  on public.settings for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── webhook_events ──────────────────────────────────────────────────────────
-- Service role inserts. Admin selects. No updates or deletes.

create policy webhook_events_admin_select
  on public.webhook_events for select
  using (public.is_admin());

-- Inserts handled exclusively by service role (bypasses RLS)

-- ─── admin_audit_logs ────────────────────────────────────────────────────────
-- Append-only. Service role inserts. Admin selects. No updates or deletes.

create policy admin_audit_logs_admin_select
  on public.admin_audit_logs for select
  using (public.is_admin());

-- Inserts handled exclusively by service role (bypasses RLS)

-- ─── order_cancellation_requests ─────────────────────────────────────────────
-- Authenticated customers can create/read for their own orders.
-- Guest requests via validated guest_access_token (server action only).
-- Staff/admin can read and update all.

create policy order_cancellation_requests_customer_select_own
  on public.order_cancellation_requests for select
  using (auth.uid() = user_id);

create policy order_cancellation_requests_customer_insert_own
  on public.order_cancellation_requests for insert
  with check (
    auth.uid() = user_id AND
    exists (
      select 1 from public.orders o
      where o.id = order_cancellation_requests.order_id
      and o.user_id = auth.uid()
      and o.status in ('paid', 'processing')
    )
  );

create policy order_cancellation_requests_staff_all
  on public.order_cancellation_requests for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- ─── data_deletion_requests ──────────────────────────────────────────────────
-- Public can insert through rate-limited server actions.
-- Public cannot read, update, or list requests.
-- Staff/admin manage all.

create policy data_deletion_requests_staff_all
  on public.data_deletion_requests for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());

-- Public inserts handled via service role in a rate-limited server action

-- ─── warranty_claim_images ───────────────────────────────────────────────────
-- Customers can upload/view images only for warranties they own.
-- Staff/admin can view all.

create policy warranty_claim_images_customer_own
  on public.warranty_claim_images for all
  using (
    exists (
      select 1 from public.warranties w
      where w.id = warranty_claim_images.warranty_id
      and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.warranties w
      where w.id = warranty_claim_images.warranty_id
      and w.user_id = auth.uid()
    )
  );

create policy warranty_claim_images_staff_all
  on public.warranty_claim_images for all
  using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());
