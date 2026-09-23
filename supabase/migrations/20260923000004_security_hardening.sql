-- Addresses Supabase database-linter findings after the initial schema:
--   * pg_trgm was installed in `public` — move it to `extensions`.
--   * set_updated_at() had a mutable search_path.
--   * handle_new_user() / set_updated_at() are trigger-only functions but
--     got the default PUBLIC execute grant — revoke it so anon/authenticated
--     can't invoke them directly via PostgREST RPC.
-- (v_*.security_definer_view is an intentional, documented trade-off — see
-- supabase/migrations/20260923000002_rls_and_views.sql — not fixed here.)

create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

create or replace function set_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function set_updated_at() from public, anon, authenticated;
revoke execute on function handle_new_user() from public, anon, authenticated;
