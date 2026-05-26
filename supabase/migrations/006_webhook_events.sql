-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006: Webhook Events Table
-- Database Schema Specification §6.15
--
-- IDEMPOTENCY: Before processing any Stripe webhook, INSERT the event into
-- this table using ON CONFLICT DO NOTHING. If 0 rows returned, event was
-- already processed — return 200 immediately without further processing.
--
-- This prevents:
-- - Duplicate order creation
-- - Duplicate inventory decrements
-- - Duplicate warranty record creation
-- from repeated Stripe webhook deliveries.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb,
  error text
);

create index webhook_events_stripe_event_id_idx on public.webhook_events(stripe_event_id);
create index webhook_events_event_type_idx on public.webhook_events(event_type);
create index webhook_events_processed_at_idx on public.webhook_events(processed_at desc);

-- Idempotency pattern (implemented in app/api/stripe/webhook/route.ts):
--
-- INSERT INTO public.webhook_events (stripe_event_id, event_type, payload)
-- VALUES ($1, $2, $3)
-- ON CONFLICT (stripe_event_id) DO NOTHING
-- RETURNING id;
--
-- If no row returned → already processed → return HTTP 200 immediately.
-- If row returned → proceed with order update, inventory decrement, warranty creation.
