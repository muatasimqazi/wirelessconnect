-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 012: Database Triggers
-- Database Schema Specification §12
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── updated_at Trigger Function ─────────────────────────────────────────────
-- Automatically updates the updated_at column on any row update.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to all tables with the column
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger set_device_intakes_updated_at
  before update on public.device_intakes
  for each row execute function public.set_updated_at();

create trigger set_carts_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create trigger set_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

create trigger set_addresses_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger set_warranties_updated_at
  before update on public.warranties
  for each row execute function public.set_updated_at();

create trigger set_coupons_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

create trigger set_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

create trigger set_order_cancellation_requests_updated_at
  before update on public.order_cancellation_requests
  for each row execute function public.set_updated_at();

create trigger set_data_deletion_requests_updated_at
  before update on public.data_deletion_requests
  for each row execute function public.set_updated_at();

-- ─── Profile Creation Trigger ─────────────────────────────────────────────────
-- When a Supabase Auth user signs up, automatically create a matching profile.
-- Runs SECURITY DEFINER with locked search_path to prevent privilege escalation.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Role Protection Trigger ──────────────────────────────────────────────────
-- Prevents any user from escalating their own role via a direct UPDATE.
-- Role changes MUST go through service-role server actions only.
-- If auth.uid() is not null during a role update → client request → raise error.

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If role is being changed, only allow via service role (no auth.uid())
  if old.role is distinct from new.role then
    if auth.uid() is not null then
      raise exception 'Role changes are not permitted via client requests. Use admin server actions.';
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ─── Hold Period Gate Trigger ─────────────────────────────────────────────────
-- Prevents a device intake from transitioning to 'ready_to_list' if the
-- hold period has not yet expired.
-- This is a hard database-level enforcement of RCW 19.60 compliance.
-- Server-side validation in convertIntakeToProduct() provides the first gate;
-- this trigger provides a final safety net.

create or replace function public.enforce_hold_period()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'ready_to_list' and old.status != 'ready_to_list' then
    if new.hold_until_date is not null and new.hold_until_date > current_date then
      raise exception
        'Device is in hold period until %. Cannot list before hold period expires.',
        new.hold_until_date;
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_intake_hold_period
  before update on public.device_intakes
  for each row execute function public.enforce_hold_period();
