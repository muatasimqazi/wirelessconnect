-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007: Admin Audit Logs Table
-- Database Schema Specification §6.19
--
-- Audit logs are append-only. No UPDATE or DELETE is permitted.
-- RLS: service role can INSERT; admin users can SELECT.
--
-- Actions to audit:
-- - Role changes on profiles
-- - Product status changes (especially activating/archiving)
-- - Order status changes
-- - Warranty claim status changes
-- - Coupon creation and deactivation
-- - Settings changes
-- - Device intake rejection
-- - Intake-to-product conversion
-- - Any export of IMEI or serial number data
-- ─────────────────────────────────────────────────────────────────────────────

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action audit_action not null,
  table_name text,
  record_id text,
  old_values jsonb,   -- Excludes seller_id_number_encrypted and other sensitive fields
  new_values jsonb,   -- Excludes seller_id_number_encrypted and other sensitive fields
  ip_address text,
  user_agent text,
  notes text,
  created_at timestamptz not null default now()
  -- No updated_at — audit logs are immutable
);

create index admin_audit_logs_actor_id_idx on public.admin_audit_logs(actor_id);
create index admin_audit_logs_action_idx on public.admin_audit_logs(action);
create index admin_audit_logs_table_name_idx on public.admin_audit_logs(table_name);
create index admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);
