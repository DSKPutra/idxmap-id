-- IDXMap.ID initial schema
-- Core reference data (tickers, investors, holdings), conglomerate mapping,
-- EOD prices, search logs, and paid-access profiles/payments.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------

create table if not exists tickers (
  code text primary key check (code = upper(code)),
  name text not null,
  sector text,
  listed_shares bigint,
  market_cap numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickers_name_trgm_idx on tickers using gin (name gin_trgm_ops);
create index if not exists tickers_sector_idx on tickers (sector);

comment on table tickers is 'IDX-listed issuers (emiten).';

create table if not exists investors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text not null,
  type text not null check (type in ('CP', 'ID', 'IB', 'MF', 'IS', 'PF', 'SC', 'FD', 'OT')),
  local_foreign text not null check (local_foreign in ('L', 'F')),
  nationality text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists investors_name_trgm_idx on investors using gin (name gin_trgm_ops);
create index if not exists investors_name_normalized_idx on investors (name_normalized);
create index if not exists investors_type_idx on investors (type);
create index if not exists investors_local_foreign_idx on investors (local_foreign);

comment on column investors.type is 'KSEI investor type code: CP korporasi, ID individu, IB bank investasi, MF reksa dana, IS asuransi, PF dana pensiun, SC sekuritas, FD yayasan, OT lainnya.';
comment on column investors.local_foreign is 'L = lokal, F = asing.';

create table if not exists holdings (
  id bigserial primary key,
  ticker_code text not null references tickers (code) on delete cascade,
  investor_id uuid not null references investors (id) on delete cascade,
  shares bigint not null check (shares >= 0),
  percentage numeric(7, 4) not null check (percentage >= 0),
  report_date date not null,
  created_at timestamptz not null default now(),
  unique (ticker_code, investor_id, report_date)
);

create index if not exists holdings_ticker_idx on holdings (ticker_code, report_date desc);
create index if not exists holdings_investor_idx on holdings (investor_id, report_date desc);
create index if not exists holdings_percentage_idx on holdings (ticker_code, percentage desc);

comment on table holdings is 'KSEI "Pemegang Saham di atas 1%" snapshots, one row per ticker/investor/report_date.';

-- ---------------------------------------------------------------------------
-- Conglomerate mapping (manually curated)
-- ---------------------------------------------------------------------------

create table if not exists conglomerates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  founder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conglomerate_members (
  id bigserial primary key,
  conglomerate_id uuid not null references conglomerates (id) on delete cascade,
  ticker_code text not null references tickers (code) on delete cascade,
  role text not null default 'core' check (role in ('core', 'affiliate')),
  ownership_note text,
  unique (conglomerate_id, ticker_code)
);

create index if not exists conglomerate_members_ticker_idx on conglomerate_members (ticker_code);

-- ---------------------------------------------------------------------------
-- Prices (EOD) — populated by a scheduled Edge Function or CSV import
-- ---------------------------------------------------------------------------

create table if not exists prices (
  id bigserial primary key,
  ticker_code text not null references tickers (code) on delete cascade,
  date date not null,
  close numeric not null,
  change_pct numeric,
  volume bigint,
  source text not null default 'EOD_CSV',
  created_at timestamptz not null default now(),
  unique (ticker_code, date)
);

create index if not exists prices_ticker_date_idx on prices (ticker_code, date desc);

-- ---------------------------------------------------------------------------
-- Search logs / hot searches
-- ---------------------------------------------------------------------------

create table if not exists search_logs (
  id bigserial primary key,
  query text not null,
  query_type text not null default 'other' check (query_type in ('ticker', 'investor', 'other')),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists search_logs_created_at_idx on search_logs (created_at desc);
create index if not exists search_logs_query_idx on search_logs (lower(query));

-- ---------------------------------------------------------------------------
-- Profiles / payments (paid access via Mayar.id lifetime purchase)
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  is_paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete set null,
  mayar_transaction_id text unique,
  email text,
  amount numeric,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payments_profile_idx on payments (profile_id);

-- ---------------------------------------------------------------------------
-- AI Q&A rate limiting
-- ---------------------------------------------------------------------------

create table if not exists ai_query_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  question text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_query_logs_user_time_idx on ai_query_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tickers_set_updated_at on tickers;
create trigger tickers_set_updated_at before update on tickers
  for each row execute function set_updated_at();

drop trigger if exists investors_set_updated_at on investors;
create trigger investors_set_updated_at before update on investors
  for each row execute function set_updated_at();

drop trigger if exists conglomerates_set_updated_at on conglomerates;
create trigger conglomerates_set_updated_at before update on conglomerates
  for each row execute function set_updated_at();

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row when a new auth user signs in via magic link.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
