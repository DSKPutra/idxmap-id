-- Pivot from a fictional named-investor model to KSEI's real public data
-- shape. KSEI's free bulk "Kepemilikan Efek" report is an AGGREGATE balance
-- position per security — total shares held by each of the 9 investor types,
-- split Local/Foreign. It does NOT name individual holders (that only
-- exists scattered across each issuer's own disclosure filings, not as a
-- bulk download). Rather than mix real tickers with fabricated investor
-- names, `investors` and `holdings` are retired in favor of
-- `ownership_breakdown`, which matches exactly what KSEI actually publishes.

drop view if exists v_mutual_fund_positions;
drop view if exists v_holdings_preview;
drop view if exists v_local_foreign_overview;
drop view if exists v_ticker_summary;
drop view if exists v_market_stats;

drop table if exists holdings;
drop table if exists investors;

create table if not exists ownership_breakdown (
  id bigserial primary key,
  ticker_code text not null references tickers (code) on delete cascade,
  investor_type text not null check (investor_type in ('CP', 'ID', 'IB', 'MF', 'IS', 'PF', 'SC', 'FD', 'OT')),
  local_foreign text not null check (local_foreign in ('L', 'F')),
  shares bigint not null check (shares >= 0),
  percentage numeric(6, 3) not null check (percentage >= 0),
  report_date date not null,
  created_at timestamptz not null default now(),
  unique (ticker_code, investor_type, local_foreign, report_date)
);

create index if not exists ownership_breakdown_ticker_idx on ownership_breakdown (ticker_code, report_date desc);

comment on table ownership_breakdown is 'Real, aggregate KSEI "Kepemilikan Efek" balance position: shares per ticker x investor type x local/foreign. Source: ksei.co.id monthly public report. No named individual holders exist at this granularity.';

alter table ownership_breakdown enable row level security;

-- Full row-level detail (all 9 types x 2) is a paid feature, same paywall
-- pattern as the old `holdings` table. Free/anonymous users read the
-- top-3-by-percentage preview view below instead.
create policy ownership_breakdown_paid_read on ownership_breakdown for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_paid = true
    )
  );

-- ---------------------------------------------------------------------------
-- Views rebuilt on top of the real aggregate model
-- ---------------------------------------------------------------------------

create or replace view v_ticker_summary
with (security_invoker = false) as
select
  t.code,
  t.name,
  t.sector,
  t.listed_shares,
  t.market_cap,
  max(o.report_date) as report_date,
  coalesce(sum(o.percentage) filter (where o.local_foreign = 'L'), 0) as local_pct,
  coalesce(sum(o.percentage) filter (where o.local_foreign = 'F'), 0) as foreign_pct,
  coalesce(
    100 - sum(o.percentage) filter (where o.investor_type in ('CP', 'IB', 'FD')),
    100
  ) as free_float_pct
from tickers t
left join ownership_breakdown o on o.ticker_code = t.code
  and o.report_date = (select max(o2.report_date) from ownership_breakdown o2 where o2.ticker_code = t.code)
group by t.code, t.name, t.sector, t.listed_shares, t.market_cap;

comment on view v_ticker_summary is 'Public per-ticker overview computed from real KSEI aggregate ownership.';

create or replace view v_ownership_preview
with (security_invoker = false) as
select ticker_code, investor_type, local_foreign, shares, percentage, report_date
from (
  select
    o.*,
    row_number() over (partition by o.ticker_code order by o.percentage desc) as rn
  from ownership_breakdown o
  where o.report_date = (select max(o2.report_date) from ownership_breakdown o2 where o2.ticker_code = o.ticker_code)
) ranked
where rn <= 3;

comment on view v_ownership_preview is 'Top-3-by-percentage ownership rows per ticker, visible to free/anonymous users as a teaser for the full breakdown.';

create or replace view v_market_stats
with (security_invoker = false) as
select
  (select count(*) from tickers) as ticker_count,
  (select count(distinct sector) from tickers) as sector_count,
  (select count(*) from conglomerates) as conglomerate_count,
  9 as investor_type_count;

comment on view v_market_stats is 'Landing-page dynamic stats.';

create or replace view v_local_foreign_overview
with (security_invoker = false) as
select
  investor_type,
  local_foreign,
  count(distinct ticker_code) as ticker_count,
  sum(percentage) as total_pct
from ownership_breakdown
where report_date = (select max(report_date) from ownership_breakdown)
group by investor_type, local_foreign;

grant select on v_ticker_summary, v_ownership_preview, v_market_stats, v_local_foreign_overview, v_hot_searches
  to anon, authenticated;
