-- O4: storm_history — persists per-zip storm event pulls so event timelines
-- survive across sessions without re-fetching from the weather API.

create table if not exists storm_history (
  id          uuid primary key default gen_random_uuid(),
  zip         text not null,
  event_type  text,
  event_date  text,
  severity    text,
  fetched_at  timestamptz not null default now()
);

-- unique per zip+date+type so upserts are idempotent
create unique index if not exists storm_history_zip_date_type
  on storm_history (zip, event_date, event_type);

create index if not exists storm_history_zip
  on storm_history (zip, event_date desc);

alter table storm_history enable row level security;

create policy "storm_history_select_all" on storm_history for select using (true);
create policy "storm_history_insert_all" on storm_history for insert with check (true);
