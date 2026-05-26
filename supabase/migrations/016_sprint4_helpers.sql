-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 016: Sprint 4 Helper Functions
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Order Number Generator ───────────────────────────────────────────────────
-- Returns the next sequential order number in WC-NNNNN format.
-- Called server-side in features/checkout/actions.ts before order INSERT.

create or replace function public.get_next_order_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'WC-' || nextval('public.order_number_seq')::text;
$$;

grant execute on function public.get_next_order_number() to service_role;
