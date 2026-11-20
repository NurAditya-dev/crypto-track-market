begin;
create table public.market_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('watch','alert','holding')),
  coin_id text not null check (coin_id ~ '^[a-z0-9_-]{1,150}$'),
  coin_name text not null check (length(coin_name) between 1 and 160),
  direction text check (direction in ('above','below')),
  price numeric check (price > 0 and price < 1e30),
  quantity numeric check (quantity > 0 and quantity < 1e30),
  triggered_at timestamptz,
  triggered_price numeric,
  created_at timestamptz not null default now(),
  check (
    (kind = 'watch' and price is null and quantity is null and direction is null) or
    (kind = 'alert' and price is not null and direction is not null and quantity is null) or
    (kind = 'holding' and price is not null and quantity is not null and direction is null)
  )
);
create unique index market_watch_once on public.market_entries(user_id, coin_id) where kind = 'watch';
create index market_entries_owner on public.market_entries(user_id, created_at);
alter table public.market_entries enable row level security;
revoke all on public.market_entries from public, anon, authenticated;
grant select, delete on public.market_entries to authenticated;
grant insert(id,kind,coin_id,coin_name,direction,price,quantity) on public.market_entries to authenticated;
create policy market_owner_read on public.market_entries for select to authenticated using (user_id = (select auth.uid()));
create policy market_owner_add on public.market_entries for insert to authenticated with check (user_id = (select auth.uid()));
create policy market_owner_remove on public.market_entries for delete to authenticated using (user_id = (select auth.uid()));

create schema if not exists market_jobs;
revoke all on schema market_jobs from public, anon, authenticated;
create extension if not exists http with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- All targets and acquisition costs use IDR. Read each distinct quote once per batch.
create function market_jobs.check_price_alerts() returns void
language plpgsql set search_path = '' as $$
declare
  batch text;
  response extensions.http_response;
  prices jsonb;
begin
  for batch in
    select string_agg(coin_id, ',') from (
      select coin_id, (row_number() over (order by coin_id)-1)/40 as bucket
      from (select distinct coin_id from public.market_entries
            where kind = 'alert' and triggered_at is null) coins
    ) groups_of_coins group by bucket
  loop
    select * into response from extensions.http_get(
      'https://api.coingecko.com/api/v3/simple/price?vs_currencies=idr&ids=' || batch
    );
    if response.status != 200 then
      raise warning 'CoinGecko returned HTTP %', response.status;
      continue;
    end if;
    prices := response.content::jsonb;
    update public.market_entries e
    set triggered_at = now(), triggered_price = (prices->e.coin_id->>'idr')::numeric
    where kind = 'alert' and triggered_at is null
      and jsonb_typeof(prices->e.coin_id->'idr') = 'number'
      and (prices->e.coin_id->>'idr')::numeric > 0
      and case when direction = 'above' then (prices->e.coin_id->>'idr')::numeric >= price
               else (prices->e.coin_id->>'idr')::numeric <= price end;
  end loop;
end;
$$;
revoke all on function market_jobs.check_price_alerts() from public, anon, authenticated;
select cron.schedule('crypto-market-price-alerts','*/5 * * * *','select market_jobs.check_price_alerts()');
commit;
