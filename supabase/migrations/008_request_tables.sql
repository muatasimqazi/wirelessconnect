-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008: Customer Request Tables
-- Database Schema Specification §6.16–§6.17
--
-- These tables record customer-initiated requests that require staff/admin review.
-- Neither table auto-cancels orders or deletes data — staff must act manually.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 6.16 order_cancellation_requests ────────────────────────────────────────
-- Customer-initiated cancellation requests. Staff/admin must approve or deny.
-- Request creation also updates denormalized fields on orders table.
-- Staff/admin decisions must be logged to admin_audit_logs.

create table public.order_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_access_token uuid,        -- For guest cancellation requests
  customer_email text not null,
  customer_locale text not null default 'en',
  reason text not null,
  status request_status not null default 'submitted',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_cancellation_requests_order_id_idx on public.order_cancellation_requests(order_id);
create index order_cancellation_requests_user_id_idx on public.order_cancellation_requests(user_id);
create index order_cancellation_requests_status_idx on public.order_cancellation_requests(status);
create index order_cancellation_requests_created_at_idx on public.order_cancellation_requests(created_at desc);

-- ─── 6.17 data_deletion_requests ─────────────────────────────────────────────
-- CCPA data deletion requests. 45-day response deadline.
-- Processing is manual for MVP. Public users can INSERT (rate-limited server action).
-- Staff/admin read and update. All updates must be audited.

create table public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  order_number text,
  reason text,
  customer_locale text not null default 'en',
  status request_status not null default 'submitted',
  response_due_at timestamptz not null default now() + interval '45 days',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  completed_at timestamptz,
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index data_deletion_requests_email_idx on public.data_deletion_requests(email);
create index data_deletion_requests_status_idx on public.data_deletion_requests(status);
create index data_deletion_requests_response_due_at_idx on public.data_deletion_requests(response_due_at);
create index data_deletion_requests_created_at_idx on public.data_deletion_requests(created_at desc);
