-- A Mayar payment can arrive before the buyer's first magic-link login, in
-- which case `profiles` doesn't exist yet when the webhook fires. Extend the
-- new-user trigger to check for a prior paid `payments` row by email and
-- activate access immediately on first sign-in, instead of requiring a
-- separate reconciliation job.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  has_prior_payment boolean;
begin
  select exists (
    select 1 from payments
    where email = new.email and status = 'paid'
  ) into has_prior_payment;

  insert into public.profiles (id, email, is_paid, paid_at)
  values (new.id, new.email, coalesce(has_prior_payment, false), case when has_prior_payment then now() end)
  on conflict (id) do nothing;

  if has_prior_payment then
    update public.payments set profile_id = new.id where email = new.email and profile_id is null;
  end if;

  return new;
end;
$$;
