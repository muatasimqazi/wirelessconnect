-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 018: Fix hold period trigger to respect hold_period_waived
--
-- Bug: enforce_hold_period trigger blocked status → ready_to_list even when
-- hold_period_waived = true, making the waiver feature non-functional.
--
-- Fix: add hold_period_waived check so a waived intake can be listed
-- immediately regardless of hold_until_date.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.enforce_hold_period()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'ready_to_list' and old.status != 'ready_to_list' then
    -- Skip enforcement when hold has been explicitly waived
    if coalesce(new.hold_period_waived, false) = true then
      return new;
    end if;

    if new.hold_until_date is not null and new.hold_until_date > current_date then
      raise exception
        'Device is in hold period until %. Cannot list before hold period expires.',
        new.hold_until_date;
    end if;
  end if;
  return new;
end;
$$;
