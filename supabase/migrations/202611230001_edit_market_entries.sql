begin;

grant update (price, quantity, direction) on public.market_entries to authenticated;

create policy market_owner_edit on public.market_entries
  for update to authenticated
  using (user_id = (select auth.uid()) and kind in ('alert', 'holding'))
  with check (user_id = (select auth.uid()) and kind in ('alert', 'holding'));

create function market_jobs.reset_edited_alert() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.triggered_at := null;
  new.triggered_price := null;
  return new;
end;
$$;
revoke all on function market_jobs.reset_edited_alert() from public, anon, authenticated;

create trigger reset_edited_alert before update of price, direction
on public.market_entries for each row
when (old.kind = 'alert' and
      (old.price is distinct from new.price or old.direction is distinct from new.direction))
execute function market_jobs.reset_edited_alert();

commit;
