-- M2: leads table
-- Two fields beyond spec (state_abbrev, storm_summary) are added because the
-- LeadCard display requires them and recomputing from zip_data on every read
-- would add joins that don't belong in the list view.

create table if not exists leads (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid,
  rep_id         uuid,
  zip            text not null,
  street_address text,
  lat            double precision,
  lng            double precision,
  state_abbrev   text,
  fit_score      integer,
  fit_grade      text,
  storm_flag     boolean not null default false,
  storm_summary  text,
  status         text not null default 'saved'
                   check (status in ('saved','contacted','interested','closed_won','closed_lost')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  closed_at      timestamptz
);

create index if not exists leads_org_created  on leads (org_id,  created_at desc);
create index if not exists leads_rep_created  on leads (rep_id,  created_at desc);
create index if not exists leads_zip          on leads (zip);

-- keep updated_at current on every row update
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- RLS enabled with permissive (true) policies until auth is wired
alter table leads enable row level security;

create policy "leads_select_all" on leads for select using (true);
create policy "leads_insert_all" on leads for insert with check (true);
create policy "leads_update_all" on leads for update using (true);
create policy "leads_delete_all" on leads for delete using (true);
