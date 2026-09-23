-- Row Level Security and public-safe views.
--
-- Design: full `holdings` rows (the complete, sortable pemegang-saham table)
-- are only selectable by paid users. Everyone else — including anonymous
-- visitors — reads through security-invoker=false views that are owned by
-- the migration role and cap what they return (top N rows per ticker), so
-- the view itself enforces the "preview" limit rather than RLS on the base
-- table doing double duty.

alter table tickers enable row level security;
alter table investors enable row level security;
alter table holdings enable row level security;
alter table conglomerates enable row level security;
alter table conglomerate_members enable row level security;
alter table prices enable row level security;
alter table search_logs enable row level security;
alter table profiles enable row level security;
alter table payments enable row level security;
alter table ai_query_logs enable row level security;

-- Public read-only reference data -------------------------------------------------

create policy tickers_public_read on tickers for select using (true);
create policy investors_public_read on investors for select using (true);
create policy conglomerates_public_read on conglomerates for select using (true);
create policy conglomerate_members_public_read on conglomerate_members for select using (true);
create policy prices_public_read on prices for select using (true);

-- Holdings: only paid users (or service role, which bypasses RLS) get the full table ----

create policy holdings_paid_read on holdings for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_paid = true
    )
  );

-- search_logs: anyone can log a search; nobody reads raw rows directly (use the view) --

create policy search_logs_insert on search_logs for insert
  to anon, authenticated
  with check (true);

-- profiles: a user manages only their own row -------------------------------------

create policy profiles_select_own on profiles for select
  using (auth.uid() = id);

create policy profiles_update_own on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- payments: a user can see only their own payment history -------------------------

create policy payments_select_own on payments for select
  using (profile_id = auth.uid());

-- ai_query_logs: a user can see/insert only their own rows -------------------------

create policy ai_query_logs_select_own on ai_query_logs for select
  using (auth.uid() = user_id);

create policy ai_query_logs_insert_own on ai_query_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------------
-- Public views (security_invoker = false, i.e. run with the owning role's
-- privileges, so they can read past `holdings` RLS while still limiting what
-- they expose).
-- ---------------------------------------------------------------------------------

create or replace view v_ticker_summary
with (security_invoker = false) as
select
  t.code,
  t.name,
  t.sector,
  t.listed_shares,
  t.market_cap,
  max(h.report_date) as report_date,
  count(distinct h.investor_id) as holder_count,
  coalesce(sum(h.percentage) filter (where i.local_foreign = 'L'), 0) as local_pct,
  coalesce(sum(h.percentage) filter (where i.local_foreign = 'F'), 0) as foreign_pct,
  coalesce(
    100 - sum(h.percentage) filter (
      where i.type in ('CP', 'IB', 'FD') -- strategic / non-free-float holder types
    ),
    100
  ) as free_float_pct
from tickers t
left join holdings h on h.ticker_code = t.code
  and h.report_date = (select max(h2.report_date) from holdings h2 where h2.ticker_code = t.code)
left join investors i on i.id = h.investor_id
group by t.code, t.name, t.sector, t.listed_shares, t.market_cap;

comment on view v_ticker_summary is 'Public, paywall-free per-ticker overview used by the landing page, search, and float screener.';

create or replace view v_holdings_preview
with (security_invoker = false) as
select
  ticker_code,
  investor_id,
  investor_name,
  investor_type,
  local_foreign,
  shares,
  percentage,
  report_date
from (
  select
    h.ticker_code,
    h.investor_id,
    i.name as investor_name,
    i.type as investor_type,
    i.local_foreign,
    h.shares,
    h.percentage,
    h.report_date,
    row_number() over (
      partition by h.ticker_code
      order by h.percentage desc
    ) as rn
  from holdings h
  join investors i on i.id = h.investor_id
  where h.report_date = (
    select max(h2.report_date) from holdings h2 where h2.ticker_code = h.ticker_code
  )
) ranked
where rn <= 5;

comment on view v_holdings_preview is 'Top-5-by-percentage holdings per ticker, visible to free/anonymous users as a teaser for the paid full table.';

create or replace view v_market_stats
with (security_invoker = false) as
select
  (select count(*) from tickers) as ticker_count,
  (select count(*) from investors) as investor_count,
  (select count(*) from conglomerates) as conglomerate_count,
  (select count(distinct type) from investors) as investor_type_count;

comment on view v_market_stats is 'Landing-page dynamic stats.';

create or replace view v_hot_searches
with (security_invoker = false) as
select query, query_type, count(*) as search_count, max(created_at) as last_searched_at
from search_logs
group by query, query_type
order by search_count desc, last_searched_at desc
limit 10;

create or replace view v_local_foreign_overview
with (security_invoker = false) as
select
  i.type,
  i.local_foreign,
  count(distinct h.investor_id) as investor_count,
  coalesce(sum(h.percentage), 0) as total_pct
from holdings h
join investors i on i.id = h.investor_id
where h.report_date = (select max(report_date) from holdings h2 where h2.ticker_code = h.ticker_code)
group by i.type, i.local_foreign;

create or replace view v_mutual_fund_positions
with (security_invoker = false) as
select
  i.id as investor_id,
  i.name as investor_name,
  count(distinct h.ticker_code) as position_count,
  max(h.percentage) as top_holding_pct,
  (
    select t.code from holdings h2
    join tickers t on t.code = h2.ticker_code
    where h2.investor_id = i.id
    order by h2.percentage desc
    limit 1
  ) as top_holding_ticker
from investors i
join holdings h on h.investor_id = i.id
where i.type = 'MF'
  and h.report_date = (select max(report_date) from holdings h2 where h2.ticker_code = h.ticker_code)
group by i.id, i.name;

-- Grant read access on the public views to anonymous + authenticated roles.
grant select on v_ticker_summary, v_holdings_preview, v_market_stats, v_hot_searches,
  v_local_foreign_overview, v_mutual_fund_positions
  to anon, authenticated;
