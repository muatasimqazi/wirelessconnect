-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 010: RLS Helper Functions
-- Database Schema Specification §11
--
-- SECURITY NOTE: These functions use SECURITY DEFINER.
-- To prevent privilege escalation:
-- 1. search_path is locked to 'public'
-- 2. A role-protection trigger (migration 011) prevents client-side role changes
-- 3. Only service role (via server actions) can update profiles.role
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── is_admin_or_staff() ─────────────────────────────────────────────────────
-- Returns true if the current authenticated user has role 'admin' or 'staff'.
-- Used in RLS policies to protect admin-only tables and operations.

create or replace function public.is_admin_or_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role in ('admin', 'staff')
  );
$$;

-- ─── is_admin() ──────────────────────────────────────────────────────────────
-- Returns true if the current authenticated user has role 'admin'.
-- Used for admin-only operations (audit logs, settings changes, role management).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;
